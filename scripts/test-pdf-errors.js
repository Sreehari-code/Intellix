async function testPdfErrors() {
  console.log("Testing Error Case 1: Non-PDF file upload ...");
  const textBlob = new Blob(["Hello world test"], { type: "text/plain" });
  const form1 = new FormData();
  form1.append("file", textBlob, "notes.txt");

  const res1 = await fetch("http://localhost:3000/api/documents/parse", {
    method: "POST",
    body: form1,
  });
  const data1 = await res1.json();
  console.log("Non-PDF error status:", res1.status, "Error message:", data1.error);
  if (res1.status === 400 && data1.error.includes("Invalid file type")) {
    console.log("✅ Error Case 1 (Non-PDF validation) PASSED!");
  } else {
    console.error("❌ Error Case 1 Failed");
  }

  console.log("Testing Error Case 2: Empty 0-byte file upload ...");
  const emptyBlob = new Blob([], { type: "application/pdf" });
  const form2 = new FormData();
  form2.append("file", emptyBlob, "empty.pdf");

  const res2 = await fetch("http://localhost:3000/api/documents/parse", {
    method: "POST",
    body: form2,
  });
  const data2 = await res2.json();
  console.log("Empty file error status:", res2.status, "Error message:", data2.error);
  if (res2.status === 400 && data2.error.includes("empty")) {
    console.log("✅ Error Case 2 (Empty file validation) PASSED!");
  } else {
    console.error("❌ Error Case 2 Failed");
  }
}

testPdfErrors().catch(console.error);
