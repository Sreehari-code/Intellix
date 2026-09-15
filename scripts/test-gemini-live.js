const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const match = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : '';

async function testGemini37() {
  console.log("=== Testing Google Gemini 3.7 / 3.8 Flash ===");

  const topic = "Variables and Static Typing in Java";
  const documentTitle = "Java Programming Principles";
  const difficulty = "intermediate";
  const questionCount = 3;

  const focusedContextText = `[EXCERPT 1 | Page 1 | Variables and Types]
In Java, a variable is a named memory location that stores a value of a specific data type. Java is a statically typed language, which means that every variable must be declared with its data type before it can be used in the program. Once declared, a variable cannot hold values of an incompatible type without explicit type casting. Local variables declared inside methods must be initialized before they are read, otherwise the compiler issues an error.`;

  const prompt = `You are a university professor creating an educational multiple-choice assessment for: "${topic}".
Difficulty: "${difficulty.toUpperCase()}".
Document: "${documentTitle}".

INSTRUCTIONS:
1. Focus on testing CORE CONCEPTS, DEFINITIONS, MECHANISMS, and RULES from the material.
2. Write direct, natural question stems (e.g. "What is required before a local variable can be read in Java?").
3. DO NOT quote half the paragraph in the question.
4. Create 4 distinct options: 1 correct answer and 3 realistic distractors.
5. Provide a clear explanation and supporting verbatim excerpt.

Source Excerpts:
${focusedContextText}

Return valid JSON with: {"questions": [{"question": string, "answer": string, "options": [{"id": string, "text": string}], "correctAnswerId": string, "difficulty": string, "topic": string, "explanation": string, "source": {"document": string, "page": number | null, "excerpt": string}}]}`;

  const models = ['gemini-3.7-flash', 'gemini-3.8-flash'];

  for (const model of models) {
    console.log(`\nTrying model: ${model}...`);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
        }
      );

      console.log(`Status for ${model}:`, response.status, response.statusText);
      const rawText = await response.text();
      if (response.ok) {
        console.log(`🎉 SUCCESS with ${model}!`);
        console.log("Full Generated Questions:\n", JSON.stringify(JSON.parse(rawText), null, 2));
        break;
      } else {
        console.log(`Error with ${model}:`, rawText.slice(0, 200));
      }
    } catch (e) {
      console.error(`Fetch failed for ${model}:`, e.message);
    }
  }
}

testGemini37().catch(console.error);
