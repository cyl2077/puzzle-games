// === Simon Says (记忆灯) ===
const SimonGame = {
  sequence: [], playerIdx: 0,
  showingSequence: false,
  score: 0, highScore: 0,
  container: null, statsCb: null,
  colors: ['#ff6b6b','#54a0ff','#00d2a0','#ffd93d'],
  colorNames: ['红','蓝','绿','黄'],
  soundEnabled: true,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.sequence = [];
    this.playerIdx = 0;
    this.showingSequence = false;
    this.score = 0;
    const saved = localStorage.getItem('simon_high');
    this.highScore = saved ? parseInt(saved) : 0;
    this.render();
    setTimeout(() => this.nextRound(), 600);
  },

  render() {
    this.container.innerHTML = `
      <div style="text-align:center">
        <div style="color:var(--text2);font-size:13px;margin-bottom:12px">记住灯光顺序，然后重复点击！</div>
        <div class="simon-board">
          ${this.colors.map((c, i) => `
            <button class="simon-btn" data-idx="${i}" style="background:${c};aspect-ratio:1;border:none;border-radius:16px;cursor:pointer;transition:all 0.15s;box-shadow:0 0 0 rgba(0,0,0,0.3)"></button>
          `).join('')}
        </div>
        <div id="simonStatus" style="margin-top:14px;font-weight:600;font-size:15px;color:var(--accent2)">准备...</div>
        <div style="color:var(--text2);font-size:12px;margin-top:8px">最高分: ${this.highScore}</div>
      </div>`;

    this.container.querySelectorAll('.simon-btn').forEach((btn, i) => {
      btn.addEventListener('click', () => this.playerPress(i, btn));
    });
  },

  nextRound() {
    this.showingSequence = true;
    this.playerIdx = 0;
    this.sequence.push(Math.floor(Math.random() * 4));
    document.getElementById('simonStatus').textContent = '记住顺序...';
    this.updateStats();
    this.playSequence(0);
  },

  playSequence(i) {
    if (i >= this.sequence.length) {
      this.showingSequence = false;
      document.getElementById('simonStatus').textContent = '轮到你！';
      return;
    }
    const idx = this.sequence[i];
    const btn = this.container.querySelector(`.simon-btn[data-idx="${idx}"]`);
    this.lightUp(btn, idx);
    setTimeout(() => this.playSequence(i + 1), 500);
  },

  lightUp(btn, idx) {
    btn.style.transform = 'scale(1.1)';
    btn.style.boxShadow = `0 0 24px ${this.colors[idx]}`;
    // Simple tone via oscillator
    if (this.soundEnabled) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 300 + idx * 100;
        osc.type = 'sine';
        gain.gain.value = 0.1;
        osc.start(); osc.stop(ctx.currentTime + 0.15);
      } catch(e) {}
    }
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 0 0 rgba(0,0,0,0.3)';
    }, 300);
  },

  playerPress(idx, btn) {
    if (this.showingSequence) return;
    this.lightUp(btn, idx);

    if (idx !== this.sequence[this.playerIdx]) {
      document.getElementById('simonStatus').innerHTML = '<span style="color:#ff6b6b">错误！</span>';
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('simon_high', this.highScore);
      }
      setTimeout(() => this.showGameOver(), 800);
      return;
    }

    this.playerIdx++;
    if (this.playerIdx >= this.sequence.length) {
      this.score++;
      document.getElementById('simonStatus').textContent = '正确！下一轮...';
      setTimeout(() => this.nextRound(), 800);
    }
    this.updateStats();
  },

  updateStats() {
    if (this.statsCb) this.statsCb({ '得分': this.score, '序列长度': this.sequence.length });
  },

  showGameOver() {
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `<h3>游戏结束</h3><p>分数: ${this.score} | 最高分: ${this.highScore}</p><button class="btn" id="replayBtn">再来一次</button>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => {
      this.init(this.container, this.statsCb);
    });
  },

  destroy() {}
};
