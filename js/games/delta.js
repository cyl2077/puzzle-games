// === 三角洲行动随机配装 (Delta Force Randomizer) ===
const DeltaGame = {
  slots: {
    map:   { name:'地图', icon:'🗺️', items:[
      '零号大坝 · 机密','零号大坝 · 永夜','长弓溪谷 · 机密','航天基地 · 机密',
      '航天基地 · 绝密','巴克什 · 机密','巴克什 · 绝密','潮汐监狱 · 绝密',
      '瓦尔基里 · 绝密','攀升 · 攻防','烬区 · 攻防','贯穿 · 步战',
      '堑壕战 · 攻防','断轨 · 攻防','风暴眼 · 攻防','断层 · 攻防'
    ]},
    oper:  { name:'干员', icon:'🎖️', items:[
      '红狼·凯','威龙·王宇昊','无名·蒙贝尔','疾风·拜尔斯','赛伊德',
      '露娜·金','骇爪·麦晓雯','银翼·哈里森','回响·埃弗利',
      '蜂医·罗伊','蛊·佐娅','蝶·范德梅尔',
      '牧羊人·缪萨','乌鲁鲁·费莱尔','深蓝·彼得罗夫'
    ]},
    gun:   { name:'枪械', icon:'🔫', items:[
      'M4A1 突击步枪','K416 突击步枪','AKM 突击步枪','SCAR-H 战斗步枪',
      'AS Val 突击步枪','QBZ95-1 突击步枪','AK-12 突击步枪','AUG 突击步枪',
      'Vector 冲锋枪','P90 冲锋枪','MP5 冲锋枪','MP7 冲锋枪','SR-3M 冲锋枪',
      'AWM 狙击步枪','M700 狙击步枪','R93 狙击步枪','M82 反器材狙击',
      'M249 轻机枪','PKM 轻机枪','S12K 霰弹枪','SR-25 射手步枪'
    ]},
    bp:    { name:'背包', icon:'🎒', items:[
      '轻型背包','中型背包','大型背包','战术背包','突击背包','野战背包','行军背包'
    ]},
    chest: { name:'胸挂', icon:'🦺', items:[
      '轻型胸挂','中型胸挂','重型胸挂','战术胸挂','快速胸挂','通用胸挂','特种胸挂'
    ]},
    armor: { name:'护甲', icon:'🛡️', items:[
      '轻型防弹衣 Lv.1','通用战术背心 Lv.2','HT战术背心 Lv.2',
      '制式防弹背心 Lv.3','TG-H防弹衣 Lv.3','射手战术背心 Lv.3',
      '武士防弹背心 Lv.4','DT-AVS防弹衣 Lv.4','MK-2战术背心 Lv.4',
      '精英防弹背心 Lv.5','重型防弹背心 Lv.5','Hvk-2防弹衣 Lv.5',
      'HA-2重型防弹衣 Lv.6','特里克MAS2.0 Lv.6','金刚防弹衣 Lv.6','泰坦防弹装甲 Lv.6'
    ]},
    helmet:{ name:'头盔', icon:'⛑️', items:[
      '户外棒球帽 Lv.1','老式钢盔 Lv.1',
      '复古摩托头盔 Lv.2','MC防弹头盔 Lv.2','DRO战术头盔 Lv.2',
      '防暴头盔 Lv.3','DAS防弹头盔 Lv.3','MC201战术头盔 Lv.3',
      'D6战术头盔 Lv.4','DICH训练头盔 Lv.4','GT1战术头盔 Lv.4',
      'GN重型头盔 Lv.5','DICH-1战术头盔 Lv.5','Mask-1铁壁头盔 Lv.5',
      'H70精英头盔 Lv.6','GT5指挥官头盔 Lv.6','DICH-9重型头盔 Lv.6'
    ]}
  },
  keys: ['map','oper','gun','bp','chest','armor','helmet'],
  spinning: false,
  results: {},
  intervals: {},
  container: null,
  statsCb: null,

  photoPalette: [
    'linear-gradient(135deg, #1a3a2a 0%, #2d6a3f 50%, #40916c 100%)',
    'linear-gradient(135deg, #1b2838 0%, #2a4560 50%, #3a6b8c 100%)',
    'linear-gradient(135deg, #2d1b38 0%, #5a3d6b 50%, #7b52a3 100%)',
    'linear-gradient(135deg, #3d2e1a 0%, #6b4d2d 50%, #9a6d3d 100%)',
    'linear-gradient(135deg, #1a2838 0%, #2d4a6b 50%, #3d6b9a 100%)',
    'linear-gradient(135deg, #381a1a 0%, #6b2d2d 50%, #9a3d3d 100%)',
    'linear-gradient(135deg, #1a3830 0%, #2d6b5a 50%, #3d9a80 100%)',
    'linear-gradient(135deg, #2d2d1a 0%, #5a6b2d 50%, #8a9a3d 100%)',
    'linear-gradient(135deg, #381a30 0%, #6b2d5a 50%, #9a3d7b 100%)',
    'linear-gradient(135deg, #0d2137 0%, #1a3d5c 50%, #2a6090 100%)',
    'linear-gradient(135deg, #3a1a1a 0%, #6b4040 50%, #9a5a5a 100%)',
    'linear-gradient(135deg, #1a3a1a 0%, #3d6b3d 50%, #5a9a5a 100%)',
  ],

  init(container, statsCb) {
    this.container = container;
    this.statsCb = statsCb;
    this.spinning = false;
    this.results = {};
    this.intervals = {};
    this.render();
  },

  photoFor(slotKey, itemName) {
    const items = this.slots[slotKey].items;
    const idx = items.indexOf(itemName);
    return this.photoPalette[idx % this.photoPalette.length];
  },

  render() {
    const slotCards = this.keys.map(k => {
      const s = this.slots[k];
      return `<div class="delta-slot card" id="slot_${k}">
        <div class="delta-photo" id="photo_${k}">
          <span class="delta-photo-icon">${s.icon}</span>
        </div>
        <div class="delta-label-sm">${s.name}</div>
        <div class="delta-display" id="display_${k}">?</div>
      </div>`;
    }).join('');

    this.container.innerHTML = `
      <div style="text-align:center;width:100%">
        <div class="delta-grid" id="slotGrid">
          ${slotCards}
        </div>
        <button class="btn pulse" id="rollBtn" style="margin-top:20px;font-size:18px;padding:14px 40px">
          🎰 开始抽奖
        </button>
        <div id="deltaResult" style="margin-top:16px;min-height:40px;font-size:15px;font-weight:600;color:var(--accent2)"></div>
      </div>
    `;

    document.getElementById('rollBtn').addEventListener('click', () => this.startRoll());
  },

  startRoll() {
    if (this.spinning) return;
    this.spinning = true;
    this.results = {};
    const btn = document.getElementById('rollBtn');
    btn.disabled = true;
    btn.textContent = '🎰 抽奖中...';
    btn.classList.remove('pulse');
    document.getElementById('deltaResult').textContent = '';

    this.keys.forEach(k => {
      const display = document.getElementById(`display_${k}`);
      const photo = document.getElementById(`photo_${k}`);
      display.classList.add('rolling');
      let tick = 0;
      this.intervals[k] = setInterval(() => {
        const items = this.slots[k].items;
        const idx = Math.floor(Math.random() * items.length);
        const item = items[idx];
        display.textContent = item;
        display.style.color = ['#ff6b6b','#ffa726','#ffd93d','#00d2a0','#54a0ff','#a29bfe','#e0e0f0'][Math.floor(Math.random()*7)];
        if (photo) photo.style.background = this.photoFor(k, item);
        tick++;
      }, 60);
    });

    setTimeout(() => {
      this.keys.forEach(k => {
        clearInterval(this.intervals[k]);
        const items = this.slots[k].items;
        const pick = items[Math.floor(Math.random() * items.length)];
        this.results[k] = pick;
        const display = document.getElementById(`display_${k}`);
        display.textContent = pick;
        display.style.color = 'var(--accent2)';
        display.classList.remove('rolling');
        display.classList.add('done');
        const photo = document.getElementById(`photo_${k}`);
        if (photo) {
          photo.style.background = this.photoFor(k, pick);
          photo.classList.add('photo-done');
        }
      });

      this.spinning = false;
      btn.disabled = false;
      btn.textContent = '🎰 再来一次';
      btn.classList.add('pulse');
      this.showResult();
    }, 3000);
  },

  showResult() {
    const lines = this.keys.map(k => {
      const s = this.slots[k];
      return `<div class="delta-result-item">
        <span class="delta-result-icon">${s.icon}</span>
        <span class="delta-result-name">${s.name}</span>
        <span class="delta-result-val">${this.results[k]}</span>
      </div>`;
    });
    document.getElementById('deltaResult').innerHTML = `
      <div class="delta-result-card">
        <div style="font-weight:700;margin-bottom:8px;color:var(--text)">📋 抽奖结果</div>
        ${lines.join('')}
      </div>
    `;
  },

  destroy() {
    this.keys.forEach(k => clearInterval(this.intervals[k]));
  }
};
