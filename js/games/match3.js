// === Match 3 (宝石消消乐) ===
const Match3Game = {
  grid: [], size: 8,
  gems: ['🔴','🔵','🟢','🟡','🟣','🟠'],
  gemColors: { '🔴':'#ff6b6b', '🔵':'#54a0ff', '🟢':'#00d2a0', '🟡':'#ffd93d', '🟣':'#a29bfe', '🟠':'#ffa726' },
  selected: null,
  score: 0, moves: 20,
  container: null, statsCb: null,
  running: false,
  swapping: false,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.score = 0;
    this.moves = 20;
    this.selected = null;
    this.running = true;
    this.swapping = false;
    this.initGrid();
    this.render();
    this.updateStats();
  },

  initGrid() {
    this.grid = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () =>
        this.gems[Math.floor(Math.random() * this.gems.length)]
      )
    );
    // Remove initial matches
    let matches = this.findAllMatches();
    while (matches.length > 0) {
      for (const { r, c } of matches) {
        this.grid[r][c] = this.gems[Math.floor(Math.random() * this.gems.length)];
      }
      matches = this.findAllMatches();
    }
  },

  render() {
    let gridHTML = '';
    for (let r = 0; r < this.size; r++) {
      gridHTML += '<div class="match3-row" style="display:flex">';
      for (let c = 0; c < this.size; c++) {
        gridHTML += `<div class="match3-cell" id="m3_${r}_${c}" data-r="${r}" data-c="${c}" style="
          flex:1;aspect-ratio:1;display:flex;align-items:center;justify-content:center;
          font-size:28px;cursor:pointer;border-radius:6px;
          transition:transform 0.15s,opacity 0.3s;
          ">${this.grid[r][c]}</div>`;
      }
      gridHTML += '</div>';
    }

    this.container.innerHTML = `
      <div style="text-align:center;touch-action:manipulation">
        <div style="color:var(--text2);font-size:13px;margin-bottom:8px">交换相邻宝石，3个以上消除得分</div>
        <div class="match3-board" style="background:var(--surface2);padding:8px;border-radius:12px;max-width:360px;margin:0 auto">
          ${gridHTML}
        </div>
        <div id="match3Msg" style="margin-top:10px;min-height:20px;font-size:14px;font-weight:600;color:var(--accent2)"></div>
      </div>`;

    this.container.querySelectorAll('.match3-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        if (!this.running || this.swapping) return;
        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);
        this.selectCell(r, c);
      });

      // Touch drag support
      cell.addEventListener('touchstart', (e) => {
        if (!this.running || this.swapping) return;
        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);
        this._touchStart = { r, c, x: e.touches[0].clientX, y: e.touches[0].clientY };
      });
      cell.addEventListener('touchend', (e) => {
        if (!this.running || this.swapping || !this._touchStart) return;
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const dx = endX - this._touchStart.x;
        const dy = endY - this._touchStart.y;
        const { r, c } = this._touchStart;
        let tr = r, tc = c;
        if (Math.abs(dx) > Math.abs(dy)) {
          tc = dx > 0 ? c + 1 : c - 1;
        } else {
          tr = dy > 0 ? r + 1 : r - 1;
        }
        this.selectCell(r, c);
        if (tr >= 0 && tr < this.size && tc >= 0 && tc < this.size) {
          this.selectCell(tr, tc);
        }
        this._touchStart = null;
      });
    });
  },

  selectCell(r, c) {
    // Clear previous selection
    this.container.querySelectorAll('.match3-cell').forEach(c =>
      c.style.outline = 'none');

    if (!this.selected) {
      this.selected = { r, c };
      const cell = document.getElementById(`m3_${r}_${c}`);
      if (cell) cell.style.outline = '2px solid var(--accent)';
      return;
    }

    const prev = this.selected;
    this.selected = null;

    // Check if adjacent
    const dr = Math.abs(r - prev.r);
    const dc = Math.abs(c - prev.c);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      this.swapAndCheck(prev.r, prev.c, r, c);
    } else {
      this.selected = { r, c };
      const cell = document.getElementById(`m3_${r}_${c}`);
      if (cell) cell.style.outline = '2px solid var(--accent)';
    }
  },

  async swapAndCheck(r1, c1, r2, c2) {
    this.swapping = true;
    this.swap(r1, c1, r2, c2);
    await this.animateSwap(r1, c1, r2, c2);

    const matches = this.findAllMatches();
    if (matches.length === 0) {
      // Swap back
      this.swap(r1, c1, r2, c2);
      await this.animateSwap(r1, c1, r2, c2);
      document.getElementById('match3Msg').textContent = '无法消除！';
      setTimeout(() => { document.getElementById('match3Msg').textContent = ''; }, 1000);
      this.swapping = false;
      return;
    }

    document.getElementById('match3Msg').textContent = '';
    this.moves--;

    // Chain reactions
    while (matches.length > 0) {
      for (const { r, c } of matches) {
        this.score += 10;
        const cell = document.getElementById(`m3_${r}_${c}`);
        if (cell) { cell.style.opacity = '0'; cell.style.transform = 'scale(0.5)'; }
      }
      await this.sleep(250);

      // Remove and drop
      const removed = new Set(matches.map(m => `${m.r},${m.c}`));
      for (let c = 0; c < this.size; c++) {
        let writeRow = this.size - 1;
        for (let r = this.size - 1; r >= 0; r--) {
          if (!removed.has(`${r},${c}`)) {
            this.grid[writeRow][c] = this.grid[r][c];
            writeRow--;
          }
        }
        for (let r = writeRow; r >= 0; r--) {
          this.grid[r][c] = this.gems[Math.floor(Math.random() * this.gems.length)];
        }
      }
      this.refreshDisplay();
      await this.sleep(200);

      const newMatches = this.findAllMatches();
      // Only continue if we found new matches
      if (newMatches.length === matches.length) break; // prevent infinite loop
      matches.length = 0;
      for (const m of newMatches) matches.push(m);
    }

    this.refreshDisplay();
    this.updateStats();
    this.swapping = false;

    if (this.moves <= 0) this.gameOver();
  },

  swap(r1, c1, r2, c2) {
    const tmp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = tmp;
  },

  animateSwap(r1, c1, r2, c2) {
    const cell1 = document.getElementById(`m3_${r1}_${c1}`);
    const cell2 = document.getElementById(`m3_${r2}_${c2}`);
    if (cell1) {
      cell1.style.transform = `translate(${(c2-c1)*100}%, ${(r2-r1)*100}%)`;
      cell1.textContent = this.grid[r1][c1];
    }
    if (cell2) {
      cell2.style.transform = `translate(${(c1-c2)*100}%, ${(r1-r2)*100}%)`;
      cell2.textContent = this.grid[r2][c2];
    }
    return this.sleep(200);
  },

  refreshDisplay() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = document.getElementById(`m3_${r}_${c}`);
        if (cell) {
          cell.textContent = this.grid[r][c];
          cell.style.opacity = '1';
          cell.style.transform = 'scale(1)';
        }
      }
    }
  },

  findAllMatches() {
    const matched = new Set();
    // Horizontal
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size - 2; c++) {
        if (this.grid[r][c] === this.grid[r][c+1] && this.grid[r][c] === this.grid[r][c+2]) {
          let end = c + 2;
          while (end + 1 < this.size && this.grid[r][end + 1] === this.grid[r][c]) end++;
          for (let i = c; i <= end; i++) matched.add(`${r},${i}`);
        }
      }
    }
    // Vertical
    for (let c = 0; c < this.size; c++) {
      for (let r = 0; r < this.size - 2; r++) {
        if (this.grid[r][c] === this.grid[r+1][c] && this.grid[r][c] === this.grid[r+2][c]) {
          let end = r + 2;
          while (end + 1 < this.size && this.grid[end + 1][c] === this.grid[r][c]) end++;
          for (let i = r; i <= end; i++) matched.add(`${i},${c}`);
        }
      }
    }
    return Array.from(matched).map(s => {
      const [r, c] = s.split(',').map(Number);
      return { r, c };
    });
  },

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },

  updateStats() {
    if (this.statsCb) this.statsCb({ '得分': this.score, '剩余步数': this.moves });
  },

  gameOver() {
    this.running = false;
    const div = document.createElement('div');
    div.className = 'game-over-overlay';
    div.innerHTML = `<h3>游戏结束</h3><p>得分: ${this.score}</p><button class="btn" id="replayBtn">再来一次</button>`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
    document.getElementById('replayBtn').addEventListener('click', () => {
      this.init(this.container, this.statsCb);
    });
  },

  destroy() { this.running = false; }
};
