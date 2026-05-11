// === Whack-a-Mole (打地鼠) - 5 关闯关模式 ===
const WhackGame = {
  score: 0, misses: 0,
  moles: Array(9).fill(false),
  running: false, timer: null, spawnTimer: null,
  container: null, statsCb: null,
  bestScore: 0,
  level: 1, maxLevel: 5,
  targetScore: 50, timeLeft: 30, spawnDelay: 1000,
  levelConfigs: [
    { target: 60, time: 30, spawnDelay: 1000, name: '热身' },
    { target: 120, time: 28, spawnDelay: 800, name: '加速' },
    { target: 180, time: 26, spawnDelay: 650, name: '疯狂' },
    { target: 250, time: 24, spawnDelay: 500, name: '极限' },
    { target: 350, time: 22, spawnDelay: 380, name: '地狱' },
  ],

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0; this.misses = 0; this.level = 1;
    const cfg = this.levelConfigs[0];
    this.targetScore = cfg.target; this.timeLeft = cfg.time; this.spawnDelay = cfg.spawnDelay;
    this.moles = Array(9).fill(false);
    const saved = localStorage.getItem('whack_best');
    this.bestScore = saved ? parseInt(saved) : 0;
    this.running = true;
    this.render();
    this.showLevelIntro(() => {
      this.bindEvents();
      this.startSpawner();
      this.startTimer();
      this.updateStats();
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
        <div style="color:var(--text2);font-size:13px;margin-bottom:8px">点击地鼠得分，别点空！</div>
        <div class="whack-grid">${holesHTML}</div>
        <div style="margin-top:12px;color:var(--text2);font-size:12px">最高分: ${this.bestScore} | 累计通关数</div>
      </div>`;
  },

  bindEvents() {
    this.container.querySelectorAll('.whack-hole').forEach(hole => {
      hole.addEventListener('click', () => {
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
          if (this.score >= this.targetScore) {
            if (this.level >= this.maxLevel) { this.gameOver(true); return; }
            this.levelClear();
          }
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
      const hideIdx = Math.floor(Math.random() * 9);
      if (this.moles[hideIdx]) {
        this.moles[hideIdx] = false;
        const m = document.getElementById(`mole_${hideIdx}`);
        if (m) m.classList.remove('up');
      }
      const showIdx = Math.floor(Math.random() * 9);
      if (!this.moles[showIdx]) {
        this.moles[showIdx] = true;
        const m = document.getElementById(`mole_${showIdx}`);
        if (m) m.classList.add('up');
      }
      // Chance of second mole increases with level
      if (Math.random() < 0.2 + this.level * 0.1) {
        const extra = Math.floor(Math.random() * 9);
        if (!this.moles[extra]) {
          this.moles[extra] = true;
          const m = document.getElementById(`mole_${extra}`);
          if (m) m.classList.add('up');
        }
      }
      this.spawnTimer = setTimeout(spawn, this.spawnDelay);
    };
    this.spawnTimer = setTimeout(spawn, 500);
  },

  levelClear() {
    clearInterval(this.timer);
    clearTimeout(this.spawnTimer);
    this.running = false;
    const div = document.createElement('div');
    div.className = 'level-intro';
    div.innerHTML = `<div class="level-num">✅ 第 ${this.level} 关通过！</div><div class="level-title">准备进入第 ${this.level + 1} 关</div>`;
    this.container.appendChild(div);
    setTimeout(() => {
      if (div.parentNode) div.remove();
      this.level++;
      const cfg = this.levelConfigs[this.level - 1];
      this.targetScore = cfg.target; this.timeLeft = cfg.time; this.spawnDelay = cfg.spawnDelay;
      this.moles = Array(9).fill(false);
      this.running = true;
      this.updateStats();
      this.startSpawner();
      this.startTimer();
    }, 1800);
  },

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateStats();
      if (this.timeLeft <= 0) this.gameOver(false);
    }, 1000);
  },

  updateStats() {
    if (this.statsCb) this.statsCb({ '关卡': `${this.level}/${this.maxLevel}`, '得分': `${this.score}/${this.targetScore}`, '剩余': `${this.timeLeft}s` });
  },

  gameOver(won = false) {
    this.running = false;
    clearInterval(this.timer);
    clearTimeout(this.spawnTimer);
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('whack_best', this.bestScore);
    }
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = won
      ? `<h3>🎉 恭喜通关！</h3><p>通过了全部 ${this.maxLevel} 关！最终得分: ${this.score}</p><button class="btn" id="replayBtn">再来一局</button>`
      : `<h3>时间到！</h3><p>第 ${this.level}/${this.maxLevel} 关 | 得分: ${this.score}/${this.targetScore} | 最高: ${this.bestScore}</p><button class="btn" id="replayBtn">再来一次</button>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => {
      this.destroy(); this.init(this.container, this.statsCb);
    });
  },

  destroy() {
    this.running = false;
    clearInterval(this.timer);
    clearTimeout(this.spawnTimer);
  }
};
