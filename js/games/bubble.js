// === Bubble Shooter (泡泡龙) ===
const BubbleGame = {
  canvas: null, ctx: null,
  bubbles: [], shooter: { x: 0, y: 0, color: '', angle: 0 },
  currentBubble: null,
  colors: ['#ff6b6b','#ffa726','#ffd93d','#00d2a0','#54a0ff','#a29bfe'],
  score: 0, shots: 0,
  rows: 8, cols: 10,
  cellSize: 0, radius: 0,
  container: null, statsCb: null,
  animFrame: null, running: false,
  aimLine: { active: false, angle: 0 },

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.shots = 0;
    this.running = true;
    this.currentBubble = null;
    this.bubbles = [];
    this.aimLine = { active: false, angle: Math.PI / 2 };
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

    // Mouse/touch controls
    const updateAim = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = (clientX - rect.left) * (this.canvas.width / rect.width);
      const my = (clientY - rect.top) * (this.canvas.height / rect.height);
      const dx = mx - this.shooter.x;
      const dy = my - this.shooter.y;
      if (dy < 0) {
        this.aimLine.angle = Math.atan2(-dy, dx);
        this.aimLine.active = true;
      }
    };

    this.canvas.addEventListener('mousemove', e => { updateAim(e.clientX, e.clientY); });
    this.canvas.addEventListener('touchmove', e => { e.preventDefault(); updateAim(e.touches[0].clientX, e.touches[0].clientY); });
    this.canvas.addEventListener('click', e => { this.shoot(); });
    this.canvas.addEventListener('touchend', e => { this.shoot(); });
  },

  initGrid() {
    this.bubbles = [];
    // Fill top 4 rows with random bubbles
    for (let r = 0; r < 4; r++) {
      const offset = (r % 2) * this.cellSize / 2;
      const cols = (r % 2 === 1) ? this.cols - 1 : this.cols;
      for (let c = 0; c < cols; c++) {
        const bx = offset + c * this.cellSize + this.cellSize / 2;
        const by = r * this.cellSize * 0.87 + this.cellSize / 2;
        this.bubbles.push({
          x: bx, y: by, r: this.radius,
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
      vx: 0, vy: 0, active: true
    };
  },

  shoot() {
    if (!this.currentBubble || !this.currentBubble.active) return;
    const speed = 12;
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

    // Check collision with ceiling or other bubbles
    if (cb.y - cb.r <= 0) {
      this.snapBubble(cb);
      return;
    }

    for (const b of this.bubbles) {
      const dx = cb.x - b.x;
      const dy = cb.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.radius * 2) {
        this.snapBubble(cb);
        return;
      }
    }

    // Fell off bottom
    if (cb.y > this.canvas.height + this.radius) {
      this.spawnBubble();
    }
  },

  snapBubble(bubble) {
    bubble.active = false;
    bubble.shooting = false;

    // Find grid position
    const row = Math.round(bubble.y / (this.cellSize * 0.87));
    const offset = (row % 2) * this.cellSize / 2;
    const col = Math.round((bubble.x - offset - this.cellSize / 2) / this.cellSize);
    bubble.row = row;
    bubble.col = col;
    bubble.x = offset + col * this.cellSize + this.cellSize / 2;
    bubble.y = row * this.cellSize * 0.87 + this.cellSize / 2;
    bubble.x = Math.max(this.radius, Math.min(this.canvas.width - this.radius, bubble.x));
    this.bubbles.push(bubble);

    // Find matches
    const matches = this.findMatches(bubble);
    if (matches.length >= 3) {
      this.score += matches.length * 10;
      matches.forEach(b => {
        const idx = this.bubbles.indexOf(b);
        if (idx >= 0) this.bubbles.splice(idx, 1);
      });
      // Remove floating bubbles
      this.removeFloating();
    }

    this.spawnBubble();
    this.updateStats();

    // Check lose
    if (this.bubbles.some(b => b.y > this.shooter.y - this.radius * 3)) {
      this.gameOver();
      return;
    }
  },

  findMatches(bubble) {
    const visited = new Set();
    const matches = [];
    const stack = [bubble];
    while (stack.length) {
      const b = stack.pop();
      const key = `${b.x},${b.y}`;
      if (visited.has(key)) continue;
      visited.add(key);
      matches.push(b);
      for (const other of this.bubbles) {
        if (other.color !== bubble.color) continue;
        const dx = b.x - other.x;
        const dy = b.y - other.y;
        if (Math.sqrt(dx*dx + dy*dy) < this.radius * 2.2 && !visited.has(`${other.x},${other.y}`)) {
          stack.push(other);
        }
      }
    }
    return matches;
  },

  removeFloating() {
    // BFS from top row to find connected bubbles
    const connected = new Set();
    const queue = this.bubbles.filter(b => b.y < this.cellSize);
    queue.forEach(b => connected.add(`${b.x},${b.y}`));
    while (queue.length) {
      const b = queue.pop();
      for (const other of this.bubbles) {
        const key = `${other.x},${other.y}`;
        if (connected.has(key)) continue;
        const dx = b.x - other.x;
        const dy = b.y - other.y;
        if (Math.sqrt(dx*dx + dy*dy) < this.radius * 2.2) {
          connected.add(key);
          queue.push(other);
        }
      }
    }
    const before = this.bubbles.length;
    this.bubbles = this.bubbles.filter(b => connected.has(`${b.x},${b.y}`));
    this.score += (before - this.bubbles.length) * 5;
  },

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw bubbles
    for (const b of this.bubbles) {
      this.drawBubble(b.x, b.y, b.r, b.color);
    }

    // Draw aiming line
    if (this.currentBubble && !this.currentBubble.shooting && this.aimLine.active) {
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

    // Draw current bubble
    if (this.currentBubble) {
      this.drawBubble(this.currentBubble.x, this.currentBubble.y, this.currentBubble.r, this.currentBubble.color);
    }

    // Shooter base
    ctx.fillStyle = 'var(--text2)';
    ctx.fillRect(this.shooter.x - 8, this.shooter.y + this.radius + 2, 16, 8);
  },

  drawBubble(x, y, r, color) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Shine
    ctx.beginPath();
    ctx.arc(x - r*0.25, y - r*0.25, r*0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
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
