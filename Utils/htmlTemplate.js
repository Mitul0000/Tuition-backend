// Registry of renderers — one function per question type.
// Each function receives ONE question object and returns the HTML
// that goes BELOW the number/text/marks row (options, blank space, etc.)
const questionTypeRenderers = {
  mcq: (question) => {
    if (!question.options || question.options.length === 0) return "";
    return `
      <div class="options">
        ${question.options
          .map((option, i) => `<span class="option">${String.fromCharCode(97 + i)}) ${option}</span>`)
          .join("")}
      </div>
    `;
  },

  fillInTheBlank: () => {
    return "";
  },

  shortAnswer: () => {
    return "";
  },

  longAnswer: () => {
  return "";
  },

  default: () => "",
};

const renderQuestion = (question, type) => {
  const renderer = questionTypeRenderers[type] || questionTypeRenderers.default;
  const bodyHTML = renderer(question);

  return `
    <div class="question-block">
      <div class="question-row">
        <span class="question-text"><strong>${question.number}.</strong> ${question.question}</span>
        <span class="question-marks">${question.marks}</span>
      </div>
      ${bodyHTML}
    </div>
  `;
};

const renderSection = (section) => {
  const questionsHTML = section.questions
    .map((question) => renderQuestion(question, section.type))
    .join("");

  return `
    <div class="section">
      <h2 class="section-title">${section.title}</h2>
      ${questionsHTML}
    </div>
  `;
};

exports.buildPaperHTML = (paperData) => {
  const { metadata, sections } = paperData;
  const { institutionName, className, timeAllowed, watermark, totalMarks } = metadata;

  const sectionsHTML = sections.map(renderSection).join("");

  const watermarkHTML = watermark
    ? `<div class="watermark">${institutionName || ""}</div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Bengali&family=Noto+Sans+Devanagari&display=swap');

          * { box-sizing: border-box; }

          body {
            font-family: 'Noto Sans', 'Noto Sans Bengali', 'Noto Sans Devanagari', sans-serif;
            font-size: 13px;
            line-height: 1.5;
            color: #1a1a1a;
            margin: 0;
            padding: 30px 36px;
            position: relative;
            border: 2px solid #1a1a1a;
          }

          .watermark {
            position: fixed;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 70px;
            font-weight: 700;
            color: rgba(0, 0, 0, 0.06);
            z-index: -1;
            white-space: nowrap;
          }

          .header {
            text-align: center;
            border-bottom: 3px double #1a1a1a;
            padding-bottom: 12px;
            margin-bottom: 4px;
          }
          .header .institution-name {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            letter-spacing: 0.03em;
            text-transform: uppercase;
          }
          .header .class-name {
            font-size: 14px;
            margin: 6px 0 0 0;
            color: #444;
          }

          .meta-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0 18px 0;
            font-size: 13px;
            font-weight: 600;
            border-bottom: 1px solid #1a1a1a;
            margin-bottom: 22px;
          }

          .section { margin-bottom: 26px; }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: #f0f0f0;
            border: 1px solid #1a1a1a;
            padding: 5px 0;
            margin-bottom: 16px;
          }

          .question-block { margin-bottom: 16px; page-break-inside: avoid; }
          .question-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
          .question-text { flex: 1; }
          .question-marks {
            white-space: nowrap;
            font-weight: 600;
            border: 1px solid #999;
            border-radius: 3px;
            padding: 1px 8px;
            font-size: 12px;
            height: fit-content;
          }

          .options {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 20px;
            margin: 8px 0 0 22px;
          }
          .option { font-size: 13px; }

          .answer-space {
            border-bottom: 1px dashed #aaa;
            margin-top: 10px;
          }
          .answer-space-short { height: 55px; }
        </style>
      </head>
      <body>
        ${watermarkHTML}
        <div class="header">
          <p class="institution-name">${institutionName || ""}</p>
          <p class="class-name">${className || ""}</p>
        </div>
        <div class="meta-row">
          <span>Time: ${timeAllowed || "-"}</span>
          <span>Total Marks: ${totalMarks || "-"}</span>
        </div>
        ${sectionsHTML}
      </body>
    </html>
  `;
};

// Answer-sheet renderers — same registry pattern, different content per type
const answerTypeRenderers = {
  mcq: (question) => {
    return `<div class="answer-text"><strong>Answer:</strong> ${question.answer}</div>`;
  },
  shortAnswer: (question) => {
    return `<div class="answer-text"><strong>Answer:</strong> ${question.answer}</div>`;
  },
  longAnswer: (question) => {
    return `<div class="answer-text"><strong>Answer:</strong> ${question.answer}</div>`;
  },
  fillInTheBlank: (question) => {
    return `<div class="answer-text"><strong>Answer:</strong> ${question.answer}</div>`;
  },
  default: () => "",
};

const renderAnswerQuestion = (question, type) => {
  const renderer = answerTypeRenderers[type] || answerTypeRenderers.default;
  const answerHTML = renderer(question);

  return `
    <div class="question-block">
      <div class="question-row">
        <span class="question-text"><strong>${question.number}.</strong> ${question.question}</span>
        <span class="question-marks">${question.marks}</span>
      </div>
      ${answerHTML}
    </div>
  `;
};

const renderAnswerSection = (section) => {
  const questionsHTML = section.questions
    .map((question) => renderAnswerQuestion(question, section.type))
    .join("");

  return `
    <div class="section">
      <h2 class="section-title">${section.title}</h2>
      ${questionsHTML}
    </div>
  `;
};

exports.buildAnswerSheetHTML = (paperData) => {
  const { metadata, sections } = paperData;
  const { institutionName, className, timeAllowed, totalMarks } = metadata;

  const sectionsHTML = sections.map(renderAnswerSection).join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Bengali&family=Noto+Sans+Devanagari&display=swap');
          * { box-sizing: border-box; }
          body {
            font-family: 'Noto Sans', 'Noto Sans Bengali', 'Noto Sans Devanagari', sans-serif;
            font-size: 13px;
            line-height: 1.5;
            color: #1a1a1a;
            margin: 0;
            padding: 30px 36px;
            border: 2px solid #1a1a1a;
          }
          .header { text-align: center; border-bottom: 3px double #1a1a1a; padding-bottom: 12px; margin-bottom: 4px; }
          .header .institution-name { font-size: 24px; font-weight: 700; margin: 0; text-transform: uppercase; }
          .header .class-name { font-size: 14px; margin: 6px 0 0 0; color: #444; }
          .meta-row {
            display: flex; justify-content: space-between; padding: 10px 0 18px 0;
            font-size: 13px; font-weight: 600; border-bottom: 1px solid #1a1a1a; margin-bottom: 22px;
          }
          .section { margin-bottom: 26px; }
          .section-title {
            font-size: 14px; font-weight: 700; text-align: center; text-transform: uppercase;
            background: #f0f0f0; border: 1px solid #1a1a1a; padding: 5px 0; margin-bottom: 16px;
          }
          .question-block { margin-bottom: 14px; page-break-inside: avoid; }
          .question-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
          .question-text { flex: 1; }
          .question-marks {
            white-space: nowrap; font-weight: 600; border: 1px solid #999; border-radius: 3px;
            padding: 1px 8px; font-size: 12px;
          }
          .answer-text { margin: 4px 0 0 22px; color: #1a5c2e; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="institution-name">${institutionName || ""} — Answer Key</p>
          <p class="class-name">${className || ""}</p>
        </div>
        <div class="meta-row">
          <span>Time: ${timeAllowed || "-"}</span>
          <span>Total Marks: ${totalMarks || "-"}</span>
        </div>
        ${sectionsHTML}
      </body>
    </html>
  `;
};