// === Bubble Shooter (泡泡龙) ===
const BubbleGame = {
  canvas: null, ctx: null,
  bubbles: [], shooter: { x: 0, y: 0 },
  currentBubble: null,
  colors: ['#ff6b6b','#ffa726','#ffd93d','#00d2a0','#54a0ff','#a29bfe'],
  score: 0, shots: 0,
  rows: 8, cols: 10,
  cellSize: 0, radius: 0,
  container: null, statsCb: null,
  animFrame: null, running: false,
  aimLine: { angle: Math.PI / 2 },
  nextId: 0,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.shots = 0;
    this.running = true;
    this.currentBubble = null;
    this.bubbles = [];
    this.nextId = 0;
    this.render();
    this.setupCanvas();
    this.initGrid();
    this.spawnBubble();
    this.loop();
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
      if (dy < 0) {
        this.aimLine.angle = Math.atan2(-dy, dx);
      }
    };

    this.canvas.addEventListener('mousemove', e => { updateAim(e.clientX, e.clientY); });
    this.canvas.addEventListener('touchmove', e => { e.preventDefault(); updateAim(e.touches[0].clientX, e.touches[0].clientY); });
    this.canvas.addEventListener('click', () => { this.shoot(); });
    this.canvas.addEventListener('touchend', () => { this.shoot(); });
  },

  initGrid() {
    this.bubbles = [];
    for (let r = 0; r < 5; r++) {
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

  spawnBubble() {
    this.currentBubble = {
      x: this.shooter.x, y: this.shooter.y,
      r: this.radius,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
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

    // Wall bounce
    if (cb.x - cb.r <= 0 || cb.x + cb.r >= this.canvas.width) {
      cb.vx *= -1;
      cb.x = Math.max(cb.r, Math.min(this.canvas.width - cb.r, cb.x));
    }

    // Hit ceiling
    if (cb.y - cb.r <= 0) {
      this.snapBubble(cb);
      return;
    }

    // Hit existing bubbles
    for (let i = 0; i < this.bubbles.length; i++) {
      const b = this.bubbles[i];
      const dx = cb.x - b.x;
      const dy = cb.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.radius * 2 * 0.95) {
        this.snapBubble(cb);
        return;
      }
    }

    // Fell off bottom - respawn
    if (cb.y > this.canvas.height + this.radius) {
      cb.shooting = false;
      cb.active = false;
      this.spawnBubble();
    }
  },

  snapBubble(bubble) {
    bubble.active = false;
    bubble.shooting = false;
    bubble.id = this.nextId++;

    // Snap to nearest grid position
    let bestR = 0, bestC = 0, bestDist = Infinity;
    for (let r = 0; r < this.rows; r++) {
      const offset = (r % 2) * this.cellSize / 2;
      const maxCols = (r % 2 === 1) ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxCols; c++) {
        const gx = offset + c * this.cellSize + this.cellSize / 2;
        const gy = r * this.cellSize * 0.87 + this.cellSize / 2 + 10;
        const dx = bubble.x - gx;
        const dy = bubble.y - gy;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          // Also check this position isn't already occupied
          if (!this.bubbles.some(b => b.row === r && b.col === c)) {
            bestDist = d;
            bestR = r; bestC = c;
          }
        }
      }
    }

    bubble.row = bestR;
    bubble.col = bestC;
    const offset = (bestR % 2) * this.cellSize / 2;
    bubble.x = offset + bestC * this.cellSize + this.cellSize / 2;
    bubble.y = bestR * this.cellSize * 0.87 + this.cellSize / 2 + 10;
    this.bubbles.push(bubble);

    // Find matches by flood fill on grid adjacency
    const matched = this.findMatches(bubble);
    if (matched.length >= 3) {
      this.score += matched.length * 10;
      const matchedIds = new Set(matched.map(b => b.id));
      this.bubbles = this.bubbles.filter(b => !matchedIds.has(b.id));
      this.removeFloating();
    }

    this.spawnBubble();
    this.updateStats();

    // Check lose
    const loseRow = this.bubbles.some(b => b.y + b.r > this.shooter.y - 10);
    if (loseRow) this.gameOver();
  },

  // Get grid-adjacent bubbles (same color) using row/col
  getNeighbors(bubble) {
    const r = bubble.row, c = bubble.col;
    const neighbors = [];
    // Same-row neighbors
    const candidates = [];
    if (r % 2 === 0) {
      // Even row
      candidates.push({ row: r, col: c - 1 });
      candidates.push({ row: r, col: c + 1 });
      candidates.push({ row: r - 1, col: c - 1 });
      candidates.push({ row: r - 1, col: c });
      candidates.push({ row: r + 1, col: c - 1 });
      candidates.push({ row: r + 1, col: c });
    } else {
      // Odd row
      candidates.push({ row: r, col: c - 1 });
      candidates.push({ row: r, col: c + 1 });
      candidates.push({ row: r - 1, col: c });
      candidates.push({ row: r - 1, col: c + 1 });
      candidates.push({ row: r + 1, col: c });
      candidates.push({ row: r + 1, col: c + 1 });
    }
    for (const pos of candidates) {
      const b = this.bubbles.find(b => b.row === pos.row && b.col === pos.col);
      if (b && b.color === bubble.color) neighbors.push(b);
    }
    return neighbors;
  },

  findMatches(bubble) {
    const visited = new Set();
    const matches = [];
    const stack = [bubble];
    while (stack.length) {
      const b = stack.pop();
      if (visited.has(b.id)) continue;
      visited.add(b.id);
      matches.push(b);
      for (const nb of this.getNeighbors(b)) {
        if (!visited.has(nb.id)) stack.push(nb);
      }
    }
    return matches;
  },

  removeFloating() {
    // BFS from top-row bubbles to find all connected bubbles
    const connected = new Set();
    const queue = this.bubbles.filter(b => b.row <= 0);
    queue.forEach(b => connected.add(b.id));
    while (queue.length) {
      const b = queue.shift();
      // Use catch-all neighbors (any color) via same getNeighbors logic but without color filter
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
        if (nb && !connected.has(nb.id)) {
          connected.add(nb.id);
          queue.push(nb);
        }
      }
    }
    const before = this.bubbles.length;
    this.bubbles = this.bubbles.filter(b => connected.has(b.id));
    this.score += (before - this.bubbles.length) * 5;
  },

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const b of this.bubbles) {
      this.drawBubble(b.x, b.y, b.r, b.color);
    }

    // Aiming line
    if (this.currentBubble && !this.currentBubble.shooting) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.shooter.x, this.shooter.y);
      ctx.lineTo(
        this.shooter.x + Math.cos(this.aimLine.angle) * 80,
        this.shooter.y - Math.sin(this.aimLine.angle) * 80
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (this.currentBubble) {
      this.drawBubble(this.currentBubble.x, this.currentBubble.y, this.currentBubble.r, this.currentBubble.color);
    }
  },

  drawBubble(x, y, r, color) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
  },

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  updateStats() {
    if (this.statsCb) this.statsCb({ '得分': this.score, '消除': this.shots });
  },

  gameOver() {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `<h3>游戏结束</h3><p>得分: ${this.score}</p><button class="btn" id="replayBtn">再来一次</button>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => {
      this.destroy();
      this.init(this.container, this.statsCb);
    });
  },

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
  }
};
