// === Reaction Time (反应速度测试) ===
const ReactionGame = {
  state: 'idle', // idle, waiting, ready, clicked
  startTime: 0,
  timeout: null,
  best: Infinity,
  results: [],
  container: null,
  statsCb: null,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.state = 'idle';
    this.results = [];
    this.render();
    this.updateStats();
  },

  render() {
    this.container.innerHTML = `
      <div style="text-align:center">
        <div class="reaction-zone" id="reactionZone"
          style="width:200px;height:200px;border-radius:50%;margin:20px auto;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.1s;user-select:none;font-size:16px;font-weight:700">
          <span id="zoneText">点我开始</span>
        </div>
        <div id="reactionResults" style="margin-top:16px"></div>
      </div>
    `;

    const zone = document.getElementById('reactionZone');
    this.updateZoneStyle(zone, 'idle');

    zone.addEventListener('click', () => {
      if (this.state === 'idle' || this.state === 'clicked') {
        this.startCountdown();
      } else if (this.state === 'waiting') {
        this.tooEarly();
      } else if (this.state === 'ready') {
        this.recordReaction();
      }
    });
  },

  updateZoneStyle(zone, state) {
    if (state === 'idle') {
      zone.style.background = 'var(--accent)';
      zone.style.color = '#fff';
      document.getElementById('zoneText').textContent = '点我开始';
    } else if (state === 'waiting') {
      zone.style.background = '#ff6b6b';
      zone.style.color = '#fff';
      document.getElementById('zoneText').textContent = '等待绿色...';
    } else if (state === 'ready') {
      zone.style.background = '#00d2a0';
      zone.style.color = '#fff';
      document.getElementById('zoneText').textContent = '快按！';
    } else if (state === 'clicked') {
      zone.style.background = 'var(--accent)';
      zone.style.color = '#fff';
      document.getElementById('zoneText').textContent = '再试一次';
    }
  },

  startCountdown() {
    this.state = 'waiting';
    const zone = document.getElementById('reactionZone');
    this.updateZoneStyle(zone, 'waiting');

    const delay = 1000 + Math.random() * 3000;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.state = 'ready';
      this.startTime = Date.now();
      this.updateZoneStyle(zone, 'ready');
    }, delay);
  },

  tooEarly() {
    this.state = 'clicked';
    clearTimeout(this.timeout);
    const zone = document.getElementById('reactionZone');
    zone.style.background = '#ffa726';
    document.getElementById('zoneText').textContent = '太早了！等绿色再按';
    setTimeout(() => {
      this.state = 'idle';
      this.updateZoneStyle(zone, 'idle');
    }, 1500);
  },

  recordReaction() {
    this.state = 'clicked';
    const time = Date.now() - this.startTime;
    this.results.unshift(time);
    if (this.results.length > 5) this.results.pop();
    if (time < this.best) this.best = time;

    const zone = document.getElementById('reactionZone');
    document.getElementById('zoneText').textContent = `${time} ms`;
    this.updateStats();
    this.showResults();

    setTimeout(() => {
      this.state = 'idle';
      this.updateZoneStyle(zone, 'idle');
    }, 2000);
  },

  showResults() {
    const el = document.getElementById('reactionResults');
    el.innerHTML = `<p style="color:var(--text2);font-size:13px;margin-bottom:8px">最近 5 次：</p>
      <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
        ${this.results.map((t, i) => `<span style="padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;
          background:${i===0?'var(--accent)':'var(--surface2)'};color:${i===0?'#fff':'var(--text)'}"
        >${t}ms</span>`).join('')}
      </div>`;
  },

  updateStats() {
    if (this.statsCb) {
      this.statsCb({ '最佳': this.best === Infinity ? '--' : `${this.best}ms` });
    }
  },

  destroy() {
    clearTimeout(this.timeout);
  }
};
