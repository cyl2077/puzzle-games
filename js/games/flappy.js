// === Flappy Bird Clone (小鸟飞飞) ===
const FlappyGame = {
  canvas: null,
  ctx: null,
  width: 360,
  height: 500,
  bird: { x: 0, y: 0, r: 14, vy: 0 },
  pipes: [],
  score: 0,
  best: 0,
  running: false,
  started: false,
  loop: null,
  frameCount: 0,
  container: null,
  statsCb: null,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.running = true;
    this.started = false;
    this.frameCount = 0;
    this.pipes = [];

    const w = Math.min(360, container.clientWidth - 48);
    const h = Math.min(500, w * 1.4);
    this.width = w;
    this.height = h;
    this.bird = { x: w * 0.25, y: h / 2, r: 14, vy: 0 };

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d');

    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
    const inst = document.createElement('div');
    inst.className = 'instructions';
    inst.textContent = '点击屏幕让小鸟飞起来，避开管道！';
    this.container.appendChild(inst);

    this.canvas.addEventListener('click', () => this.tap());
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.tap(); });

    this.updateStats();
    this.draw();
    this.loop = setInterval(() => this.tick(), 16);
  },

  tap() {
    if (!this.running) return;
    if (!this.started) { this.started = true; }
    this.bird.vy = -6;
  },

  tick() {
    if (!this.running) return;
    this.frameCount++;

    if (this.started) {
      this.bird.vy += 0.4;
      this.bird.y += this.bird.vy;

      // Pipe generation
      if (this.frameCount % 80 === 0) {
        const gap = 130;
        const center = 60 + Math.random() * (this.height - gap - 120);
        this.pipes.push({ x: this.width, top: center - gap / 2, bottom: center + gap / 2, scored: false });
      }

      // Move pipes
      for (const p of this.pipes) p.x -= 2.5;

      // Remove off-screen pipes
      this.pipes = this.pipes.filter(p => p.x > -60);

      // Collision
      const b = this.bird;
      // Ground/ceiling
      if (b.y - b.r < 0 || b.y + b.r > this.height) { this.gameOver(); return; }

      for (const p of this.pipes) {
        if (b.x + b.r > p.x && b.x - b.r < p.x + 40) {
          if (b.y - b.r < p.top || b.y + b.r > p.bottom) { this.gameOver(); return; }
        }
        if (!p.scored && p.x + 20 < b.x) {
          p.scored = true;
          this.score++;
          this.updateStats();
        }
      }
    }

    this.draw();
  },

  draw() {
    const c = this.ctx;
    c.clearRect(0, 0, this.width, this.height);

    // Sky
    c.fillStyle = '#1a3a5c';
    c.fillRect(0, 0, this.width, this.height);

    // Pipes
    for (const p of this.pipes) {
      c.fillStyle = '#00d2a0';
      c.fillRect(p.x, 0, 40, p.top);
      c.fillRect(p.x - 3, p.top - 25, 46, 25);
      c.fillRect(p.x, p.bottom, 40, this.height - p.bottom);
      c.fillRect(p.x - 3, p.bottom, 46, 25);
    }

    // Bird
    c.fillStyle = '#ffd93d';
    c.beginPath();
    c.arc(this.bird.x, this.bird.y, this.bird.r, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(this.bird.x + 3, this.bird.y - 3, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#000';
    c.beginPath();
    c.arc(this.bird.x + 5, this.bird.y - 4, 2, 0, Math.PI * 2);
    c.fill();

    if (!this.started) {
      c.fillStyle = '#fff';
      c.font = '16px sans-serif';
      c.textAlign = 'center';
      c.fillText('点击开始', this.width / 2, this.height / 2 - 40);
    }
  },

  updateStats() {
    if (this.statsCb) {
      if (this.score > this.best) this.best = this.score;
      this.statsCb({ '得分': this.score, '最佳': this.best });
    }
  },

  gameOver() {
    this.running = false;
    clearInterval(this.loop);
    if (this.score > this.best) this.best = this.score;
    this.updateStats();
    this.draw();

    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `
      <h3>游戏结束</h3>
      <p>得分: ${this.score} | 最佳: ${this.best}</p>
      <button class="btn" id="replayBtn">再来一次</button>
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
  }
};
