// === Snake Game (贪吃蛇) - 5 关闯关模式 ===
const SnakeGame = {
  canvas: null, ctx: null,
  tileCount: 20, tileSize: 0,
  snake: [], food: null,
  dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
  score: 0, speed: 100,
  loop: null, running: false,
  container: null, statsCb: null,
  touchStart: null,
  level: 1, maxLevel: 5,
  targetScore: 50,
  levelConfigs: [
    { target: 50, speed: 100, name: '新手入门' },
    { target: 100, speed: 85, name: '渐入佳境' },
    { target: 150, speed: 70, name: '速度挑战' },
    { target: 200, speed: 55, name: '极限反应' },
    { target: 300, speed: 45, name: '蛇王之路' },
  ],

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.snake = [{ x: 10, y: 10 }];
    this.dir = { x: 1, y: 0 }; this.nextDir = { x: 1, y: 0 };
    this.score = 0; this.level = 1;
    const cfg = this.levelConfigs[0];
    this.speed = cfg.speed; this.targetScore = cfg.target;
    this.running = true; this.touchStart = null;

    const size = Math.min(400, this.container.clientWidth - 48);
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.canvas.width = size; this.canvas.height = size;
    this.ctx = this.canvas.getContext('2d');
    this.tileSize = size / this.tileCount;

    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
    this.container.appendChild(this.buildDPad());
    this.spawnFood();
    this.showLevelIntro(() => {
      this.updateStats();
      document.addEventListener('keydown', this._handleKey);
      this.canvas.addEventListener('touchstart', this._touchStart, {passive:false});
      this.canvas.addEventListener('touchend', this._touchEnd, {passive:false});
      this.loop = setInterval(() => this.tick(), this.speed);
    });
  },

  showLevelIntro(cb) {
    this.running = false;
    const cfg = this.levelConfigs[this.level - 1];
    const div = document.createElement('div');
    div.className = 'level-intro';
    div.innerHTML = `<div class="level-num">第 ${this.level} 关</div><div class="level-title">${cfg.name} · 目标 ${cfg.target} 分</div>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    setTimeout(() => {
      if (div.parentNode) div.remove();
      this.running = true;
      cb();
    }, 1500);
  },

  _handleKey(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') SnakeGame.setDir(0, -1);
    else if (k === 'arrowdown' || k === 's') SnakeGame.setDir(0, 1);
    else if (k === 'arrowleft' || k === 'a') SnakeGame.setDir(-1, 0);
    else if (k === 'arrowright' || k === 'd') SnakeGame.setDir(1, 0);
  },

  setDir(dx, dy) {
    if (this.dir.x === -dx && this.dir.y === -dy) return;
    this.nextDir = { x: dx, y: dy };
  },

  _touchStart(e) { e.preventDefault(); if(e.touches[0]) SnakeGame.touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY}; },
  _touchEnd(e) {
    e.preventDefault();
    if (!SnakeGame.touchStart) return;
    const dx = e.changedTouches[0].clientX - SnakeGame.touchStart.x;
    const dy = e.changedTouches[0].clientY - SnakeGame.touchStart.y;
    SnakeGame.touchStart = null;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
    if (Math.abs(dx) > Math.abs(dy)) SnakeGame.setDir(dx > 0 ? 1 : -1, 0);
    else SnakeGame.setDir(0, dy > 0 ? 1 : -1);
  },

  buildDPad() {
    const d = document.createElement('div');
    d.className = 'dpad';
    d.innerHTML = `
      <button class="dpad-btn dpad-up" id="dpUp">▲</button>
      <button class="dpad-btn dpad-left" id="dpLeft">◀</button>
      <button class="dpad-btn dpad-right" id="dpRight">▶</button>
      <button class="dpad-btn dpad-down" id="dpDown">▼</button>`;
    setTimeout(() => {
      const bind = (id, dx, dy) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('touchstart', e => { e.preventDefault(); SnakeGame.setDir(dx, dy); });
      };
      bind('dpUp', 0, -1); bind('dpDown', 0, 1); bind('dpLeft', -1, 0); bind('dpRight', 1, 0);
    }, 0);
    return d;
  },

  tick() {
    if (!this.running) return;
    this.dir = this.nextDir;
    const head = this.snake[0];
    const newHead = { x: head.x + this.dir.x, y: head.y + this.dir.y };
    if (newHead.x < 0 || newHead.x >= this.tileCount || newHead.y < 0 || newHead.y >= this.tileCount) { this.gameOver(); return; }
    if (this.snake.some(s => s.x === newHead.x && s.y === newHead.y)) { this.gameOver(); return; }
    this.snake.unshift(newHead);
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 10; this.updateStats();
      if (this.score >= this.targetScore) {
        if (this.level >= this.maxLevel) { this.gameOver(true); return; }
        this.levelUp();
        return;
      }
      this.spawnFood();
      if (this.speed > 35) { this.speed -= 2; clearInterval(this.loop); this.loop = setInterval(() => this.tick(), this.speed); }
    } else { this.snake.pop(); }
    this.draw();
  },

  spawnFood() {
    do { this.food = { x: Math.floor(Math.random() * this.tileCount), y: Math.floor(Math.random() * this.tileCount) }; }
    while (this.snake.some(s => s.x === this.food.x && s.y === this.food.y));
  },

  levelUp() {
    clearInterval(this.loop);
    this.running = false;
    const div = document.createElement('div');
    div.className = 'level-intro';
    div.innerHTML = `<div class="level-num">✅ 第 ${this.level} 关通过！</div><div class="level-title">准备进入第 ${this.level + 1} 关</div>`;
    this.container.appendChild(div);
    setTimeout(() => {
      if (div.parentNode) div.remove();
      this.level++;
      const cfg = this.levelConfigs[this.level - 1];
      this.speed = cfg.speed; this.targetScore = cfg.target;
      this.snake = [{ x: 10, y: 10 }];
      this.dir = { x: 1, y: 0 }; this.nextDir = { x: 1, y: 0 };
      this.spawnFood();
      this.showLevelIntro(() => {
        this.updateStats();
        this.loop = setInterval(() => this.tick(), this.speed);
      });
    }, 1800);
  },

  draw() {
    const c = this.ctx, t = this.tileSize;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.fillStyle = '#ff6b6b';
    c.fillRect(this.food.x * t + 2, this.food.y * t + 2, t - 4, t - 4);
    this.snake.forEach((s, i) => {
      c.fillStyle = i === 0 ? '#a29bfe' : '#6c5ce7';
      c.fillRect(s.x * t + 1, s.y * t + 1, t - 2, t - 2);
    });
  },

  updateStats() {
    if (this.statsCb) this.statsCb({ '关卡': `${this.level}/${this.maxLevel}`, '得分': `${this.score}/${this.targetScore}`, '长度': this.snake.length });
  },

  gameOver(won = false) {
    this.running = false; clearInterval(this.loop);
    document.removeEventListener('keydown', this._handleKey);
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = won
      ? `<h3>🎉 恭喜通关！</h3><p>通过了全部 ${this.maxLevel} 关！最终得分: ${this.score}</p><button class="btn" id="replayBtn">再来一局</button>`
      : `<h3>游戏结束！</h3><p>第 ${this.level}/${this.maxLevel} 关 | 得分: ${this.score}/${this.targetScore} | 长度: ${this.snake.length}</p><button class="btn" id="replayBtn">再来一局</button>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => { this.destroy(); this.init(this.container, this.statsCb); });
  },

  destroy() { this.running = false; clearInterval(this.loop); document.removeEventListener('keydown', this._handleKey); }
};
