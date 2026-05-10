// === Fruit Catch (接水果) ===
const FruitCatchGame = {
  canvas: null,
  ctx: null,
  width: 360,
  height: 550,
  basket: { x: 0, w: 80, h: 24 },
  items: [],
  score: 0,
  lives: 5,
  running: false,
  loop: null,
  frameCount: 0,
  speed: 1.5,
  container: null,
  statsCb: null,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.lives = 5;
    this.running = true;
    this.frameCount = 0;
    this.items = [];
    this.speed = 1.5;

    const w = Math.min(360, container.clientWidth - 48);
    const h = Math.min(550, w * 1.5);
    this.width = w;
    this.height = h;
    this.basket = { x: w / 2 - 40, w: 80, h: 24 };

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d');

    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
    const inst = document.createElement('div');
    inst.className = 'instructions';
    inst.textContent = '左右滑动或点击两侧移动篮子接水果';
    this.container.appendChild(inst);

    // Touch/mouse controls
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      this.basket.x = touchX - this.basket.w / 2;
      this.clampBasket();
    });
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      this.basket.x = touchX - this.basket.w / 2;
      this.clampBasket();
    });
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.basket.x = e.clientX - rect.left - this.basket.w / 2;
      this.clampBasket();
    });
    // Also allow clicking left/right halves
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX < this.width / 2) {
        this.basket.x -= 40;
      } else {
        this.basket.x += 40;
      }
      this.clampBasket();
    });

    this.updateStats();
    this.loop = setInterval(() => this.tick(), 16);
  },

  clampBasket() {
    this.basket.x = Math.max(0, Math.min(this.width - this.basket.w, this.basket.x));
  },

  tick() {
    if (!this.running) return;
    this.frameCount++;

    // Spawn items
    if (this.frameCount % 40 === 0) {
      const isBomb = Math.random() < 0.15;
      const emoji = isBomb ? '💣' : ['🍎','🍊','🍋','🍇','🍓','🍑','🍒','🥝'][Math.floor(Math.random() * 8)];
      this.items.push({
        x: Math.random() * (this.width - 30),
        y: -30,
        r: 18,
        emoji,
        isBomb,
        vy: this.speed + Math.random()
      });
    }

    // Increase speed over time
    if (this.frameCount % 500 === 0) this.speed += 0.3;

    // Move items
    for (const item of this.items) item.y += item.vy;

    // Check catch/miss
    this.items = this.items.filter(item => {
      if (item.y - item.r > this.height) {
        if (!item.isBomb) { this.lives--; this.updateStats(); }
        if (this.lives <= 0) { this.gameOver(); return false; }
        return false;
      }
      // Catch
      if (item.y + item.r > this.height - this.basket.h - 5 &&
          item.x > this.basket.x && item.x < this.basket.x + this.basket.w) {
        if (item.isBomb) {
          this.lives--;
          this.updateStats();
          if (this.lives <= 0) { this.gameOver(); return false; }
        } else {
          this.score += 10;
          this.updateStats();
        }
        return false;
      }
      return true;
    });

    this.draw();
  },

  draw() {
    const c = this.ctx;
    c.clearRect(0, 0, this.width, this.height);
    c.fillStyle = '#1a1a3e';
    c.fillRect(0, 0, this.width, this.height);

    // Items
    for (const item of this.items) {
      c.font = '28px sans-serif';
      c.textAlign = 'center';
      c.fillText(item.emoji, item.x, item.y);
    }

    // Basket
    c.fillStyle = '#a29bfe';
    c.fillRect(this.basket.x, this.height - this.basket.h, this.basket.w, this.basket.h);
    c.fillStyle = '#6c5ce7';
    c.fillRect(this.basket.x + 5, this.height - this.basket.h + 2, this.basket.w - 10, this.basket.h - 4);

    // Lives
    c.font = '14px sans-serif';
    c.textAlign = 'left';
    c.fillStyle = '#fff';
    c.fillText('❤️'.repeat(this.lives), 8, 22);
  },

  updateStats() {
    if (this.statsCb) {
      this.statsCb({ '得分': this.score, '生命': this.lives });
    }
  },

  gameOver() {
    this.running = false;
    clearInterval(this.loop);

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
    clearInterval(this.loop);
  }
};
