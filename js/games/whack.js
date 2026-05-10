// === Whack-a-Mole (打地鼠) ===
const WhackGame = {
  score: 0, misses: 0, timeLeft: 30,
  moles: Array(9).fill(false),
  running: false, timer: null, spawnTimer: null,
  container: null, statsCb: null,
  bestScore: 0,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.misses = 0;
    this.timeLeft = 30;
    this.moles = Array(9).fill(false);
    const saved = localStorage.getItem('whack_best');
    this.bestScore = saved ? parseInt(saved) : 0;
    this.running = true;
    this.render();
    this.bindEvents();
    this.startSpawner();
    this.startTimer();
    this.updateStats();
  },

  render() {
    let holesHTML = '';
    for (let i = 0; i < 9; i++) {
      holesHTML += `
        <div class="whack-hole" data-idx="${i}">
          <div class="whack-mole" id="mole_${i}">🔨</div>
          <div class="whack-dirt"></div>
        </div>`;
    }
    this.container.innerHTML = `
      <div style="text-align:center">
        <div style="color:var(--text2);font-size:13px;margin-bottom:8px">点击地鼠得分，小心别点空！</div>
        <div class="whack-grid">${holesHTML}</div>
        <div style="margin-top:12px;color:var(--text2);font-size:12px">最高分: ${this.bestScore}</div>
      </div>`;
  },

  bindEvents() {
    this.container.querySelectorAll('.whack-hole').forEach(hole => {
      hole.addEventListener('click', (e) => {
        if (!this.running) return;
        const idx = parseInt(hole.dataset.idx);
        if (this.moles[idx]) {
          this.moles[idx] = false;
          this.score += 10;
          const mole = document.getElementById(`mole_${idx}`);
          mole.classList.remove('up');
          mole.textContent = '💥';
          setTimeout(() => { mole.textContent = '🔨'; }, 200);
          this.updateStats();
        } else {
          this.misses++;
          this.score = Math.max(0, this.score - 2);
          this.updateStats();
        }
      });
    });
  },

  startSpawner() {
    const spawn = () => {
      if (!this.running) return;

      // Hide random mole
      const hideIdx = Math.floor(Math.random() * 9);
      if (this.moles[hideIdx]) {
        this.moles[hideIdx] = false;
        const m = document.getElementById(`mole_${hideIdx}`);
        if (m) m.classList.remove('up');
      }

      // Show random mole
      const showIdx = Math.floor(Math.random() * 9);
      if (!this.moles[showIdx]) {
        this.moles[showIdx] = true;
        const m = document.getElementById(`mole_${showIdx}`);
        if (m) m.classList.add('up');
      }

      // Also occasionally show a second mole
      if (Math.random() < 0.3) {
        const extra = Math.floor(Math.random() * 9);
        if (!this.moles[extra]) {
          this.moles[extra] = true;
          const m = document.getElementById(`mole_${extra}`);
          if (m) m.classList.add('up');
        }
      }

      const delay = Math.max(400, 1200 - this.score);
      this.spawnTimer = setTimeout(spawn, delay);
    };
    this.spawnTimer = setTimeout(spawn, 500);
  },

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateStats();
      if (this.timeLeft <= 0) this.gameOver();
    }, 1000);
  },

  updateStats() {
    if (this.statsCb) this.statsCb({ '得分': this.score, '剩余': `${this.timeLeft}s` });
  },

  gameOver() {
    this.running = false;
    clearInterval(this.timer);
    clearTimeout(this.spawnTimer);
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('whack_best', this.bestScore);
    }
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `<h3>时间到！</h3><p>得分: ${this.score} | 最高分: ${this.bestScore}</p><button class="btn" id="replayBtn">再来一次</button>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => {
      this.destroy();
      this.init(this.container, this.statsCb);
    });
  },

  destroy() {
    this.running = false;
    clearInterval(this.timer);
    clearTimeout(this.spawnTimer);
  }
};
