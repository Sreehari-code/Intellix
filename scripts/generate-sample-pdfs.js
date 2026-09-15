const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

async function createSamplePdfs() {
  const dir = path.join(__dirname, "..", "sample-data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 1. Data Structures: Trees & Recursion PDF
  const pdf1 = await PDFDocument.create();
  const font1 = await pdf1.embedFont(StandardFonts.Helvetica);
  const bold1 = await pdf1.embedFont(StandardFonts.HelveticaBold);

  // Page 1
  let page1 = pdf1.addPage([600, 750]);
  page1.drawText("Data Structures & Algorithms: Trees and Recursive Structures", {
    x: 50,
    y: 700,
    size: 16,
    font: bold1,
    color: rgb(0.1, 0.1, 0.5),
  });

  page1.drawText("Section 1: Binary Search Trees and Properties", {
    x: 50,
    y: 660,
    size: 13,
    font: bold1,
    color: rgb(0.2, 0.2, 0.2),
  });

  const text1 = `A Binary Search Tree (BST) is a hierarchical node-based data structure where each node contains a key. The left subtree of a node contains only keys lesser than the node's key, and the right subtree contains only keys greater than the node's key. Both left and right subtrees must also be binary search trees.

In-order traversal of a BST produces elements in strictly ascending sorted order. The time complexity for searching, insertion, and deletion in a balanced BST is O(log n), whereas a degenerate or skewed tree degrades to O(n) worst-case time complexity.

Section 2: AVL Trees and Rebalancing Rotations

An AVL tree is a strictly self-balancing binary search tree. For every node in an AVL tree, the heights of its two child subtrees differ by at most one (balance factor of -1, 0, or +1).

When an insertion or deletion causes the balance factor to become +2 or -2, rebalancing is performed using tree rotations:
1. Left Rotation (LL Case): Applied when a node is inserted into the right subtree of a right child.
2. Right Rotation (RR Case): Applied when a node is inserted into the left subtree of a left child.
3. Left-Right Rotation (LR Case): A double rotation where the left child undergoes a left rotation, followed by a right rotation at the root.
4. Right-Left Rotation (RL Case): A right rotation on the right child followed by a left rotation at the root.`;

  page1.drawText(text1, {
    x: 50,
    y: 630,
    size: 10,
    font: font1,
    lineHeight: 14,
    maxWidth: 500,
  });

  // Page 2
  let page2 = pdf1.addPage([600, 750]);
  page2.drawText("Section 3: Recursion and Call Stack Dynamics", {
    x: 50,
    y: 700,
    size: 13,
    font: bold1,
    color: rgb(0.2, 0.2, 0.2),
  });

  const text2 = `Recursion is a computational method where a function solves a problem by calling smaller instances of itself. Every valid recursive algorithm must define two components:
1. Base Case: The terminating condition that produces an answer directly without further recursive calls.
2. Recursive Step: The progression where the problem size is strictly decreased towards the base case.

When a recursive function executes, each active call allocates a stack frame on the call stack containing local variables and return addresses. Excessive depth without reaching the base case triggers a stack overflow exception.

Tail recursion occurs when the recursive call is the final action executed by the function, allowing compiler optimizations to reuse stack frames.`;

  page2.drawText(text2, {
    x: 50,
    y: 660,
    size: 10,
    font: font1,
    lineHeight: 14,
    maxWidth: 500,
  });

  const pdfBytes1 = await pdf1.save();
  const filePath1 = path.join(dir, "data_structures_trees_recursion.pdf");
  fs.writeFileSync(filePath1, pdfBytes1);
  console.log(`Generated: ${filePath1} (${pdfBytes1.length} bytes)`);

  // 2. CRISPR & Molecular Genetics PDF
  const pdf2 = await PDFDocument.create();
  const font2 = await pdf2.embedFont(StandardFonts.Helvetica);
  const bold2 = await pdf2.embedFont(StandardFonts.HelveticaBold);

  let page3 = pdf2.addPage([600, 750]);
  page3.drawText("Molecular Genetics: CRISPR-Cas9 and Gene Editing Mechanisms", {
    x: 50,
    y: 700,
    size: 15,
    font: bold2,
    color: rgb(0.1, 0.4, 0.2),
  });

  const text3 = `Section 1: Architectural Components of CRISPR-Cas9

CRISPR (Clustered Regularly Interspaced Short Palindromic Repeats) is an adaptive immune system discovered in prokaryotes that defends against bacteriophages. The system has been repurposed as a targeted genetic engineering tool.

The modern CRISPR-Cas9 platform consists of two primary elements:
1. Cas9 Endonuclease: A molecular scissor enzyme that induces double-stranded breaks (DSBs) in DNA.
2. Single Guide RNA (sgRNA): A synthetic chimeric fusion of crRNA and tracrRNA that guides Cas9 to a 20-nucleotide target sequence matching the genomic locus.

Section 2: Protospacer Adjacent Motif (PAM) Requirement

Cas9 binding and cleavage strictly require the presence of a short Protospacer Adjacent Motif (PAM) immediately downstream of the target DNA sequence. For Streptococcus pyogenes Cas9, the canonical PAM sequence is 5'-NGG-3'. Without a valid PAM, Cas9 cannot initiate DNA melting and double-stranded cleavage.

Section 3: Cellular DNA Repair Pathways

Following Cas9 cleavage, eukaryotic cells repair the double-strand break via two main pathways:
1. Non-Homologous End Joining (NHEJ): An error-prone repair mechanism that introduces insertions or deletions (indels), frequently disrupting the open reading frame to achieve gene knockout.
2. Homology-Directed Repair (HDR): A high-fidelity template-dependent pathway utilized in the presence of donor DNA to introduce precise nucleotide edits or gene knock-ins.`;

  page3.drawText(text3, {
    x: 50,
    y: 660,
    size: 10,
    font: font2,
    lineHeight: 14,
    maxWidth: 500,
  });

  const pdfBytes2 = await pdf2.save();
  const filePath2 = path.join(dir, "molecular_genetics_crispr.pdf");
  fs.writeFileSync(filePath2, pdfBytes2);
  console.log(`Generated: ${filePath2} (${pdfBytes2.length} bytes)`);
}

createSamplePdfs().catch(console.error);
