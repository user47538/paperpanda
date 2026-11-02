import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import { createRequire } from "node:module";

const frontend = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");
const backend = fs.readFileSync(new URL("../backend/server.js", import.meta.url), "utf8");
function loadFunctions(source, names, globals = {}) {
  const context = vm.createContext(globals);
  for (const name of names) {
    const match = new RegExp(`(?:async )?function ${name}\\(`).exec(source);
    assert.ok(match, `Missing function ${name}`);
    const end = source.indexOf("\n}\n", match.index) + 2;
    vm.runInContext(source.slice(match.index, end), context);
  }
  return context;
}
const parserNames = ["normaliseWorksheetQuestionNumber", "extractWorksheetQuestionReferences", "splitWorksheetTextIntoLines", "getWorksheetQuestionLineMatch"];
const frontNames = [...parserNames, "buildWorksheetQuestionBlocksFromText", "normaliseQuestionBlock", "getDocumentPages", "getDocumentPageText", "getCurrentDocumentPageIndex", "getAskPageVisualOptions", "buildDocumentVisionPages", "requestAskAnswer", "clipText", "getMeaningfulPdfText", "getPdfTextSignal", "shouldUseBackendOcrForPdfPage"];
const backNames = [...parserNames, "buildWorksheetQuestionBlocks", "clipText", "cleanDocumentQuestionBlocks", "cleanDocumentVisionPages", "cleanDocumentStudyText", "buildAskDocumentContext", "findStructuredWorksheetQuestion", "extractFocusedWorksheetQuestion", "requestAskModelAnswer", "extractResponseText", "extractResponseJson"];
const plain = (value) => JSON.parse(JSON.stringify(value));
function frontContext(overrides = {}) {
  return loadFunctions(frontend, frontNames, {
    state: { currentDocumentPageIndexes: {} },
    hydrateDocumentPreviewImages: async () => {},
    compressDocumentPageImage: async (url) => url,
    getTodayAskHistory: () => [],
    getNextSubjectAssessment: () => null,
    ...overrides
  });
}
function backContext(overrides = {}) {
  return loadFunctions(backend, backNames, {
    buildGreatTeacherInstruction: (...rules) => rules.join(" "),
    greatTeacherAskDecisionLens: "", greatTeacherAskDeliveryLens: "",
    greatTeacherAskResponseShape: "", greatTeacherAssessmentGuard: "",
    callOpenAiJson: async () => { throw new Error("Unexpected model call"); },
    ...overrides
  });
}
const page = (pageNumber, text, image = true) => ({ pageNumber, text, imageUrl: image ? `https://example.test/page-${pageNumber}.png` : "" });

for (const [name, source, buildName] of [["frontend", frontend, "buildWorksheetQuestionBlocksFromText"], ["backend", backend, "buildWorksheetQuestionBlocks"]]) {
  test(`${name}: question labels and requests preserve lettered parts`, () => {
    const context = loadFunctions(source, [...parserNames, buildName]);
    for (const label of ["7a", "Q7(a)", "Question 7 (a)", "007a)"]) {
      assert.equal(context.normaliseWorksheetQuestionNumber(label), "Q7A");
    }
    assert.deepEqual(plain(context.extractWorksheetQuestionReferences("Explain question 7(a)")), ["Q7A"]);
    assert.deepEqual(plain(context.extractWorksheetQuestionReferences("Help with Q7 part b")), ["Q7B"]);
    assert.deepEqual(plain(context.extractWorksheetQuestionReferences("7(a)")), ["Q7A"]);
    assert.deepEqual(plain(context.extractWorksheetQuestionReferences("What is 7 + 8?")), []);
  });
  test(`${name}: standalone numbers and subparts stay separate from the next question`, () => {
    const context = loadFunctions(source, [...parserNames, buildName]);
    const blocks = context[buildName]("Page 3\n6. Find the perimeter.\n7\nCalculate each expression.\n(a) 3 + 5\n(b) 8 - 2\n8. Find the area.\n3", 3);
    assert.deepEqual(plain(blocks.map((block) => block.questionNumber)), ["Q6", "Q7", "Q7A", "Q7B", "Q8"]);
    const target = blocks.find((block) => block.questionNumber === "Q7A");
    assert.match(target.text, /Calculate each expression/);
    assert.match(target.text, /3 \+ 5/);
    assert.doesNotMatch(target.text, /8 - 2|Find the area/);
    assert.equal(target.pageNumber, 3);
    assert.equal(context.getWorksheetQuestionLineMatch("3.5 + 2 = 5.5"), null);
    assert.equal(context.getWorksheetQuestionLineMatch("2 x + 5 = 9"), null);
    assert.equal(context.getWorksheetQuestionLineMatch("7(a) 3 + 5").questionNumber, "Q7A");
  });
}

test("Ask payload carries a question below the old 120-character cutoff on a later page", async () => {
  let payload;
  const context = frontContext({ requestApi: async (_path, body) => { payload = body; return { answer: "Answer" }; } });
  const pages = Array.from({ length: 8 }, (_, i) => page(i + 1, `${i + 1}. Find the perimeter of this shape.`));
  pages[7].text = `${"Worksheet instructions and useful information. ".repeat(20)}\n27. Calculate 8 x 6.\n28. Find the area.`;
  const document = { id: "maths", title: "Maths PDF", pages, content: "Overview", pageVisualOptions: { maxPages: 1, prioritizedPageNumbers: [1] } };
  await context.requestAskAnswer("Explain question 27", { name: "Maths" }, document);
  assert.equal(payload.document.pageVisuals[0].pageNumber, 8);
  assert.ok(payload.document.pageVisuals[0].questionBlocks.some((block) => block.questionNumber === "Q27"));
  assert.match(payload.document.pageVisuals[0].text, /27\. Calculate 8 x 6/);
  const cleaned = backContext().buildAskDocumentContext(payload.document);
  assert.equal(cleaned.pageVisuals[0].questionBlocks[0].questionNumber, "Q27");
});

test("explicit PDF page restricts selection, including when that page is absent", async () => {
  const context = frontContext();
  const document = { pages: [page(1, "7. First exercise."), page(5, "7. Second exercise.")] };
  const options = context.getAskPageVisualOptions(document, "Question 7 on page 5");
  const pages = await context.buildDocumentVisionPages(document, { ...options, includeTextPages: true });
  assert.deepEqual(plain(pages.map((entry) => entry.pageNumber)), [5]);
  const missing = context.getAskPageVisualOptions(document, "Question 7 on page 9");
  assert.equal((await context.buildDocumentVisionPages(document, { ...missing, includeTextPages: true })).length, 0);
});

test("page ordering honours request priority and enforces the page limit", async () => {
  const context = frontContext();
  const document = { pages: [page(1, "1. First question."), page(2, "2. Second question."), page(3, "3. Third question.")] };
  const selected = await context.buildDocumentVisionPages(document, { maxPages: 2, prioritizedPageNumbers: [3, 2, 1] });
  assert.deepEqual(plain(selected.map((entry) => entry.pageNumber)), [3, 2]);
});

test("saved PDFs without cached images keep question blocks and line breaks", async () => {
  const context = frontContext();
  const document = { pages: [page(6, "Page 6\n7. Calculate the total.\nUse 3 + 5.\n8. Find the area.", false)] };
  const pages = await context.buildDocumentVisionPages(document, { includeTextPages: true, maxTextPerPage: 6000, prioritizedPageNumbers: [6] });
  const back = backContext();
  const cleaned = back.buildAskDocumentContext({ pageVisuals: pages });
  assert.match(cleaned.pageVisuals[0].text, /\nUse 3 \+ 5/);
  const result = await back.extractFocusedWorksheetQuestion({ worksheetQuestionReferences: ["Q7"], documentContext: cleaned });
  assert.equal(result.pageNumber, 6);
  assert.doesNotMatch(result.extractedText, /Find the area/);
});

test("repeated numbering needs a page unless the current page resolves it", () => {
  const back = backContext();
  const pages = [page(2, "7. First exercise."), page(3, "7. Another exercise.")];
  assert.equal(back.findStructuredWorksheetQuestion({ references: ["Q7"], pageVisuals: pages }).ambiguous, true);
  assert.equal(back.findStructuredWorksheetQuestion({ references: ["Q7"], pageVisuals: pages, preferredPageNumber: 3 }).pageNumber, 3);
});

for (const [name, result] of [
  ["explicit not-found", { found: false, matchedQuestionNumber: "Q7", pageNumber: 2, extractedText: "7. A guess" }],
  ["wrong question", { found: true, matchedQuestionNumber: "Q8", pageNumber: 2, extractedText: "8. Wrong question" }],
  ["invented page", { found: true, matchedQuestionNumber: "Q7", pageNumber: 99, extractedText: "7. Wrong page" }]
]) {
  test(`visual matching rejects ${name}`, async () => {
    let calls = 0;
    const back = backContext({ callOpenAiJson: async () => { calls++; return { output_text: JSON.stringify(result) }; } });
    const answer = await back.requestAskModelAnswer({ subjectName: "Maths", question: "Explain Q7", documentContext: back.buildAskDocumentContext({ pageVisuals: [page(2, "7. Actual question.")] }) });
    assert.match(answer, /couldn't verify Q7/);
    assert.equal(calls, 1, "A rejected match must not reach the answer model");
  });
}

test("verified answers use the original page and exclude stale history and summaries", async () => {
  const calls = [];
  const back = backContext({ callOpenAiJson: async (_endpoint, body) => {
    calls.push(body);
    return calls.length === 1
      ? { output_text: JSON.stringify({ found: true, matchedQuestionNumber: "7(a)", pageNumber: 4, extractedText: "7(a) Calculate 3 + 5." }) }
      : { output_text: "Q7(a), PDF page 4: Calculate 3 + 5. The answer is 8." };
  } });
  const documentContext = back.buildAskDocumentContext({ content: "Wrong old summary", pageVisuals: [page(4, "7(a) Calculate 3 + 5.\n8. Find the area.")], preferredPageNumber: 4 });
  const answer = await back.requestAskModelAnswer({ subjectName: "Maths", question: "Explain Q7(a)", recentHistory: [{ answer: "Wrong old answer" }], documentContext });
  assert.match(answer, /PDF page 4/);
  assert.equal(calls.length, 2);
  assert.ok(calls[0].input[1].content.some((entry) => entry.type === "input_image" && entry.image_url.endsWith("page-4.png")));
  const input = JSON.parse(calls[1].input[1].content[0].text);
  assert.equal(input.focusedWorksheetQuestion.matchedQuestionNumber, "Q7A");
  assert.deepEqual(input.recentHistory, []);
  assert.doesNotMatch(input.document.content, /Wrong old summary/);
});

test("missing PDF context cannot generate a guessed numbered answer", async () => {
  const back = backContext();
  assert.match(await back.requestAskModelAnswer({ subjectName: "Maths", question: "Explain Q7" }), /couldn't verify Q7/);
});

test("compact retries retain the matching question and page", () => {
  const back = backContext();
  const document = { pageVisuals: [page(8, "27. Calculate 8 x 6.")], preferredPageNumber: 8 };
  assert.equal(back.buildAskDocumentContext(document, { compact: true }).pageVisuals[0].pageNumber, 8);
});

test("a single scanned page triggers OCR inside a mostly searchable PDF", async () => {
  let ocrCalls = 0;
  const pages = [1, 2, 3, 4, 5].map((number) => page(number, number === 4 ? "" : "Plenty of searchable text."));
  const context = loadFunctions(backend, ["parsePdfBufferWithOcrFallback"], {
    parsePdfBuffer: async () => ({ pages }),
    shouldOcrPdfPage: (entry) => !entry.text,
    canUseLocalOcr: () => true,
    ocrPdfPagesLocally: async (input) => { ocrCalls++; return input.map((entry) => ({ ...entry, text: entry.text || "7. Scanned question." })); },
    didPdfPageTextsChange: () => true,
    stripPdfOcrArtifacts: (input) => input,
    rebuildPdfTextIndexes: (input) => ({ pages: input }),
    buildPdfOcrErrorMessage: () => "",
    openAiApiKey: ""
  });
  const result = await context.parsePdfBufferWithOcrFallback(Buffer.from("fixture"));
  assert.equal(ocrCalls, 1);
  assert.equal(result.ocrUsed, true);
  assert.match(result.pages[3].text, /7\. Scanned question/);
});

// Build an actual searchable PDF fixture so parsing is exercised, not just text mocks.
function makePdf(lines) {
  const stream = `BT /F1 12 Tf 40 750 Td 18 TL\n${lines.map((line) => `(${line.replace(/[\\()]/g, "\\$&")}) Tj T*`).join("\n")}\nET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

test("actual PDF upload extraction retains numbers, subparts, and page images through the Ask payload", async () => {
  const requireBackend = createRequire(new URL("../backend/package.json", import.meta.url));
  const pdfjsLib = await import(requireBackend.resolve("pdfjs-dist/legacy/build/pdf.mjs"));
  const { createCanvas } = requireBackend("@napi-rs/canvas");
  const context = loadFunctions(backend, [...parserNames, "buildWorksheetQuestionBlocks", "extractPdfPageText", "getPdfPageBlockText", "parsePdfBuffer"], {
    pdfjsLib, Uint8Array,
    shouldOcrPdfPage: () => false,
    pdfPreviewRenderScale: 1.25,
    renderPdfPageToDataUrl: async (pdfPage) => {
      const viewport = pdfPage.getViewport({ scale: 1.25 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await pdfPage.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      return `data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`;
    }
  });
  const extracted = await context.parsePdfBuffer(makePdf(["Maths worksheet", "6. Find the perimeter.", "7", "Calculate each expression.", "(a) 3 + 5", "(b) 8 - 2", "8. Find the area."]));
  assert.equal(extracted.pages.length, 1);
  assert.match(extracted.pages[0].imageUrl, /^data:image\/png;base64,/);
  assert.ok(extracted.pages[0].questionBlocks.some((block) => block.questionNumber === "Q7A"));
  let request;
  const front = frontContext({ requestApi: async (_endpoint, body) => { request = body; return { answer: "checked" }; } });
  await front.requestAskAnswer("Explain question 7(a)", { name: "Maths" }, { title: "Uploaded maths PDF", content: extracted.fullText, pages: extracted.pages });
  const cleaned = backContext().buildAskDocumentContext(request.document);
  const match = backContext().findStructuredWorksheetQuestion({ references: ["Q7A"], pageVisuals: cleaned.pageVisuals });
  assert.equal(match.pageNumber, 1);
  assert.match(match.extractedText, /3 \+ 5/);
  assert.doesNotMatch(match.extractedText, /8 - 2|Find the area/);
});

test("repeating the same question on a different page or PDF does not replay the old answer", () => {
  const state = { currentDocumentPageIndexes: {}, subjectLandingView: "original", subjectLandingPieceIndex: 0 };
  let document = { id: "pdf-one", pages: [page(1, "7. First question."), page(2, "7. Different question.")] };
  const surface = { kind: "landing" };
  const context = loadFunctions(frontend, [...parserNames, "buildWorksheetQuestionBlocksFromText", "getDocumentPages", "normaliseQuestionBlock", "getCurrentDocumentPageIndex", "getAskSourceKey", "storeAskAnswerForSurface", "canReplayStoredAskAnswer"], {
    state,
    getSelectedSubject: () => ({ id: "maths" }),
    getActiveAskDocument: () => document,
    getStoredAskAnswer: () => state.subjectLandingAskAnswer,
    getLastAskedQuestion: () => state.subjectLandingAskLastQuestion,
    getAskReadyStatus: () => "Ready"
  });
  context.storeAskAnswerForSurface(surface, "Explain Q7", "First answer");
  assert.equal(context.canReplayStoredAskAnswer(surface, "Explain Q7"), true);
  state.currentDocumentPageIndexes[document.id] = 1;
  assert.equal(context.canReplayStoredAskAnswer(surface, "Explain Q7"), false);
  assert.equal(context.canReplayStoredAskAnswer(surface, ""), false);
  document = { ...document, id: "pdf-two" };
  assert.equal(context.canReplayStoredAskAnswer(surface, "Explain Q7"), false);
});

test("unnumbered help retains the reader's current section page limit", async () => {
  const context = frontContext();
  const document = { pages: [page(1, "First page"), page(2, "Second page")], pageVisualOptions: { maxPages: 1, prioritizedPageNumbers: [2] } };
  const options = context.getAskPageVisualOptions(document, "Explain this page");
  const result = await context.buildDocumentVisionPages(document, { ...options, includeTextPages: true });
  assert.deepEqual(plain(result.map((entry) => entry.pageNumber)), [2]);
});
