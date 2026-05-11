// === Tetris Game ===
const TetrisGame = {
  cols: 10, rows: 20, board: [],
  canvas: null, ctx: null, tileSize: 24,
  piece: null, piecePos: { x: 0, y: 0 },
  score: 0, level: 1, lines: 0, speed: 500,
  loop: null, running: false,
  container: null, statsCb: null,
  touchTimeout: null,

  pieces: [
    { shape: [[1,1,1,1]], color: '#54a0ff' },
    { shape: [[1,1],[1,1]], color: '#ffd93d' },
    { shape: [[0,1,0],[1,1,1]], color: '#a29bfe' },
    { shape: [[1,0,0],[1,1,1]], color: '#54a0ff' },
    { shape: [[0,0,1],[1,1,1]], color: '#ffa726' },
    { shape: [[0,1,1],[1,1,0]], color: '#00d2a0' },
    { shape: [[1,1,0],[0,1,1]], color: '#ff6b6b' },
  ],

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0; this.level = 1; this.lines = 0; this.speed = 500;
    this.running = true; this.touchTimeout = null;
    this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));

    const width = this.cols * this.tileSize + 2;
    const height = this.rows * this.tileSize + 2;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.canvas.width = width; this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    container.innerHTML = '';
    container.appendChild(this.canvas);
    container.appendChild(this.buildControls());
    this.spawnPiece();
    this.updateStats();
    document.addEventListener('keydown', this._handleKey);
    this.loop = setInterval(() => this.tick(), this.speed);
  },

  buildControls() {
    const d = document.createElement('div');
    d.className = 'tetris-controls';
    d.innerHTML = `
      <button class="btn small tet-btn" id="tetLeft">◀</button>
      <button class="btn small tet-btn" id="tetRotate">↻</button>
      <button class="btn small tet-btn" id="tetRight">▶</button>
      <button class="btn small tet-btn" id="tetDrop" style="flex:2">▼ 下落</button>`;
    setTimeout(() => {
      ['tetLeft','tetRight','tetRotate','tetDrop'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('touchstart', e => { e.preventDefault(); TetrisGame.handleTouch(id); });
        el.addEventListener('mousedown', e => { e.preventDefault(); TetrisGame.handleTouch(id); });
      });
    }, 0);
    return d;
  },

  handleTouch(id) {
    if (!this.running) return;
    if (id === 'tetLeft') { this.move(-1); this.draw(); }
    else if (id === 'tetRight') { this.move(1); this.draw(); }
    else if (id === 'tetRotate') { this.rotate(); this.draw(); }
    else if (id === 'tetDrop') { this.hardDrop(); }
  },

  spawnPiece() {
    const p = this.pieces[Math.floor(Math.random() * this.pieces.length)];
    this.piece = { shape: p.shape.map(r => [...r]), color: p.color };
    this.piecePos = { x: Math.floor((this.cols - this.piece.shape[0].length) / 2), y: 0 };
    if (this.collides(this.piece.shape, this.piecePos)) this.gameOver();
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
        this.board.splice(r, 1); this.board.unshift(Array(this.cols).fill(0));
        cleared++; r++;
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
    const np = { x: this.piecePos.x, y: this.piecePos.y + 1 };
    if (this.collides(this.piece.shape, np)) this.place();
    else this.piecePos = np;
    this.draw();
  },

  rotate() {
    const shape = this.piece.shape;
    const rot = shape[0].map((_, i) => shape.map(r => r[i]).reverse());
    if (!this.collides(rot, this.piecePos)) this.piece.shape = rot;
  },

  move(dx) {
    const np = { x: this.piecePos.x + dx, y: this.piecePos.y };
    if (!this.collides(this.piece.shape, np)) this.piecePos = np;
  },

  hardDrop() {
    while (!this.collides(this.piece.shape, { x: this.piecePos.x, y: this.piecePos.y + 1 })) this.piecePos.y++;
    this.place(); this.draw();
  },

  _handleKey(e) {
    if (!TetrisGame.running) return;
    if (e.key === 'ArrowLeft') { TetrisGame.move(-1); TetrisGame.draw(); }
    else if (e.key === 'ArrowRight') { TetrisGame.move(1); TetrisGame.draw(); }
    else if (e.key === 'ArrowDown') TetrisGame.tick();
    else if (e.key === 'ArrowUp') { TetrisGame.rotate(); TetrisGame.draw(); }
    else if (e.key === ' ') { e.preventDefault(); TetrisGame.hardDrop(); }
  },

  draw() {
    const c = this.ctx, t = this.tileSize;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let r = 0; r < this.rows; r++)
      for (let col = 0; col < this.cols; col++) {
        if (this.board[r][col]) { c.fillStyle = this.board[r][col]; c.fillRect(col * t, r * t, t - 1, t - 1); }
      }
    if (this.piece && this.running) {
      c.fillStyle = this.piece.color;
      for (let r = 0; r < this.piece.shape.length; r++)
        for (let col = 0; col < this.piece.shape[r].length; col++) {
          if (this.piece.shape[r][col]) c.fillRect((this.piecePos.x + col) * t, (this.piecePos.y + r) * t, t - 1, t - 1);
        }
    }
  },

  updateStats() { if (this.statsCb) this.statsCb({ '得分': this.score, '等级': this.level, '行数': this.lines }); },

  gameOver() {
    this.running = false; clearInterval(this.loop);
    document.removeEventListener('keydown', this._handleKey);
    this.draw();
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `<h3>游戏结束！</h3><p>得分: ${this.score} | 等级: ${this.level} | 消除: ${this.lines}行</p><button class="btn" id="replayBtn">再来一局</button>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => { this.destroy(); this.init(this.container, this.statsCb); });
  },

  destroy() { this.running = false; clearInterval(this.loop); document.removeEventListener('keydown', this._handleKey); }
};
