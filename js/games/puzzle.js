// === Sliding Puzzle (15-Puzzle) ===
const PuzzleGame = {
  size: 4,
  tiles: [],
  emptyIdx: 15,
  moves: 0,
  container: null,
  statsCb: null,
  gridEl: null,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.moves = 0;
    this.tiles = Array.from({ length: this.size * this.size - 1 }, (_, i) => i + 1);
    this.tiles.push(0); // 0 = empty
    this.emptyIdx = this.tiles.indexOf(0);

    // Shuffle by making random valid moves
    for (let i = 0; i < 200; i++) {
      const neighbors = this.getNeighbors(this.emptyIdx);
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      this.swap(this.emptyIdx, pick);
      this.emptyIdx = pick;
    }

    this.render();
    this.updateStats();
  },

  getNeighbors(idx) {
    const r = Math.floor(idx / this.size);
    const c = idx % this.size;
    const result = [];
    if (r > 0) result.push(idx - this.size);
    if (r < this.size - 1) result.push(idx + this.size);
    if (c > 0) result.push(idx - 1);
    if (c < this.size - 1) result.push(idx + 1);
    return result;
  },

  swap(a, b) {
    [this.tiles[a], this.tiles[b]] = [this.tiles[b], this.tiles[a]];
  },

  render() {
    this.container.innerHTML = '<div class="puzzle-grid"></div>';
    this.gridEl = this.container.querySelector('.puzzle-grid');

    this.tiles.forEach((val, i) => {
      const tile = document.createElement('div');
      tile.className = 'puzzle-tile' + (val === 0 ? ' empty' : '');
      tile.textContent = val || '';
      tile.addEventListener('click', () => this.move(i));
      this.gridEl.appendChild(tile);
    });
  },

  move(idx) {
    if (this.tiles[idx] === 0) return;
    const neighbors = this.getNeighbors(this.emptyIdx);
    if (!neighbors.includes(idx)) return;

    this.swap(idx, this.emptyIdx);
    this.emptyIdx = idx;
    this.moves++;
    this.updateStats();
    this.refreshDOM();

    if (this.checkWin()) {
      this.showWin();
    }
  },

  refreshDOM() {
    const tileEls = this.gridEl.querySelectorAll('.puzzle-tile');
    this.tiles.forEach((val, i) => {
      tileEls[i].textContent = val || '';
      tileEls[i].className = 'puzzle-tile' + (val === 0 ? ' empty' : '');
    });
  },

  checkWin() {
    for (let i = 0; i < this.tiles.length - 1; i++) {
      if (this.tiles[i] !== i + 1) return false;
    }
    return true;
  },

  updateStats() {
    if (this.statsCb) {
      this.statsCb({ '步数': this.moves });
    }
  },

  showWin() {
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `
      <h3>🎉 拼图完成！</h3>
      <p>用了 ${this.moves} 步</p>
      <button class="btn" id="replayBtn">再来一局</button>
    `;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => {
      this.init(this.container, this.statsCb);
    });
  },

  destroy() {}
};
