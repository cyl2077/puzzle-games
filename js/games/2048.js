/**
 * 2048 Game
 * @author ch2077
 * @version 1.5.3
 * @date 2025-03-08 修复滑动失效问题
 * @date 2025-05-02 增加鼠标拖拽支持(桌面端也能拖了)
 *
 * 经典2048数字合并，4x4网格
 * 滑动算法：每行/列独立slide，先滤0再合并相邻相等，末尾补0
 * 移动端用touch start/end坐标差判断方向，阈值20px避免误触
 * desktop端加了mousedown/mouseup拖拽，阈值15px
 */
const Game2048 = {
  grid: [],       // 4x4数字矩阵
  score: 0,       // 当前得分（合并时累加）
  container: null,
  statsCb: null,
  boardEl: null,
  touchStart: null,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.touchStart = null;
    this.grid = Array.from({ length: 4 }, () => Array(4).fill(0));
    this.render();
    this.spawn();
    this.spawn();
    this.updateBoard();
    this.updateStats();
    document.addEventListener('keydown', this._handleKey);
    this.boardEl.addEventListener('touchstart', this._touchStart, {passive:false});
    this.boardEl.addEventListener('touchend', this._touchEnd, {passive:false});
    this.boardEl.addEventListener('mousedown', this._mouseDown);
    this.boardEl.addEventListener('mouseup', this._mouseUp);
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
    if (this.statsCb) this.statsCb({ '得分': this.score });
  },

  doMove(dir) {
    let moved = false;
    const old = this.grid.map(r => [...r]);
    if (dir === 'up') moved = this.moveUp();
    else if (dir === 'down') moved = this.moveDown();
    else if (dir === 'left') moved = this.moveLeft();
    else if (dir === 'right') moved = this.moveRight();
    else return;
    if (moved) {
      this.spawn();
      this.updateBoard();
      this.updateStats();
      if (this.checkWin()) {
        this.showResult('🎉 你赢了！达到 2048！');
      } else if (this.checkLose()) {
        this.showResult('游戏结束！没有可移动的了');
      }
    }
  },

  _handleKey(e) {
    const map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
    if (map[e.key]) { e.preventDefault(); Game2048.doMove(map[e.key]); }
  },

  _touchStart(e) { e.preventDefault(); Game2048.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; },
  _touchEnd(e) {
    e.preventDefault();
    if (!Game2048.touchStart) return;
    const dx = e.changedTouches[0].clientX - Game2048.touchStart.x;
    const dy = e.changedTouches[0].clientY - Game2048.touchStart.y;
    Game2048.touchStart = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      Game2048.doMove(dx > 0 ? 'right' : 'left');
    } else {
      Game2048.doMove(dy > 0 ? 'down' : 'up');
    }
  },

  _mouseDown(e) { Game2048.touchStart = { x: e.clientX, y: e.clientY }; },
  _mouseUp(e) {
    if (!Game2048.touchStart) return;
    const dx = e.clientX - Game2048.touchStart.x;
    const dy = e.clientY - Game2048.touchStart.y;
    Game2048.touchStart = null;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      Game2048.doMove(dx > 0 ? 'right' : 'left');
    } else {
      Game2048.doMove(dy > 0 ? 'down' : 'up');
    }
  },

  slide(arr) {
    let filtered = arr.filter(v => v !== 0);
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        this.score += filtered[i];
        filtered.splice(i + 1, 1);
      }
    }
    while (filtered.length < 4) filtered.push(0);
    return filtered;
  },

  moveLeft() { let moved=false; for(let r=0;r<4;r++){const old=[...this.grid[r]];this.grid[r]=this.slide(old);if(old.join()!==this.grid[r].join())moved=true;} return moved; },
  moveRight() { let moved=false; for(let r=0;r<4;r++){const old=[...this.grid[r]];const rev=this.slide([...old].reverse()).reverse();this.grid[r]=rev;if(old.join()!==rev.join())moved=true;} return moved; },
  moveUp() { let moved=false; for(let c=0;c<4;c++){const old=[this.grid[0][c],this.grid[1][c],this.grid[2][c],this.grid[3][c]];const slided=this.slide(old);for(let r=0;r<4;r++){if(this.grid[r][c]!==slided[r])moved=true;this.grid[r][c]=slided[r];}} return moved; },
  moveDown() { let moved=false; for(let c=0;c<4;c++){const old=[this.grid[0][c],this.grid[1][c],this.grid[2][c],this.grid[3][c]];const slided=this.slide([...old].reverse()).reverse();for(let r=0;r<4;r++){if(this.grid[r][c]!==slided[r])moved=true;this.grid[r][c]=slided[r];}} return moved; },

  checkWin() { return this.grid.some(r => r.some(c => c === 2048)); },
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
    document.removeEventListener('keydown', this._handleKey);
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `<h3>${msg}</h3><p>最终得分: ${this.score}</p><button class="btn" id="replayBtn">再来一局</button>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => { this.destroy(); this.init(this.container, this.statsCb); });
  },

  destroy() {
    document.removeEventListener('keydown', this._handleKey);
  }
};
