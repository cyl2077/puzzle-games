// === Breakout (打砖块) ===
const BreakoutGame = {
  canvas: null,
  ctx: null,
  width: 480,
  height: 320,
  paddle: { x: 200, w: 80, h: 12 },
  ball: { x: 240, y: 280, r: 6, dx: 3, dy: -3 },
  bricks: [],
  score: 0,
  lives: 3,
  running: false,
  loop: null,
  container: null,
  statsCb: null,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.lives = 3;
    this.running = true;

    const w = Math.min(480, container.clientWidth - 48);
    const h = w * 0.67;
    this.width = w;
    this.height = h;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d');

    this.paddle = { x: w / 2 - 40, w: 80, h: 12 };
    this.ball = { x: w / 2, y: h - 40, r: 6, dx: 3, dy: -3 };

    // Bricks
    const cols = 8, rows = 4;
    const bw = (w - 16) / cols, bh = 18;
    this.bricks = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        this.bricks.push({ x: c * bw + 8, y: r * (bh + 4) + 30, w: bw - 4, h: bh, alive: true, color: ['#ff6b6b','#ffa726','#ffd93d','#00d2a0'][r] });

    container.innerHTML = '';
    container.appendChild(this.canvas);
    const inst = document.createElement('div');
    inst.className = 'instructions';
    inst.textContent = '← → 移动挡板 | 接住球打碎砖块';
    container.appendChild(inst);

    this.updateStats();
    document.addEventListener('keydown', this.handleKey);
    document.addEventListener('mousemove', this.handleMouse);
    this.loop = setInterval(() => this.tick(), 16);
  },

  handleKey(e) {
    if (e.key === 'ArrowLeft') BreakoutGame.paddle.x -= 20;
    if (e.key === 'ArrowRight') BreakoutGame.paddle.x += 20;
    BreakoutGame.paddle.x = Math.max(0, Math.min(BreakoutGame.width - BreakoutGame.paddle.w, BreakoutGame.paddle.x));
  },

  handleMouse(e) {
    const rect = BreakoutGame.canvas.getBoundingClientRect();
    BreakoutGame.paddle.x = e.clientX - rect.left - BreakoutGame.paddle.w / 2;
    BreakoutGame.paddle.x = Math.max(0, Math.min(BreakoutGame.width - BreakoutGame.paddle.w, BreakoutGame.paddle.x));
  },

  tick() {
    if (!this.running) return;
    const b = this.ball;
    const p = this.paddle;

    b.x += b.dx;
    b.y += b.dy;

    // Wall bounce
    if (b.x - b.r <= 0 || b.x + b.r >= this.width) b.dx *= -1;
    if (b.y - b.r <= 0) b.dy *= -1;

    // Paddle hit
    if (b.y + b.r >= this.height - p.h && b.y + b.r <= this.height - p.h + 10 &&
        b.x > p.x && b.x < p.x + p.w) {
      b.dy = -Math.abs(b.dy);
      const hitPos = (b.x - p.x) / p.w;
      b.dx = (hitPos - 0.5) * 6;
    }

    // Ball fall
    if (b.y - b.r > this.height) {
      this.lives--;
      this.updateStats();
      if (this.lives <= 0) {
        this.gameOver();
        return;
      }
      b.x = this.width / 2;
      b.y = this.height - 40;
      b.dx = 3; b.dy = -3;
    }

    // Brick collision
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (b.x + b.r > brick.x && b.x - b.r < brick.x + brick.w &&
          b.y + b.r > brick.y && b.y - b.r < brick.y + brick.h) {
        brick.alive = false;
        b.dy *= -1;
        this.score += 10;
        this.updateStats();
        if (this.bricks.every(br => !br.alive)) {
          this.gameOver(true);
          return;
        }
        break;
      }
    }

    this.draw();
  },

  draw() {
    const c = this.ctx;
    c.clearRect(0, 0, this.width, this.height);

    // Bricks
    for (const b of this.bricks) {
      if (!b.alive) continue;
      c.fillStyle = b.color;
      c.fillRect(b.x, b.y, b.w, b.h);
    }

    // Paddle
    c.fillStyle = '#a29bfe';
    c.fillRect(this.paddle.x, this.height - this.paddle.h, this.paddle.w, this.paddle.h);

    // Ball
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    c.fill();
  },

  updateStats() {
    if (this.statsCb) {
      this.statsCb({ '得分': this.score, '生命': this.lives });
    }
  },

  gameOver(won = false) {
    this.running = false;
    clearInterval(this.loop);
    document.removeEventListener('keydown', this.handleKey);
    document.removeEventListener('mousemove', this.handleMouse);

    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `
      <h3>${won ? '🎉 全部打碎！' : '游戏结束'}</h3>
      <p>得分: ${this.score}</p>
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
    document.removeEventListener('mousemove', this.handleMouse);
  }
};
