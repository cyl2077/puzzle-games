// === Tetris Game ===
const TetrisGame = {
  cols: 10,
  rows: 20,
  board: [],
  canvas: null,
  ctx: null,
  tileSize: 24,
  piece: null,
  piecePos: { x: 0, y: 0 },
  score: 0,
  level: 1,
  lines: 0,
  speed: 500,
  loop: null,
  running: false,
  container: null,
  statsCb: null,

  pieces: [
    { shape: [[1,1,1,1]], color: '#54a0ff' },                    // I
    { shape: [[1,1],[1,1]], color: '#ffd93d' },                   // O
    { shape: [[0,1,0],[1,1,1]], color: '#a29bfe' },               // T
    { shape: [[1,0,0],[1,1,1]], color: '#54a0ff' },               // J
    { shape: [[0,0,1],[1,1,1]], color: '#ffa726' },               // L
    { shape: [[0,1,1],[1,1,0]], color: '#00d2a0' },               // S
    { shape: [[1,1,0],[0,1,1]], color: '#ff6b6b' },               // Z
  ],

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.speed = 500;
    this.running = true;
    this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));

    const width = this.cols * this.tileSize + 2;
    const height = this.rows * this.tileSize + 2;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    container.innerHTML = '';
    container.appendChild(this.canvas);
    const inst = document.createElement('div');
    inst.className = 'instructions';
    inst.textContent = '← → 移动 | ↑ 旋转 | ↓ 加速 | 空格 硬降';
    container.appendChild(inst);

    this.spawnPiece();
    this.updateStats();
    document.addEventListener('keydown', this.handleKey);
    this.loop = setInterval(() => this.tick(), this.speed);
  },

  spawnPiece() {
    const p = this.pieces[Math.floor(Math.random() * this.pieces.length)];
    this.piece = { shape: p.shape.map(r => [...r]), color: p.color };
    this.piecePos = { x: Math.floor((this.cols - this.piece.shape[0].length) / 2), y: 0 };

    if (this.collides(this.piece.shape, this.piecePos)) {
      this.gameOver();
    }
  },

  collides(shape, pos) {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const bx = pos.x + c, by = pos.y + r;
        if (bx < 0 || bx >= this.cols || by >= this.rows) return true;
        if (by >= 0 && this.board[by][bx]) return true;
      }
    return false;
  },

  place() {
    const { shape, color } = this.piece;
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const bx = this.piecePos.x + c, by = this.piecePos.y + r;
        if (by < 0) { this.gameOver(); return; }
        this.board[by][bx] = color;
      }
    this.clearLines();
    this.spawnPiece();
  },

  clearLines() {
    let cleared = 0;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.board[r].every(c => c !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(Array(this.cols).fill(0));
        cleared++;
        r++; // recheck this row
      }
    }
    if (cleared > 0) {
      this.lines += cleared;
      this.score += [0, 100, 300, 500, 800][cleared] * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.speed = Math.max(50, 500 - (this.level - 1) * 40);
      clearInterval(this.loop);
      this.loop = setInterval(() => this.tick(), this.speed);
      this.updateStats();
    }
  },

  tick() {
    if (!this.running) return;
    const newPos = { x: this.piecePos.x, y: this.piecePos.y + 1 };
    if (this.collides(this.piece.shape, newPos)) {
      this.place();
    } else {
      this.piecePos = newPos;
    }
    this.draw();
  },

  rotate() {
    const shape = this.piece.shape;
    const rotated = shape[0].map((_, i) => shape.map(r => r[i]).reverse());
    if (!this.collides(rotated, this.piecePos)) {
      this.piece.shape = rotated;
    }
  },

  move(dx) {
    const newPos = { x: this.piecePos.x + dx, y: this.piecePos.y };
    if (!this.collides(this.piece.shape, newPos)) {
      this.piecePos = newPos;
    }
  },

  hardDrop() {
    while (!this.collides(this.piece.shape, { x: this.piecePos.x, y: this.piecePos.y + 1 })) {
      this.piecePos.y++;
    }
    this.place();
    this.draw();
  },

  handleKey(e) {
    if (!TetrisGame.running) return;
    switch (e.key) {
      case 'ArrowLeft': TetrisGame.move(-1); TetrisGame.draw(); break;
      case 'ArrowRight': TetrisGame.move(1); TetrisGame.draw(); break;
      case 'ArrowDown': TetrisGame.tick(); break;
      case 'ArrowUp': TetrisGame.rotate(); TetrisGame.draw(); break;
      case ' ': e.preventDefault(); TetrisGame.hardDrop(); break;
    }
  },

  draw() {
    const c = this.ctx;
    const t = this.tileSize;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Board
    for (let r = 0; r < this.rows; r++)
      for (let col = 0; col < this.cols; col++) {
        if (this.board[r][col]) {
          c.fillStyle = this.board[r][col];
          c.fillRect(col * t, r * t, t - 1, t - 1);
        }
      }

    // Current piece
    if (this.piece && this.running) {
      c.fillStyle = this.piece.color;
      for (let r = 0; r < this.piece.shape.length; r++)
        for (let col = 0; col < this.piece.shape[r].length; col++) {
          if (this.piece.shape[r][col]) {
            c.fillRect((this.piecePos.x + col) * t, (this.piecePos.y + r) * t, t - 1, t - 1);
          }
        }
    }
  },

  updateStats() {
    if (this.statsCb) {
      this.statsCb({ '得分': this.score, '等级': this.level, '行数': this.lines });
    }
  },

  gameOver() {
    this.running = false;
    clearInterval(this.loop);
    document.removeEventListener('keydown', this.handleKey);
    this.draw();

    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `
      <h3>游戏结束！</h3>
      <p>得分: ${this.score} | 等级: ${this.level} | 消除: ${this.lines}行</p>
      <button class="btn" id="replayBtn">再来一局</button>
    `;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => {
      this.destroy();
      this.init(this.container, this.statsCb);
    });
  },

  destroy() {
    this.running = false;
    clearInterval(this.loop);
    document.removeEventListener('keydown', this.handleKey);
  }
};
