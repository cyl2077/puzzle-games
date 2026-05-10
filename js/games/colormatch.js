// === Color Match / Stroop Test (颜色匹配) ===
const ColorMatchGame = {
  colorName: '',
  displayColor: '',
  score: 0,
  streak: 0,
  bestStreak: 0,
  timeLeft: 30,
  running: false,
  timer: null,
  container: null,
  statsCb: null,
  colors: ['红','蓝','绿','黄','橙','紫'],
  colorMap: { '红': '#ff6b6b', '蓝': '#54a0ff', '绿': '#00d2a0', '黄': '#ffd93d', '橙': '#ffa726', '紫': '#a29bfe' },

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.timeLeft = 30;
    this.running = true;
    this.render();
    this.nextRound();
    this.startTimer();
    this.updateStats();
  },

  render() {
    this.container.innerHTML = `
      <div style="text-align:center">
        <div style="color:var(--text2);font-size:14px;margin-bottom:8px">文字颜色与名称是否一致？</div>
        <div id="colorDisplay" style="font-size:48px;font-weight:800;min-height:80px;display:flex;align-items:center;justify-content:center;transition:all 0.15s"></div>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:20px">
          <button class="btn" id="matchYes" style="font-size:18px;padding:14px 36px;background:var(--green)">✅ 一致</button>
          <button class="btn" id="matchNo" style="font-size:18px;padding:14px 36px;background:var(--red)">❌ 不一致</button>
        </div>
        <div id="matchResult" style="margin-top:16px;min-height:28px;font-size:15px;font-weight:600"></div>
        <div style="margin-top:12px;color:var(--text2);font-size:13px">
          连击: <span id="streakDisplay" style="color:var(--accent2);font-weight:700">0</span>
        </div>
      </div>
    `;

    document.getElementById('matchYes').addEventListener('click', () => this.answer(true));
    document.getElementById('matchNo').addEventListener('click', () => this.answer(false));
  },

  nextRound() {
    if (!this.running) return;

    // Randomly choose whether color matches name
    const match = Math.random() < 0.4; // 40% chance of match
    this.colorName = this.colors[Math.floor(Math.random() * this.colors.length)];

    if (match) {
      this.displayColor = this.colorMap[this.colorName];
    } else {
      // Pick a different color
      const others = this.colors.filter(c => c !== this.colorName);
      const pick = others[Math.floor(Math.random() * others.length)];
      this.displayColor = this.colorMap[pick];
    }

    const display = document.getElementById('colorDisplay');
    if (display) {
      display.textContent = this.colorName;
      display.style.color = this.displayColor;
    }
  },

  answer(userSaysMatch) {
    if (!this.running) return;
    const actualMatch = this.displayColor === this.colorMap[this.colorName];
    const correct = (userSaysMatch === actualMatch);

    const resultEl = document.getElementById('matchResult');
    if (correct) {
      this.score += 10 + this.streak * 2;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      resultEl.innerHTML = '<span style="color:#00d2a0">正确！</span>';
    } else {
      this.streak = 0;
      resultEl.innerHTML = '<span style="color:#ff6b6b">错了！</span>';
    }

    document.getElementById('streakDisplay').textContent = this.streak;
    this.updateStats();
    this.nextRound();
  },

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateStats();
      if (this.timeLeft <= 0) {
        this.gameOver();
      }
    }, 1000);
  },

  updateStats() {
    if (this.statsCb) {
      this.statsCb({ '得分': this.score, '连击': this.streak, '时间': `${this.timeLeft}s` });
    }
  },

  gameOver() {
    this.running = false;
    clearInterval(this.timer);
    if (this.streak > this.bestStreak) this.bestStreak = this.streak;

    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `
      <h3>时间到！</h3>
      <p>得分: ${this.score} | 最佳连击: ${this.bestStreak}</p>
      <button class="btn" id="replayBtn">再来一次</button>
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
    clearInterval(this.timer);
  }
};
