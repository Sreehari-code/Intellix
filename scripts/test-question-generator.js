async function testQuestionGenerator() {
  console.log("--- Testing POST /api/quiz/generate ---");

  const payload = {
    documentId: "doc-1",
    topic: "Cellular Respiration & ATP Synthesis",
    difficulty: "intermediate",
    questionCount: 5,
  };

  console.log("Sending question generation request:", JSON.stringify(payload, null, 2));

  const res = await fetch("http://localhost:3000/api/quiz/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("Response Status:", res.status);
  console.log(`Generated ${data.questions?.length || 0} questions.`);

  if (res.ok && data.success && data.questions?.length > 0) {
    console.log("Sample Question 1:");
    console.log(`Question: ${data.questions[0].question}`);
    console.log(`Options (${data.questions[0].options.length}):`, data.questions[0].options.map(o => `${o.id}: ${o.text}`));
    console.log(`Correct Answer: ${data.questions[0].correctAnswerIds}`);
    console.log(`Explanation: ${data.questions[0].explanation}`);
    console.log(`Source Evidence: ${data.questions[0].sourceQuote}`);
    console.log("\n✅ AI Question Generator API PASSED!");
  } else {
    console.error("❌ Question Generator failed:", data);
    process.exit(1);
  }
}

testQuestionGenerator().catch(console.error);
