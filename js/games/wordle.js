/**
 * Wordle (猜单词)
 * @author ch2077
 * @version 1.1.0
 * @date 2025-03-20 初版完成
 * @date 2025-04-05 扩展词库到50个词
 *
 * 6次机会猜5字母英文单词
 * 绿色=位置正确，黄色=字母存在但位置错，灰色=不在单词中
 * 键盘映射支持物理键盘+触屏虚拟键盘
 * 词库精选50个常见5字母词，后面可以继续加
 */
const WordleGame = {
  // 词库：选的都是常见词，剔除了生僻词和复数形式
  words: ['apple','brain','crane','dance','eagle','flame','grape','heart','image','joker',
    'knife','lemon','magic','noble','ocean','pearl','queen','raven','stone','tiger',
    'unity','vivid','whale','xenon','youth','zebra','bloom','cloud','dream','earth',
    'faith','ghost','honey','ivory','jazzy','kayak','light','mango','night','olive',
    'piano','quest','river','sugar','thumb','ultra','vapor','wheat','candy','frost'],
  target: '', guesses: [], currentGuess: '',
  maxGuesses: 6, wordLen: 5,
  won: false, lost: false,
  container: null, statsCb: null,

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.target = this.words[Math.floor(Math.random() * this.words.length)];
    this.guesses = [];
    this.currentGuess = '';
    this.won = false;
    this.lost = false;
    this.render();
    this.updateStats();
  },

  render() {
    let gridHTML = '';
    for (let r = 0; r < this.maxGuesses; r++) {
      gridHTML += '<div class="wordle-row" id="wrow_' + r + '">';
      for (let c = 0; c < this.wordLen; c++) {
        gridHTML += '<div class="wordle-cell" id="wcell_' + r + '_' + c + '"></div>';
      }
      gridHTML += '</div>';
    }

    this.container.innerHTML = `
      <div style="text-align:center">
        <div style="color:var(--text2);font-size:13px;margin-bottom:12px">猜出 5 字母单词，${this.maxGuesses} 次机会</div>
        <div class="wordle-grid">${gridHTML}</div>
        <div class="wordle-keyboard" id="wordleKeys" style="margin-top:16px;max-width:360px;margin-left:auto;margin-right:auto">
          ${this.buildKeyboard()}
        </div>
        <div id="wordleMsg" style="margin-top:12px;min-height:24px;font-weight:600"></div>
      </div>`;

    // Bind keyboard clicks
    this.container.querySelectorAll('.wordle-key').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (key === 'ENTER') this.submitGuess();
        else if (key === 'DEL') this.deleteChar();
        else if (!this.won && !this.lost) this.addChar(key);
      });
    });

    // Physical keyboard
    this._keyHandler = (e) => {
      if (this.won || this.lost) return;
      if (e.key === 'Enter') { e.preventDefault(); this.submitGuess(); }
      else if (e.key === 'Backspace') { e.preventDefault(); this.deleteChar(); }
      else if (/^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); this.addChar(e.key.toLowerCase()); }
    };
    document.addEventListener('keydown', this._keyHandler);
  },

  buildKeyboard() {
    const rows = [
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l'],
      ['ENTER','z','x','c','v','b','n','m','DEL']
    ];
    return rows.map(row => `<div style="display:flex;gap:4px;justify-content:center;margin-bottom:4px">` +
      row.map(k => {
        const label = k === 'DEL' ? '⌫' : k === 'ENTER' ? '⏎' : k.toUpperCase();
        const wide = (k === 'ENTER' || k === 'DEL') ? ' style="flex:1.5"' : ' style="flex:1"';
        return `<button class="wordle-key btn small" data-key="${k}"${wide}>${label}</button>`;
      }).join('') + '</div>').join('');
  },

  addChar(ch) {
    if (this.currentGuess.length < this.wordLen) {
      this.currentGuess += ch;
      this.updateGrid();
    }
  },

  deleteChar() {
    this.currentGuess = this.currentGuess.slice(0, -1);
    this.updateGrid();
  },

  submitGuess() {
    if (this.currentGuess.length !== this.wordLen) return;
    if (!this.words.includes(this.currentGuess)) {
      document.getElementById('wordleMsg').innerHTML = '<span style="color:#ff6b6b">单词不在词库中</span>';
      return;
    }
    this.guesses.push(this.currentGuess);
    const rowIdx = this.guesses.length - 1;
    this.revealRow(rowIdx);

    if (this.currentGuess === this.target) {
      this.won = true;
      document.getElementById('wordleMsg').innerHTML = '<span style="color:#00d2a0">🎉 恭喜猜对！</span>';
      document.removeEventListener('keydown', this._keyHandler);
    } else if (this.guesses.length >= this.maxGuesses) {
      this.lost = true;
      document.getElementById('wordleMsg').innerHTML = `<span style="color:#ff6b6b">答案是: ${this.target.toUpperCase()}</span>`;
      document.removeEventListener('keydown', this._keyHandler);
    }
    this.currentGuess = '';
    this.updateStats();
  },

  revealRow(rowIdx) {
    const guess = this.guesses[rowIdx];
    const targetArr = this.target.split('');
    const result = Array(this.wordLen).fill('absent');

    // First pass: correct positions
    for (let i = 0; i < this.wordLen; i++) {
      if (guess[i] === targetArr[i]) {
        result[i] = 'correct';
        targetArr[i] = null;
      }
    }
    // Second pass: present
    for (let i = 0; i < this.wordLen; i++) {
      if (result[i] === 'correct') continue;
      const idx = targetArr.indexOf(guess[i]);
      if (idx !== -1) {
        result[i] = 'present';
        targetArr[idx] = null;
      }
    }

    const colors = { correct: '#00d2a0', present: '#ffa726', absent: '#444466' };
    for (let i = 0; i < this.wordLen; i++) {
      const cell = document.getElementById(`wcell_${rowIdx}_${i}`);
      setTimeout(() => {
        cell.textContent = guess[i].toUpperCase();
        cell.style.background = colors[result[i]];
        cell.style.color = '#fff';
        cell.style.transform = 'rotateX(360deg)';
      }, i * 150);

      // Color the keyboard
      const keyBtn = this.container.querySelector(`.wordle-key[data-key="${guess[i]}"]`);
      if (keyBtn) {
        const current = keyBtn.style.background;
        if (result[i] === 'correct' || current === '') {
          keyBtn.style.background = colors[result[i]];
        } else if (result[i] === 'present' && current !== colors.correct) {
          keyBtn.style.background = colors.present;
        } else if (result[i] === 'absent' && current === '') {
          keyBtn.style.background = colors.absent;
        }
      }
    }
  },

  updateGrid() {
    const rowIdx = this.guesses.length;
    for (let i = 0; i < this.wordLen; i++) {
      const cell = document.getElementById(`wcell_${rowIdx}_${i}`);
      if (cell) cell.textContent = this.currentGuess[i] ? this.currentGuess[i].toUpperCase() : '';
    }
  },

  updateStats() {
    if (this.statsCb) this.statsCb({ '已猜': `${this.guesses.length}/${this.maxGuesses}`, '状态': this.won ? '✅' : this.lost ? '❌' : '🧠' });
  },

  destroy() {
    document.removeEventListener('keydown', this._keyHandler);
  }
};
