// === Snake Game ===
const SnakeGame = {
  canvas: null,
  ctx: null,
  gridSize: 20,
  tileCount: 20,
  snake: [],
  food: null,
  dir: { x: 1, y: 0 },
  nextDir: { x: 1, y: 0 },
  score: 0,
  speed: 100,
  loop: null,
  running: false,
  container: null,
  statsCb: null,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.snake = [{ x: 10, y: 10 }];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.speed = 100;
    this.running = true;

    const size = Math.min(400, container.clientWidth - 48);
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'game-canvas';
    this.canvas.width = size;
    this.canvas.height = size;
    this.ctx = this.canvas.getContext('2d');
    this.tileSize = size / this.tileCount;

    container.innerHTML = '';
    container.appendChild(this.canvas);
    container.appendChild(this.createInstructions('方向键 / WASD 控制方向'));

    this.spawnFood();
    this.updateStats();

    document.addEventListener('keydown', this.handleKey);
    this.loop = setInterval(() => this.tick(), this.speed);
  },

  createInstructions(text) {
    const d = document.createElement('div');
    d.className = 'instructions';
    d.textContent = text;
    return d;
  },

  handleKey(e) {
    const key = e.key.toLowerCase();
    if (['arrowup','w'].includes(key) && SnakeGame.dir.y === 0) {
      SnakeGame.nextDir = { x: 0, y: -1 };
    } else if (['arrowdown','s'].includes(key) && SnakeGame.dir.y === 0) {
      SnakeGame.nextDir = { x: 0, y: 1 };
    } else if (['arrowleft','a'].includes(key) && SnakeGame.dir.x === 0) {
      SnakeGame.nextDir = { x: -1, y: 0 };
    } else if (['arrowright','d'].includes(key) && SnakeGame.dir.x === 0) {
      SnakeGame.nextDir = { x: 1, y: 0 };
    }
  },

  tick() {
    if (!this.running) return;
    this.dir = this.nextDir;
    const head = this.snake[0];
    const newHead = { x: head.x + this.dir.x, y: head.y + this.dir.y };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= this.tileCount || newHead.y < 0 || newHead.y >= this.tileCount) {
      this.gameOver();
      return;
    }
    // Self collision
    if (this.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      this.gameOver();
      return;
    }

    this.snake.unshift(newHead);

    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 10;
      this.updateStats();
      this.spawnFood();
      if (this.speed > 40) {
        this.speed -= 2;
        clearInterval(this.loop);
        this.loop = setInterval(() => this.tick(), this.speed);
      }
    } else {
      this.snake.pop();
    }

    this.draw();
  },

  spawnFood() {
    do {
      this.food = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount)
      };
    } while (this.snake.some(s => s.x === this.food.x && s.y === this.food.y));
  },

  draw() {
    const c = this.ctx;
    const t = this.tileSize;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Food
    c.fillStyle = '#ff6b6b';
    c.fillRect(this.food.x * t + 2, this.food.y * t + 2, t - 4, t - 4);

    // Snake
    this.snake.forEach((s, i) => {
      c.fillStyle = i === 0 ? '#a29bfe' : '#6c5ce7';
      c.fillRect(s.x * t + 1, s.y * t + 1, t - 2, t - 2);
    });
  },

  updateStats() {
    if (this.statsCb) {
      this.statsCb({ '得分': this.score, '长度': this.snake.length });
    }
  },

  gameOver() {
    this.running = false;
    clearInterval(this.loop);
    document.removeEventListener('keydown', this.handleKey);

    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `
      <h3>游戏结束！</h3>
      <p>得分: ${this.score} | 长度: ${this.snake.length}</p>
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
  }
};
