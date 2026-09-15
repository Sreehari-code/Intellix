const { evaluateTestSubmission } = require('../lib/quiz/evaluator.ts');

const sampleQuestions = [
  {
    id: "q-1",
    question: "What is the time complexity of searching an item in a balanced Binary Search Tree?",
    options: [
      { id: "opt-a", text: "O(log n)" },
      { id: "opt-b", text: "O(n)" },
      { id: "opt-c", text: "O(1)" },
      { id: "opt-d", text: "O(n log n)" },
    ],
    correctAnswerIds: ["opt-a"],
    difficulty: "intermediate",
    topic: "Binary Search Trees",
    conceptTested: "BST Search Complexity",
    explanation: "A balanced BST has height O(log n), so search requires at most O(log n) comparisons.",
    sourceQuote: "The search operation on a balanced BST runs in O(log n) time.",
  },
  {
    id: "q-2",
    question: "Which invariant must hold true for every node in an AVL tree?",
    options: [
      { id: "opt-a", text: "The heights of two child subtrees of any node differ by at most one." },
      { id: "opt-b", text: "All leaf nodes must be at the exact same depth." },
      { id: "opt-c", text: "Nodes must have strictly two children." },
      { id: "opt-d", text: "The root must have a balance factor of zero." },
    ],
    correctAnswerIds: ["opt-a"],
    difficulty: "intermediate",
    topic: "AVL Trees",
    conceptTested: "AVL Balance Invariant",
    explanation: "An AVL tree is a self-balancing binary search tree where the balance factor (height difference) is -1, 0, or +1.",
    sourceQuote: "In an AVL tree, the heights of child subtrees differ by at most 1.",
  }
];

function testEvaluator() {
  console.log("=== Testing Phase 7 Test Evaluator Logic ===");

  // Scenario 1: 1 correct, 1 incorrect
  const report1 = evaluateTestSubmission({
    documentTitle: "Data Structures Study Guide",
    topic: "Trees",
    difficulty: "intermediate",
    questions: sampleQuestions,
    selectedAnswers: {
      "q-1": ["opt-a"], // correct
      "q-2": ["opt-b"], // incorrect
    },
    timeSpentSeconds: 45,
  });

  console.log(`Total questions: ${report1.totalQuestions}`);
  console.log(`Correct count: ${report1.correctCount}`);
  console.log(`Score percentage: ${report1.scorePercentage}%`);
  console.log(`Time spent: ${report1.totalTimeSpentSeconds}s`);
  console.log(`Concepts evaluated: ${report1.conceptMastery.length}`);
  console.log(`Weak topics: ${report1.weakTopics.join(", ")}`);

  if (report1.scorePercentage === 50 && report1.correctCount === 1 && report1.weakTopics.includes("AVL Balance Invariant")) {
    console.log("✅ Evaluator Scenario 1 PASSED!");
  } else {
    console.error("❌ Evaluator Scenario 1 Failed:", report1);
    process.exit(1);
  }

  // Scenario 2: 100% correct
  const report2 = evaluateTestSubmission({
    documentTitle: "Data Structures Study Guide",
    topic: "Trees",
    difficulty: "intermediate",
    questions: sampleQuestions,
    selectedAnswers: {
      "q-1": ["opt-a"], // correct
      "q-2": ["opt-a"], // correct
    },
    timeSpentSeconds: 60,
  });

  if (report2.scorePercentage === 100 && report2.correctCount === 2 && report2.weakTopics.length === 0) {
    console.log("✅ Evaluator Scenario 2 (100% mastery) PASSED!");
  } else {
    console.error("❌ Evaluator Scenario 2 Failed:", report2);
    process.exit(1);
  }

  console.log("\n🎉 ALL Evaluator tests PASSED successfully!");
}

testEvaluator();
