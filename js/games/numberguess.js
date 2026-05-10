// === Number Guessing (数字猜谜) ===
const NumberGuessGame = {
  target: 0,
  attempts: 0,
  range: [1, 100],
  container: null,
  statsCb: null,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.target = Math.floor(Math.random() * 100) + 1;
    this.attempts = 0;
    this.range = [1, 100];
    this.render();
    this.updateStats();
  },

  render() {
    this.container.innerHTML = `
      <div style="text-align:center">
        <div style="font-size:60px;margin-bottom:12px">🤔</div>
        <p style="color:var(--text2);margin-bottom:8px">我想了一个 1~100 之间的数字</p>
        <p style="color:var(--accent2);font-size:14px;margin-bottom:20px" id="rangeHint">范围: 1 ~ 100</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px">
          <input type="number" id="guessInput" min="1" max="100" placeholder="输入数字"
            style="width:140px;padding:10px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:16px;text-align:center">
          <button class="btn" id="guessBtn">猜！</button>
        </div>
        <div id="resultHint" style="font-size:15px;min-height:24px"></div>
        <div id="history" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center"></div>
      </div>
    `;

    const input = document.getElementById('guessInput');
    document.getElementById('guessBtn').addEventListener('click', () => this.guess());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.guess();
    });
    input.focus();
  },

  guess() {
    const input = document.getElementById('guessInput');
    const val = parseInt(input.value);
    if (isNaN(val) || val < 1 || val > 100) {
      document.getElementById('resultHint').innerHTML = '<span style="color:#ff6b6b">请输入 1~100 的数字</span>';
      return;
    }

    this.attempts++;
    this.updateStats();

    const hint = document.getElementById('resultHint');
    const history = document.getElementById('history');
    const badge = document.createElement('span');
    badge.style.cssText = 'padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;';

    if (val === this.target) {
      hint.innerHTML = `<span style="color:#00d2a0;font-size:18px">🎉 猜对了！数字就是 ${this.target}</span>`;
      badge.style.background = 'var(--green)';
      badge.style.color = '#fff';
      badge.textContent = val + ' ✓';
      history.appendChild(badge);
      this.showWin();
      return;
    }

    if (val < this.target) {
      this.range[0] = Math.max(this.range[0], val + 1);
      hint.innerHTML = `<span style="color:#ffa726">📈 太小了！再大一点</span>`;
      badge.style.background = '#3a2a10';
      badge.style.color = '#ffa726';
    } else {
      this.range[1] = Math.min(this.range[1], val - 1);
      hint.innerHTML = `<span style="color:#54a0ff">📉 太大了！再小一点</span>`;
      badge.style.background = '#1a2a3a';
      badge.style.color = '#54a0ff';
    }
    badge.textContent = val;
    history.appendChild(badge);

    document.getElementById('rangeHint').textContent = `范围: ${this.range[0]} ~ ${this.range[1]}`;
    input.value = '';
    input.focus();
  },

  updateStats() {
    if (this.statsCb) {
      this.statsCb({ '猜测次数': this.attempts });
    }
  },

  showWin() {
    document.getElementById('guessBtn').disabled = true;
    document.getElementById('guessInput').disabled = true;
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `<h3>🎉 猜对了！</h3><p>用了 ${this.attempts} 次</p><button class="btn" id="replayBtn">再来一局</button>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => {
      this.init(this.container, this.statsCb);
    });
  },

  destroy() {}
};
