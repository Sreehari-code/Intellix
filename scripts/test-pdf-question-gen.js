const fs = require("fs");
const path = require("path");

async function testPdfEndToEndQuestionGen() {
  console.log("--- 1. Uploading Real PDF: data_structures_trees_recursion.pdf ---");
  const filePath = path.join(__dirname, "..", "sample-data", "data_structures_trees_recursion.pdf");
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: "application/pdf" });

  const form = new FormData();
  form.append("file", blob, "data_structures_trees_recursion.pdf");

  const parseRes = await fetch("http://localhost:3000/api/documents/parse", {
    method: "POST",
    body: form,
  });
  const parseData = await parseRes.json();
  console.log("PDF Upload Status:", parseRes.status, "Doc ID:", parseData.document?.id);

  if (!parseRes.ok || !parseData.success) {
    console.error("PDF upload failed:", parseData);
    process.exit(1);
  }

  const docId = parseData.document.id;
  const targetTopic = parseData.document.topics[1]?.name || "AVL Trees and Rebalancing Rotations";

  console.log(`\n--- 2. Generating 5 Questions on topic "${targetTopic}" (Advanced) ---`);
  const genRes = await fetch("http://localhost:3000/api/quiz/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId: docId,
      topic: targetTopic,
      difficulty: "advanced",
      questionCount: 5,
    }),
  });

  const genData = await genRes.json();
  console.log("Generation Status:", genRes.status);
  console.log(`Generated ${genData.questions?.length || 0} questions.`);

  if (genRes.ok && genData.success && genData.questions?.length > 0) {
    console.log("\nGenerated Questions Summary:");
    genData.questions.forEach((q, i) => {
      console.log(`\n[Question ${i + 1}] (${q.difficulty.toUpperCase()} - ${q.topic})`);
      console.log(`Stem: ${q.question}`);
      console.log(`Answer: ${q.options.find(o => q.correctAnswerIds.includes(o.id))?.text}`);
      console.log(`Source Citation: "${q.sourceQuote}"`);
    });
    console.log("\n🎉 Complete End-to-End Real PDF Question Generation PASSED!");
  } else {
    console.error("Question generation failed:", genData);
    process.exit(1);
  }
}

testPdfEndToEndQuestionGen().catch(console.error);
