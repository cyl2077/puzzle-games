// === App Shell ===
const app = {
  currentGame: null,
  games: [
    {
      id: 'memory',
      name: '记忆翻牌',
      icon: '🧠',
      desc: '翻开卡片找到相同的配对，考验你的记忆力！',
      tags: ['记忆', '配对'],
      module: MemoryGame
    },
    {
      id: 'snake',
      name: '贪吃蛇',
      icon: '🐍',
      desc: '经典贪吃蛇游戏，吃掉食物越长越大！',
      tags: ['经典', '街机'],
      module: SnakeGame
    },
    {
      id: '2048',
      name: '2048',
      icon: '🔢',
      desc: '滑动合并数字方块，挑战达到 2048！',
      tags: ['数字', '策略'],
      module: Game2048
    },
    {
      id: 'minesweeper',
      name: '扫雷',
      icon: '💣',
      desc: '经典扫雷游戏，避开地雷找出所有安全格！',
      tags: ['经典', '推理'],
      module: MinesweeperGame
    },
    {
      id: 'puzzle',
      name: '滑块拼图',
      icon: '🧩',
      desc: '移动滑块还原图片顺序，经典的 15 拼图！',
      tags: ['逻辑', '排序'],
      module: PuzzleGame
    },
    {
      id: 'tetris',
      name: '俄罗斯方块',
      icon: '🧱',
      desc: '经典俄罗斯方块，消除整行得分升级！',
      tags: ['经典', '街机'],
      module: TetrisGame
    },
    {
      id: 'tictactoe',
      name: '井字棋',
      icon: '⭕',
      desc: '经典三子棋，与 AI 对战看谁先连成一线！',
      tags: ['策略', '对战'],
      module: TicTacToeGame
    },
    {
      id: 'numberguess',
      name: '数字猜谜',
      icon: '🎯',
      desc: '猜出 1~100 之间的神秘数字，范围会逐渐缩小！',
      tags: ['逻辑', '推理'],
      module: NumberGuessGame
    },
    {
      id: 'breakout',
      name: '打砖块',
      icon: '🏓',
      desc: '经典打砖块，移动挡板反弹小球消除所有砖块！',
      tags: ['经典', '街机'],
      module: BreakoutGame
    },
    {
      id: 'reaction',
      name: '反应测试',
      icon: '⚡',
      desc: '测试你的反应速度！看到绿色立即点击！',
      tags: ['反应', '挑战'],
      module: ReactionGame
    },
    {
      id: 'sudoku',
      name: '数独',
      icon: '🔢',
      desc: '经典九宫格数字推理，填满所有空格！',
      tags: ['数字', '推理'],
      module: SudokuGame
    },
    {
      id: 'flappy',
      name: '小鸟飞飞',
      icon: '🐤',
      desc: '点击让小鸟飞起，穿过管道，越远越好！',
      tags: ['休闲', '街机'],
      module: FlappyGame
    },
    {
      id: 'fruitcatch',
      name: '接水果',
      icon: '🍎',
      desc: '滑动篮子接住水果，小心避开炸弹！',
      tags: ['休闲', '反应'],
      module: FruitCatchGame
    },
    {
      id: 'colormatch',
      name: '颜色匹配',
      icon: '🎨',
      desc: '快速判断文字颜色是否与名称一致，30秒挑战！',
      tags: ['反应', '脑力'],
      module: ColorMatchGame
    },
    {
      id: 'delta',
      name: '三角洲配装',
      icon: '🎖️',
      desc: '三角洲行动随机配装器！地图、干员、枪械全随机，准备出击！',
      tags: ['随机', '配装'],
      module: DeltaGame
    }
  ],

  init() {
    this.renderGameGrid();
    this.bindEvents();
  },

  renderGameGrid() {
    const grid = document.getElementById('gameGrid');
    grid.innerHTML = this.games.map(g => `
      <div class="game-card" data-game="${g.id}">
        <div class="game-icon">${g.icon}</div>
        <div class="game-name">${g.name}</div>
        <div class="game-desc">${g.desc}</div>
        <div class="game-tags">${g.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
    `).join('');
  },

  bindEvents() {
    document.getElementById('gameGrid').addEventListener('click', (e) => {
      const card = e.target.closest('.game-card');
      if (card) {
        const gameId = card.dataset.game;
        this.openGame(gameId);
      }
    });

    document.getElementById('backBtn').addEventListener('click', () => {
      this.closeGame();
    });
  },

  openGame(gameId) {
    const gameDef = this.games.find(g => g.id === gameId);
    if (!gameDef) return;

    this.currentGame = gameDef;

    document.getElementById('homePage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'block';
    document.getElementById('backBtn').style.display = 'block';
    document.getElementById('gameTitle').textContent = gameDef.name;

    const controls = document.getElementById('gameControls');
    controls.innerHTML = `
      <div class="game-stats" id="gameStats"></div>
      <button class="btn small" id="gameRestart">重新开始</button>
    `;
    document.getElementById('gameRestart').addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('gameArea').innerHTML = '';
    this.startGame();
  },

  closeGame() {
    if (this.currentGame && this.currentGame.module && this.currentGame.module.destroy) {
      this.currentGame.module.destroy();
    }
    this.currentGame = null;
    document.getElementById('homePage').style.display = 'block';
    document.getElementById('gamePage').style.display = 'none';
    document.getElementById('backBtn').style.display = 'none';
    document.getElementById('gameArea').innerHTML = '';
  },

  startGame() {
    if (!this.currentGame) return;
    const area = document.getElementById('gameArea');
    area.innerHTML = '';
    this.currentGame.module.init(area, this.updateStats.bind(this));
  },

  updateStats(stats) {
    const el = document.getElementById('gameStats');
    if (el) {
      el.innerHTML = Object.entries(stats).map(([k, v]) =>
        `<div class="stat">${k}: <span>${v}</span></div>`
      ).join('');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
