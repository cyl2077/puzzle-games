const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs');
const rootDir = path.join(__dirname, '..');

// Source files in order for front 30 pages
const frontFiles = [
  { path: 'js/app.js', desc: 'App Shell' },
  { path: 'index.html', desc: 'HTML' },
  { path: 'js/games/breakout.js', desc: 'Breakout' },
  { path: 'js/games/bubble.js', desc: 'Bubble Shooter' },
  { path: 'js/games/invaders.js', desc: 'Space Invaders' },
  { path: 'js/games/snake.js', desc: 'Snake' },
  { path: 'js/games/2048.js', desc: '2048' },
  { path: 'js/games/tetris.js', desc: 'Tetris' },
  { path: 'js/games/minesweeper.js', desc: 'Minesweeper' },
  { path: 'js/games/match3.js', desc: 'Match 3' },
];

// Source files in reverse order for back 30 pages
const backFiles = [
  { path: 'css/style.css', desc: 'Stylesheet' },
  { path: 'js/games/colormatch.js', desc: 'Color Match' },
  { path: 'js/games/numberguess.js', desc: 'Number Guess' },
  { path: 'js/games/reaction.js', desc: 'Reaction' },
  { path: 'js/games/simon.js', desc: 'Simon Says' },
  { path: 'js/games/tictactoe.js', desc: 'Tic-Tac-Toe' },
  { path: 'js/games/puzzle.js', desc: 'Sliding Puzzle' },
  { path: 'js/games/fruitcatch.js', desc: 'Fruit Catch' },
  { path: 'js/games/flappy.js', desc: 'Flappy Bird' },
  { path: 'js/games/sudoku.js', desc: 'Sudoku' },
  { path: 'js/games/delta.js', desc: 'Delta Randomizer' },
  { path: 'js/games/wordle.js', desc: 'Wordle' },
  { path: 'js/games/whack.js', desc: 'Whack-a-Mole' },
  { path: 'js/games/memory.js', desc: 'Memory Match' },
];

function generateSourcePDF(files, outputFile, reverse) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 20, bottom: 25, left: 25, right: 25 }
  });

  const outPath = path.join(docsDir, outputFile);
  doc.pipe(fs.createWriteStream(outPath));

  if (reverse) files = [...files].reverse();

  const charsPerLine = 82;
  const linesPerPage = 55;

  let allLines = [];

  for (const file of files) {
    const filePath = path.join(rootDir, file.path);
    if (!fs.existsSync(filePath)) { continue; }
    const content = fs.readFileSync(filePath, 'utf-8');
    const codeLines = content.split('\n');
    allLines.push('');
    allLines.push(`// === ${file.desc} (${file.path}) ===`);
    allLines.push('');
    for (const l of codeLines) allLines.push(l);
  }

  let pageNum = 1;
  let lineIdx = 0;

  while (lineIdx < allLines.length) {
    // Page header
    doc.font('Times-Roman').fontSize(7);
    doc.text('Puzzle Games Collection  V3.2', 25, 12, { width: 545, align: 'left' });

    // Content area starts
    doc.font('Courier').fontSize(7);
    let y = 28;
    const bottomY = doc.page.height - 22;

    for (let i = 0; i < linesPerPage && lineIdx < allLines.length; i++, lineIdx++) {
      const raw = allLines[lineIdx] || ' ';
      // Wrap long lines
      let text = raw.length > charsPerLine ? raw.substring(0, charsPerLine) : raw;
      let remaining = raw.length > charsPerLine ? raw.substring(charsPerLine) : '';

      doc.text(text, 25, y, { width: 545, lineBreak: false });
      y += 9.5;

      while (remaining.length > 0 && i < linesPerPage - 1) {
        i++;
        text = remaining.length > charsPerLine ? remaining.substring(0, charsPerLine) : remaining;
        remaining = remaining.length > charsPerLine ? remaining.substring(charsPerLine) : '';
        doc.text(text, 25, y, { width: 545, lineBreak: false });
        y += 9.5;
      }
    }

    // Page footer
    doc.font('Times-Roman').fontSize(7);
    doc.text(`Page ${pageNum}`, 25, doc.page.height - 18, { width: 545, align: 'center' });

    if (lineIdx < allLines.length) {
      doc.addPage();
      pageNum++;
    }
  }

  doc.end();
  console.log(`Generated: ${outputFile} (${pageNum} pages)`);
}

function generateManualPDF(inputFile, outputFile) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 36, bottom: 36, left: 50, right: 50 }
  });

  doc.registerFont('CN', 'C:/Windows/Fonts/simfang.ttf');
  doc.registerFont('CN-Bold', 'C:/Windows/Fonts/simhei.ttf');

  const outPath = path.join(docsDir, outputFile);
  doc.pipe(fs.createWriteStream(outPath));

  const content = fs.readFileSync(path.join(docsDir, inputFile), 'utf-8');
  const lines = content.split('\n');

  doc.font('CN-Bold').fontSize(16);
  doc.text('益智小游戏合集平台系统', { align: 'center' });
  doc.moveDown(0.3);
  doc.font('CN-Bold').fontSize(12);
  doc.text('用户操作手册', { align: 'center' });
  doc.moveDown(0.3);
  doc.font('CN').fontSize(10);
  doc.text('版本：V3.2    更新日期：2025年5月', { align: 'center' });
  doc.moveDown(1);

  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      doc.font('Courier').fontSize(8);
      doc.text(line, 60, doc.y + 0.5, { width: 480 });
      continue;
    }

    if (line.trim() === '---') { doc.moveDown(0.3); continue; }

    if (line.startsWith('# ')) {
      doc.font('CN-Bold').fontSize(18);
      doc.text(line.replace('# ', ''));
      doc.moveDown(0.5); continue;
    }
    if (line.startsWith('## ')) {
      doc.moveDown(0.8);
      doc.font('CN-Bold').fontSize(14);
      doc.text(line.replace('## ', ''));
      doc.moveDown(0.3); continue;
    }
    if (line.startsWith('### ')) {
      doc.moveDown(0.5);
      doc.font('CN-Bold').fontSize(12);
      doc.text(line.replace('### ', ''));
      doc.moveDown(0.2); continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      if (line.includes('---')) continue;
      doc.font('CN').fontSize(9);
      doc.text(line.split('|').filter(c => c.trim()).join('  |  '), 50, doc.y + 0.4);
      continue;
    }

    let text = line;
    if (text.trim().startsWith('- ') || text.trim().startsWith('* ')) {
      doc.font('CN').fontSize(10);
      doc.text('  ' + text.trim(), 55, doc.y + 0.3);
      continue;
    }
    if (text.trim().match(/^\d+\./)) {
      doc.font('CN').fontSize(10);
      doc.text(text, 55, doc.y + 0.3);
      continue;
    }
    if (text.match(/^\*\*.*\*\*$/)) {
      doc.font('CN-Bold').fontSize(11);
      doc.text(text.replace(/\*\*/g, ''));
      doc.moveDown(0.3); continue;
    }
    if (text.includes('**')) {
      doc.font('CN').fontSize(10);
      doc.text(text.replace(/\*\*/g, ''), 50, doc.y + 0.5, { width: 495 });
      continue;
    }
    if (text.trim()) {
      doc.font('CN').fontSize(10);
      doc.text(text, 50, doc.y + 0.5, { width: 495 });
    } else {
      doc.moveDown(0.2);
    }
  }

  doc.end();
  console.log(`Generated: ${outputFile}`);
}

// Generate all PDFs
generateSourcePDF(frontFiles, '源码前30页.pdf', false);
generateSourcePDF(backFiles, '源码后30页.pdf', true);
generateManualPDF('用户操作手册.md', '用户操作手册.pdf');

console.log('Done.');
