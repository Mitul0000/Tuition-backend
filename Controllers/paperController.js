const { assemblePaper } = require("../Utils/paperAssembler");
const { buildPaperHTML, buildAnswerSheetHTML } = require("../Utils/htmlTemplate");
const { renderPdf } = require("../Utils/pdfRenderer");
const Paper = require("../Models/Paper");

exports.postGeneratePdf = async (request, response) => {
  try {
    const { selectedQuestions, metadata } = request.body;
    const formatedObject = assemblePaper(selectedQuestions, metadata);
    const htmlPaper = buildPaperHTML(formatedObject);
    const pdfBuffer = await renderPdf(htmlPaper);
    response.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="question-paper.pdf"',
      "Content-Length": pdfBuffer.length,
    });

    response.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating PDF:", err);
    response
      .status(500)
      .json({ error: "Failed to generate question paper PDF" });
  }
};

exports.postGenerateAnswerSheet = async (request, response) => {
  try {
    const { selectedQuestions, metadata } = request.body;

    const formatedObject = assemblePaper(selectedQuestions, metadata);
    const htmlAnswerSheet = buildAnswerSheetHTML(formatedObject);
    const pdfBuffer = await renderPdf(htmlAnswerSheet);

    response.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="answer-key.pdf"',
      "Content-Length": pdfBuffer.length,
    });

    response.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating answer sheet PDF:", error);
    response.status(500).json({ error: "Failed to generate answer sheet PDF" });
  }
};

// New: save a paper against the logged-in tutor's Firebase uid, for the "My Papers" list
exports.postSavePaper = async (request, response) => {
  try {
    const { title, metadata, selectedQuestions } = request.body;
    const uid = request.user.uid;

    const paper = await Paper.create({
      uid,
      title,
      metadata,
      selectedQuestions,
    });

    response.status(201).json({ paper });
  } catch (error) {
    console.error("Error saving paper:", error);
    response.status(500).json({ error: "Failed to save paper" });
  }
};

// New: list saved papers for the logged-in tutor
exports.getMyPapers = async (request, response) => {
  try {
    const uid = request.user.uid;
    const papers = await Paper.find({ uid }).sort({ createdAt: -1 });
    response.json({ papers });
  } catch (error) {
    console.error("Error fetching papers:", error);
    response.status(500).json({ error: "Failed to fetch papers" });
  }
};