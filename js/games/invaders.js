// === Space Invaders (太空侵略者) ===
const InvadersGame = {
  canvas: null, ctx: null,
  player: { x: 0, y: 0, w: 40, h: 30 },
  aliens: [], bullets: [], alienBullets: [],
  alienDir: 1, alienSpeed: 0.5, alienDrop: 8,
  score: 0, lives: 3, level: 1,
  running: false, animFrame: null,
  container: null, statsCb: null,
  moveLeft: false, moveRight: false,
  lastShot: 0, shotCooldown: 400,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.bullets = [];
    this.alienBullets = [];
    this.alienDir = 1;
    this.alienSpeed = 0.5;
    this.moveLeft = false;
    this.moveRight = false;
    this.running = true;
    this.render();
    this.setupCanvas();
    this.spawnAliens();
    this.bindControls();
    this.loop();
  },

  render() {
    this.container.innerHTML = `<canvas id="invCanvas" style="width:100%;max-width:400px;border-radius:8px;touch-action:none"></canvas>`;
  },

  setupCanvas() {
    this.canvas = document.getElementById('invCanvas');
    this.ctx = this.canvas.getContext('2d');
    const w = Math.min(400, this.container.clientWidth - 32);
    this.canvas.width = w;
    this.canvas.height = w * 1.4;
    this.player.x = this.canvas.width / 2;
    this.player.y = this.canvas.height - 50;
  },

  spawnAliens() {
    this.aliens = [];
    const cols = 8, rows = 3 + this.level;
    const w = this.canvas.width / (cols + 1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.aliens.push({
          x: w + c * w, y: 40 + r * 40,
          w: 24, h: 20, alive: true,
          type: r % 3
        });
      }
    }
  },

  bindControls() {
    // Keyboard
    const keydown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.moveLeft = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.moveRight = true;
    };
    const keyup = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.moveLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.moveRight = false;
    };
    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);
    this._keydown = keydown;
    this._keyup = keyup;

    // Touch
    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const tx = (e.touches[0].clientX - rect.left) * (this.canvas.width / rect.width);
      this.player.x = Math.max(this.player.w/2, Math.min(this.canvas.width - this.player.w/2, tx));
    });
    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const tx = (e.touches[0].clientX - rect.left) * (this.canvas.width / rect.width);
      this.player.x = Math.max(this.player.w/2, Math.min(this.canvas.width - this.player.w/2, tx));
      this.shoot();
    });
    this.canvas.addEventListener('click', () => this.shoot());

    // Mouse move
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.player.x = Math.max(this.player.w/2, Math.min(this.canvas.width - this.player.w/2, mx));
    });
  },

  shoot() {
    const now = Date.now();
    if (now - this.lastShot < this.shotCooldown) return;
    this.lastShot = now;
    this.bullets.push({ x: this.player.x, y: this.player.y - 20, vy: -6 });
  },

  update() {
    // Player movement
    if (this.moveLeft) this.player.x -= 5;
    if (this.moveRight) this.player.x += 5;
    this.player.x = Math.max(this.player.w/2, Math.min(this.canvas.width - this.player.w/2, this.player.x));

    // Auto shoot
    const now = Date.now();
    if (now - this.lastShot > 800) this.shoot();

    // Update bullets
    for (const b of this.bullets) b.y += b.vy;
    this.bullets = this.bullets.filter(b => b.y > -10);

    // Update alien bullets
    for (const b of this.alienBullets) b.y += 2;
    this.alienBullets = this.alienBullets.filter(b => b.y < this.canvas.height + 10);

    // Random alien shooting
    const liveAliens = this.aliens.filter(a => a.alive);
    if (liveAliens.length && Math.random() < 0.015) {
      const shooter = liveAliens[Math.floor(Math.random() * liveAliens.length)];
      this.alienBullets.push({ x: shooter.x, y: shooter.y + 10 });
    }

    // Move aliens
    let hitEdge = false;
    for (const a of this.aliens) {
      if (!a.alive) continue;
      a.x += this.alienDir * this.alienSpeed;
      if (a.x + a.w/2 >= this.canvas.width || a.x - a.w/2 <= 0) hitEdge = true;
    }
    if (hitEdge) {
      this.alienDir *= -1;
      for (const a of this.aliens) {
        if (!a.alive) continue;
        a.y += this.alienDrop;
        a.x += this.alienDir * this.alienSpeed;
      }
    }

    // Bullet-alien collisions
    for (const b of this.bullets) {
      for (const a of this.aliens) {
        if (!a.alive) continue;
        if (Math.abs(b.x - a.x) < a.w/2 && Math.abs(b.y - a.y) < a.h/2) {
          a.alive = false;
          b.y = -999;
          this.score += (a.type + 1) * 10;
        }
      }
    }
    this.bullets = this.bullets.filter(b => b.y > -10 && b.y < this.canvas.height + 10);

    // Alien bullet - player collision
    for (const b of this.alienBullets) {
      if (Math.abs(b.x - this.player.x) < this.player.w/2 && Math.abs(b.y - this.player.y) < this.player.h/2) {
        b.y = -999;
        this.lives--;
        if (this.lives <= 0) { this.gameOver(); return; }
      }
    }
    this.alienBullets = this.alienBullets.filter(b => b.y > -10);

    // Aliens reach bottom
    if (this.aliens.some(a => a.alive && a.y + a.h/2 >= this.player.y)) {
      this.lives = 0;
      this.gameOver();
      return;
    }

    // Next level
    if (this.aliens.every(a => !a.alive)) {
      this.level++;
      this.alienSpeed += 0.2;
      this.spawnAliens();
    }

    this.updateStats();
  },

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Aliens
    for (const a of this.aliens) {
      if (!a.alive) continue;
      const colors = ['#54a0ff','#ffa726','#ff6b6b'];
      ctx.fillStyle = colors[a.type];
      ctx.fillRect(a.x - a.w/2, a.y - a.h/2, a.w, a.h);
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(a.x - 5, a.y - 5, 3, 4);
      ctx.fillRect(a.x + 2, a.y - 5, 3, 4);
    }

    // Player
    ctx.fillStyle = '#00d2a0';
    ctx.beginPath();
    ctx.moveTo(this.player.x, this.player.y - this.player.h/2);
    ctx.lineTo(this.player.x - this.player.w/2, this.player.y + this.player.h/2);
    ctx.lineTo(this.player.x + this.player.w/2, this.player.y + this.player.h/2);
    ctx.closePath();
    ctx.fill();

    // Bullets
    ctx.fillStyle = '#ffd93d';
    for (const b of this.bullets) {
      ctx.fillRect(b.x - 2, b.y - 6, 4, 10);
    }
    ctx.fillStyle = '#ff6b6b';
    for (const b of this.alienBullets) {
      ctx.fillRect(b.x - 2, b.y - 4, 4, 8);
    }

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const starSeed = 42;
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137 + starSeed) % this.canvas.width);
      const sy = ((i * 251 + this.score * 10) % this.canvas.height);
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
  },

  loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  },

  updateStats() {
    if (this.statsCb) this.statsCb({ '得分': this.score, '生命': this.lives, '关卡': this.level });
  },

  gameOver() {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
    document.removeEventListener('keydown', this._keydown);
    document.removeEventListener('keyup', this._keyup);
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `<h3>游戏结束</h3><p>得分: ${this.score} | 到达第 ${this.level} 关</p><button class="btn" id="replayBtn">再来一次</button>`;
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
    document.removeEventListener('keydown', this._keydown);
    document.removeEventListener('keyup', this._keyup);
  }
};
