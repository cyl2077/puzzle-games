// === Breakout (打砖块) - 5 关闯关模式 ===
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
  level: 1,
  maxLevel: 5,
  running: false,
  loop: null,
  container: null,
  statsCb: null,

  levelConfigs: [
    { rows: 4, cols: 7, speed: 3, colors: ['#ff6b6b','#ffa726','#ffd93d','#00d2a0'] },
    { rows: 5, cols: 8, speed: 3.5, colors: ['#ff6b6b','#ffa726','#ffd93d','#00d2a0','#54a0ff'] },
    { rows: 5, cols: 9, speed: 4, colors: ['#ff6b6b','#ffa726','#ffd93d','#00d2a0','#54a0ff'] },
    { rows: 6, cols: 9, speed: 4.5, colors: ['#ff6b6b','#ffa726','#ffd93d','#00d2a0','#54a0ff','#a29bfe'] },
    { rows: 7, cols: 10, speed: 5, colors: ['#ff6b6b','#ffa726','#ffd93d','#00d2a0','#54a0ff','#a29bfe','#ee5a24'] },
  ],

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
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

    container.innerHTML = '';
    container.appendChild(this.canvas);
    const inst = document.createElement('div');
    inst.className = 'instructions';
    inst.textContent = '← → 移动挡板 | 鼠标 / 触屏拖动';
    container.appendChild(inst);

    this.showLevelIntro(() => {
      this.buildLevel();
      this.updateStats();
      document.addEventListener('keydown', this.handleKey);
      document.addEventListener('mousemove', this.handleMouse);
      this.canvas.addEventListener('touchmove', this.handleTouch, {passive:false});
      this.canvas.addEventListener('touchstart', this.handleTouch, {passive:false});
      this.loop = setInterval(() => this.tick(), 16);
    });
  },

  buildLevel() {
    const cfg = this.levelConfigs[this.level - 1];
    const cols = cfg.cols, rows = cfg.rows;
    const bw = (this.width - 16) / cols, bh = 16;
    this.bricks = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        this.bricks.push({
          x: c * bw + 8, y: r * (bh + 4) + 30,
          w: bw - 4, h: bh, alive: true,
          color: cfg.colors[r % cfg.colors.length]
        });
    this.ball = {
      x: this.width / 2, y: this.height - 40, r: 6,
      dx: (Math.random() - 0.5) * cfg.speed, dy: -cfg.speed
    };
  },

  showLevelIntro(cb) {
    const div = document.createElement('div');
    div.className = 'level-intro';
    div.innerHTML = `<div class="level-num">第 ${this.level} 关</div><div class="level-title">打砖块</div>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    setTimeout(() => { if (div.parentNode) div.remove(); cb(); }, 1500);
  },

  showLevelClear(cb) {
    this.running = false;
    clearInterval(this.loop);
    const div = document.createElement('div');
    div.className = 'level-intro';
    div.innerHTML = `<div class="level-num">✅ 过关！</div><div class="level-title">准备进入第 ${this.level + 1} 关</div>`;
    this.container.appendChild(div);
    setTimeout(() => { if (div.parentNode) div.remove(); cb(); }, 1500);
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

  handleTouch(e) {
    e.preventDefault();
    const rect = BreakoutGame.canvas.getBoundingClientRect();
    BreakoutGame.paddle.x = e.touches[0].clientX - rect.left - BreakoutGame.paddle.w / 2;
    BreakoutGame.paddle.x = Math.max(0, Math.min(BreakoutGame.width - BreakoutGame.paddle.w, BreakoutGame.paddle.x));
  },

  tick() {
    if (!this.running) return;
    const b = this.ball, p = this.paddle, spd = this.levelConfigs[this.level - 1].speed;

    b.x += b.dx;
    b.y += b.dy;

    if (b.x - b.r <= 0 || b.x + b.r >= this.width) b.dx *= -1;
    if (b.y - b.r <= 0) b.dy *= -1;

    if (b.y + b.r >= this.height - p.h && b.y + b.r <= this.height - p.h + 10 &&
        b.x > p.x && b.x < p.x + p.w) {
      b.dy = -Math.abs(b.dy);
      const hitPos = (b.x - p.x) / p.w;
      b.dx = (hitPos - 0.5) * spd * 2;
      if (Math.abs(b.dy) < spd) b.dy = -spd;
    }

    if (b.y - b.r > this.height) {
      this.lives--;
      this.updateStats();
      if (this.lives <= 0) { this.gameOver(); return; }
      b.x = this.width / 2; b.y = this.height - 40;
      b.dx = (Math.random() - 0.5) * spd; b.dy = -spd;
    }

    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (b.x + b.r > brick.x && b.x - b.r < brick.x + brick.w &&
          b.y + b.r > brick.y && b.y - b.r < brick.y + brick.h) {
        brick.alive = false;
        b.dy *= -1;
        this.score += 10;
        this.updateStats();
        if (this.bricks.every(br => !br.alive)) {
          if (this.level >= this.maxLevel) { this.gameOver(true); }
          else { this.levelClear(); }
          return;
        }
        break;
      }
    }

    this.draw();
  },

  levelClear() {
    this.running = false;
    clearInterval(this.loop);
    document.removeEventListener('keydown', this.handleKey);
    document.removeEventListener('mousemove', this.handleMouse);
    const div = document.createElement('div');
    div.className = 'level-intro';
    div.innerHTML = `<div class="level-num">✅ 第 ${this.level} 关通过！</div><div class="level-title">准备进入第 ${this.level + 1} 关</div>`;
    this.container.appendChild(div);
    setTimeout(() => {
      if (div.parentNode) div.remove();
      this.level++;
      this.running = true;
      document.addEventListener('keydown', this.handleKey);
      document.addEventListener('mousemove', this.handleMouse);
      this.canvas.addEventListener('touchmove', this.handleTouch, {passive:false});
      this.canvas.addEventListener('touchstart', this.handleTouch, {passive:false});
      this.showLevelIntro(() => {
        this.buildLevel();
        this.updateStats();
        this.loop = setInterval(() => this.tick(), 16);
      });
    }, 1800);
  },

  draw() {
    const c = this.ctx;
    c.clearRect(0, 0, this.width, this.height);
    for (const b of this.bricks) {
      if (!b.alive) continue;
      c.fillStyle = b.color;
      c.fillRect(b.x, b.y, b.w, b.h);
    }
    c.fillStyle = '#a29bfe';
    c.fillRect(this.paddle.x, this.height - this.paddle.h, this.paddle.w, this.paddle.h);
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    c.fill();
  },

  updateStats() {
    if (this.statsCb) {
      this.statsCb({ '关卡': `${this.level}/${this.maxLevel}`, '得分': this.score, '生命': this.lives });
    }
  },

  gameOver(won = false) {
    this.running = false;
    clearInterval(this.loop);
    document.removeEventListener('keydown', this.handleKey);
    document.removeEventListener('mousemove', this.handleMouse);
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = won
      ? `<h3>🎉 恭喜通关！</h3><p>通过了全部 ${this.maxLevel} 关！得分: ${this.score}</p><button class="btn" id="replayBtn">再来一局</button>`
      : `<h3>游戏结束</h3><p>第 ${this.level}/${this.maxLevel} 关 | 得分: ${this.score}</p><button class="btn" id="replayBtn">再来一局</button>`;
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
