// === 2048 Game ===
const Game2048 = {
  grid: [],
  score: 0,
  container: null,
  statsCb: null,
  boardEl: null,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.grid = Array.from({ length: 4 }, () => Array(4).fill(0));
    this.render();
    this.spawn();
    this.spawn();
    this.updateBoard();
    this.updateStats();
    document.addEventListener('keydown', this.handleKey);
  },

  render() {
    this.container.innerHTML = '<div class="game-2048"><div class="board-2048"></div></div>';
    this.boardEl = this.container.querySelector('.board-2048');
    for (let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell-2048';
      this.boardEl.appendChild(cell);
    }
  },

  spawn() {
    const empty = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (this.grid[r][c] === 0) empty.push({ r, c });
    if (empty.length === 0) return;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  },

  updateBoard() {
    const cells = this.boardEl.querySelectorAll('.cell-2048');
    cells.forEach((cell, i) => {
      const r = Math.floor(i / 4);
      const c = i % 4;
      const v = this.grid[r][c];
      cell.textContent = v || '';
      cell.className = 'cell-2048' + (v ? ` tile-${v}` : '');
    });
  },

  updateStats() {
    if (this.statsCb) {
      this.statsCb({ '得分': this.score });
    }
  },

  handleKey(e) {
    const key = e.key;
    let moved = false;
    const old = Game2048.grid.map(r => [...r]);

    if (key === 'ArrowUp') moved = Game2048.moveUp();
    else if (key === 'ArrowDown') moved = Game2048.moveDown();
    else if (key === 'ArrowLeft') moved = Game2048.moveLeft();
    else if (key === 'ArrowRight') moved = Game2048.moveRight();
    else return;

    if (moved) {
      Game2048.spawn();
      Game2048.updateBoard();
      Game2048.updateStats();
      if (Game2048.checkWin()) {
        Game2048.showResult('🎉 你赢了！达到 2048！');
      } else if (Game2048.checkLose()) {
        Game2048.showResult('游戏结束！没有可移动的了');
      }
    }
  },

  slide(arr) {
    let filtered = arr.filter(v => v !== 0);
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        Game2048.score += filtered[i];
        filtered.splice(i + 1, 1);
      }
    }
    while (filtered.length < 4) filtered.push(0);
    return filtered;
  },

  moveLeft() {
    let moved = false;
    for (let r = 0; r < 4; r++) {
      const oldRow = [...this.grid[r]];
      this.grid[r] = this.slide(oldRow);
      if (oldRow.join(',') !== this.grid[r].join(',')) moved = true;
    }
    return moved;
  },

  moveRight() {
    let moved = false;
    for (let r = 0; r < 4; r++) {
      const oldRow = [...this.grid[r]];
      const rev = this.slide([...oldRow].reverse()).reverse();
      this.grid[r] = rev;
      if (oldRow.join(',') !== rev.join(',')) moved = true;
    }
    return moved;
  },

  moveUp() {
    let moved = false;
    for (let c = 0; c < 4; c++) {
      const oldCol = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]];
      const slided = this.slide(oldCol);
      for (let r = 0; r < 4; r++) {
        if (this.grid[r][c] !== slided[r]) moved = true;
        this.grid[r][c] = slided[r];
      }
    }
    return moved;
  },

  moveDown() {
    let moved = false;
    for (let c = 0; c < 4; c++) {
      const oldCol = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]];
      const slided = this.slide([...oldCol].reverse()).reverse();
      for (let r = 0; r < 4; r++) {
        if (this.grid[r][c] !== slided[r]) moved = true;
        this.grid[r][c] = slided[r];
      }
    }
    return moved;
  },

  checkWin() {
    return this.grid.some(r => r.some(c => c === 2048));
  },

  checkLose() {
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === 0) return false;
        if (c < 3 && this.grid[r][c] === this.grid[r][c + 1]) return false;
        if (r < 3 && this.grid[r][c] === this.grid[r + 1][c]) return false;
      }
    return true;
  },

  showResult(msg) {
    document.removeEventListener('keydown', this.handleKey);
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `
      <h3>${msg}</h3>
      <p>最终得分: ${this.score}</p>
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
    document.removeEventListener('keydown', this.handleKey);
  }
};
