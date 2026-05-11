// === Bubble Shooter (泡泡射手) - 5 关闯关模式 ===
const BubbleGame = {
  canvas: null, ctx: null,
  bubbles: [], shooter: { x: 0, y: 0 },
  currentBubble: null,
  allColors: ['#ff6b6b','#ffa726','#ffd93d','#00d2a0','#54a0ff','#a29bfe'],
  colors: [],
  score: 0, shots: 0,
  rows: 8, cols: 10,
  cellSize: 0, radius: 0,
  container: null, statsCb: null,
  animFrame: null, running: false,
  aimLine: { angle: Math.PI / 2 },
  nextId: 0,
  level: 1, maxLevel: 5,
  levelConfigs: [
    { rows: 5, numColors: 4 },
    { rows: 6, numColors: 4 },
    { rows: 7, numColors: 5 },
    { rows: 8, numColors: 5 },
    { rows: 9, numColors: 6 },
  ],

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.shots = 0;
    this.level = 1;
    this.running = true;
    this.currentBubble = null;
    this.bubbles = [];
    this.nextId = 0;
    this.render();
    this.setupCanvas();
    this.showLevelIntro(() => {
      this.startLevel();
      this.loop();
    });
  },

  startLevel() {
    const cfg = this.levelConfigs[this.level - 1];
    this.colors = this.allColors.slice(0, cfg.numColors);
    this.initGrid(cfg.rows);
    this.spawnBubble();
    this.updateStats();
  },

  render() {
    this.container.innerHTML = `<canvas id="bubbleCanvas" style="width:100%;max-width:400px;border-radius:8px;touch-action:none"></canvas>`;
  },

  setupCanvas() {
    this.canvas = document.getElementById('bubbleCanvas');
    this.ctx = this.canvas.getContext('2d');
    const w = Math.min(400, this.container.clientWidth - 32);
    this.canvas.width = w;
    this.canvas.height = w * 1.5;
    this.cellSize = this.canvas.width / this.cols;
    this.radius = this.cellSize * 0.42;
    this.shooter = { x: this.canvas.width / 2, y: this.canvas.height - this.radius - 4 };

    const updateAim = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = (clientX - rect.left) * (this.canvas.width / rect.width);
      const my = (clientY - rect.top) * (this.canvas.height / rect.height);
      const dx = mx - this.shooter.x;
      const dy = my - this.shooter.y;
      if (dy < 0) this.aimLine.angle = Math.atan2(-dy, dx);
    };

    this.canvas.addEventListener('mousemove', e => { updateAim(e.clientX, e.clientY); });
    this.canvas.addEventListener('touchmove', e => { e.preventDefault(); updateAim(e.touches[0].clientX, e.touches[0].clientY); });
    this.canvas.addEventListener('click', () => { this.shoot(); });
    this.canvas.addEventListener('touchend', () => { this.shoot(); });
  },

  initGrid(numRows) {
    this.bubbles = [];
    for (let r = 0; r < numRows; r++) {
      const offset = (r % 2) * this.cellSize / 2;
      const maxCols = (r % 2 === 1) ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxCols; c++) {
        this.bubbles.push({
          id: this.nextId++,
          x: offset + c * this.cellSize + this.cellSize / 2,
          y: r * this.cellSize * 0.87 + this.cellSize / 2 + 10,
          r: this.radius,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          row: r, col: c
        });
      }
    }
  },

  showLevelIntro(cb) {
    const div = document.createElement('div');
    div.className = 'level-intro';
    div.innerHTML = `<div class="level-num">第 ${this.level} 关</div><div class="level-title">泡泡射手 · ${this.levelConfigs[this.level-1].numColors} 色</div>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    setTimeout(() => { if (div.parentNode) div.remove(); cb(); }, 1500);
  },

  spawnBubble() {
    // Only pick colors that still exist on the grid (or any if grid is empty)
    let pool = this.colors;
    if (this.bubbles.length > 0) {
      const remainingColors = [...new Set(this.bubbles.map(b => b.color))];
      if (remainingColors.length > 0) pool = remainingColors;
    }
    this.currentBubble = {
      x: this.shooter.x, y: this.shooter.y,
      r: this.radius,
      color: pool[Math.floor(Math.random() * pool.length)],
      vx: 0, vy: 0, active: true, shooting: false
    };
  },

  shoot() {
    if (!this.currentBubble || this.currentBubble.shooting) return;
    const speed = 14;
    this.currentBubble.vx = Math.cos(this.aimLine.angle) * speed;
    this.currentBubble.vy = -Math.sin(this.aimLine.angle) * speed;
    this.currentBubble.shooting = true;
    this.shots++;
  },

  update() {
    const cb = this.currentBubble;
    if (!cb || !cb.shooting) return;

    cb.x += cb.vx;
    cb.y += cb.vy;

    if (cb.x - cb.r <= 0 || cb.x + cb.r >= this.canvas.width) {
      cb.vx *= -1;
      cb.x = Math.max(cb.r, Math.min(this.canvas.width - cb.r, cb.x));
    }

    if (cb.y - cb.r <= 0) {
      this.snapBubble(cb);
      return;
    }

    for (let i = 0; i < this.bubbles.length; i++) {
      const b = this.bubbles[i];
      const dx = cb.x - b.x;
      const dy = cb.y - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < this.radius * 2 * 0.95) {
        this.snapBubble(cb);
        return;
      }
    }

    if (cb.y > this.canvas.height + this.radius) {
      cb.shooting = false; cb.active = false;
      this.spawnBubble();
    }
  },

  snapBubble(bubble) {
    bubble.active = false; bubble.shooting = false; bubble.id = this.nextId++;

    let bestR = 0, bestC = 0, bestDist = Infinity;
    for (let r = 0; r < this.rows; r++) {
      const offset = (r % 2) * this.cellSize / 2;
      const maxCols = (r % 2 === 1) ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxCols; c++) {
        const gx = offset + c * this.cellSize + this.cellSize / 2;
        const gy = r * this.cellSize * 0.87 + this.cellSize / 2 + 10;
        const dx = bubble.x - gx, dy = bubble.y - gy;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          if (!this.bubbles.some(b => b.row === r && b.col === c)) {
            bestDist = d; bestR = r; bestC = c;
          }
        }
      }
    }

    bubble.row = bestR; bubble.col = bestC;
    const offset = (bestR % 2) * this.cellSize / 2;
    bubble.x = offset + bestC * this.cellSize + this.cellSize / 2;
    bubble.y = bestR * this.cellSize * 0.87 + this.cellSize / 2 + 10;
    this.bubbles.push(bubble);

    const matched = this.findMatches(bubble);
    if (matched.length >= 3) {
      this.score += matched.length * 10;
      const matchedIds = new Set(matched.map(b => b.id));
      this.bubbles = this.bubbles.filter(b => !matchedIds.has(b.id));
      this.removeFloating();
    }

    this.spawnBubble();
    this.updateStats();

    // Level clear or game over
    if (this.bubbles.length === 0) {
      if (this.level >= this.maxLevel) { this.gameOver(true); }
      else { this.levelClear(); }
      return;
    }
    const loseRow = this.bubbles.some(b => b.y + b.r > this.shooter.y - 10);
    if (loseRow) this.gameOver(false);
  },

  getNeighbors(bubble) {
    const r = bubble.row, c = bubble.col;
    const candidates = [];
    if (r % 2 === 0) {
      candidates.push({ row: r, col: c - 1 }, { row: r, col: c + 1 },
        { row: r - 1, col: c - 1 }, { row: r - 1, col: c },
        { row: r + 1, col: c - 1 }, { row: r + 1, col: c });
    } else {
      candidates.push({ row: r, col: c - 1 }, { row: r, col: c + 1 },
        { row: r - 1, col: c }, { row: r - 1, col: c + 1 },
        { row: r + 1, col: c }, { row: r + 1, col: c + 1 });
    }
    const neighbors = [];
    for (const pos of candidates) {
      const b = this.bubbles.find(b => b.row === pos.row && b.col === pos.col);
      if (b && b.color === bubble.color) neighbors.push(b);
    }
    return neighbors;
  },

  findMatches(bubble) {
    const visited = new Set(), matches = [], stack = [bubble];
    while (stack.length) {
      const b = stack.pop();
      if (visited.has(b.id)) continue;
      visited.add(b.id); matches.push(b);
      for (const nb of this.getNeighbors(b)) {
        if (!visited.has(nb.id)) stack.push(nb);
      }
    }
    return matches;
  },

  removeFloating() {
    const connected = new Set();
    const queue = this.bubbles.filter(b => b.row <= 0);
    queue.forEach(b => connected.add(b.id));
    while (queue.length) {
      const b = queue.shift();
      const r = b.row, c = b.col;
      const candidates = [];
      if (r % 2 === 0) {
        candidates.push({ row: r, col: c - 1 }, { row: r, col: c + 1 },
          { row: r - 1, col: c - 1 }, { row: r - 1, col: c },
          { row: r + 1, col: c - 1 }, { row: r + 1, col: c });
      } else {
        candidates.push({ row: r, col: c - 1 }, { row: r, col: c + 1 },
          { row: r - 1, col: c }, { row: r - 1, col: c + 1 },
          { row: r + 1, col: c }, { row: r + 1, col: c + 1 });
      }
      for (const pos of candidates) {
        const nb = this.bubbles.find(b => b.row === pos.row && b.col === pos.col);
        if (nb && !connected.has(nb.id)) { connected.add(nb.id); queue.push(nb); }
      }
    }
    const before = this.bubbles.length;
    this.bubbles = this.bubbles.filter(b => connected.has(b.id));
    this.score += (before - this.bubbles.length) * 5;
  },

  levelClear() {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
    const div = document.createElement('div');
    div.className = 'level-intro';
    div.innerHTML = `<div class="level-num">✅ 第 ${this.level} 关通过！</div><div class="level-title">准备进入第 ${this.level + 1} 关</div>`;
    this.container.appendChild(div);
    setTimeout(() => {
      if (div.parentNode) div.remove();
      this.level++;
      this.running = true;
      this.bubbles = [];
      this.currentBubble = null;
      this.showLevelIntro(() => {
        this.startLevel();
        this.loop();
      });
    }, 1800);
  },

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const b of this.bubbles) this.drawBubble(b.x, b.y, b.r, b.color);
    if (this.currentBubble && !this.currentBubble.shooting) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.shooter.x, this.shooter.y);
      ctx.lineTo(this.shooter.x + Math.cos(this.aimLine.angle) * 80, this.shooter.y - Math.sin(this.aimLine.angle) * 80);
      ctx.stroke(); ctx.setLineDash([]);
    }
    if (this.currentBubble) this.drawBubble(this.currentBubble.x, this.currentBubble.y, this.currentBubble.r, this.currentBubble.color);
  },

  drawBubble(x, y, r, color) {
    const ctx = this.ctx;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
  },

  loop() {
    if (!this.running) return;
    this.update(); this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  updateStats() {
    if (this.statsCb) this.statsCb({ '关卡': `${this.level}/${this.maxLevel}`, '得分': this.score });
  },

  gameOver(won = false) {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = won
      ? `<h3>🎉 恭喜通关！</h3><p>通过了全部 ${this.maxLevel} 关！得分: ${this.score}</p><button class="btn" id="replayBtn">再来一局</button>`
      : `<h3>游戏结束</h3><p>第 ${this.level}/${this.maxLevel} 关 | 得分: ${this.score}</p><button class="btn" id="replayBtn">再来一次</button>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => {
      this.destroy(); this.init(this.container, this.statsCb);
    });
  },

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
  }
};
