const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');

function generateSourcePDF(inputFile, outputFile, title) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 30, bottom: 20, left: 25, right: 25 },
    font: 'Courier'
  });

  const outPath = path.join(docsDir, outputFile);
  doc.pipe(fs.createWriteStream(outPath));

  const content = fs.readFileSync(path.join(docsDir, inputFile), 'utf-8');
  const lines = content.split('\n');

  const charsPerLine = 75;
  const linesPerPage = 48;

  let lineNum = 0;
  let pageNum = 1;

  function newPage() {
    if (lineNum > 0) {
      doc.addPage();
    }
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(`${'='.repeat(70)}`, 30, 30, { width: 535 });
    doc.text(`  ${title}                                        第 ${pageNum} 页`, 30, 45, { width: 535 });
    doc.text(`${'='.repeat(70)}`, 30, 60, { width: 535 });
    doc.moveDown(1.5);
    doc.font('Courier').fontSize(7.5);
    pageNum++;
    lineNum = 0;
  }

  newPage();

  for (const line of lines) {
    if (lineNum >= linesPerPage) {
      doc.text(`${'-'.repeat(70)}`, 30, doc.y + 8);
      newPage();
    }

    // Wrap long lines
    let text = line || ' ';
    while (text.length > charsPerLine) {
      doc.text(text.substring(0, charsPerLine), 30, doc.y + 0.5, { width: 535, lineBreak: false });
      text = text.substring(charsPerLine);
      lineNum++;
      if (lineNum >= linesPerPage) {
        doc.text(`${'-'.repeat(70)}`, 30, doc.y + 8);
        newPage();
      }
    }
    doc.text(text, 30, doc.y + 0.5, { width: 535, lineBreak: false });
    lineNum++;
  }

  doc.end();
  console.log(`Generated: ${outPath} (${pageNum - 1} pages)`);
}

function generateManualPDF(inputFile, outputFile) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 36, bottom: 36, left: 50, right: 50 }
  });

  const outPath = path.join(docsDir, outputFile);
  doc.pipe(fs.createWriteStream(outPath));

  const content = fs.readFileSync(path.join(docsDir, inputFile), 'utf-8');
  const lines = content.split('\n');

  doc.font('Helvetica-Bold').fontSize(16);
  doc.text('益智小游戏合集平台系统 — 用户操作手册', { align: 'center' });
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(10);
  doc.text('版本：V3.2    更新日期：2025年5月', { align: 'center' });
  doc.moveDown(1);

  let inCodeBlock = false;
  let inTable = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (!inCodeBlock) doc.moveDown(0.5);
      continue;
    }

    if (inCodeBlock) {
      doc.font('Courier').fontSize(8);
      doc.text(line, 60, doc.y + 0.5, { width: 480 });
      continue;
    }

    // Skip horizontal rules
    if (line.trim() === '---') {
      doc.moveDown(0.5);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      doc.font('Helvetica-Bold').fontSize(18);
      doc.text(line.replace('# ', ''), { continued: false });
      doc.moveDown(0.5);
      continue;
    }
    if (line.startsWith('## ')) {
      doc.moveDown(1);
      doc.font('Helvetica-Bold').fontSize(14);
      doc.text(line.replace('## ', ''));
      doc.moveDown(0.3);
      continue;
    }
    if (line.startsWith('### ')) {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(line.replace('### ', ''));
      doc.moveDown(0.2);
      continue;
    }

    // Tables - convert markdown table to text
    if (line.startsWith('|') && line.endsWith('|')) {
      if (line.includes('---')) continue;
      doc.font('Helvetica').fontSize(9);
      const cells = line.split('|').filter(c => c.trim());
      doc.text(cells.join('  |  '), 50, doc.y + 0.5);
      continue;
    }

    // Bold text
    let text = line;
    if (text.startsWith('**') && text.endsWith('**')) {
      doc.font('Helvetica-Bold').fontSize(11);
      text = text.replace(/\*\*/g, '');
      doc.text(text);
      doc.moveDown(0.3);
      continue;
    }

    // Bullet points
    if (text.trim().startsWith('- ') || text.trim().startsWith('* ')) {
      doc.font('Helvetica').fontSize(10);
      const indent = text.match(/^\s*/)[0].length;
      doc.text('  ' + text.trim(), 55 + indent, doc.y + 0.3);
      continue;
    }

    // Regular text
    if (text.trim()) {
      doc.font('Helvetica').fontSize(10);
      doc.text(text, 50, doc.y + 0.5, { width: 495 });
    } else {
      doc.moveDown(0.3);
    }
  }

  doc.end();
  console.log(`Generated: ${outPath}`);
}

// Generate all PDFs
generateSourcePDF('源码前30页_格式化.txt', '源码前30页.pdf', '益智小游戏合集平台系统 V3.2');
generateSourcePDF('源码后30页_格式化.txt', '源码后30页.pdf', '益智小游戏合集平台系统 V3.2');
generateManualPDF('用户操作手册.md', '用户操作手册.pdf');

console.log('All PDFs generated successfully.');
