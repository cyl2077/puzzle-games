// === Memory Match Game ===
const MemoryGame = {
  emojis: ['🐶','🐱','🐰','🦊','🐻','🐼','🐨','🐯'],
  cards: [],
  flipped: [],
  matched: [],
  moves: 0,
  timer: null,
  seconds: 0,
  container: null,
  statsCb: null,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.moves = 0;
    this.seconds = 0;
    this.matched = [];
    this.flipped = [];
    this.cards = [...this.emojis, ...this.emojis]
      .sort(() => Math.random() - 0.5);
    this.render();
    this.startTimer();
  },

  render() {
    this.container.innerHTML = '<div class="memory-grid"></div>';
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
      this.statsCb({ '步数': this.moves, '配对': `${this.matched.length}/${this.emojis.length}`, '时间': `${this.seconds}s` });
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
        document.querySelectorAll('.memory-card')[a].classList.add('matched');
        document.querySelectorAll('.memory-card')[b].classList.add('matched');
        this.flipped = [];
        if (this.matched.length === this.cards.length) {
          clearInterval(this.timer);
          setTimeout(() => this.showWin(), 400);
        }
      } else {
        setTimeout(() => {
          document.querySelectorAll('.memory-card')[a].classList.remove('flipped');
          document.querySelectorAll('.memory-card')[b].classList.remove('flipped');
          document.querySelectorAll('.memory-card')[a].textContent = '';
          document.querySelectorAll('.memory-card')[b].textContent = '';
          this.flipped = [];
        }, 600);
      }
    }
  },

  showWin() {
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `
      <h3>🎉 恭喜过关！</h3>
      <p>用了 ${this.moves} 步，耗时 ${this.seconds} 秒</p>
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
    clearInterval(this.timer);
  }
};
