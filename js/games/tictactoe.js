// === Tic-Tac-Toe (井字棋) ===
const TicTacToeGame = {
  board: [],
  player: 'X',
  ai: 'O',
  turn: 'X',
  wins: 0,
  losses: 0,
  draws: 0,
  container: null,
  statsCb: null,
  gridEl: null,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.board = Array(9).fill('');
    this.turn = 'X';
    this.render();
    this.updateStats();
  },

  render() {
    this.container.innerHTML = `
      <div class="tictactoe-grid"></div>
      <div class="instructions" style="margin-top:16px">你执 X，AI 执 O</div>
    `;
    this.gridEl = this.container.querySelector('.tictactoe-grid');
    this.gridEl.style.cssText = 'display:grid;grid-template-columns:repeat(3,80px);grid-template-rows:repeat(3,80px);gap:4px;';

    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'ttt-cell';
      cell.style.cssText = 'background:var(--surface2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;cursor:pointer;transition:background 0.15s;';
      cell.dataset.idx = i;
      cell.textContent = this.board[i];
      cell.addEventListener('click', () => this.playerMove(i, cell));
      this.gridEl.appendChild(cell);
    }
  },

  playerMove(idx, cell) {
    if (this.board[idx] !== '' || this.turn !== 'X') return;
    this.board[idx] = 'X';
    cell.textContent = 'X';
    cell.style.color = '#54a0ff';

    if (this.checkWin('X')) {
      this.wins++;
      this.updateStats();
      this.endGame('你赢了！');
      return;
    }
    if (this.board.every(c => c !== '')) {
      this.draws++;
      this.updateStats();
      this.endGame('平局！');
      return;
    }

    this.turn = 'O';
    setTimeout(() => this.aiMove(), 300);
  },

  aiMove() {
    const move = this.getBestMove();
    this.board[move] = 'O';
    const cell = this.gridEl.querySelectorAll('.ttt-cell')[move];
    cell.textContent = 'O';
    cell.style.color = '#ff6b6b';

    if (this.checkWin('O')) {
      this.losses++;
      this.updateStats();
      this.endGame('AI 赢了！');
      return;
    }
    if (this.board.every(c => c !== '')) {
      this.draws++;
      this.updateStats();
      this.endGame('平局！');
      return;
    }
    this.turn = 'X';
  },

  getBestMove() {
    // Minimax
    let best = -Infinity;
    let move = 0;
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === '') {
        this.board[i] = 'O';
        const score = this.minimax(0, false);
        this.board[i] = '';
        if (score > best) { best = score; move = i; }
      }
    }
    return move;
  },

  minimax(depth, isMax) {
    if (this.checkWin('O')) return 10 - depth;
    if (this.checkWin('X')) return depth - 10;
    if (this.board.every(c => c !== '')) return 0;

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (this.board[i] === '') {
          this.board[i] = 'O';
          best = Math.max(best, this.minimax(depth + 1, false));
          this.board[i] = '';
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (this.board[i] === '') {
          this.board[i] = 'X';
          best = Math.min(best, this.minimax(depth + 1, true));
          this.board[i] = '';
        }
      }
      return best;
    }
  },

  checkWin(p) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(w => w.every(i => this.board[i] === p));
  },

  updateStats() {
    if (this.statsCb) {
      this.statsCb({ '胜': this.wins, '负': this.losses, '平': this.draws });
    }
  },

  endGame(msg) {
    this.gridEl.querySelectorAll('.ttt-cell').forEach(c => c.style.cursor = 'default');
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `<h3>${msg}</h3><button class="btn" id="replayBtn">再来一局</button>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => {
      this.init(this.container, this.statsCb);
    });
  },

  destroy() {}
};
