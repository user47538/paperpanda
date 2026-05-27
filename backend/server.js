import cors from "cors";
import express from "express";
import multer from "multer";
import { createCanvas } from "@napi-rs/canvas";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { availableRevisionGrades, getRevisionCatalogueForGrade, getRevisionEntry } from "./curriculumCatalog.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const openAiApiKey = process.env.OPENAI_API_KEY || "";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ].filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    }
  })
);
app.use(express.json({ limit: "10mb" }));

function requireOpenAiKey() {
  if (!openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the backend.");
  }
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

async function callOpenAiJson(endpoint, payload) {
  requireOpenAiKey();
  const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`
    },
    body: JSON.stringify(payload)
  });

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
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`
    },
    body: JSON.stringify(payload)
  });

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

function shouldOcrPdfPage(page) {
  return getMeaningfulPdfText(page?.text).length < 40;
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
                "You extract worksheet text from school PDF page images. Return only JSON. Read all visible text carefully. Preserve headings, labels, numbered questions, and answer lines where readable. Do not summarise. If a page has little or no readable text, return an empty string for that page."
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
                image_url: page.imageUrl,
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

  return pages.map((page) => {
    const ocrText = String(ocrByPageNumber.get(page.pageNumber) || "").trim();
    if (!ocrText) {
      return page;
    }
    return {
      ...page,
      text: `Page ${page.pageNumber}\n${ocrText}`.trim()
    };
  });
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

async function renderPdfPageToDataUrl(page) {
  const viewport = page.getViewport({ scale: 1.25 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");
  const canvasFactory = new NodeCanvasFactory();
  await page.render({ canvasContext: context, viewport, canvasFactory }).promise;
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
    const imageUrl = await renderPdfPageToDataUrl(page);

    if (pageText) {
      const blockText = `Page ${pageNumber}\n${pageText}`;
      pages.push({
        pageNumber,
        text: blockText,
        imageUrl,
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
    (sparsePages === pdfData.pages.length || getMeaningfulPdfText(pdfData.fullText).length < pdfData.pages.length * 30);

  if (!needsOcrFallback) {
    return pdfData;
  }

  const ocrPages = await ocrPdfPagesWithOpenAi(pdfData.pages);
  return rebuildPdfTextIndexes(ocrPages);
}

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    hasOpenAiKey: Boolean(openAiApiKey)
  });
});

app.get("/api/revision/catalogue", (request, response) => {
  const grade = String(request.query?.grade || "7");
  response.json({
    grade,
    grades: availableRevisionGrades,
    entries: getRevisionCatalogueForGrade(grade)
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

app.post("/api/ask", async (request, response) => {
  try {
    const { subjectName, question, recentHistory = [], nextAssessment = null, document = null } = request.body || {};
    if (!subjectName || !question) {
      response.status(400).json({ error: "subjectName and question are required." });
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
                "You are a helpful Australian school study support tutor. Explain clearly, use short paragraphs, keep language age-appropriate, and base your help on the provided subject and document context. Give guidance, examples, steps, and clarification rather than claiming to have unseen information."
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
                  subjectName,
                  question,
                  recentHistory,
                  nextAssessment,
                  document
                },
                null,
                2
              )
            }
          ]
        }
      ],
      max_output_tokens: 500
    });

    const answer = extractResponseText(responsePayload);
    if (!answer) {
      throw new Error("OpenAI returned an empty answer.");
    }

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
      format: "mp3",
      input: text,
      instructions:
        "Speak as a warm, fluent female tutor for an Australian school student. Use natural pauses, clear emphasis, and calm expressive delivery."
    });

    response.setHeader("Content-Type", speech.contentType);
    response.send(speech.buffer);
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Speech generation failed."
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
              text:
                "You build Australian school revision tests. Return only JSON. Use a NAPLAN-inspired structure. The test must contain exactly 9 questions total: exactly 5 multiple-choice questions, exactly 3 short-answer questions, and exactly 1 extended-response question. Do not include answers in the instructions. For English, stay closest to NAPLAN reading/language/writing style. For other subjects, adapt that structure to the subject while keeping the question style clear and age-appropriate. Every question must include an id, marks, skill, and answerGuide. Every multiple-choice question must include exactly 4 options and a correctOption value that matches one option exactly."
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
                text:
                  "You are marking Australian school revision responses. Return only JSON. Mark fairly and give fuller feedback that helps the student improve next time. Reward what is correct, explain the main gap clearly, describe what a stronger answer needed, and give one practical next step. Use 2 to 4 sentences for each response unless the answer is blank. Use the provided answer guide and marks only. Do not invent extra criteria."
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
