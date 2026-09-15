async function testTopicDetection() {
  console.log("--- 1. Testing POST /api/documents/topics ---");
  const sampleAlgorithmsText = `[Page 1]
Data Structures: Trees, Binary Search Trees and Traversals
Chapter 1: Binary Search Tree Fundamentals
A binary search tree is an ordered tree data structure with logarithmic lookup, insertion, and deletion times.

Chapter 2: AVL Trees and Balance Factor Rotations
An AVL tree maintains height balance where balance factors do not exceed +1 or -1. Rebalancing requires left, right, left-right, and right-left rotations.

Chapter 3: Graph Representations and Topological Sorting
Graphs consist of vertices and edges, represented using adjacency matrices or adjacency lists. Topological sorting orders vertices in a directed acyclic graph (DAG).`;

  const res1 = await fetch("http://localhost:3000/api/documents/topics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentText: sampleAlgorithmsText,
      documentTitle: "Data Structures & Graph Algorithms",
    }),
  });

  const data1 = await res1.json();
  console.log("Topics Response Status:", res1.status);
  console.log("Topics Extracted Count:", data1.topics ? data1.topics.length : 0);
  console.log("Sample Topics:", JSON.stringify(data1.topics, null, 2));

  if (res1.ok && data1.success && data1.topics.length > 0) {
    console.log("✅ Automatic Topic Extraction PASSED!");
  } else {
    console.error("❌ Automatic Topic Extraction FAILED:", data1);
    process.exit(1);
  }

  console.log("\n--- 2. Testing PUT /api/documents/topics (Manual Topic Addition) ---");
  const res2 = await fetch("http://localhost:3000/api/documents/topics", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentId: "doc-1",
      newTopic: {
        name: "Mendelian Dihybrid Crosses & Linked Genes",
        description: "9:3:3:1 phenotypic ratios, recombination frequency, and genetic linkage mapping.",
        keywords: ["Dihybrid", "Linkage", "Recombination", "Centimorgans"],
      },
    }),
  });

  const data2 = await res2.json();
  console.log("Custom Topic Response Status:", res2.status);
  console.log("New Topic added:", data2.topic?.name);

  if (res2.ok && data2.success) {
    console.log("✅ Manual Custom Topic Addition PASSED!");
  } else {
    console.error("❌ Manual Custom Topic Addition FAILED:", data2);
    process.exit(1);
  }
}

testTopicDetection().catch(console.error);
