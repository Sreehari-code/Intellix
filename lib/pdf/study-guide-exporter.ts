import { Question, DifficultyLevel } from "@/types";

export interface StudyGuideExportOptions {
  documentTitle: string;
  topics: string[];
  difficulty: DifficultyLevel;
  questions: Question[];
  includeAnswerKey?: boolean;
}

/**
 * Generates an HTML printable document in pure black-and-white text format
 * with the exact structure: Question, Options, Answer.
 */
export function exportStudyGuideToPdf({
  documentTitle,
  topics,
  difficulty,
  questions,
}: StudyGuideExportOptions) {
  if (typeof window === "undefined") return;

  const topicsList = topics.join(", ");
  const dateFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let questionsHtml = "";

  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const qType = q.type || (q.options && q.options.length > 0 ? "mcq" : q.starterCode ? "coding" : "essay");

    // Options section
    let optionsHtml = "";
    if (qType === "mcq" && q.options && q.options.length > 0) {
      optionsHtml = `
        <div class="options-block">
          <div class="field-label">Options:</div>
          <div class="options-list">
            ${q.options
              .map((opt, oIdx) => {
                const letter = String.fromCharCode(65 + oIdx);
                return `<div class="option-item"><strong>${letter}.</strong> ${escapeHtml(opt.text)}</div>`;
              })
              .join("")}
          </div>
        </div>
      `;
    } else if (qType === "coding") {
      optionsHtml = `
        <div class="options-block">
          <div class="field-label">Starter Code (${q.language || "Python"}):</div>
          <pre class="code-block"><code>${escapeHtml(q.starterCode || "# Starter Code\ndef solution():\n    pass")}</code></pre>
        </div>
      `;
    } else if (qType === "essay") {
      optionsHtml = `
        <div class="options-block">
          <div class="field-label">Question Format: Descriptive / Essay Response</div>
        </div>
      `;
    }

    // Answer section
    let answerText = "";
    if (qType === "mcq") {
      const correctOpt = q.options?.find(o => q.correctAnswerIds?.includes(o.id));
      answerText = correctOpt ? `${escapeHtml(correctOpt.text)}` : `${escapeHtml(q.answer || "")}`;
    } else if (qType === "coding") {
      answerText = `<pre class="code-block"><code>${escapeHtml(q.sampleSolution || q.answer || "")}</code></pre>`;
    } else {
      answerText = `<div>${escapeHtml(q.answer || "")}</div>`;
      if (q.keyPoints && q.keyPoints.length > 0) {
        answerText += `<div style="margin-top:4px;"><strong>Key Evaluation Points:</strong><ul>${q.keyPoints.map(k => `<li>${escapeHtml(k)}</li>`).join("")}</ul></div>`;
      }
    }

    questionsHtml += `
      <div class="question-container">
        <div class="question-header">
          <strong>Question ${qNum}:</strong> ${escapeHtml(q.question)}
        </div>
        
        ${optionsHtml}

        <div class="answer-block">
          <div class="field-label"><strong>Answer:</strong></div>
          <div class="answer-content">${answerText}</div>
          ${q.explanation ? `<div class="explanation-content"><strong>Explanation:</strong> ${escapeHtml(q.explanation)}</div>` : ""}
          ${q.sourceQuote || q.source?.excerpt ? `<div class="source-content"><strong>Source Reference${q.pageReference || q.source?.page ? ` (Page ${q.pageReference || q.source?.page})` : ""}:</strong> "${escapeHtml(q.sourceQuote || q.source?.excerpt || "")}"</div>` : ""}
        </div>
      </div>
    `;
  });

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download the PDF.");
    return;
  }

  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(documentTitle)} — Questions & Answers</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
      color: #000000 !important;
      background: #ffffff !important;
      text-shadow: none !important;
      box-shadow: none !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #000000;
      background: #ffffff;
      line-height: 1.5;
      font-size: 13px;
      margin: 0;
      padding: 10px;
    }
    .doc-header {
      border-bottom: 2px solid #000000;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .doc-title {
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0 0 6px 0;
    }
    .doc-meta {
      font-size: 12px;
      margin-top: 4px;
    }
    .question-container {
      margin-bottom: 24px;
      padding-bottom: 18px;
      border-bottom: 1px solid #000000;
      page-break-inside: avoid;
    }
    .question-header {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      line-height: 1.4;
    }
    .field-label {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 4px;
      margin-top: 8px;
    }
    .options-block {
      margin-bottom: 10px;
      padding-left: 10px;
    }
    .options-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
    }
    .option-item {
      font-size: 13px;
    }
    .answer-block {
      margin-top: 10px;
      padding: 10px;
      border: 1px solid #000000;
    }
    .answer-content {
      font-size: 13px;
      font-weight: 500;
      margin-top: 2px;
    }
    .explanation-content {
      font-size: 12px;
      margin-top: 6px;
    }
    .source-content {
      font-size: 11px;
      margin-top: 6px;
      font-style: italic;
    }
    .code-block {
      font-family: "Courier New", Courier, monospace;
      font-size: 12px;
      border: 1px solid #000000;
      padding: 8px;
      margin: 4px 0;
      white-space: pre-wrap;
    }
    ul {
      margin: 4px 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 2px;
    }
    .print-btn-bar {
      margin-bottom: 20px;
      text-align: right;
    }
    .print-btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: bold;
      border: 2px solid #000000;
      cursor: pointer;
    }
    @media print {
      .print-btn-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
      .question-container {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <button onclick="window.print()" class="print-btn">
      Print / Save as PDF
    </button>
  </div>

  <div class="doc-header">
    <div class="doc-title">${escapeHtml(documentTitle)}</div>
    <div class="doc-meta"><strong>Topics:</strong> ${escapeHtml(topicsList)}</div>
    <div class="doc-meta"><strong>Difficulty:</strong> ${difficulty.toUpperCase()} &nbsp;|&nbsp; <strong>Total Questions:</strong> ${questions.length} &nbsp;|&nbsp; <strong>Date:</strong> ${dateFormatted}</div>
  </div>

  <div class="questions-list">
    ${questionsHtml}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
