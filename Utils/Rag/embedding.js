const { GoogleGenAI } = require("@google/genai");

const embedChunks = async (chunks, api_key) => {
  const ai = new GoogleGenAI({ apiKey: api_key });
  const texts = chunks.map((chunk) => chunk.text);

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: texts,
    config: { taskType: "RETRIEVAL_DOCUMENT" },
  });

  return chunks.map((chunk, index) => ({
    ...chunk,
    vector: response.embeddings[index].values,
  }));
};

const embedQuery = async (query, api_key) => {
  const ai = new GoogleGenAI({ apiKey: api_key });

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: query,
    config: { taskType: "RETRIEVAL_QUERY" },
  });

  return response.embeddings[0].values;
};

module.exports = { embedChunks, embedQuery };