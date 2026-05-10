// === Minesweeper Game ===
const MinesweeperGame = {
  rows: 9,
  cols: 9,
  mines: 10,
  grid: [],
  revealed: [],
  flagged: [],
  container: null,
  statsCb: null,
  gameOver: false,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.gameOver = false;
    this.revealed = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.flagged = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));

    // Place mines
    let placed = 0;
    while (placed < this.mines) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      if (this.grid[r][c] !== 'M') {
        this.grid[r][c] = 'M';
        placed++;
      }
    }

    // Calculate numbers
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (this.grid[r][c] !== 'M') {
          this.grid[r][c] = this.countMines(r, c);
        }

    this.render();
    this.updateStats();
  },

  countMines(r, c) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc] === 'M')
          count++;
      }
    return count;
  },

  render() {
    this.container.innerHTML = '';
    const gridEl = document.createElement('div');
    gridEl.className = 'mine-grid';
    gridEl.style.gridTemplateColumns = `repeat(${this.cols}, 32px)`;
    gridEl.style.gridTemplateRows = `repeat(${this.rows}, 32px)`;

    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.addEventListener('click', (e) => this.reveal(r, c, cell));
        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.toggleFlag(r, c, cell);
        });
        gridEl.appendChild(cell);
      }

    this.container.appendChild(gridEl);
  },

  reveal(r, c, cell) {
    if (this.gameOver) return;
    if (this.revealed[r][c] || this.flagged[r][c]) return;

    this.revealed[r][c] = true;

    if (this.grid[r][c] === 'M') {
      cell.classList.add('mine');
      cell.textContent = '💣';
      this.showResult(false);
      return;
    }

    cell.classList.add('revealed');
    const v = this.grid[r][c];
    if (v > 0) {
      cell.textContent = v;
      cell.style.color = ['','#54a0ff','#00d2a0','#ff6b6b','#a29bfe','#ffa726','#ffd93d','#e0e0f0','#8888aa'][v];
    } else {
      // Flood fill
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && !this.revealed[nr][nc]) {
            const idx = nr * this.cols + nc;
            const ncell = this.container.querySelectorAll('.mine-cell')[idx];
            this.reveal(nr, nc, ncell);
          }
        }
    }

    if (this.checkWin()) {
      this.showResult(true);
    }
  },

  toggleFlag(r, c, cell) {
    if (this.gameOver || this.revealed[r][c]) return;
    this.flagged[r][c] = !this.flagged[r][c];
    if (this.flagged[r][c]) {
      cell.classList.add('flagged');
      cell.textContent = '🚩';
    } else {
      cell.classList.remove('flagged');
      cell.textContent = '';
    }
    this.updateStats();
  },

  checkWin() {
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (this.grid[r][c] !== 'M' && !this.revealed[r][c]) return false;
    return true;
  },

  updateStats() {
    if (this.statsCb) {
      const flagged = this.flagged.flat().filter(Boolean).length;
      this.statsCb({ '地雷': this.mines, '标记': flagged });
    }
  },

  showResult(won) {
    this.gameOver = true;
    // Reveal all
    const cells = this.container.querySelectorAll('.mine-cell');
    cells.forEach(cell => {
      const r = +cell.dataset.r, c = +cell.dataset.c;
      if (this.grid[r][c] === 'M') {
        cell.classList.add('mine');
        cell.textContent = '💣';
      }
    });

    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `
      <h3>${won ? '🎉 你赢了！' : '💥 踩雷了！'}</h3>
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
