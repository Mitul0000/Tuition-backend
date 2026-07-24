const { CHUNK_SIZE, CHUNK_OVERLAP } = require("../../Config/constants").constants;
const { countTokens } = require("../tokenCounter");

exports.chunkSections = (sections) => {
  const chunks = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const sectionTokenCount = countTokens(section.text);

    if (sectionTokenCount > CHUNK_SIZE) {
      // split into sentences
      const sentences = section.text.match(/[^.!?]+[.!?]+/g) || [section.text];

      let currentChunkSentences = [];
      let currentTokenCount = 0;

      for (let s = 0; s < sentences.length; s++) {
        const sentence = sentences[s];
        const sentenceTokens = countTokens(sentence);

        if (currentTokenCount + sentenceTokens > CHUNK_SIZE && currentChunkSentences.length > 0) {
          // close current chunk
          chunks.push({
            text: currentChunkSentences.join(" ").trim(),
            sectionTag: section.heading,
            chunkIndex: chunkIndex++,
          });

          // start new chunk with overlap: back up from the end of the closed chunk
          let overlapSentences = [];
          let overlapTokens = 0;
          for (let j = currentChunkSentences.length - 1; j >= 0; j--) {
            const t = countTokens(currentChunkSentences[j]);
            if (overlapTokens + t > CHUNK_OVERLAP) break;
            overlapSentences.unshift(currentChunkSentences[j]);
            overlapTokens += t;
          }

          currentChunkSentences = overlapSentences;
          currentTokenCount = overlapTokens;
        }

        currentChunkSentences.push(sentence);
        currentTokenCount += sentenceTokens;
      }

      // push whatever's left as the final chunk
      if (currentChunkSentences.length > 0) {
        chunks.push({
          text: currentChunkSentences.join(" ").trim(),
          sectionTag: section.heading,
          chunkIndex: chunkIndex++,
        });
      }
    } else {
      chunks.push({
        text: section.text,
        sectionTag: section.heading,
        chunkIndex: chunkIndex++,
      });
    }
  }

  return chunks;
};