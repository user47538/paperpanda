import cors from "cors";
import express from "express";
import multer from "multer";
import { createCanvas } from "@napi-rs/canvas";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker, PSM } from "tesseract.js";
import {
  awardAccountPoints,
  getDataFilePath,
  getSessionAccount,
  registerUser,
  signInUser,
  signOutSession,
  updateAccount,
  updateAccountPassword,
  updateAccountSettings,
  updateAccountSubjects
} from "./authStore.js";
import { availableRevisionGrades, getRevisionCatalogueForGrade, getRevisionEntry } from "./curriculumCatalog.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const openAiApiKey = process.env.OPENAI_API_KEY || "";
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const geminiWritingImageModel = String(process.env.GEMINI_WRITING_IMAGE_MODEL || "gemini-3.1-flash-image").trim() || "gemini-3.1-flash-image";
const openAiJsonTimeoutMs = Math.max(5_000, Number(process.env.OPENAI_JSON_TIMEOUT_MS || 35_000) || 35_000);
const openAiSpeechTimeoutMs = Math.max(5_000, Number(process.env.OPENAI_SPEECH_TIMEOUT_MS || 35_000) || 35_000);
const geminiImageTimeoutMs = Math.max(5_000, Number(process.env.GEMINI_IMAGE_TIMEOUT_MS || 45_000) || 45_000);
const localOcrTimeoutMs = Math.max(10_000, Number(process.env.LOCAL_OCR_TIMEOUT_MS || 90_000) || 90_000);
const pdfPreviewRenderScale = Math.max(1, Number(process.env.PDF_PREVIEW_RENDER_SCALE || 1.25) || 1.25);
const pdfOcrRenderScale = Math.max(pdfPreviewRenderScale, Number(process.env.PDF_OCR_RENDER_SCALE || 2.2) || 2.2);
const localOcrEnabled = String(process.env.LOCAL_OCR_ENABLED || "1").trim() !== "0";
const localOcrLanguage = String(process.env.LOCAL_OCR_LANGUAGE || "eng").trim() || "eng";
const localOcrCachePath = String(process.env.LOCAL_OCR_CACHE_PATH || "/tmp/paperpanda-tesseract-cache").trim() || "/tmp/paperpanda-tesseract-cache";
const localOcrRecycleAfterJobs = Math.max(1, Number(process.env.LOCAL_OCR_RECYCLE_AFTER_JOBS || 12) || 12);
const writingImageSectionTextLimit = 420;
const writingImagePreviousTextLimit = 220;
const writingImageFeedbackLimit = 280;
const greatTeacherStudentProfile =
  "The student is 13, in Australian Year 7 high school, loves horses, is an intermediate rider, and lives and breathes horses.";
const greatTeacherTeachingLens =
  "Teach like a great teacher, not a textbook. Start with the clearest path into the student's thinking. Use plain language first. Use horse-related framing only when it genuinely makes an idea easier to picture, easier to remember, or more engaging. Keep horse references light, relevant, and selective. Never force them into simple ideas or add a novelty layer that makes the explanation harder. If plain wording is better, use plain wording. When a horse frame truly helps, prefer familiar ideas like riding, horse care, tack, timing, balance, rhythm, height in hands, distance, pace, or feed.";
const greatTeacherAssessmentGuard =
  "Do not distort source content, assessment wording, answer guides, required terminology, or tested content just to add horse language. Keep the academic meaning exact.";
const greatTeacherAskDecisionLens =
  "Before answering, silently decide what will help this student most. Start with the plain explanation she needs. Only add a horse-based comparison if it clearly makes the idea easier to understand or remember. If you use one, keep it brief, familiar, and immediately tied back to the school idea. Never stack analogies or turn the answer into horse talk for its own sake.";
const greatTeacherAskDeliveryLens =
  "Sound like a great teacher speaking directly to this student: clear, calm, practical, and mentally engaging. Do not sound like a textbook, worksheet, rubric, or generic tutor. Keep sentences short. Cut filler, over-explaining, and adult phrasing. Focus on the exact thing she needs to understand or do next.";
const greatTeacherAskResponseShape =
  "For most questions, give a very short orientation first so she knows what the question is really asking, then give the clearest steps or points in order. If a direct answer is enough, give the direct answer and one short clarification. If the task needs a process, use a short numbered list. Keep the response tight and useful.";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});
let localOcrWorkerPromise = null;
let localOcrWorkerJobCount = 0;
let localOcrQueue = Promise.resolve();

const configuredOrigins = String(process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(configuredOrigins);
const fallbackFrontendOrigins = new Set([
  "https://paperpanda-gg1z.onrender.com"
]);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.has(origin) || fallbackFrontendOrigins.has(origin)) {
    return true;
  }

  return /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(origin);
}

function isSameHostOrigin(origin, requestHost) {
  if (!origin || !requestHost) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host.toLowerCase() === String(requestHost).toLowerCase();
  } catch (error) {
    return false;
  }
}

function getBearerToken(request) {
  const authorizationHeader = String(request.header("Authorization") || "");
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

async function requireSession(request, response) {
  const token = getBearerToken(request);
  if (!token) {
    response.status(401).json({ error: "Sign in is required." });
    return null;
  }

  const session = await getSessionAccount(token);
  if (!session) {
    response.status(401).json({ error: "Session expired. Sign in again." });
    return null;
  }

  return session;
}

app.use(
  cors((request, callback) => {
    const requestOrigin = request.header("Origin");
    const requestHost = request.header("Host");

    if (isAllowedOrigin(requestOrigin) || isSameHostOrigin(requestOrigin, requestHost)) {
      callback(null, { origin: true });
      return;
    }

    callback(null, { origin: false });
  })
);
app.use(express.json({ limit: "50mb" }));

function requireOpenAiKey() {
  if (!openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the backend.");
  }
}

function requireGeminiKey() {
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the backend.");
  }
}

function buildGreatTeacherInstruction(...extraRules) {
  return [
    greatTeacherStudentProfile,
    greatTeacherTeachingLens,
    ...extraRules.filter(Boolean)
  ].join(" ");
}

function extractResponseText(responsePayload) {
  if (typeof responsePayload?.output_text === "string" && responsePayload.output_text.trim()) {
    return responsePayload.output_text.trim();
  }

  const textParts = [];
  for (const outputItem of responsePayload?.output || []) {
    for (const contentItem of outputItem?.content || []) {
      if ((contentItem?.type === "output_text" || contentItem?.type === "text") && typeof contentItem.text === "string") {
        textParts.push(contentItem.text);
      }
    }
  }

  return textParts.join("\n\n").trim();
}

function extractResponseJson(responsePayload) {
  const text = extractResponseText(responsePayload);
  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error("OpenAI returned invalid schedule JSON.");
  }
}

function cleanRevisionNotes(notes) {
  if (!Array.isArray(notes)) {
    return [];
  }

  return notes
    .map((note) => ({
      title: String(note?.title || "").trim(),
      content: String(note?.content || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000)
    }))
    .filter((note) => note.title || note.content);
}

function clipText(value, maxLength) {
  const normalised = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalised || normalised.length <= maxLength) {
    return normalised;
  }
  return `${normalised.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function cleanDocumentStudyText(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 28000);
}

function cleanDocumentStudyPageExcerpts(pageExcerpts) {
  if (!Array.isArray(pageExcerpts)) {
    return [];
  }

  return pageExcerpts
    .map((page, index) => ({
      pageNumber: Math.max(1, Number(page?.pageNumber || index + 1) || index + 1),
      text: clipText(String(page?.text || "").replace(/\s+/g, " ").trim(), 360)
    }))
    .filter((page) => page.text)
    .slice(0, 90);
}

function cleanDocumentVisionPages(pageVisuals, { pageLimit = 6, textLimit = 260 } = {}) {
  if (!Array.isArray(pageVisuals)) {
    return [];
  }

  return pageVisuals
    .map((page, index) => {
      const imageUrl = String(page?.imageUrl || "").trim();
      return {
        pageNumber: Math.max(1, Number(page?.pageNumber || index + 1) || index + 1),
        text: clipText(String(page?.text || "").replace(/\s+/g, " ").trim(), textLimit),
        imageUrl
      };
    })
    .filter((page) => page.imageUrl && (/^data:image\//i.test(page.imageUrl) || /^https?:\/\//i.test(page.imageUrl)))
    .slice(0, pageLimit);
}

function cleanAskHistoryEntries(history, { limit = 4, textLimit = 240 } = {}) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .slice(-limit)
    .map((entry) => ({
      question: clipText(String(entry?.question || "").trim(), textLimit),
      answer: clipText(String(entry?.answer || "").trim(), textLimit * 2)
    }))
    .filter((entry) => entry.question || entry.answer);
}

function cleanAskAssessment(nextAssessment, { textLimit = 120 } = {}) {
  if (!nextAssessment || typeof nextAssessment !== "object") {
    return null;
  }

  const title = clipText(String(nextAssessment.title || "").trim(), textLimit);
  const due = clipText(String(nextAssessment.due || "").trim(), textLimit);
  return title || due ? { title, due } : null;
}

function buildAskDocumentContext(document, { compact = false } = {}) {
  if (!document || typeof document !== "object") {
    return null;
  }

  const pageVisuals = cleanDocumentVisionPages(document.pageVisuals, {
    pageLimit: compact ? 1 : 2,
    textLimit: compact ? 140 : 160
  });
  const cleanedContent = cleanDocumentStudyText(document.content);
  const contentLimit = pageVisuals.length
    ? (compact ? 700 : 1200)
    : (compact ? 1800 : 2400);

  return {
    title: clipText(String(document.title || "").trim(), 180),
    type: clipText(String(document.type || "").trim(), 120),
    focusPageNumber: Math.max(1, Number(document.focusPageNumber || 0) || 0) || null,
    focusQuestionNumber: Math.max(1, Number(document.focusQuestionNumber || 0) || 0) || null,
    content: clipText(cleanedContent, contentLimit),
    pageVisuals
  };
}

function getRecommendedStudySectionCount(pageCount) {
  const totalPages = Math.max(1, Number(pageCount || 0) || 1);
  if (totalPages <= 1) {
    return 1;
  }
  if (totalPages <= 4) {
    return totalPages;
  }
  if (totalPages <= 12) {
    return Math.ceil(totalPages / 2);
  }
  if (totalPages <= 36) {
    return Math.ceil(totalPages / 3);
  }
  return Math.min(18, Math.ceil(totalPages / 4));
}

function getStudyPlanSectionCountGuidance(pageCount) {
  const target = getRecommendedStudySectionCount(pageCount);
  if (target <= 4) {
    return { min: target, max: target, target };
  }
  return {
    min: Math.max(4, target - 1),
    max: Math.min(18, target + 1),
    target
  };
}

function normaliseStudySections(sections) {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections
    .map((section, index) => ({
      id: String(section?.id || `section-${index + 1}`).trim(),
      title: String(section?.title || `Section ${index + 1}`).trim(),
      summary: String(section?.summary || "").trim(),
      sectionText: String(section?.sectionText || "").trim(),
      pageStart: Number(section?.pageStart || 0) || null,
      pageEnd: Number(section?.pageEnd || 0) || null,
      bullets: Array.isArray(section?.bullets)
        ? section.bullets.map((bullet) => String(bullet || "").trim()).filter(Boolean).slice(0, 4)
        : [],
      importantTerms: Array.isArray(section?.importantTerms)
        ? section.importantTerms.map((term) => String(term || "").trim()).filter(Boolean).slice(0, 10)
        : []
    }))
    .filter((section) => section.sectionText);
}

function normaliseStudyQuiz(quiz) {
  const questions = Array.isArray(quiz?.questions)
    ? quiz.questions
        .map((question, index) => ({
          id: String(question?.id || `quiz-${index + 1}`).trim(),
          prompt: String(question?.prompt || "").trim(),
          options: Array.isArray(question?.options)
            ? question.options.map((option) => String(option || "").trim()).filter(Boolean).slice(0, 4)
            : [],
          correctOption: String(question?.correctOption || "").trim(),
          explanation: String(question?.explanation || "").trim()
        }))
        .filter(
          (question) =>
            question.prompt &&
            question.options.length === 4 &&
            question.correctOption &&
            question.options.includes(question.correctOption)
        )
    : [];

  return {
    title: String(quiz?.title || "Quick check").trim(),
    passingScore: Math.max(1, Math.min(questions.length, Number(quiz?.passingScore || 3) || 3)),
    questions
  };
}

async function callOpenAiJson(endpoint, payload, { timeoutMs = openAiJsonTimeoutMs, timeoutLabel = "OpenAI request" } = {}) {
  requireOpenAiKey();
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiApiKey}`
      },
      body: JSON.stringify(payload),
      signal: abortController.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${timeoutLabel} timed out.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }

  if (!response.ok) {
    let message = "OpenAI request failed.";
    try {
      const errorPayload = await response.json();
      message = errorPayload?.error?.message || message;
    } catch (error) {
      const fallbackText = await response.text();
      if (fallbackText) {
        message = fallbackText;
      }
    }
    throw new Error(message);
  }

  return response.json();
}

async function callOpenAiSpeech(payload) {
  requireOpenAiKey();
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), openAiSpeechTimeoutMs);
  let response;
  try {
    response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiApiKey}`
      },
      body: JSON.stringify(payload),
      signal: abortController.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("OpenAI speech request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }

  if (!response.ok) {
    let message = "OpenAI speech request failed.";
    try {
      const errorPayload = await response.json();
      message = errorPayload?.error?.message || message;
    } catch (error) {
      const fallbackText = await response.text();
      if (fallbackText) {
        message = fallbackText;
      }
    }
    throw new Error(message);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "audio/mpeg"
  };
}

async function callGeminiJson(endpoint, payload, { timeoutMs = geminiImageTimeoutMs, timeoutLabel = "Gemini request" } = {}) {
  requireGeminiKey();
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey
      },
      body: JSON.stringify(payload),
      signal: abortController.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${timeoutLabel} timed out.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }

  if (!response.ok) {
    let message = "Gemini request failed.";
    try {
      const errorPayload = await response.json();
      message = errorPayload?.error?.message || message;
    } catch (error) {
      const fallbackText = await response.text();
      if (fallbackText) {
        message = fallbackText;
      }
    }
    throw new Error(message);
  }

  return response.json();
}

function extractGeminiImage(payload) {
  if (payload?.output_image?.data) {
    return {
      mimeType: String(payload.output_image.mime_type || "image/png"),
      data: String(payload.output_image.data || "")
    };
  }

  for (const step of Array.isArray(payload?.steps) ? payload.steps : []) {
    if (String(step?.type || "") !== "model_output") {
      continue;
    }
    for (const contentBlock of Array.isArray(step?.content) ? step.content : []) {
      if (String(contentBlock?.type || "") === "image" && String(contentBlock?.data || "").trim()) {
        return {
          mimeType: String(contentBlock.mime_type || "image/png"),
          data: String(contentBlock.data || "")
        };
      }
    }
  }

  throw new Error("Gemini image generation returned no image.");
}

async function generateGeminiImage(prompt) {
  const payload = await callGeminiJson("interactions", {
    model: geminiWritingImageModel,
    input: [
      {
        type: "text",
        text: prompt
      }
    ]
  }, {
    timeoutMs: geminiImageTimeoutMs,
    timeoutLabel: "Gemini image generation"
  });
  const imageRecord = extractGeminiImage(payload);
  return `data:${imageRecord.mimeType};base64,${imageRecord.data}`;
}

async function generateWritingIllustrationOptions(prompts, buildPrompt) {
  const initialResults = await Promise.allSettled(
    prompts.map(async (prompt) => ({ prompt, imageUrl: await generateGeminiImage(buildPrompt(prompt)) }))
  );

  const options = initialResults.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return {
      prompt: prompts[index],
      imageUrl: ""
    };
  });

  const failedIndexes = options.reduce((indexes, option, index) => {
    if (!String(option.imageUrl || "").trim()) {
      indexes.push(index);
    }
    return indexes;
  }, []);

  if (!failedIndexes.length) {
    return options;
  }

  const retryResults = await Promise.allSettled(
    failedIndexes.map(async (failedIndex) => ({
      failedIndex,
      prompt: prompts[failedIndex],
      imageUrl: await generateGeminiImage(buildPrompt(prompts[failedIndex]))
    }))
  );

  retryResults.forEach((result) => {
    if (result.status === "fulfilled") {
      options[result.value.failedIndex] = {
        prompt: result.value.prompt,
        imageUrl: result.value.imageUrl
      };
    }
  });

  return options;
}

function extractPdfPageText(items) {
  let currentLine = "";
  let previousY = null;
  const lines = [];

  items.forEach((item) => {
    const value = "str" in item ? item.str : "";
    if (!value.trim()) {
      return;
    }

    const currentY = Math.round(item.transform?.[5] || 0);
    if (previousY !== null && Math.abs(currentY - previousY) > 4) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = value;
    } else {
      currentLine = `${currentLine} ${value}`.trim();
    }
    previousY = currentY;
  });

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines.join("\n");
}

function getMeaningfulPdfText(text) {
  return String(text || "")
    .replace(/^Page\s+\d+\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getPdfTextSignal(text) {
  const meaningfulText = getMeaningfulPdfText(text);
  const words = meaningfulText ? meaningfulText.split(/\s+/).filter(Boolean) : [];
  const alphaChars = (meaningfulText.match(/[A-Za-z]/g) || []).length;
  const digitChars = (meaningfulText.match(/\d/g) || []).length;
  const mathsSymbolChars = (meaningfulText.match(/[=+\-*/^%<>()[\]{}|\\_~×÷±√∑∫∞≈≠≤≥πθ∆]/g) || []).length;
  const longWords = words.filter((word) => /[A-Za-z]{3,}/.test(word)).length;
  return {
    meaningfulText,
    length: meaningfulText.length,
    alphaChars,
    digitChars,
    mathsSymbolChars,
    wordCount: words.length,
    longWordCount: longWords
  };
}

function canUseLocalOcr() {
  return localOcrEnabled;
}

function getPdfPageBlockText(pageNumber, text) {
  const cleanedText = String(text || "").trim();
  return cleanedText ? `Page ${pageNumber}\n${cleanedText}`.trim() : "";
}

function shouldOcrPdfPage(page) {
  const signal = getPdfTextSignal(page?.text);
  const symbolHeavyLowContext =
    signal.length >= 80 &&
    signal.longWordCount < 6 &&
    signal.alphaChars < 36 &&
    signal.digitChars + signal.mathsSymbolChars >= 18;
  return (
    signal.length < 80 ||
    signal.longWordCount < 8 ||
    (signal.alphaChars < 28 && signal.wordCount < 18) ||
    (signal.alphaChars < 48 && signal.length < 180) ||
    symbolHeavyLowContext
  );
}

function rebuildPdfTextIndexes(pages) {
  let fullText = "";
  let currentIndex = 0;
  const rebuiltPages = pages.map((page) => {
    const text = String(page?.text || "").trim();
    if (!text) {
      return {
        ...page,
        text: "",
        startIndex: currentIndex,
        endIndex: currentIndex
      };
    }

    const startIndex = currentIndex;
    fullText += `${fullText ? "\n\n" : ""}${text}`;
    currentIndex = fullText.length + 2;
    return {
      ...page,
      text,
      startIndex,
      endIndex: startIndex + text.length
    };
  });

  return {
    fullText,
    pages: rebuiltPages
  };
}

function stripPdfOcrArtifacts(pages) {
  return (Array.isArray(pages) ? pages : []).map((page) => {
    const { ocrImageUrl, ...rest } = page || {};
    return rest;
  });
}

function didPdfPageTextsChange(beforePages, afterPages) {
  const baselinePages = Array.isArray(beforePages) ? beforePages : [];
  const candidatePages = Array.isArray(afterPages) ? afterPages : [];
  return candidatePages.some((page, index) => String(page?.text || "").trim() !== String(baselinePages[index]?.text || "").trim());
}

function buildPdfOcrErrorMessage(errors) {
  return errors
    .map((entry) => String(entry || "").trim())
    .filter(Boolean)
    .join(" ");
}

function getPdfOcrImageUrl(page) {
  return String(page?.ocrImageUrl || page?.imageUrl || "").trim();
}

function preprocessCanvasForOcr(canvas, context) {
  if (!canvas?.width || !canvas?.height || !context?.getImageData || !context?.putImageData) {
    return;
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  let minLuminance = 255;
  let maxLuminance = 0;

  for (let index = 0; index < data.length; index += 4) {
    const luminance = Math.round(data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114);
    minLuminance = Math.min(minLuminance, luminance);
    maxLuminance = Math.max(maxLuminance, luminance);
  }

  const range = Math.max(1, maxLuminance - minLuminance);
  for (let index = 0; index < data.length; index += 4) {
    const luminance = Math.round(data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114);
    const normalized = ((luminance - minLuminance) / range) * 255;
    let boosted = (normalized - 128) * 1.45 + 128;
    if (boosted >= 198) {
      boosted = 255;
    } else if (boosted <= 36) {
      boosted = 0;
    }
    const clamped = Math.max(0, Math.min(255, Math.round(boosted)));
    data[index] = clamped;
    data[index + 1] = clamped;
    data[index + 2] = clamped;
  }

  context.putImageData(imageData, 0, 0);
}

async function runWithTimeout(taskFactory, timeoutMs, timeoutLabel) {
  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error(`${timeoutLabel} timed out.`));
    }, timeoutMs);

    Promise.resolve()
      .then(taskFactory)
      .then((result) => {
        clearTimeout(timeoutHandle);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutHandle);
        reject(error);
      });
  });
}

async function createConfiguredLocalOcrWorker() {
  const worker = await createWorker(localOcrLanguage, 1, {
    cachePath: localOcrCachePath
  });
  await worker.setParameters({
    preserve_interword_spaces: "1",
    tessedit_pageseg_mode: String(PSM.AUTO),
    user_defined_dpi: "300"
  });
  return worker;
}

async function getLocalOcrWorker() {
  if (!localOcrWorkerPromise) {
    localOcrWorkerPromise = createConfiguredLocalOcrWorker().catch((error) => {
      localOcrWorkerPromise = null;
      throw error;
    });
  }
  return localOcrWorkerPromise;
}

async function recycleLocalOcrWorker() {
  const workerPromise = localOcrWorkerPromise;
  localOcrWorkerPromise = null;
  localOcrWorkerJobCount = 0;
  if (!workerPromise) {
    return;
  }
  try {
    const worker = await workerPromise;
    await worker.terminate();
  } catch (error) {
    // Ignore worker teardown failures and allow the next request to recreate it.
  }
}

async function runLocalOcrTask(taskFactory) {
  const previousTask = localOcrQueue.catch(() => {});
  let releaseQueue = () => {};
  localOcrQueue = new Promise((resolve) => {
    releaseQueue = resolve;
  });
  await previousTask;
  try {
    return await taskFactory();
  } finally {
    releaseQueue();
  }
}

function applyOcrTranscriptsToPages(pages, ocrByPageNumber) {
  return pages.map((page) => {
    const transcriptText = String(ocrByPageNumber.get(page.pageNumber) || "").trim();
    if (!transcriptText) {
      return page;
    }
    return {
      ...page,
      text: getPdfPageBlockText(page.pageNumber, transcriptText)
    };
  });
}

function decodeDataUrlToBuffer(imageUrl) {
  const source = String(imageUrl || "").trim();
  if (!source) {
    return null;
  }
  const commaIndex = source.indexOf(",");
  if (commaIndex === -1) {
    return Buffer.from(source, "base64");
  }
  return Buffer.from(source.slice(commaIndex + 1), "base64");
}

async function ocrPdfPagesLocally(pages) {
  if (!canUseLocalOcr()) {
    throw new Error("Local OCR is disabled on this host.");
  }

  const pagesNeedingOcr = pages
    .filter((page) => shouldOcrPdfPage(page))
    .map((page) => ({
      pageNumber: page.pageNumber,
      imageUrl: getPdfOcrImageUrl(page)
    }))
    .filter((page) => page.imageUrl);

  if (!pagesNeedingOcr.length) {
    return pages;
  }

  return runLocalOcrTask(async () => {
    const worker = await getLocalOcrWorker();
    const ocrByPageNumber = new Map();
    try {
      for (const page of pagesNeedingOcr) {
        const imageBuffer = decodeDataUrlToBuffer(page.imageUrl);
        if (!imageBuffer?.length) {
          continue;
        }
        const result = await runWithTimeout(
          () => worker.recognize(imageBuffer),
          localOcrTimeoutMs,
          `Local OCR for page ${page.pageNumber}`
        );
        const transcriptText = String(result?.data?.text || "").trim();
        if (transcriptText) {
          ocrByPageNumber.set(page.pageNumber, transcriptText);
        }
      }
    } catch (error) {
      await recycleLocalOcrWorker();
      throw error;
    }

    localOcrWorkerJobCount += 1;
    if (localOcrWorkerJobCount >= localOcrRecycleAfterJobs) {
      await recycleLocalOcrWorker();
    }

    return applyOcrTranscriptsToPages(pages, ocrByPageNumber);
  });
}

async function ocrPdfPagesWithOpenAi(pages) {
  requireOpenAiKey();
  const pagesNeedingOcr = pages.filter((page) => shouldOcrPdfPage(page));
  if (!pagesNeedingOcr.length) {
    return pages;
  }

  const ocrByPageNumber = new Map();
  const chunkSize = 3;

  for (let index = 0; index < pagesNeedingOcr.length; index += chunkSize) {
    const chunk = pagesNeedingOcr.slice(index, index + chunkSize);
    const responsePayload = await callOpenAiJson("responses", {
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You extract worksheet text from school PDF page images. Return only JSON. Read all visible text carefully. Preserve headings, labels, numbered questions, answer lines, mathematical symbols, equations, units, tables, and multiple-choice options where readable. Do not summarise. If a page has little or no readable text, return an empty string for that page."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Return a JSON object with one key, pageTranscripts. Its value must be an array of objects with pageNumber and text. Keep each page's text separate."
            },
            ...chunk.flatMap((page) => [
              {
                type: "input_text",
                text: `Page ${page.pageNumber}`
              },
              {
                type: "input_image",
                image_url: getPdfOcrImageUrl(page),
                detail: "high"
              }
            ])
          ]
        }
      ],
      text: {
        format: {
          type: "json_object"
        }
      },
      max_output_tokens: 4000
    });

    const parsed = extractResponseJson(responsePayload);
    const transcripts = Array.isArray(parsed?.pageTranscripts) ? parsed.pageTranscripts : [];
    transcripts.forEach((entry) => {
      const pageNumber = Number(entry?.pageNumber);
      const transcriptText = String(entry?.text || "").trim();
      if (Number.isFinite(pageNumber)) {
        ocrByPageNumber.set(pageNumber, transcriptText);
      }
    });
  }

  return applyOcrTranscriptsToPages(pages, ocrByPageNumber);
}

class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(Math.ceil(width), Math.ceil(height));
    const context = canvas.getContext("2d");
    return { canvas, context };
  }

  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = Math.ceil(width);
    canvasAndContext.canvas.height = Math.ceil(height);
  }

  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

async function renderPdfPageToDataUrl(page, { scale = pdfPreviewRenderScale, preprocessForOcr = false } = {}) {
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");
  const canvasFactory = new NodeCanvasFactory();
  await page.render({ canvasContext: context, viewport, canvasFactory }).promise;
  if (preprocessForOcr) {
    preprocessCanvasForOcr(canvas, context);
  }
  return `data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`;
}

async function parsePdfBuffer(buffer) {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    useWorkerFetch: false,
    isEvalSupported: false
  });
  const pdf = await loadingTask.promise;
  const pages = [];
  let fullText = "";
  let currentIndex = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = extractPdfPageText(textContent.items).trim();
    const blockText = getPdfPageBlockText(pageNumber, pageText);
    const needsOcrAssist = shouldOcrPdfPage({ text: blockText });
    const imageUrl = await renderPdfPageToDataUrl(page, { scale: pdfPreviewRenderScale });
    const ocrImageUrl = needsOcrAssist
      ? await renderPdfPageToDataUrl(page, { scale: pdfOcrRenderScale, preprocessForOcr: true })
      : "";

    if (pageText) {
      pages.push({
        pageNumber,
        text: blockText,
        imageUrl,
        ocrImageUrl,
        startIndex: currentIndex,
        endIndex: currentIndex + blockText.length
      });
      fullText += `${fullText ? "\n\n" : ""}${blockText}`;
      currentIndex = fullText.length + 2;
    } else {
      pages.push({
        pageNumber,
        text: "",
        imageUrl,
        ocrImageUrl,
        startIndex: currentIndex,
        endIndex: currentIndex
      });
    }
  }

  return {
    fullText,
    pages
  };
}

async function parsePdfBufferWithOcrFallback(buffer) {
  const pdfData = await parsePdfBuffer(buffer);
  const sparsePages = pdfData.pages.filter((page) => shouldOcrPdfPage(page)).length;
  const needsOcrFallback =
    sparsePages > 0 &&
    (
      sparsePages === pdfData.pages.length ||
      sparsePages >= Math.ceil(pdfData.pages.length / 2) ||
      getMeaningfulPdfText(pdfData.fullText).length < pdfData.pages.length * 30
    );

  if (!needsOcrFallback) {
    return {
      ...rebuildPdfTextIndexes(stripPdfOcrArtifacts(pdfData.pages)),
      ocrAttempted: false,
      ocrUsed: false,
      ocrError: ""
    };
  }

  let workingPages = pdfData.pages;
  let ocrAttempted = false;
  let ocrUsed = false;
  const ocrErrors = [];

  if (canUseLocalOcr()) {
    ocrAttempted = true;
    try {
      const localOcrPages = await ocrPdfPagesLocally(workingPages);
      ocrUsed = ocrUsed || didPdfPageTextsChange(workingPages, localOcrPages);
      workingPages = localOcrPages;
    } catch (error) {
      ocrErrors.push(`Local OCR failed: ${error instanceof Error ? error.message : "Unknown error."}`);
    }
  }

  const stillNeedsRemoteOcr = workingPages.some((page) => shouldOcrPdfPage(page));
  if (stillNeedsRemoteOcr && openAiApiKey) {
    ocrAttempted = true;
    try {
      const remoteOcrPages = await ocrPdfPagesWithOpenAi(workingPages);
      ocrUsed = ocrUsed || didPdfPageTextsChange(workingPages, remoteOcrPages);
      workingPages = remoteOcrPages;
    } catch (error) {
      ocrErrors.push(`OpenAI OCR failed: ${error instanceof Error ? error.message : "Unknown error."}`);
    }
  }

  return {
    ...rebuildPdfTextIndexes(stripPdfOcrArtifacts(workingPages)),
    ocrAttempted,
    ocrUsed,
    ocrError: ocrUsed ? "" : buildPdfOcrErrorMessage(ocrErrors)
  };
}

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    hasOpenAiKey: Boolean(openAiApiKey),
    hasLocalOcr: canUseLocalOcr(),
    authStoreBackend: getDataFilePath()
  });
});

app.post("/api/auth/register", async (request, response) => {
  try {
    const { name, email, password, grade, subjects = [], settings = {} } = request.body || {};
    if (!name || !email || !password || !grade) {
      response.status(400).json({ error: "name, email, password, and grade are required." });
      return;
    }

    const accountSession = await registerUser({ name, email, password, grade, subjects, settings });
    response.status(201).json(accountSession);
  } catch (error) {
    response.status(error?.status || 500).json({
      error: error instanceof Error ? error.message : "Account creation failed."
    });
  }
});

app.post("/api/auth/signin", async (request, response) => {
  try {
    const { email, password } = request.body || {};
    if (!email || !password) {
      response.status(400).json({ error: "email and password are required." });
      return;
    }

    const accountSession = await signInUser({ email, password });
    response.json(accountSession);
  } catch (error) {
    response.status(error?.status || 500).json({
      error: error instanceof Error ? error.message : "Sign-in failed."
    });
  }
});

app.get("/api/auth/session", async (request, response) => {
  try {
    const session = await requireSession(request, response);
    if (!session) {
      return;
    }

    response.json(session);
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Session lookup failed."
    });
  }
});

app.post("/api/auth/signout", async (request, response) => {
  try {
    const token = getBearerToken(request);
    if (token) {
      await signOutSession(token);
    }

    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Sign-out failed."
    });
  }
});

app.patch("/api/account", async (request, response) => {
  try {
    const session = await requireSession(request, response);
    if (!session) {
      return;
    }

    const { name, email, grade } = request.body || {};
    if (!name || !email || !grade) {
      response.status(400).json({ error: "name, email, and grade are required." });
      return;
    }

    const account = await updateAccount(session.token, { name, email, grade });
    response.json({ account });
  } catch (error) {
    response.status(error?.status || 500).json({
      error: error instanceof Error ? error.message : "Account update failed."
    });
  }
});

app.post("/api/account/password", async (request, response) => {
  try {
    const session = await requireSession(request, response);
    if (!session) {
      return;
    }

    const { currentPassword, newPassword } = request.body || {};
    if (!currentPassword || !newPassword) {
      response.status(400).json({ error: "currentPassword and newPassword are required." });
      return;
    }

    await updateAccountPassword(session.token, currentPassword, newPassword);
    response.json({ ok: true });
  } catch (error) {
    response.status(error?.status || 500).json({
      error: error instanceof Error ? error.message : "Password update failed."
    });
  }
});

app.put("/api/account/subjects", async (request, response) => {
  try {
    const session = await requireSession(request, response);
    if (!session) {
      return;
    }

    const { subjects = [] } = request.body || {};
    const savedSubjects = await updateAccountSubjects(session.token, subjects);
    response.json({ subjects: savedSubjects });
  } catch (error) {
    response.status(error?.status || 500).json({
      error: error instanceof Error ? error.message : "Subject sync failed."
    });
  }
});

app.put("/api/account/settings", async (request, response) => {
  try {
    const session = await requireSession(request, response);
    if (!session) {
      return;
    }

    const { settings = {} } = request.body || {};
    const savedSettings = await updateAccountSettings(session.token, settings);
    response.json({ settings: savedSettings });
  } catch (error) {
    response.status(error?.status || 500).json({
      error: error instanceof Error ? error.message : "Settings sync failed."
    });
  }
});

app.post("/api/account/points/award", async (request, response) => {
  try {
    const session = await requireSession(request, response);
    if (!session) {
      return;
    }

    const { points = 0 } = request.body || {};
    const account = await awardAccountPoints(session.token, points);
    response.json({ account });
  } catch (error) {
    response.status(error?.status || 500).json({
      error: error instanceof Error ? error.message : "Point award failed."
    });
  }
});

app.get("/api/revision/catalogue", (request, response) => {
  const grade = String(request.query?.grade || "7");
  const entries = getRevisionCatalogueForGrade(grade);
  response.json({
    grade,
    grades: availableRevisionGrades,
    entries,
    catalogue: entries
  });
});

function flattenRevisionQuestions(test) {
  return (Array.isArray(test?.sections) ? test.sections : []).flatMap((section) =>
    (Array.isArray(section?.questions) ? section.questions : []).map((question) => ({
      ...question,
      sectionTitle: section?.title || "",
      sectionType: section?.sectionType || ""
    }))
  );
}

function normaliseRevisionResponseMap(value) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.entries(value).reduce((result, [key, responseValue]) => {
    result[String(key)] = String(responseValue || "").trim();
    return result;
  }, {});
}

async function requestAskModelAnswer({
  subjectName,
  question,
  recentHistory = [],
  nextAssessment = null,
  documentContext = null
} = {}) {
  const mathsAskSource = [
    subjectName,
    question,
    documentContext?.title,
    documentContext?.type,
    documentContext?.content,
    ...(Array.isArray(documentContext?.pageVisuals)
      ? documentContext.pageVisuals.flatMap((page) => [page?.text || ""])
      : [])
  ]
    .filter(Boolean)
    .join("\n");
  const isLikelyMathsAsk = /(?:^|\b)(maths?|mathematics?|numeracy|algebra|equation|fraction|decimal|percentage|integer|ratio|geometry|perimeter|area|volume|probability|statistics|solve|calculate|working)\b/i.test(mathsAskSource)
    || /[=+\-*/^%<>()[\]{}|\\_~×÷±√∑∫∞≈≠≤≥πθ∆]/.test(mathsAskSource);
  const baseTutorInstruction = buildGreatTeacherInstruction(
    "You are a helpful Australian school study support tutor. Start with the direct answer immediately, keep the response concise, and use simple age-appropriate language. Base your help only on the provided subject and document context. If worksheet page images are provided, read them directly, including maths questions, formulas, labels, and diagrams. Give guidance, worked steps, and clarification rather than claiming to have unseen information. If a focus page number or focus question number is provided, treat that as the exact target. Stay on that page and that numbered question unless the student clearly asks about something else nearby.",
    greatTeacherAskDecisionLens,
    greatTeacherAskDeliveryLens,
    greatTeacherAskResponseShape,
    greatTeacherAssessmentGuard
  );
  const mathsTutorInstruction = isLikelyMathsAsk
    ? "For maths questions, explain it at about an Australian Year 7 high school level. Keep only the absolute necessary information. Use this exact structure: first write 'What it is asking:' followed by one very short sentence. Then write 'Steps:' followed by a short numbered list with 3 to 5 steps. Keep each step simple and practical. Do not add background theory, extra tips, or multiple methods unless they are required to solve the question. If a formula is needed, include only that formula."
    : "";
  const nonMathsTutorInstruction = !isLikelyMathsAsk
    ? "For non-maths questions, keep the answer lean and teacher-led. Open with one short sentence that frames the idea or task. Then, if needed, use 2 to 5 short bullet points or numbered steps. Use at most one light horse-based comparison, and only when it clearly improves understanding."
    : "";
  const responsePayload = await callOpenAiJson("responses", {
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: [baseTutorInstruction, mathsTutorInstruction, nonMathsTutorInstruction].filter(Boolean).join(" ")
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(
              {
                studentProfile: {
                  age: 13,
                  schoolYear: "Australian Year 7",
                  horseInterest: "loves horses",
                  riderLevel: "intermediate rider"
                },
                subjectName,
                question: clipText(String(question || "").trim(), 800),
                recentHistory,
                nextAssessment,
                document: documentContext
                  ? {
                      title: documentContext.title,
                      type: documentContext.type,
                      focusPageNumber: documentContext.focusPageNumber,
                      focusQuestionNumber: documentContext.focusQuestionNumber,
                      content: documentContext.content,
                      pageHints: documentContext.pageVisuals.map((page) => ({
                        pageNumber: page.pageNumber,
                        text: page.text
                      }))
                    }
                  : null
              }
            )
          },
          ...((documentContext?.pageVisuals || []).flatMap((page) => {
            const pageContent = [];
            if (page.text) {
              pageContent.push({
                type: "input_text",
                text: `Document page ${page.pageNumber} extracted text:\n${page.text}`
              });
            }
            if (page.imageUrl) {
              pageContent.push({
                type: "input_image",
                image_url: page.imageUrl,
                detail: "low"
              });
            }
            return pageContent;
          }))
        ]
      }
    ],
    max_output_tokens: 420
  });

  const answer = extractResponseText(responsePayload);
  if (!answer) {
    throw new Error("OpenAI returned an empty answer.");
  }

  return answer;
}

app.post("/api/ask", async (request, response) => {
  try {
    const { subjectName, question, recentHistory = [], nextAssessment = null, document = null } = request.body || {};
    if (!subjectName || !question) {
      response.status(400).json({ error: "subjectName and question are required." });
      return;
    }

    const askDocumentContext = buildAskDocumentContext(document, { compact: true });
    const askRecentHistory = cleanAskHistoryEntries(recentHistory, { limit: 2, textLimit: 120 });
    const cleanedAssessment = cleanAskAssessment(nextAssessment);

    const answer = await requestAskModelAnswer({
      subjectName,
      question,
      recentHistory: askRecentHistory,
      nextAssessment: cleanedAssessment,
      documentContext: askDocumentContext
    });

    response.json({ answer });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Ask AI failed."
    });
  }
});

app.post("/api/speak", async (request, response) => {
  try {
    const text = String(request.body?.text || "").trim();
    if (!text) {
      response.status(400).json({ error: "text is required." });
      return;
    }

    const speech = await callOpenAiSpeech({
      model: "gpt-4o-mini-tts",
      voice: "marin",
      response_format: "wav",
      input: text,
      instructions:
        "Speak as a warm, fluent female tutor for an Australian Year 7 high school student. Sound like a great teacher: calm, clear, grounded, and easy to follow. Use natural pauses, clear emphasis, and calm expressive delivery. If the script contains a horse-related comparison, deliver it naturally as normal teaching language, not as a joke or gimmick."
    });

    response.setHeader("Content-Type", speech.contentType);
    response.send(speech.buffer);
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Speech generation failed."
    });
  }
});

app.post("/api/writing/illustrations", async (request, response) => {
  try {
    const storyTitle = String(request.body?.storyTitle || "").trim();
    const sectionNumber = Math.max(1, Number(request.body?.sectionNumber || 1) || 1);
    const sectionText = String(request.body?.sectionText || "").trim();
    const previousSectionText = String(request.body?.previousSectionText || "").trim();
    const openingAnswers = request.body?.openingAnswers && typeof request.body.openingAnswers === "object" ? request.body.openingAnswers : {};
    const imageFeedback = clipText(String(request.body?.imageFeedback || "").trim(), writingImageFeedbackLimit);
    const styleGuide = request.body?.styleGuide && typeof request.body.styleGuide === "object"
      ? {
          label: String(request.body.styleGuide.label || "").trim(),
          brief: String(request.body.styleGuide.brief || "").trim(),
          prompt: String(request.body.styleGuide.prompt || "").trim()
        }
      : null;
    const prompts = Array.isArray(request.body?.prompts)
      ? request.body.prompts.map((prompt) => String(prompt || "").trim()).filter(Boolean).slice(0, 4)
      : [];

    if (!sectionText) {
      response.status(400).json({ error: "sectionText is required." });
      return;
    }

    if (!prompts.length) {
      response.status(400).json({ error: "At least one illustration prompt is required." });
      return;
    }

    const who = String(openingAnswers.who || "the main character").trim();
    const where = String(openingAnswers.where || "the setting").trim();
    const want = String(openingAnswers.want || "their goal").trim();
    const clippedPreviousSectionText = clipText(previousSectionText, writingImagePreviousTextLimit);
    const clippedSectionText = clipText(sectionText, writingImageSectionTextLimit);
    const buildPrompt = (prompt) =>
      [
        "Create a children's picture-book illustration.",
        "No words, labels, speech bubbles, borders, or watermarks.",
        "Keep the scene clear, readable, and strongly composed for a child reader.",
        imageFeedback ? "Treat the student's visual feedback as a required brief unless it conflicts with safety or the story text." : "",
        storyTitle ? `Story title: ${storyTitle}.` : "",
        `Section ${sectionNumber}.`,
        `Main character: ${who}.`,
        `Setting: ${where}.`,
        `Goal: ${want}.`,
        imageFeedback ? `Required visual brief: ${imageFeedback}` : "",
        styleGuide?.label ? `Keep the established book style: ${styleGuide.label}.` : "",
        styleGuide?.brief ? `Style notes: ${styleGuide.brief}` : "",
        styleGuide?.prompt ? `Reference style direction from the chosen book image: ${styleGuide.prompt}` : "",
        imageFeedback ? "Apply the required visual brief to the character design, setting details, colour mood, and composition wherever possible." : "",
        clippedPreviousSectionText ? `Previous section summary: ${clippedPreviousSectionText}` : "",
        `Current section text: ${clippedSectionText}`,
        `Scene direction: ${prompt}`
      ].filter(Boolean).join(" ");
    const options = await generateWritingIllustrationOptions(prompts, buildPrompt);
    const failedCount = options.filter((option) => !String(option.imageUrl || "").trim()).length;
    const partialFailure = failedCount > 0 && failedCount < options.length;
    const allFailed = failedCount === options.length;

    response.json({
      options,
      partialFailure,
      error: allFailed
        ? "Illustration generation failed."
        : partialFailure
          ? "Some illustration options could not be generated."
          : ""
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Illustration generation failed."
    });
  }
});

app.post("/api/document/study-plan", async (request, response) => {
  try {
    const subjectName = String(request.body?.subjectName || "").trim();
    const title = String(request.body?.title || "").trim();
    const type = String(request.body?.type || "").trim();
    const pageCount = Number(request.body?.pageCount || 0);
    const content = cleanDocumentStudyText(request.body?.content);
    const pageExcerpts = cleanDocumentStudyPageExcerpts(request.body?.pageExcerpts);
    const pageVisuals = cleanDocumentVisionPages(request.body?.pageVisuals, { pageLimit: 6, textLimit: 260 });
    const effectivePageCount = pageCount || pageExcerpts.length || Math.max(1, Math.ceil(content.length / 1800));
    const sectionCountGuidance = getStudyPlanSectionCountGuidance(effectivePageCount);

    if (!subjectName || !title || (!content && !pageExcerpts.length && !pageVisuals.length)) {
      response.status(400).json({ error: "subjectName, title, and readable document context are required." });
      return;
    }

    const responsePayload = await callOpenAiJson("responses", {
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: buildGreatTeacherInstruction(
                "You are organising a school study document for a student. Return only JSON. Your job is to act like a sharp tutor who decides what is genuinely worth learning for the syllabus and assessed work. Surface the core knowledge, vocabulary, processes, evidence, examples, arguments, success criteria, and any worksheet questions or worked examples the student must actually know. Break the document into sequential study sections. Make the section titles useful and specific. Preserve subject detail. For maths or science, name the actual concepts, formulas, processes, questions, and examples covered. Read any provided page images directly, including mathematical notation, tables, diagrams, labels, and answer choices. Ignore decorative, repetitive, or administrative text unless it directly affects the assessed task. Also create a short end-of-document quiz. Do not use markdown in the JSON.",
                "Write the overview, section summaries, bullets, sectionText, and quiz explanations as if a great teacher prepared them for this specific student.",
                greatTeacherAssessmentGuard
              )
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                {
                  document: {
                    subjectName,
                    title,
                    type,
                    pageCount: effectivePageCount,
                    targetSectionCount: sectionCountGuidance.target,
                    content: content || "Preview text is limited. Use the supplied page excerpts and page images."
                  },
                  pageExcerpts,
                  pageVisuals: pageVisuals.map((page) => ({
                    pageNumber: page.pageNumber,
                    text: page.text
                  })),
                  outputSchema: {
                    overview: "string",
                    importantTerms: ["string"],
                    sections: [
                      {
                        id: "string",
                        title: "string",
                        summary: "string",
                        sectionText: "string",
                        pageStart: "number|null",
                        pageEnd: "number|null",
                        bullets: ["string"],
                        importantTerms: ["string"]
                      }
                    ],
                    quiz: {
                      title: "string",
                      passingScore: "number",
                      questions: [
                        {
                          id: "string",
                          prompt: "string",
                          options: ["string", "string", "string", "string"],
                          correctOption: "string",
                          explanation: "string"
                        }
                      ]
                    }
                  },
                  rules: [
                    `Create between ${sectionCountGuidance.min} and ${sectionCountGuidance.max} sections. Aim for ${sectionCountGuidance.target} sections for this document length.`,
                    "Keep sections in the same order as the document.",
                    "Each section summary must explain the core knowledge or skill from that section in 1 to 2 student-friendly sentences.",
                    "Each section bullets list must contain 2 to 4 specific takeaways the student genuinely needs to know from that section.",
                    "Each bullet must name the actual concept, process, example, term, theme, or evidence focus instead of generic advice.",
                    "Make sectionText concise enough to study from, but specific enough to preserve the key teaching points.",
                    "Prioritise what the student would need to remember to complete the unit, answer questions, write responses, or revise the topic later.",
                    "Use the pageExcerpts to keep the section order correct and include pageStart and pageEnd whenever page numbers are available.",
                    "For longer documents, do not compress a large number of pages into a tiny number of sections. Keep each section focused on a small sequential chunk of learning.",
                    "If the document includes assignment directions, keep the parts that change what the student must know, show, explain, compare, or include for success.",
                    "Do not fill the summary or bullets with generic lines like understand this topic, revise your notes, or learn the key ideas.",
                    "The quiz must have exactly 4 multiple-choice questions.",
                    "Set passingScore to 3 unless the document is extremely short."
                  ]
                },
                null,
                2
              )
            },
            ...pageVisuals.flatMap((page) => {
              const pageContent = [
                {
                  type: "input_text",
                  text: `Document page ${page.pageNumber}${page.text ? ` extracted text:\n${page.text}` : ""}`
                }
              ];
              if (page.imageUrl) {
                pageContent.push({
                  type: "input_image",
                  image_url: page.imageUrl,
                  detail: "high"
                });
              }
              return pageContent;
            })
          ]
        }
      ],
      text: {
        format: {
          type: "json_object"
        }
      },
      max_output_tokens: 7000
    });

    const parsed = extractResponseJson(responsePayload);
    const sections = normaliseStudySections(parsed?.sections);
    const quiz = normaliseStudyQuiz(parsed?.quiz);
    const importantTerms = Array.isArray(parsed?.importantTerms)
      ? parsed.importantTerms.map((term) => String(term || "").trim()).filter(Boolean).slice(0, 24)
      : [];

    if (!sections.length) {
      response.status(500).json({ error: "The study plan did not contain any usable sections." });
      return;
    }

    response.json({
      overview: String(parsed?.overview || "").trim(),
      importantTerms,
      sections,
      quiz: quiz.questions.length === 4 ? quiz : null
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Document study plan generation failed."
    });
  }
});

app.post("/api/document/revision-test", async (request, response) => {
  try {
    const grade = String(request.body?.grade || "").trim();
    const subjectId = String(request.body?.subjectId || "").trim();
    const subjectName = String(request.body?.subjectName || "").trim();
    const title = String(request.body?.title || "").trim();
    const pageCount = Number(request.body?.pageCount || 0);
    const content = cleanDocumentStudyText(request.body?.content);

    if (!grade || !subjectId || !subjectName || !title || !content) {
      response.status(400).json({ error: "grade, subjectId, subjectName, title, and content are required." });
      return;
    }

    const responsePayload = await callOpenAiJson("responses", {
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: buildGreatTeacherInstruction(
                "You build Australian school revision tests from one study document. Return only JSON. Create exactly 15 questions total using this structure: 8 multiple-choice, 5 short-answer, and 2 extended-response. Base every question directly on the supplied document only. Do not include answers in the student-facing instructions. Every question must include an id, number, type, prompt, marks, skill, and answerGuide. Every multiple-choice question must include exactly 4 options and a correctOption that matches one option exactly.",
                "Keep student-facing instructions and question wording clear, uncluttered, and confidence-building. Only use the student's horse-related language if it helps engagement without changing the tested idea.",
                greatTeacherAssessmentGuard
              )
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                {
                  document: {
                    grade,
                    subjectId,
                    subjectName,
                    title,
                    pageCount,
                    content
                  },
                  outputSchema: {
                    title: "string",
                    subjectId: "string",
                    subjectName: "string",
                    grade: "string",
                    focus: "string",
                    estimatedMinutes: "number",
                    instructions: "string",
                    sections: [
                      {
                        title: "string",
                        sectionType: "reading | language | application | writing",
                        stimulusTitle: "string",
                        stimulusText: "string",
                        questions: [
                          {
                            id: "string",
                            number: "number",
                            type: "multiple-choice | short-answer | extended-response",
                            prompt: "string",
                            options: ["string"],
                            correctOption: "string",
                            answerGuide: "string",
                            marks: "number",
                            skill: "string"
                          }
                        ]
                      }
                    ]
                  },
                  rules: [
                    "Create exactly 15 questions total.",
                    "Use exactly 8 multiple-choice questions, exactly 5 short-answer questions, and exactly 2 extended-response questions.",
                    "Base the questions only on the supplied document.",
                    "If the document is literary or humanities based, prefer comprehension, inference, vocabulary in context, evidence use, themes, and interpretation.",
                    "If the document is maths or science based, prefer concept checking, worked reasoning, and applied interpretation.",
                    "Use clear student-friendly wording."
                  ]
                },
                null,
                2
              )
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_object"
        }
      },
      max_output_tokens: 5000
    });

    const parsed = extractResponseJson(responsePayload);
    const questions = flattenRevisionQuestions(parsed);
    const multipleChoiceCount = questions.filter((question) => String(question.type || "").toLowerCase() === "multiple-choice").length;
    const shortAnswerCount = questions.filter((question) => String(question.type || "").toLowerCase() === "short-answer").length;
    const extendedResponseCount = questions.filter((question) => String(question.type || "").toLowerCase() === "extended-response").length;
    if (questions.length !== 15 || multipleChoiceCount !== 8 || shortAnswerCount !== 5 || extendedResponseCount !== 2) {
      response.status(500).json({
        error: "Document revision test generation did not return the required question structure. Please try again."
      });
      return;
    }

    response.json({
      test: {
        ...parsed,
        title: parsed?.title || `${title} revision test`,
        subjectId: parsed?.subjectId || subjectId,
        subjectName: parsed?.subjectName || subjectName,
        grade: parsed?.grade || `Year ${grade}`,
        focus: parsed?.focus || title
      }
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Document revision test generation failed."
    });
  }
});

app.post("/api/revision/generate-test", async (request, response) => {
  try {
    const grade = String(request.body?.grade || "").trim();
    const subjectId = String(request.body?.subjectId || "").trim();
    const topic = String(request.body?.topic || "").trim();
    const textTitle = String(request.body?.textTitle || "").trim();
    const notes = cleanRevisionNotes(request.body?.notes);

    if (!grade || !subjectId) {
      response.status(400).json({ error: "grade and subjectId are required." });
      return;
    }

    const revisionEntry = getRevisionEntry(grade, subjectId);
    if (!revisionEntry) {
      response.status(404).json({ error: "No revision catalogue entry exists for that grade and subject." });
      return;
    }

    const responsePayload = await callOpenAiJson("responses", {
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: buildGreatTeacherInstruction(
                "You build Australian school revision tests. Return only JSON. Use a NAPLAN-inspired structure. The test must contain exactly 9 questions total: exactly 5 multiple-choice questions, exactly 3 short-answer questions, and exactly 1 extended-response question. Do not include answers in the instructions. For English, stay closest to NAPLAN reading/language/writing style. For other subjects, adapt that structure to the subject while keeping the question style clear and age-appropriate. Every question must include an id, marks, skill, and answerGuide. Every multiple-choice question must include exactly 4 options and a correctOption value that matches one option exactly.",
                "Keep student-facing instructions and question wording clear, uncluttered, and confidence-building. Only use the student's horse-related language if it helps engagement without changing the tested idea.",
                greatTeacherAssessmentGuard
              )
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                {
                  request: {
                    grade,
                    topic,
                    textTitle,
                    selectedNotes: notes
                  },
                  syllabusEntry: revisionEntry,
                  outputSchema: {
                    title: "string",
                    subjectId: "string",
                    subjectName: "string",
                    grade: "string",
                    focus: "string",
                    estimatedMinutes: "number",
                    instructions: "string",
                    sections: [
                      {
                        title: "string",
                        sectionType: "reading | language | application | writing",
                        stimulusTitle: "string",
                        stimulusText: "string",
                        questions: [
                          {
                            id: "string",
                            number: "number",
                            type: "multiple-choice | short-answer | extended-response",
                            prompt: "string",
                            options: ["string"],
                            correctOption: "string",
                            answerGuide: "string",
                            marks: "number",
                            skill: "string"
                          }
                        ]
                      }
                    ]
                  }
                },
                null,
                2
              )
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_object"
        }
      },
      max_output_tokens: 4000
    });

    const parsed = extractResponseJson(responsePayload);
    const questions = flattenRevisionQuestions(parsed);
    const multipleChoiceCount = questions.filter((question) => String(question.type || "").toLowerCase() === "multiple-choice").length;
    const shortAnswerCount = questions.filter((question) => String(question.type || "").toLowerCase() === "short-answer").length;
    const extendedResponseCount = questions.filter((question) => String(question.type || "").toLowerCase() === "extended-response").length;
    if (multipleChoiceCount !== 5 || shortAnswerCount !== 3 || extendedResponseCount !== 1) {
      response.status(500).json({
        error: "Revision test generation did not return the required question structure. Please try again."
      });
      return;
    }

    response.json({
      catalogueEntry: revisionEntry,
      test: {
        ...parsed,
        subjectId: parsed?.subjectId || subjectId
      }
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Revision test generation failed."
    });
  }
});

app.post("/api/revision/submit-test", async (request, response) => {
  try {
    const test = request.body?.test;
    const responsesByQuestionId = normaliseRevisionResponseMap(request.body?.responses);
    const subjectId = String(test?.subjectId || "").trim();
    const grade = String(test?.grade || "").trim();

    if (!test || !subjectId || !grade) {
      response.status(400).json({ error: "test, grade, and subjectId are required." });
      return;
    }

    const revisionEntry = getRevisionEntry(grade, subjectId);
    if (!revisionEntry) {
      response.status(404).json({ error: "No revision catalogue entry exists for that grade and subject." });
      return;
    }

    const questions = flattenRevisionQuestions(test);
    if (!questions.length) {
      response.status(400).json({ error: "The submitted test does not contain any questions." });
      return;
    }

    const autoMarkedFeedback = [];
    const openResponseQuestions = [];
    let totalScore = 0;
    let totalAvailable = 0;

    questions.forEach((question) => {
      const questionId = String(question.id || `q${question.number || ""}`).trim();
      const studentAnswer = String(responsesByQuestionId[questionId] || "").trim();
      const marks = Number(question.marks || 0);
      totalAvailable += marks;

      if (String(question.type || "").toLowerCase() === "multiple-choice") {
        const correctOption = String(question.correctOption || "").trim();
        const isCorrect = Boolean(studentAnswer) && studentAnswer === correctOption;
        const score = isCorrect ? marks : 0;
        totalScore += score;
        autoMarkedFeedback.push({
          id: questionId,
          number: question.number,
          type: question.type,
          marks,
          score,
          isCorrect,
          feedback: isCorrect
            ? `Correct. You selected the strongest option. Keep using the same clue-checking approach next time: ${question.answerGuide || "match the option to the strongest evidence in the question."}`
            : `Not correct. The strongest answer is ${correctOption || "the best supported option"}. Use the correction guide below to see why that option is stronger and what clue or concept you should look for next time.`,
          answerGuide: question.answerGuide || "",
          studentAnswer,
          correctOption
        });
        return;
      }

      openResponseQuestions.push({
        id: questionId,
        number: question.number,
        type: question.type,
        prompt: question.prompt,
        marks,
        skill: question.skill,
        answerGuide: question.answerGuide,
        studentAnswer
      });
    });

    let aiMarkedFeedback = [];
    if (openResponseQuestions.length) {
      const responsePayload = await callOpenAiJson("responses", {
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: buildGreatTeacherInstruction(
                  "You are marking Australian school revision responses. Return only JSON. Mark fairly and give fuller feedback that helps the student improve next time. Reward what is correct, explain the main gap clearly, describe what a stronger answer needed, and give one practical next step. Use 2 to 4 sentences for each response unless the answer is blank. Use the provided answer guide and marks only. Do not invent extra criteria.",
                  "Feedback should sound like a great teacher standing beside the student: calm, direct, practical, and easy to act on.",
                  greatTeacherAssessmentGuard
                )
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(
                  {
                    subject: revisionEntry.subjectName,
                    grade,
                    syllabusEntry: revisionEntry,
                    questions: openResponseQuestions,
                    outputSchema: {
                      questionFeedback: [
                        {
                          id: "string",
                          score: "number",
                          feedback: "string",
                          answerGuide: "string"
                        }
                      ],
                      overallFeedback: "string"
                    }
                  },
                  null,
                  2
                )
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_object"
          }
        },
        max_output_tokens: 2500
      });

      const parsed = extractResponseJson(responsePayload);
      aiMarkedFeedback = Array.isArray(parsed?.questionFeedback) ? parsed.questionFeedback : [];
      openResponseQuestions.forEach((question) => {
        const matchedFeedback = aiMarkedFeedback.find((item) => String(item.id || "") === question.id);
        totalScore += Number(matchedFeedback?.score || 0);
      });

      response.json({
        overallFeedback:
          parsed?.overallFeedback ||
          "Your test has been marked. Review the feedback under each question to see what to improve.",
        totalScore,
        totalAvailable,
        questionFeedback: [
          ...autoMarkedFeedback,
          ...openResponseQuestions.map((question) => {
            const matchedFeedback = aiMarkedFeedback.find((item) => String(item.id || "") === question.id);
            return {
              id: question.id,
              number: question.number,
              type: question.type,
              marks: question.marks,
              score: Number(matchedFeedback?.score || 0),
              feedback:
                matchedFeedback?.feedback ||
                "No feedback was returned for this answer. Try expanding your response and resubmitting.",
              answerGuide: matchedFeedback?.answerGuide || question.answerGuide || "",
              studentAnswer: question.studentAnswer
            };
          })
        ].sort((left, right) => Number(left.number || 0) - Number(right.number || 0))
      });
      return;
    }

    response.json({
      overallFeedback: "Your test has been marked.",
      totalScore,
      totalAvailable,
      questionFeedback: autoMarkedFeedback.sort((left, right) => Number(left.number || 0) - Number(right.number || 0))
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Revision test submission failed."
    });
  }
});

app.post("/api/upload/pdf", upload.single("file"), async (request, response) => {
  try {
    if (!request.file?.buffer) {
      response.status(400).json({ error: "A PDF file is required." });
      return;
    }

    const pdfData = await parsePdfBufferWithOcrFallback(request.file.buffer);
    response.json(pdfData);
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "PDF processing failed."
    });
  }
});

app.post("/api/upload/assessment-schedule", upload.single("file"), async (request, response) => {
  try {
    if (!request.file?.buffer) {
      response.status(400).json({ error: "A PDF schedule file is required." });
      return;
    }

    const pdfData = await parsePdfBuffer(request.file.buffer);
    if (!pdfData.pages.length) {
      response.status(400).json({ error: "The PDF schedule could not be read." });
      return;
    }

    const responsePayload = await callOpenAiJson("responses", {
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You extract assessment schedule rows from school PDFs. Return only JSON. Read the page carefully, including image text. Normalize each row into the schema requested. Preserve the exact subject wording, task number, component/task, distribution date, due date, and weighting as shown. Ignore headers, totals, semester totals, course totals, and extension labels unless they are part of a real assessment row."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Extract the assessment schedule from this PDF page. Return a JSON object with one key, assessments, whose value is an array of rows. Each row must have subjectName, taskNumber, componentTask, distributionDate, dueDate, and weighting as strings. If a subject is implied by a grouped section, carry that subject to subsequent rows until the next subject heading."
            },
            ...pdfData.pages.slice(0, 3).flatMap((page) => {
              const content = [];
              if (page.text) {
                content.push({
                  type: "input_text",
                  text: `Extracted page text for page ${page.pageNumber}:\n${page.text}`
                });
              }
              content.push({
                type: "input_image",
                image_url: page.imageUrl,
                detail: "high"
              });
              return content;
            })
          ]
        }
      ],
      text: {
        format: {
          type: "json_object"
        }
      },
      max_output_tokens: 4000
    });

    const parsed = extractResponseJson(responsePayload);
    const assessments = Array.isArray(parsed?.assessments)
      ? parsed.assessments
          .map((row) => ({
            subjectName: String(row?.subjectName || "").trim(),
            taskNumber: String(row?.taskNumber || "").trim(),
            componentTask: String(row?.componentTask || "").trim(),
            distributionDate: String(row?.distributionDate || "").trim(),
            dueDate: String(row?.dueDate || "").trim(),
            weighting: String(row?.weighting || "").trim()
          }))
          .filter(
            (row) =>
              row.subjectName &&
              row.componentTask &&
              row.distributionDate &&
              row.dueDate &&
              row.weighting
          )
      : [];

    response.json({ assessments });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Assessment schedule parsing failed."
    });
  }
});

app.listen(port, () => {
  console.log(`PaperPanda API listening on port ${port}`);
});
