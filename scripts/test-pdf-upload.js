const fs = require("fs");
const path = require("path");

async function testPdfUpload() {
  const filePath = path.join(__dirname, "..", "sample-data", "data_structures_trees_recursion.pdf");
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: "application/pdf" });

  const formData = new FormData();
  formData.append("file", blob, "data_structures_trees_recursion.pdf");

  console.log("Sending POST /api/documents/parse ...");
  const res = await fetch("http://localhost:3000/api/documents/parse", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  console.log("Response Status:", res.status);
  console.log("Response Data:", JSON.stringify(data, null, 2));

  if (res.ok && data.success) {
    console.log("✅ PDF Text Extraction & Topic Discovery PASSED!");
    console.log(`Document Title: ${data.document.title}`);
    console.log(`Pages: ${data.document.pageCount}`);
    console.log(`Words: ${data.document.wordCount}`);
    console.log(`Topics Detected (${data.document.topics.length}):`, data.document.topics.map(t => t.name));
  } else {
    console.error("❌ PDF Parsing failed:", data);
    process.exit(1);
  }
}

testPdfUpload().catch(console.error);
