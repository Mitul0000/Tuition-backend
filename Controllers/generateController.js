const { extractTextFromFiles } = require("../Utils/extraction");
const { chunkSections } = require("../Utils/Rag/chunking");
const { embedChunks, embedQuery } = require("../Utils/Rag/embedding");
const { retrieveRelevantChunks } = require("../Utils/Rag/retrieval");
const { generateQuestions } = require("../Utils/generate");
const { countTokens } = require("../Utils/tokenCounter");
const { decideRoute } = require("../Utils/routing");
const RagVector = require("../Models/ragVector");
const { constants } = require("../Config/constants");
const crypto = require("crypto");

exports.postGenerateQuestion = async (req, res) => {
  try {
    const { requirements, api_key } = req.body;
    const files = req.files;

    // Step 1: Extraction
    const extractedData = await extractTextFromFiles(files, api_key);
    const sections = extractedData.sections;
    const fullText = sections.map((s) => s.text).join("\n\n");

    // Step 2: Routing
    const route = decideRoute(fullText);

    console.log("Routing decision:", route);

    let contentText;
    let sessionId = null;

    if (route === "Direct") {
      contentText = fullText;
    } else {
      // RAG path
      const chunkedSections = chunkSections(sections);
      const vectorizedChunks = await embedChunks(chunkedSections, api_key);

      sessionId = crypto.randomUUID();
      await RagVector.create({ sessionId, chunks: vectorizedChunks });

      if (requirements.syllabus) {
        const queryVector = await embedQuery(requirements.syllabus, api_key);
        const relevantChunks = retrieveRelevantChunks(queryVector, vectorizedChunks, constants.TOP_K);
        contentText = relevantChunks.map((c) => c.text).join("\n\n");
      } else {
        contentText = vectorizedChunks.map((c) => c.text).join("\n\n");
      }
    }

    // Step 3: Generation
    const questions = await generateQuestions(contentText, requirements, api_key);

    res.json({ questions, sessionId });
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
};

exports.postRegenerateQuestion = async (req, res) => {
  const { sessionId, requirements, api_key } = req.body;

  try {
    const ragVector = await RagVector.findOne({ sessionId });
    if (!ragVector) {
      return res.status(404).json({ error: "Session not found" });
    }

    let contentText;
    if (requirements.syllabus) {
      const queryVector = await embedQuery(requirements.syllabus, api_key);
      const relevantChunks = retrieveRelevantChunks(queryVector, ragVector.chunks, constants.TOP_K);
      contentText = relevantChunks.map((c) => c.text).join("\n\n");
    } else {
      contentText = ragVector.chunks.map((c) => c.text).join("\n\n");
    }

    const questions = await generateQuestions(contentText, requirements, api_key);

    res.json({ questions, sessionId });
  } catch (error) {
    console.error("Error regenerating questions:", error);
    res.status(500).json({ error: "Failed to regenerate questions" });
  }
};


exports.deleteSession = async (req, res) => {
  const { sessionId } = req.body;
  try {
    await RagVector.deleteOne({ sessionId });
    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
};