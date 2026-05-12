/**
 * Memory Match (记忆翻牌) - 5 关闯关模式
 * @author ch2077
 * @version 2.0.0
 * @date 2025-04-08 加入闯关，4对→12对递增
 * @date 2025-04-30 修了grid布局在desktop上显示不全的问题
 *
 * 经典记忆配对，翻两张相同的牌即消除
 * 5关难度：初级4对→中级6对→高级8对→专家10对→大师12对
 * 每关独立计时计步，配对全部翻完进入下一关
 */
const MemoryGame = {
  allEmojis: ['🐶','🐱','🐰','🦊','🐻','🐼','🐨','🐯','🐮','🐷','🐸','🐵'],
  cards: [],
  flipped: [],
  matched: [],
  moves: 0,
  timer: null,
  seconds: 0,
  container: null,
  statsCb: null,
  level: 1, maxLevel: 5,
  levelConfigs: [
    { pairs: 4, cols: 4, name: '初级' },
    { pairs: 6, cols: 6, name: '中级' },
    { pairs: 8, cols: 4, name: '高级' },
    { pairs: 10, cols: 5, name: '专家' },
    { pairs: 12, cols: 6, name: '大师' },
  ],

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.moves = 0;
    this.seconds = 0;
    this.level = 1;
    this.matched = [];
    this.flipped = [];
    this.showLevelIntro(() => {
      this.startLevel();
    });
  },

  startLevel() {
    const cfg = this.levelConfigs[this.level - 1];
    const emojis = this.allEmojis.slice(0, cfg.pairs);
    this.moves = 0; this.seconds = 0;
    this.matched = []; this.flipped = [];
    this.cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    this.render(cfg.cols);
    this.startTimer();
  },

  showLevelIntro(cb) {
    const cfg = this.levelConfigs[this.level - 1];
    const div = document.createElement('div');
    div.className = 'level-intro';
    div.innerHTML = `<div class="level-num">第 ${this.level} 关</div><div class="level-title">${cfg.name} · ${cfg.pairs} 对</div>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    setTimeout(() => { if (div.parentNode) div.remove(); cb(); }, 1500);
  },

  render(cols) {
    this.container.innerHTML = `<div class="memory-grid" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:auto"></div>`;
    const grid = this.container.querySelector('.memory-grid');
    this.cards.forEach((emoji, i) => {
      const div = document.createElement('div');
      div.className = 'memory-card';
      div.dataset.index = i;
      div.textContent = '';
      div.addEventListener('click', () => this.flip(i, div));
      grid.appendChild(div);
    });
    this.updateStats();
  },

  startTimer() {
    clearInterval(this.timer);
    this.seconds = 0;
    this.timer = setInterval(() => {
      this.seconds++;
      this.updateStats();
    }, 1000);
  },

  updateStats() {
    if (this.statsCb) {
      const cfg = this.levelConfigs[this.level - 1];
      this.statsCb({ '关卡': `${this.level}/${this.maxLevel}`, '步数': this.moves, '配对': `${this.matched.length}/${cfg.pairs}`, '时间': `${this.seconds}s` });
    }
  },

  flip(index, el) {
    if (this.flipped.length >= 2) return;
    if (this.matched.includes(index)) return;
    if (this.flipped.includes(index)) return;

    el.textContent = this.cards[index];
    el.classList.add('flipped');
    this.flipped.push(index);

    if (this.flipped.length === 2) {
      this.moves++;
      this.updateStats();
      const [a, b] = this.flipped;
      if (this.cards[a] === this.cards[b]) {
        this.matched.push(a, b);
        const cards = this.container.querySelectorAll('.memory-card');
        cards[a].classList.add('matched');
        cards[b].classList.add('matched');
        this.flipped = [];
        if (this.matched.length === this.cards.length) {
          clearInterval(this.timer);
          setTimeout(() => {
            if (this.level >= this.maxLevel) { this.showWin(true); }
            else { this.levelClear(); }
          }, 400);
        }
      } else {
        setTimeout(() => {
          const cards = this.container.querySelectorAll('.memory-card');
          cards[a].classList.remove('flipped');
          cards[b].classList.remove('flipped');
          cards[a].textContent = '';
          cards[b].textContent = '';
          this.flipped = [];
        }, 600);
      }
    }
  },

  levelClear() {
    const div = document.createElement('div');
    div.className = 'level-intro';
    div.innerHTML = `<div class="level-num">✅ 第 ${this.level} 关通过！</div><div class="level-title">准备进入第 ${this.level + 1} 关</div>`;
    this.container.appendChild(div);
    setTimeout(() => {
      if (div.parentNode) div.remove();
      this.level++;
      this.startLevel();
    }, 1800);
  },

  showWin(full = false) {
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    if (full) {
      div.innerHTML = `<h3>🎉 恭喜通关！</h3><p>通过了全部 ${this.maxLevel} 关！用了 ${this.moves} 步</p><button class="btn" id="replayBtn">再来一局</button>`;
    } else {
      div.innerHTML = `<h3>🎉 恭喜过关！</h3><p>用了 ${this.moves} 步，耗时 ${this.seconds} 秒</p><button class="btn" id="replayBtn">再来一局</button>`;
    }
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => {
      this.destroy();
      this.init(this.container, this.statsCb);
    });
  },

  destroy() { clearInterval(this.timer); }
};
