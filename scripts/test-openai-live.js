const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const match = envContent.match(/OPENAI_API_KEY=([^\r\n]+)/);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
process.env.OPENAI_API_KEY = apiKey;

async function testDirectOpenAI() {
  console.log("=== Testing Direct OpenAI Question Generation ===");
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("API Key present?", !!apiKey, apiKey ? `(Length: ${apiKey.length}, starts with: ${apiKey.slice(0, 10)}...)` : "");

  const topic = "Variables and Static Typing in Java";
  const documentTitle = "Java Programming Principles";
  const difficulty = "intermediate";
  const questionCount = 3;

  const focusedContextText = `[EXCERPT 1 | Page 1 | Variables and Types]
In Java, a variable is a named memory location that stores a value of a specific data type. Java is a statically typed language, which means that every variable must be declared with its data type before it can be used in the program. Once declared, a variable cannot hold values of an incompatible type without explicit type casting. Local variables declared inside methods must be initialized before they are read, otherwise the compiler issues an error.`;

  const prompt = `You are a university professor creating a high-quality educational multiple-choice assessment for the topic: "${topic}".
Difficulty: "${difficulty.toUpperCase()}".
Document: "${documentTitle}".

INSTRUCTIONS:
1. Focus on testing CORE CONCEPTS, DEFINITIONS, MECHANISMS, and RULES from the material.
2. Write direct, natural question stems (e.g. "What is required before a local variable can be read in Java?").
3. DO NOT quote half the paragraph in the question.
4. Create 4 distinct options: 1 correct answer and 3 realistic distractors.
5. Provide a clear explanation and supporting verbatim excerpt.

Source Excerpts:
${focusedContextText}`;

  console.log("\nSending prompt to OpenAI gpt-4o-mini...");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an academic assessment generator. Output ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "question": "Natural, direct question testing a specific concept",
      "answer": "Exact text of the correct option",
      "options": [
        {"id": "opt-a", "text": "Clear option choice A"},
        {"id": "opt-b", "text": "Clear option choice B"},
        {"id": "opt-c", "text": "Clear option choice C"},
        {"id": "opt-d", "text": "Clear option choice D"}
      ],
      "correctAnswerId": "opt-a",
      "difficulty": "${difficulty}",
      "topic": "${topic}",
      "explanation": "Clear explanation of the concept and why the answer is correct",
      "source": {
        "document": "${documentTitle}",
        "page": 1,
        "excerpt": "Verbatim quote from the excerpt supporting this fact"
      }
    }
  ]
}`,
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  console.log("OpenAI Status:", response.status, response.statusText);
  const text = await response.text();
  console.log("OpenAI Raw Response:", text);
}

testDirectOpenAI().catch(console.error);
