exports.assemblePaper = (selectedQuestions, metadata) => {
  const format = {
    mcq: "Multiple Choice Questions",
    shortAnswer: "Short Answer Questions",
    longAnswer: "Long Answer Questions",
    fillInTheBlank: "Fill in the Blanks",
  };

  const sections = Object.keys(format)
    .filter((key) => selectedQuestions[key] && selectedQuestions[key].length > 0)
    .map((key) => ({
      title: format[key],
      type: key,
      questions: selectedQuestions[key].map((questions, index) => ({
        ...questions,
        number: index + 1,
      })),
    }));

  return {
    metadata,
    sections,
  };
};