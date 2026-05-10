// === Sudoku (数独) ===
const SudokuGame = {
  board: [],
  solution: [],
  given: [],
  selected: null,
  difficulty: 'easy',
  container: null,
  statsCb: null,
  errors: 0,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.selected = null;
    this.errors = 0;
    this.generate();
    this.render();
    this.updateStats();
  },

  generate() {
    const { puzzle, solution, given } = this.makePuzzle();
    this.board = puzzle.map(r => [...r]);
    this.given = given.map(r => [...r]);
    this.solution = solution;
  },

  makePuzzle() {
    // Generate solved board
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    const fill = (b) => {
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++) {
          if (b[r][c] === 0) {
            const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
            for (const n of nums) {
              if (this.isValid(b, r, c, n)) {
                b[r][c] = n;
                if (fill(b)) return true;
                b[r][c] = 0;
              }
            }
            return false;
          }
        }
      return true;
    };
    fill(board);

    const solution = board.map(r => [...r]);
    const puzzle = board.map(r => [...r]);
    const given = Array.from({ length: 9 }, () => Array(9).fill(true));

    // Remove cells based on difficulty
    const remove = { easy: 35, medium: 45, hard: 55 }[this.difficulty];
    let removed = 0;
    while (removed < remove) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (puzzle[r][c] !== 0) {
        puzzle[r][c] = 0;
        given[r][c] = false;
        removed++;
      }
    }
    return { puzzle, solution, given };
  },

  isValid(board, r, c, n) {
    for (let i = 0; i < 9; i++)
      if (board[r][i] === n || board[i][c] === n) return false;
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (board[br + i][bc + j] === n) return false;
    return true;
  },

  render() {
    this.container.innerHTML = `
      <div style="text-align:center">
        <div class="sudoku-board" style="display:grid;grid-template-columns:repeat(9,1fr);gap:0;border:3px solid var(--accent);border-radius:8px;overflow:hidden;width:100%;max-width:360px;margin:0 auto">
        </div>
        <div class="sudoku-pad" style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;max-width:300px;margin:16px auto 0">
          ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="btn small num-btn" data-n="${n}" style="font-size:18px;padding:10px">${n}</button>`).join('')}
          <button class="btn small" id="eraseBtn" style="font-size:14px;background:var(--surface2)">擦除</button>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:center">
          <button class="btn small" id="hintBtn" style="background:var(--surface2)">提示</button>
          <select id="diffSelect" style="background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:12px">
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>
      </div>`;

    const boardEl = this.container.querySelector('.sudoku-board');
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.dataset.r = r;
        cell.dataset.c = c;
        const v = this.board[r][c];
        const isGiven = v !== 0;
        cell.textContent = v || '';
        cell.style.cssText = `
          aspect-ratio:1;display:flex;align-items:center;justify-content:center;
          font-size:${isGiven?'17px':'15px'};font-weight:${isGiven?'700':'400'};
          background:${isGiven?'var(--surface2)':'var(--bg)'};
          border:0.5px solid var(--border);cursor:pointer;
          color:${isGiven?'var(--accent2)':'var(--text)'};
        `;
        cell.addEventListener('click', () => this.selectCell(r, c, cell));
        boardEl.appendChild(cell);
      }

    // Number pad
    this.container.querySelectorAll('.num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.selected) {
          this.fillNumber(parseInt(btn.dataset.n));
        }
      });
    });
    document.getElementById('eraseBtn').addEventListener('click', () => {
      if (this.selected) this.fillNumber(0);
    });
    document.getElementById('hintBtn').addEventListener('click', () => this.giveHint());
    document.getElementById('diffSelect').value = this.difficulty;
    document.getElementById('diffSelect').addEventListener('change', (e) => {
      this.difficulty = e.target.value;
      this.init(this.container, this.statsCb);
    });
  },

  selectCell(r, c, cell) {
    this.selected = { r, c, cell };
    this.container.querySelectorAll('.sudoku-board div').forEach(d => d.style.outline = 'none');
    cell.style.outline = '2px solid var(--accent)';
  },

  fillNumber(n) {
    const { r, c } = this.selected;
    if (this.given[r][c]) return;
    if (n === 0) {
      this.selected.cell.textContent = '';
      this.board[r][c] = 0;
    } else {
      this.selected.cell.textContent = n;
      this.board[r][c] = n;
      if (n !== this.solution[r][c]) {
        this.selected.cell.style.color = '#ff6b6b';
        this.errors++;
      } else {
        this.selected.cell.style.color = '#00d2a0';
        this.refreshAllCells();
      }
    }
    this.updateStats();
    this.checkComplete();
  },

  refreshAllCells() {
    const cells = this.container.querySelectorAll('.sudoku-board div');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.r), c = parseInt(cell.dataset.c);
      if (this.board[r][c] !== 0 && this.board[r][c] === this.solution[r][c]) {
        cell.style.color = '#00d2a0';
      }
    });
  },

  giveHint() {
    // Find an empty or wrong cell
    const empty = [];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (this.board[r][c] !== this.solution[r][c]) empty.push({ r, c });
    if (empty.length === 0) return;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    this.board[r][c] = this.solution[r][c];
    const cells = this.container.querySelectorAll('.sudoku-board div');
    cells[r * 9 + c].textContent = this.solution[r][c];
    cells[r * 9 + c].style.color = 'var(--accent2)';
    cells[r * 9 + c].style.fontWeight = '700';
    this.updateStats();
    this.checkComplete();
  },

  checkComplete() {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (this.board[r][c] !== this.solution[r][c]) return;
    this.showWin();
  },

  updateStats() {
    if (this.statsCb) {
      const filled = this.board.flat().filter(v => v !== 0).length;
      this.statsCb({ '已填': `${filled}/81`, '错误': this.errors });
    }
  },

  showWin() {
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `<h3>恭喜完成！</h3><p>错误次数: ${this.errors}</p><button class="btn" id="replayBtn">新游戏</button>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => {
      this.init(this.container, this.statsCb);
    });
  },

  destroy() {}
};
