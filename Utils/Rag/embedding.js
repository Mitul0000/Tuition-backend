const { GoogleGenAI } = require("@google/genai");
const { EMBEDDING_DIMENSIONS } = require("../../Config/constants").constants;

const BATCH_SIZE = 100;

const normalize = (values) => {
  const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  return norm === 0 ? values : values.map((v) => v / norm);
};

const embedChunks = async (chunks, api_key) => {
  const ai = new GoogleGenAI({ apiKey: api_key });
  const texts = chunks.map((chunk) => chunk.text);
  const vectors = [];

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: texts.slice(start, start + BATCH_SIZE),
      config: {
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    });
    for (const e of response.embeddings) vectors.push(normalize(e.values));
  }

  return chunks.map((chunk, index) => ({
    ...chunk,
    vector: vectors[index],
  }));
};

const embedQuery = async (query, api_key) => {
  const ai = new GoogleGenAI({ apiKey: api_key });

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: query,
    config: {
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  return normalize(response.embeddings[0].values);
};

module.exports = { embedChunks, embedQuery };