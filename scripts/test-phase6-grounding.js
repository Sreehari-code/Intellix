const fs = require('fs');
const path = require('path');

async function testPhase6Grounding() {
  console.log('=== Testing Phase 6 — Source Grounding Pipeline ===\n');

  // 1. Check if sample PDF exists
  const samplePdfPath = path.join(__dirname, '..', 'sample-data', 'data_structures_trees_recursion.pdf');
  if (!fs.existsSync(samplePdfPath)) {
    console.error('❌ Sample PDF not found at:', samplePdfPath);
    process.exit(1);
  }

  // 2. Test PDF upload & text extraction
  const fileBuffer = fs.readFileSync(samplePdfPath);
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', blob, 'data_structures_trees_recursion.pdf');

  console.log('1. Uploading PDF to /api/documents/parse...');
  const uploadRes = await fetch('http://localhost:3000/api/documents/parse', {
    method: 'POST',
    body: formData,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.success) {
    console.error('❌ Upload failed:', uploadData);
    process.exit(1);
  }

  console.log('✅ Upload & extraction success!');
  console.log(`   Document ID: ${uploadData.document.id}`);
  console.log(`   Page count: ${uploadData.document.pageCount}`);
  console.log(`   Word count: ${uploadData.document.wordCount}`);
  console.log(`   Detected Topics: ${uploadData.document.topics?.map(t => t.name).join(', ')}`);

  // 3. Test Question Generation with Source Grounding
  const chosenTopic = uploadData.document.topics?.[0]?.name || 'Binary Search Trees';
  console.log(`\n2. Generating grounded questions for topic: "${chosenTopic}"...`);

  const genRes = await fetch('http://localhost:3000/api/quiz/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId: uploadData.document.id,
      topic: chosenTopic,
      difficulty: 'intermediate',
      questionCount: 4,
    }),
  });

  const genData = await genRes.json();
  if (!genRes.ok || !genData.success) {
    console.error('❌ Question generation failed:', genData);
    process.exit(1);
  }

  console.log(`✅ Generated ${genData.questions.length} questions successfully!`);

  // 4. Validate Grounding & Source Format
  console.log('\n3. Validating Source Grounding on generated questions:');
  let allGrounded = true;

  genData.questions.forEach((q, idx) => {
    console.log(`\n--- Question ${idx + 1} ---`);
    console.log(`Question: ${q.question}`);
    console.log(`Answer: ${q.answer}`);
    console.log(`Difficulty: ${q.difficulty}`);
    console.log(`Topic: ${q.topic}`);
    console.log(`Explanation: ${q.explanation}`);
    console.log(`Source Document: ${q.source?.document}`);
    console.log(`Source Page: ${q.source?.page ?? 'None (Unpaged)'}`);
    console.log(`Source Excerpt: "${q.source?.excerpt}"`);

    if (!q.source || !q.source.document || !q.source.excerpt) {
      console.error(`❌ Question ${idx + 1} is missing required source metadata!`);
      allGrounded = false;
    }
  });

  if (allGrounded) {
    console.log('\n🎉 ALL Phase 6 Source Grounding tests PASSED successfully!');
  } else {
    console.error('\n❌ Grounding test failed.');
    process.exit(1);
  }
}

testPhase6Grounding().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
