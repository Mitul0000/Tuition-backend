const { GoogleGenAI } =require("@google/genai");

exports.extractTextFromFiles = async (files, api_key) => {
  const ai = new GoogleGenAI({ apiKey: api_key });

  const fileParts = files.map((file) => ({
    inlineData: {
      data: file.buffer.toString("base64"),
      mimeType: file.mimetype,
    },
  }));

  const promptText = `
    Extract all text content from the provided files, in the order given.
    Preserve headings and section structure.

    Math notation rules:
    - Use simple, plain-text math notation wherever possible (e.g. "x^2", "a_1", "a/b", "sqrt(x)")
      instead of LaTeX commands.
    - Only use LaTeX commands (\\frac, \\begin{...}, \\therefore, \\times, etc.) when there is truly
      no reasonable plain-text alternative (e.g. a matrix or determinant array).
    - Never use LaTeX display-math delimiters like \\[ \\] or $$ $$; keep everything as normal text.

    JSON output rules (these are strict - the output must be valid, parseable JSON):
    - Respond ONLY with valid JSON in exactly the shape shown below. No commentary, no markdown
      code fences, nothing before "{" or after the final "}".
    - Every "text" value must be a SINGLE JSON string. Do not put literal line breaks inside a
      string - if you need a new paragraph or a new line within one "text" value, encode it as the
      two characters backslash-n (\\n), the same way any valid JSON string escapes a newline. Never
      output a raw, unescaped newline, tab, or other control character inside a string value.
    - Any backslash you output inside a "text" value (whether from LaTeX or elsewhere) must be a
      correctly escaped JSON backslash, i.e. two characters "\\\\" in the JSON, so that a LaTeX
      command like \\frac survives as the literal text "\\frac" once the JSON is parsed.
    - If a lesson has several distinct items (definitions, examples, MCQ options), prefer separate
      short "text" values or clearly numbered lines within one value over one long unbroken block.

    Respond ONLY with valid JSON in exactly this shape:

    {
      "sections": [
        { "heading": "string", "text": "string", "order": number }
      ]
    }
  `;

  const contents = [{ role: "user", parts: [...fileParts, { text: promptText }] }];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      responseMimeType: "application/json",
      // Constrains the model's structured output to this exact shape, in
      // addition to the prompt instructions above. This doesn't guarantee
      // the "text" strings are free of stray LaTeX backslashes or literal
      // newlines, but it does eliminate an entire class of malformed output
      // (extra fields, wrong types, missing keys, commentary around the
      // JSON) which is why sanitizeJsonText() below still exists as the
      // second line of defense.
      responseSchema: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                text: { type: "string" },
                order: { type: "integer" },
              },
              required: ["heading", "text", "order"],
            },
          },
        },
        required: ["sections"],
      },
    },
  });

  const rawText = stripCodeFences(response.text);

  console.log("Raw AI response:", rawText);

  let parsedData;
  try {
    parsedData = JSON.parse(sanitizeJsonText(rawText));
  } catch (error) {
    throw new Error(
      "Failed to parse JSON from AI response. Raw response: " + rawText,
    );
  }
  return parsedData;
};

function stripCodeFences(text) {
  if (!text) return text;
  return text
    .trim()
    .replace(/^```[a-zA-Z]*\s*/, "")
    .replace(/```\s*$/, "")
    .trim();
}

// The model is asked for JSON but its "text" fields contain LaTeX-heavy,
// multi-paragraph content. Two things routinely make that invalid JSON:
//
//   1. Stray backslashes from LaTeX commands (\begin, \frac, \therefore, ...)
//      that aren't valid JSON escapes.
//   2. Literal raw newlines/tabs left inside string values instead of
//      escaped \n / \t (this is the one that was actually causing the
//      "Bad control character in string literal" failures - a bare regex
//      replace for backslashes never touches this).
//
// Both only matter *inside* JSON string literals - whitespace/newlines
// between tokens (object/array formatting) are legal JSON and must be left
// alone. So this walks the text char-by-char tracking whether we're inside
// a string, and only rewrites backslashes/control chars while inside one.
function sanitizeJsonText(text) {
  let out = "";
  let inString = false;
  let escapedNext = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = text.charCodeAt(i);

    if (!inString) {
      if (ch === '"') inString = true;
      out += ch;
      continue;
    }

    if (escapedNext) {
      // We're the character right after a backslash we already emitted.
      out += ch;
      escapedNext = false;
      continue;
    }

    if (ch === "\\") {
      const next = text[i + 1];
      if (next && '"\\/bfnrtu'.includes(next)) {
        // Valid JSON escape sequence - keep both characters as-is.
        out += ch;
        escapedNext = true;
      } else {
        // Stray backslash (LaTeX like \begin, \therefore, \times, ...) -
        // escape it so it becomes a literal backslash in the parsed string.
        out += "\\\\";
      }
      continue;
    }

    if (ch === '"') {
      inString = false;
      out += ch;
      continue;
    }

    if (code <= 0x1f) {
      // Raw control character inside a string literal - JSON forbids this
      // unescaped, so convert it to its proper escape sequence.
      switch (ch) {
        case "\n": out += "\\n"; break;
        case "\r": out += "\\r"; break;
        case "\t": out += "\\t"; break;
        case "\b": out += "\\b"; break;
        case "\f": out += "\\f"; break;
        default: out += "\\u" + code.toString(16).padStart(4, "0");
      }
      continue;
    }

    out += ch;
  }

  return out;
}