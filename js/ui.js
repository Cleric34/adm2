// User Interface & Tactical Flow Controller for Dual Vyuha & Attack Pattern Selection

class GameUI {
  constructor() {
    this.currentScreen = 'screen-start';

    this.playerConfig = {
      characterId: 'arjuna',
      armySize: 1000,
      vyuhaId: 'garuda',
      attackPatternId: 'double_flank_envelop',
      composition: {
        INFANTRY: 350,
        ARCHERS: 200,
        SWORDSMEN: 150,
        SPEARMEN: 100,
        CAVALRY: 80,
        ELEPHANTS: 40,
        CHARIOTS: 50,
        COMMANDERS: 30
      }
    };

    this.opponentConfig = {
      characterId: 'karna',
      armySize: 1000,
      vyuhaId: 'ardhachandra',
      attackPatternId: 'cavalry_rush',
      composition: {
        INFANTRY: 320,
        ARCHERS: 220,
        SWORDSMEN: 140,
        SPEARMEN: 120,
        CAVALRY: 90,
        ELEPHANTS: 35,
        CHARIOTS: 45,
        COMMANDERS: 30
      }
    };

    this.simulation = null;
    this.renderer = null;

    this.simSpeed = 1.0;
  }

  init(simulation, renderer) {
    this.simulation = simulation;
    this.renderer = renderer;

    this.renderCharacterSelectGrid();
    this.renderAttackPatternSelect();
    this.bindEvents();
    this.renderCompositionSliders();
    this.updateVyuhaPreviews();
  }

  showScreen(screenId) {
    document.querySelectorAll('.game-screen').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      this.currentScreen = screenId;
    }
  }

  renderCharacterSelectGrid() {
    // Allied Characters Dropdown / Grid
    const pSelect = document.getElementById('select-player-character');
    const oSelect = document.getElementById('select-opponent-character');
    if (!pSelect || !oSelect) return;

    pSelect.innerHTML = '';
    oSelect.innerHTML = '';

    Object.keys(CHARACTERS).forEach(k => {
      const c = CHARACTERS[k];
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} — ${c.weaponName} (${c.title})`;

      if (c.side === 'allied') {
        pSelect.appendChild(opt);
      } else {
        oSelect.appendChild(opt);
      }
    });

    pSelect.value = this.playerConfig.characterId;
    oSelect.value = this.opponentConfig.characterId;

    this.updateCharacterDetails('player');
    this.updateCharacterDetails('opponent');
  }

  renderAttackPatternSelect() {
    const pPatSelect = document.getElementById('select-player-attack-pattern');
    const oPatSelect = document.getElementById('select-opponent-attack-pattern');
    if (!pPatSelect || !oPatSelect) return;

    pPatSelect.innerHTML = '';
    oPatSelect.innerHTML = '';

    Object.keys(ATTACK_PATTERNS).forEach(k => {
      const p = ATTACK_PATTERNS[k];
      const optP = document.createElement('option');
      optP.value = p.id;
      optP.textContent = `${p.name} [${p.sanskritName.split(' ')[0]}]`;
      pPatSelect.appendChild(optP);

      const optO = document.createElement('option');
      optO.value = p.id;
      optO.textContent = `${p.name} [${p.sanskritName.split(' ')[0]}]`;
      oPatSelect.appendChild(optO);
    });

    pPatSelect.value = this.playerConfig.attackPatternId;
    oPatSelect.value = this.opponentConfig.attackPatternId;

    this.updateAttackPatternDetails('player');
    this.updateAttackPatternDetails('opponent');
  }

  bindEvents() {
    // Start Screen Button
    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      if (window.warAudio) window.warAudio.init();
      if (window.warAudio) window.warAudio.playShankha();
      this.showScreen('screen-setup');
    });

    // Audio Toggle
    document.getElementById('btn-audio-toggle')?.addEventListener('click', () => {
      if (window.warAudio) {
        window.warAudio.init();
        const muted = window.warAudio.toggleMute();
        document.getElementById('btn-audio-toggle').innerHTML = muted ? ' SOUND: OFF' : ' SOUND: ON';
      }
    });

    // Character Change Listeners
    document.getElementById('select-player-character')?.addEventListener('change', (e) => {
      this.playerConfig.characterId = e.target.value;
      this.updateCharacterDetails('player');
    });
    document.getElementById('select-opponent-character')?.addEventListener('change', (e) => {
      this.opponentConfig.characterId = e.target.value;
      this.updateCharacterDetails('opponent');
    });

    // Attack Pattern Change Listeners
    document.getElementById('select-player-attack-pattern')?.addEventListener('change', (e) => {
      this.playerConfig.attackPatternId = e.target.value;
      this.updateAttackPatternDetails('player');
    });
    document.getElementById('select-opponent-attack-pattern')?.addEventListener('change', (e) => {
      this.opponentConfig.attackPatternId = e.target.value;
      this.updateAttackPatternDetails('opponent');
    });

    // Army Size Slider
    const sizeSlider = document.getElementById('slider-army-size');
    const sizeDisplay = document.getElementById('display-army-size');
    sizeSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.playerConfig.armySize = val;
      this.opponentConfig.armySize = val;
      if (sizeDisplay) sizeDisplay.textContent = val;
      this.autoScaleComposition(val);
      this.updateVyuhaPreviews();
    });

    // Quick Size Presets
    document.querySelectorAll('.btn-preset-size').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = parseInt(e.target.dataset.size, 10);
        if (sizeSlider) sizeSlider.value = val;
        this.playerConfig.armySize = val;
        this.opponentConfig.armySize = val;
        if (sizeDisplay) sizeDisplay.textContent = val;
        this.autoScaleComposition(val);
        this.updateVyuhaPreviews();
      });
    });

    // Allied Vyuha Selection
    document.querySelectorAll('.player-vyuha-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.player-vyuha-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.playerConfig.vyuhaId = card.dataset.vyuha;
        this.updateVyuhaPreviews();
        if (window.warAudio) window.warAudio.playWarDrum(70, 0.4, 0.4);
      });
    });

    // Opponent Vyuha Selection (Explicitly selectable!)
    document.querySelectorAll('.opponent-vyuha-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.opponent-vyuha-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.opponentConfig.vyuhaId = card.dataset.vyuha;
        this.updateVyuhaPreviews();
        if (window.warAudio) window.warAudio.playWarDrum(60, 0.4, 0.4);
      });
    });

    // Lock Setup & Proceed to Strategic Briefing
    document.getElementById('btn-lock-setup')?.addEventListener('click', () => {
      this.prepareBriefing();
      this.showScreen('screen-briefing');
      if (window.warAudio) window.warAudio.playShankha();
    });

    // Engage Battle
    document.getElementById('btn-engage-battle')?.addEventListener('click', () => {
      this.startBattle();
    });

    // Tactical Order Commands
    document.getElementById('cmd-cavalry-charge')?.addEventListener('click', () => {
      if (this.simulation.orderCavalryCharge()) this.flashButton('cmd-cavalry-charge');
    });
    document.getElementById('cmd-reinforce-left')?.addEventListener('click', () => {
      if (this.simulation.orderReinforceFlank('left')) this.flashButton('cmd-reinforce-left');
    });
    document.getElementById('cmd-reinforce-center')?.addEventListener('click', () => {
      if (this.simulation.orderReinforceCenter()) this.flashButton('cmd-reinforce-center');
    });
    document.getElementById('cmd-archer-volley')?.addEventListener('click', () => {
      if (this.simulation.orderArcherVolley()) this.flashButton('cmd-archer-volley');
    });
    document.getElementById('cmd-reform-vyuha')?.addEventListener('click', () => {
      if (this.simulation.orderReformVyuha()) this.flashButton('cmd-reform-vyuha');
    });
    document.getElementById('cmd-war-cry')?.addEventListener('click', () => {
      if (this.simulation.orderWarCry()) this.flashButton('cmd-war-cry');
    });

    // Camera Views
    document.querySelectorAll('.btn-cam-view').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-cam-view').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const viewMode = btn.dataset.view;
        this.renderer.setCameraView(viewMode, this.simulation);
      });
    });

    // Speed toggle
    document.getElementById('btn-speed-toggle')?.addEventListener('click', () => {
      this.simSpeed = (this.simSpeed === 1.0) ? 2.0 : 1.0;
      document.getElementById('btn-speed-toggle').textContent = `${this.simSpeed}x SPEED`;
    });

    // Unit Click Inspector Hook
    window.onUnitClicked = (unitId) => {
      const unit = this.simulation.units.find(u => u.id === unitId);
      if (unit) this.showUnitInspector(unit);
    };

    // Replay Buttons
    document.getElementById('btn-play-again')?.addEventListener('click', () => {
      this.showScreen('screen-setup');
    });
    document.getElementById('btn-rematch')?.addEventListener('click', () => {
      this.startBattle();
    });
    document.getElementById('btn-change-vyuha')?.addEventListener('click', () => {
      this.showScreen('screen-setup');
    });
  }

  flashButton(id) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.add('executed');
    setTimeout(() => btn.classList.remove('executed'), 1000);
  }

  updateCharacterDetails(side) {
    const isPlayer = side === 'player';
    const charId = isPlayer ? this.playerConfig.characterId : this.opponentConfig.characterId;
    const char = CHARACTERS[charId] || (isPlayer ? CHARACTERS.arjuna : CHARACTERS.karna);

    const descElem = document.getElementById(`${side}-char-details`);
    if (descElem) {
      descElem.innerHTML = `
        <div style="font-weight: 700; color: ${char.color};">${char.name.toUpperCase()} — ${char.title}</div>
        <div><strong>Weapon:</strong> ${char.weaponName} [${char.weaponType}]</div>
        <div><strong>Special Astra:</strong> ${char.specialAstra}</div>
        <div style="font-style: italic; color: #ccc; font-size: 0.85rem; margin-top: 4px;">"${char.quote}"</div>
      `;
    }
  }

  updateAttackPatternDetails(side) {
    const isPlayer = side === 'player';
    const patId = isPlayer ? this.playerConfig.attackPatternId : this.opponentConfig.attackPatternId;
    const pat = ATTACK_PATTERNS[patId] || ATTACK_PATTERNS.frontal_breach;

    const descElem = document.getElementById(`${side}-attack-pattern-desc`);
    if (descElem) {
      descElem.innerHTML = `
        <div style="font-weight: 700; color: var(--gold-glow);">${pat.name} (${pat.sanskritName})</div>
        <div style="font-size: 0.85rem; color: #ddd; margin: 4px 0;">${pat.description}</div>
        <div style="font-size: 0.8rem; color: var(--gold-primary);"><strong>Lore:</strong> ${pat.lore}</div>
      `;
    }
  }

  autoScaleComposition(totalSize) {
    let sum = 0;
    const comp = {};
    const keys = Object.keys(UNIT_CLASSES);

    keys.forEach((key, idx) => {
      if (idx === keys.length - 1) {
        comp[key] = Math.max(1, totalSize - sum);
      } else {
        const count = Math.max(1, Math.round(totalSize * UNIT_CLASSES[key].ratio));
        comp[key] = count;
        sum += count;
      }
    });

    this.playerConfig.composition = comp;
    this.opponentConfig.composition = { ...comp };
    this.renderCompositionSliders();
  }

  renderCompositionSliders() {
    const container = document.getElementById('composition-sliders-container');
    if (!container) return;

    container.innerHTML = '';
    const comp = this.playerConfig.composition;

    Object.keys(UNIT_CLASSES).forEach(type => {
      const meta = UNIT_CLASSES[type];
      const count = comp[type] || 0;

      const row = document.createElement('div');
      row.className = 'comp-slider-row';
      row.innerHTML = `
        <div class="comp-label">
          <span class="comp-icon">${meta.icon}</span>
          <span class="comp-name">${meta.name}</span>
        </div>
        <div class="comp-slider-wrapper">
          <input type="range" class="comp-slider" data-type="${type}" min="1" max="${this.playerConfig.armySize}" value="${count}">
        </div>
        <div class="comp-value" id="comp-val-${type}">${count}</div>
      `;

      row.querySelector('.comp-slider').addEventListener('input', (e) => {
        this.updateIndividualComposition(type, parseInt(e.target.value, 10));
      });

      container.appendChild(row);
    });

    this.updateTotalArmyDisplay();
  }

  updateIndividualComposition(changedType, newValue) {
    this.playerConfig.composition[changedType] = newValue;
    let currentTotal = 0;
    Object.keys(UNIT_CLASSES).forEach(k => currentTotal += this.playerConfig.composition[k]);

    const diff = currentTotal - this.playerConfig.armySize;
    if (diff !== 0) {
      const adjustType = changedType === 'INFANTRY' ? 'ARCHERS' : 'INFANTRY';
      this.playerConfig.composition[adjustType] = Math.max(1, this.playerConfig.composition[adjustType] - diff);
    }

    Object.keys(UNIT_CLASSES).forEach(k => {
      const valDisplay = document.getElementById(`comp-val-${k}`);
      if (valDisplay) valDisplay.textContent = this.playerConfig.composition[k];
      const slider = document.querySelector(`.comp-slider[data-type="${k}"]`);
      if (slider) slider.value = this.playerConfig.composition[k];
    });

    this.updateTotalArmyDisplay();
    this.updateVyuhaPreviews();
  }

  updateTotalArmyDisplay() {
    let total = 0;
    Object.values(this.playerConfig.composition).forEach(v => total += v);
    const display = document.getElementById('total-army-counter');
    if (display) {
      display.textContent = total;
      display.style.color = (total === this.playerConfig.armySize) ? '#2ecc71' : '#e74c3c';
    }
  }

  updateVyuhaPreviews() {
    const pCanvas = document.getElementById('canvas-player-vyuha-preview');
    if (pCanvas) {
      window.renderVyuhaPreview(pCanvas, this.playerConfig.vyuhaId, this.playerConfig.composition, this.playerConfig.armySize, false);
    }

    const oCanvas = document.getElementById('canvas-opponent-vyuha-preview');
    if (oCanvas) {
      window.renderVyuhaPreview(oCanvas, this.opponentConfig.vyuhaId, this.opponentConfig.composition, this.opponentConfig.armySize, true);
    }
  }

  prepareBriefing() {
    const pChar = CHARACTERS[this.playerConfig.characterId] || CHARACTERS.arjuna;
    const oChar = CHARACTERS[this.opponentConfig.characterId] || CHARACTERS.karna;
    const pVyuha = VYUHAS[this.playerConfig.vyuhaId];
    const oVyuha = VYUHAS[this.opponentConfig.vyuhaId];
    const pPat = ATTACK_PATTERNS[this.playerConfig.attackPatternId];
    const oPat = ATTACK_PATTERNS[this.opponentConfig.attackPatternId];

    document.getElementById('brief-player-name').textContent = pChar.name.toUpperCase();
    document.getElementById('brief-player-title').textContent = pChar.title;
    document.getElementById('brief-player-size').textContent = `${this.playerConfig.armySize} Warriors`;
    document.getElementById('brief-player-vyuha').textContent = pVyuha.name;
    document.getElementById('brief-player-attack').textContent = pPat.name;

    document.getElementById('brief-opponent-name').textContent = oChar.name.toUpperCase();
    document.getElementById('brief-opponent-title').textContent = oChar.title;
    document.getElementById('brief-opponent-size').textContent = `${this.opponentConfig.armySize} Warriors`;
    document.getElementById('brief-opponent-vyuha').textContent = oVyuha.name;
    document.getElementById('brief-opponent-attack').textContent = oPat.name;

    // Matchup Analysis
    let analysis = '';
    if (pVyuha.counters.includes(oVyuha.id)) {
      analysis += ` VYUHA ADVANTAGE: Your ${pVyuha.name} possesses the sacred geometry to penetrate and dismantle ${oVyuha.name}!<br>`;
    } else if (oVyuha.counters.includes(pVyuha.id)) {
      analysis += ` VYUHA CAUTION: The enemy's ${oVyuha.name} is a known historic counter to ${pVyuha.name}! Hold your flanks with utmost discipline.<br>`;
    } else {
      analysis += ` VYUHA EQUILIBRIUM: Both sacred formations meet on equal geometric terms.<br>`;
    }

    if (pPat.countersPattern && pPat.countersPattern.includes(oPat.id)) {
      analysis += ` STRATEGY ADVANTAGE: Your ${pPat.name} perfectly disrupts their ${oPat.name}!`;
    } else if (oPat.countersPattern && oPat.countersPattern.includes(pPat.id)) {
      analysis += ` STRATEGY THREAT: The enemy's ${oPat.name} is dangerous against your ${pPat.name}! Brace for initial contact.`;
    } else {
      analysis += ` STRATEGY CLASH: Both attack doctrines will clash head-to-head in total battle.`;
    }

    document.getElementById('brief-matchup-analysis').innerHTML = analysis;
  }

  startBattle() {
    this.showScreen('screen-battle');
    this.simulation.init(this.playerConfig, this.opponentConfig);

    if (window.warAudio) {
      window.warAudio.playShankha();
      window.warAudio.startBattleDrums();
    }

    this.renderer.setCameraView('OVERVIEW', this.simulation);
  }

  updateBattleHUD() {
    if (this.currentScreen !== 'screen-battle') return;
    const sim = this.simulation;

    document.getElementById('hud-phase-badge').textContent = sim.phaseName.split('—')[0].trim().toUpperCase();

    let playerAlive = 0, opponentAlive = 0, pSimTotal = 0, oSimTotal = 0;
    for (const un of sim.units) {
      if (un.team === 'player') { pSimTotal++; if (un.isAlive) playerAlive++; }
      else if (un.team === 'opposition') { oSimTotal++; if (un.isAlive) opponentAlive++; }
    }

    const pRatio = playerAlive / Math.max(1, pSimTotal);
    const oRatio = opponentAlive / Math.max(1, oSimTotal);

    document.getElementById('hud-player-hp-bar').style.width = `${Math.round(pRatio * 100)}%`;
    document.getElementById('hud-bot-hp-bar').style.width = `${Math.round(oRatio * 100)}%`;

    const scaledPlayerSurvivors = Math.round(pRatio * sim.playerTotalInitial);
    const scaledOpponentSurvivors = Math.round(oRatio * sim.opponentTotalInitial);

    document.getElementById('hud-player-survivors').textContent = `${scaledPlayerSurvivors} / ${sim.playerTotalInitial}`;
    document.getElementById('hud-bot-survivors').textContent = `${scaledOpponentSurvivors} / ${sim.opponentTotalInitial}`;

    const elapsed = Math.floor(sim.elapsedTime);
    const mins = Math.floor(elapsed / 60);
    const secs = ('0' + (elapsed % 60)).slice(-2);
    document.getElementById('hud-battle-timer').textContent = `${mins}:${secs}`;

    // Event Ticker
    const ticker = document.getElementById('hud-event-ticker');
    if (ticker && sim.battleEvents.length > 0 && this._tk !== sim.battleEvents[0]) {
      this._tk = sim.battleEvents[0];
      ticker.innerHTML = sim.battleEvents.slice(0, 6).map(e => `
        <div class="ticker-item">
          <span class="ticker-time">[${e.time}]</span>
          <span class="ticker-tag">${e.tag}:</span>
          <span class="ticker-msg">${e.text}</span>
        </div>
      `).join('');
    }

    if (sim.isOver && !this._resultQueued) {
      this._resultQueued = true;
      setTimeout(() => { this._resultQueued = false; if (this.currentScreen === 'screen-battle') this.showResultScreen(); }, 1500);
    }
  }

  showUnitInspector(unit) {
    const inspector = document.getElementById('unit-inspector-modal');
    if (!inspector) return;
    inspector.classList.add('visible');
    inspector.innerHTML = `
      <div class="inspector-card">
        <button class="inspector-close" onclick="document.getElementById('unit-inspector-modal').classList.remove('visible')"></button>
        <h4>${unit.team === 'player' ? ' ALLIED' : ' ENEMY'} ${unit.charData ? unit.charData.name : unit.unitType}</h4>
        <p><strong>Sector:</strong> ${unit.sector.toUpperCase()}</p>
        <p><strong>Health:</strong> ${Math.round(unit.currentHp)} / ${unit.maxHp}</p>
        <p><strong>Morale:</strong> ${Math.round(unit.morale)}%</p>
        <p><strong>Status:</strong> ${unit.status.toUpperCase()}</p>
        <p><strong>Kills:</strong> ${unit.kills}</p>
      </div>
    `;
  }

  showResultScreen() {
    if (window.warAudio) window.warAudio.stopBattleDrums();
    const scoreData = this.simulation.calculateStrategicScore();

    this.showScreen('screen-result');

    const outcomeBanner = document.getElementById('result-outcome-banner');
    if (scoreData.winner === 'player') {
      outcomeBanner.textContent = `TOTAL VICTORY TO ${scoreData.winningPartyName.toUpperCase()}!`;
      outcomeBanner.className = 'result-banner victory';
    } else if (scoreData.winner === 'opposition') {
      outcomeBanner.textContent = `VICTORY TO ${scoreData.winningPartyName.toUpperCase()}!`;
      outcomeBanner.className = 'result-banner defeat';
    } else {
      outcomeBanner.textContent = 'MUTUAL DESTRUCTION — STALEMATE';
      outcomeBanner.className = 'result-banner draw';
    }

    document.getElementById('res-p-initial').textContent = scoreData.playerInitial;
    document.getElementById('res-p-survivors').textContent = scoreData.playerSurvivors;
    document.getElementById('res-p-casualties').textContent = scoreData.playerCasualties;

    document.getElementById('res-b-initial').textContent = scoreData.opponentInitial;
    document.getElementById('res-b-survivors').textContent = scoreData.opponentSurvivors;
    document.getElementById('res-b-casualties').textContent = scoreData.opponentCasualties;

    // Vyuha Accuracy and Metrics
    document.getElementById('score-vyuha-accuracy').textContent = `${scoreData.vyuhaAccuracy}%`;
    document.getElementById('score-pattern-accuracy').textContent = `${scoreData.patternAccuracy}%`;
    document.getElementById('score-army-survival').textContent = `${scoreData.survivalRate}%`;
    document.getElementById('score-line-penetration').textContent = `${scoreData.linePenetrationScore}%`;

    document.getElementById('score-total-val').textContent = `${scoreData.grandScore} / 100`;
    document.getElementById('score-rank-title').textContent = `WARRIOR RANK: ${scoreData.rank.toUpperCase()}`;
  }
}

window.GameUI = GameUI;
