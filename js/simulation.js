const UNIT_RADIUS = { INFANTRY: 1.1, ARCHERS: 1.1, SWORDSMEN: 1.1, SPEARMEN: 1.2, CAVALRY: 1.9, ELEPHANTS: 3.6, CHARIOTS: 2.8, COMMANDERS: 1.6 };
// Real-time Tactical War Simulation Engine with Authentic Kurukshetra Characters, Attack Pattern Synergies, Visceral Blood Blasts & Total Annihilation

class WarSimulation {
  constructor() {
    this.units = [];
    this.projectiles = [];
    this.pendingBloodBursts = [];

    this.phase = 1;
    this.phaseName = 'PHASE 1: ARMIES ADVANCE';
    this.phaseDescriptions = [
      'Phase 1: Armies Advance — Both hosts march in sacred geometric battle formations.',
      'Phase 2: First Contact — Longbows and celestial astras release sky-darkening volleys.',
      'Phase 3: Frontline Clash — Vanguards collide with bone-shattering kinetic fury.',
      'Phase 4: Flank Attack — Cavalry wings and swept horns execute encirclement maneuvers.',
      'Phase 5: Formation Pressure — Armored war elephants and chariots crash into the lines.',
      'Phase 6: Major Clash — Reserves deployed across all sectors in brutal attrition.',
      'Phase 7: Formation Break — Defensive lines shatter under blood-soaked pressure.',
      'Phase 8: Final Resistance — Last stand of champions and royal guards to the death.',
      'Phase 9: Total Annihilation — The enemy host is wiped out. Sole victors remain.'
    ];

    this.playerArmyCenter = { x: 0, z: 120 };
    this.botArmyCenter = { x: 0, z: -120 };

    this.playerConfig = null;
    this.opponentConfig = null;

    this.playerTotalInitial = 0;
    this.opponentTotalInitial = 0;
    this.playerCasualties = 0;
    this.opponentCasualties = 0;

    this.isPaused = false;
    this.isOver = false;
    this.winner = null; // 'player' or 'opposition'

    this.battleEvents = [];
    this.elapsedTime = 0;

    this.orderCooldowns = {
      cavalryCharge: 0,
      reinforceFlank: 0,
      reinforceCenter: 0,
      archerVolley: 0,
      reformVyuha: 0,
      warCry: 0
    };

    this.duelEventPending = null;
    this.hasTriggeredDuel = false;
  }

  init(playerConfig, opponentConfig) {
    this.units = [];
    this.projectiles = [];
    this.pendingBloodBursts = [];
    this.phase = 1;
    this.isOver = false;
    this.winner = null;
    this.elapsedTime = 0;
    this.hasTriggeredDuel = false;
    this.duelEventPending = null;

    this.playerConfig = playerConfig;
    this.opponentConfig = opponentConfig;

    this.playerTotalInitial = playerConfig.armySize;
    this.opponentTotalInitial = opponentConfig.armySize;
    this.playerCasualties = 0;
    this.opponentCasualties = 0;

    // Tactical scaling factor for high-performance 3D rendering
    const simScale = Math.min(1.0, 360 / Math.max(playerConfig.armySize, opponentConfig.armySize));
    const playerSimCount = Math.max(45, Math.round(playerConfig.armySize * simScale));
    const opponentSimCount = Math.max(45, Math.round(opponentConfig.armySize * simScale));

    this.spawnArmy('player', playerConfig, playerSimCount, 120, 0);
    this.spawnArmy('opposition', opponentConfig, opponentSimCount, -120, Math.PI);

    const pChar = CHARACTERS[playerConfig.characterId] || CHARACTERS.arjuna;
    const oChar = CHARACTERS[opponentConfig.characterId] || CHARACTERS.karna;
    const pPat = ATTACK_PATTERNS[playerConfig.attackPatternId] || ATTACK_PATTERNS.frontal_breach;
    const oPat = ATTACK_PATTERNS[opponentConfig.attackPatternId] || ATTACK_PATTERNS.double_flank_envelop;

    this.addEvent('WAR BEGINS', `${pChar.name} leads with ${pPat.name} against ${oChar.name} executing ${oPat.name}!`);
  }

  spawnArmy(team, config, simCount, startZ, baseAngle) {
    if (!this.pendingImpacts || team === 'player') this.pendingImpacts = [];
    if (team === 'player') { this.anchors = {}; this.contactTime = 0; }
    this.anchors[team] = { x: 0, z: startZ, dir: team === 'player' ? -1 : 1 };
    const vyuha = VYUHAS[config.vyuhaId] || VYUHAS.padma;
    const slots = vyuha.generateSlots(simCount, config.composition);
    const charData = CHARACTERS[config.characterId] || (team === 'player' ? CHARACTERS.arjuna : CHARACTERS.karna);
    const pattern = ATTACK_PATTERNS[config.attackPatternId] || ATTACK_PATTERNS.frontal_breach;

    const comp = config.composition;
    const unitList = [];
    Object.keys(UNIT_CLASSES).forEach(type => {
      const count = comp[type] || Math.max(1, Math.round(config.armySize * UNIT_CLASSES[type].ratio));
      const scaledCount = Math.max(1, Math.round((count / config.armySize) * simCount));
      for (let i = 0; i < scaledCount; i++) unitList.push(type);
    });

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      let unitType = unitList[i % unitList.length] || 'INFANTRY';
      let isCommander = false;

      // Commander placement
      if (slot.role && (slot.role.includes('commander') || slot.role.includes('hub') || slot.role.includes('heart') || i === 0)) {
        unitType = 'COMMANDERS';
        isCommander = true;
      } else if (slot.role && (slot.role.includes('wing') || slot.role.includes('horn')) && (i % 2 === 0)) {
        unitType = (Math.random() < 0.6) ? 'CAVALRY' : 'CHARIOTS';
      } else if (slot.role && (slot.role.includes('beak') || slot.role.includes('jaw') || slot.role.includes('vanguard'))) {
        unitType = (i % 9 === 0) ? 'ELEPHANTS' : (i % 2 === 0 ? 'SPEARMEN' : 'SWORDSMEN');
      }

      const meta = UNIT_CLASSES[unitType] || UNIT_CLASSES.INFANTRY;

      // Rotate coordinates
      const cosA = Math.cos(baseAngle);
      const sinA = Math.sin(baseAngle);
      const rotatedX = cosA * slot.x - sinA * slot.z;
      const rotatedZ = sinA * slot.x + cosA * slot.z;

      // Apply Attack Pattern Speed Modifiers & Stats
      let attackMod = meta.atk;
      let defenseMod = meta.def;
      let speedMod = meta.spd * (pattern.speedMod || 1.0);

      if (slot.sector === 'vanguard' && pattern.vanguardBonus) {
        attackMod *= (1 + pattern.vanguardBonus);
      }
      if ((slot.sector === 'left_flank' || slot.sector === 'right_flank') && pattern.flankBonus) {
        speedMod *= (1 + pattern.flankBonus);
      }

      const unit = {
        id: `${team}_${i}`,
        team: team,
        unitType: unitType,
        charId: isCommander ? charData.id : null,
        charData: isCommander ? charData : null,
        x: rotatedX,
        z: startZ + rotatedZ,
        slotX: rotatedX,
        slotZ: rotatedZ,
        formationOffsetX: slot.x,
        formationOffsetZ: slot.z,
        sector: slot.sector || 'center',
        role: slot.role || 'line',
        currentHp: isCommander ? charData.stats.attack * 10 : meta.hp,
        maxHp: isCommander ? charData.stats.attack * 10 : meta.hp,
        attack: isCommander ? charData.stats.attack : attackMod,
        defense: isCommander ? charData.stats.defense : defenseMod,
        speed: speedMod,
        range: isCommander ? charData.stats.range : meta.range,
        morale: 100,
        attackCooldown: Math.random() * 1.5,
        status: 'marching',
        facingAngle: baseAngle,
        isAlive: true,
        kills: 0,
        targetUnit: null,
        chargeBonus: (unitType === 'CAVALRY' || unitType === 'CHARIOTS') ? 1.5 : 1.0,
        isCommander: isCommander
      };

      this.units.push(unit);
    }
  }

  update(deltaSec) {
    if (this.isPaused || this.isOver) return;

    this.elapsedTime += deltaSec;

    // Cooldown timers
    Object.keys(this.orderCooldowns).forEach(k => {
      if (this.orderCooldowns[k] > 0) {
        this.orderCooldowns[k] = Math.max(0, this.orderCooldowns[k] - deltaSec * 1000);
      }
    });

    let playerAlive = 0, opponentAlive = 0;
    let pCenterX = 0, pCenterZ = 0;
    let bCenterX = 0, bCenterZ = 0;

    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.isAlive) {
        if (u.team === 'player') {
          playerAlive++;
          pCenterX += u.x;
          pCenterZ += u.z;
        } else {
          opponentAlive++;
          bCenterX += u.x;
          bCenterZ += u.z;
        }
      }
    }

    if (playerAlive > 0) {
      this.playerArmyCenter.x = pCenterX / playerAlive;
      this.playerArmyCenter.z = pCenterZ / playerAlive;
    }
    if (opponentAlive > 0) {
      this.botArmyCenter.x = bCenterX / opponentAlive;
      this.botArmyCenter.z = bCenterZ / opponentAlive;
    }

    const armyDist = Math.hypot(
      this.playerArmyCenter.x - this.botArmyCenter.x,
      this.playerArmyCenter.z - this.botArmyCenter.z
    );

    // Armies march as a block until contact, then ranks peel off to fight
    if (armyDist < 115) this.contactTime += deltaSec;
    if (armyDist > 92 && this.anchors) {
      for (const t of ['player', 'opposition']) { const A = this.anchors[t]; A.z += A.dir * 4.4 * deltaSec; }
    }

    // Update Battle Phases 1 - 9
    this.updateBattlePhase(armyDist, playerAlive, opponentAlive);

    // Units AI & Combat
    this.updateUnits(deltaSec);

    // Ballistic Arrow Projectiles
    this.updateProjectiles(deltaSec);

    // Check Total Annihilation Victory condition (Until ALL opposition are killed!)
    this.checkTotalAnnihilation(playerAlive, opponentAlive);
  }

  updateBattlePhase(armyDist, playerAlive, opponentAlive) {
    const prevPhase = this.phase;
    const playerLossPct = (this.playerCasualties / Math.max(1, this.playerTotalInitial));
    const oppLossPct = (this.opponentCasualties / Math.max(1, this.opponentTotalInitial));
    const maxLoss = Math.max(playerLossPct, oppLossPct);

    if (maxLoss < 0.02 && armyDist > 170) this.phase = 1;
    else if (maxLoss < 0.02 && armyDist > 135) this.phase = 2;
    else if (maxLoss < 0.02) this.phase = 3;
    else if (maxLoss < 0.20) this.phase = 4;
    else if (maxLoss < 0.40) this.phase = 5;
    else if (maxLoss < 0.65) this.phase = 6;
    else if (maxLoss < 0.85) this.phase = 7;
    else if (playerAlive > 0 && opponentAlive > 0) this.phase = 8;
    else this.phase = 9;

    if (this.phase !== prevPhase) {
      this.phaseName = this.phaseDescriptions[this.phase - 1];
      this.addEvent(`PHASE ${this.phase}`, this.phaseName);
      if (window.warAudio && this.phase >= 3) {
        window.warAudio.playWarDrum(50, 1.0, 0.9);
      }
    }
  }

  updateUnits(deltaSec) {
    const aliveUnits = this.units.filter(u => u.isAlive);
    // Spatial hash so targeting is ~O(n) instead of O(n^2)
    const CELL = 12, grid = new Map();
    for (const q of aliveUnits) {
      const k = ((q.x / CELL | 0) + 1024) * 4096 + ((q.z / CELL | 0) + 1024);
      const c = grid.get(k);
      if (c) c.push(q); else grid.set(k, [q]);
    }
    this._tick = (this._tick || 0) + 1;

    for (let i = 0; i < aliveUnits.length; i++) {
      const u = aliveUnits[i];
      if (!u.isAlive) continue;

      if (u.attackCooldown > 0) u.attackCooldown -= deltaSec;
      // Knockback / shove velocity from hits
      if (u.kx || u.kz) {
        u.x += u.kx * deltaSec; u.z += u.kz * deltaSec;
        const dec = Math.exp(-7 * deltaSec); u.kx *= dec; u.kz *= dec;
        if (Math.abs(u.kx) + Math.abs(u.kz) < 0.5) { u.kx = 0; u.kz = 0; }
      }

      const isArcher = (u.unitType === 'ARCHERS' || u.unitType === 'CHARIOTS');
      // Keep the current target; re-scan only when it dies or on a staggered tick
      let nearestEnemy = (u.targetUnit && u.targetUnit.isAlive) ? u.targetUnit : null;
      const rescan = nearestEnemy ? ((i + this._tick) % 6 === 0) : ((i + this._tick) % 12 === 0);
      if (rescan) {
        const cx = (u.x / CELL | 0) + 1024, cz = (u.z / CELL | 0) + 1024;
        let best = null, bs = Infinity;
        for (let r = 0; r <= 8 && !best; r++) {
          for (let a = cx - r; a <= cx + r; a++) {
            const stepB = (a === cx - r || a === cx + r) ? 1 : (2 * r || 1);
            for (let b = cz - r; b <= cz + r; b += stepB) {
              const cell = grid.get(a * 4096 + b);
              if (!cell) continue;
              for (const o of cell) {
                if (o.team === u.team) continue;
                const dx = o.x - u.x, dz = o.z - u.z;
                let sc = dx * dx + dz * dz;
                if (o.isCommander) sc *= 0.6;
                if (sc < bs) { bs = sc; best = o; }
              }
            }
          }
        }
        if (best) nearestEnemy = best;
      }
      u.targetUnit = nearestEnemy;
      const distToEnemy = nearestEnemy ? Math.hypot(nearestEnemy.x - u.x, nearestEnemy.z - u.z) : Infinity;

      const A = this.anchors[u.team], EA = this.anchors[u.team === 'player' ? 'opposition' : 'player'];
      const mounted = (u.unitType === 'CAVALRY' || u.unitType === 'CHARIOTS');
      const boost = Math.min(220, this.contactTime * 11);
      const aggro = mounted ? 55 + boost : (isArcher ? u.range + 6 : 24 + boost);
      const engage = !!nearestEnemy && distToEnemy <= Math.max(aggro, u.range);

      if (!engage || distToEnemy > u.range) {
        let tx, tz, spd = u.speed * 3.6;
        if (engage) {
          tx = nearestEnemy.x; tz = nearestEnemy.z;
          u.status = mounted ? 'charging' : 'marching';
          if (mounted) spd *= 1.3;
        } else {
          tx = A.x + u.slotX; tz = A.z + u.slotZ;
          const dd = Math.hypot(tx - u.x, tz - u.z);
          if (dd < 1.0) { u.status = 'idle'; spd = 0; }
          else { u.status = 'marching'; spd = Math.min(spd * 1.4, dd * 2.5); }
        }
        const dx = tx - u.x, dz = tz - u.z;
        const dist = Math.hypot(dx, dz) || 1;
        const moveDist = Math.min(spd * deltaSec, dist);
        u.x += (dx / dist) * moveDist;
        u.z += (dz / dist) * moveDist;
        const fx = (spd > 0) ? dx : (EA.x - u.x), fz = (spd > 0) ? dz : (EA.z - u.z);
        u.facingAngle = Math.atan2(fx, fz);
      } else {
        u.status = 'engaged';
        u.facingAngle = Math.atan2(nearestEnemy.x - u.x, nearestEnemy.z - u.z);

        if (u.attackCooldown <= 0) {
          this.executeAttack(u, nearestEnemy);
          u.attackCooldown = isArcher ? (2.4 + Math.random() * 0.3) : (1.0 + Math.random() * 0.4);
        }
      }


      // Soft collision: nobody stands inside anyone else
      {
        const ri = UNIT_RADIUS[u.unitType] || 1.1;
        const ccx = (u.x / CELL | 0) + 1024, ccz = (u.z / CELL | 0) + 1024;
        for (let a = ccx - 1; a <= ccx + 1; a++) for (let b = ccz - 1; b <= ccz + 1; b++) {
          const cell = grid.get(a * 4096 + b); if (!cell) continue;
          for (const o of cell) {
            if (o === u || !o.isAlive) continue;
            const ox = u.x - o.x, oz = u.z - o.z, lim = ri + (UNIT_RADIUS[o.unitType] || 1.1);
            const d2 = ox * ox + oz * oz;
            if (o.team !== u.team && o.unitType === 'ELEPHANTS' && u.unitType !== 'ELEPHANTS' && u.unitType !== 'COMMANDERS' &&
                (o.status === 'marching' || o.status === 'charging' || o.status === 'engaged') && d2 < (lim + 0.9) * (lim + 0.9)) {
              this.applyHit(u, o, 55, 1.4);
              this.damageUnit(u, o, 150 * deltaSec);
              if (!u.isAlive) break;
            }
            if (d2 < lim * lim && d2 > 1e-6) {
              const d = Math.sqrt(d2), push = (lim - d) * Math.min(1, deltaSec * 10) * 0.5;
              u.x += ox / d * push; u.z += oz / d * push;
            }
          }
        }
      }
    }
  }

  applyHit(def, att, power, lift) {
    const dx = def.x - att.x, dz = def.z - att.z, d = Math.hypot(dx, dz) || 1;
    const m = def.unitType === 'ELEPHANTS' ? 0.12 : def.unitType === 'COMMANDERS' ? 0.35 : (def.unitType === 'CAVALRY' || def.unitType === 'CHARIOTS') ? 0.7 : 1;
    def.hitT = this.elapsedTime; def.hitDX = dx / d; def.hitDZ = dz / d; def.hitLift = lift * m;
    def.kx = (def.kx || 0) + def.hitDX * power * m; def.kz = (def.kz || 0) + def.hitDZ * power * m;
  }

  damageUnit(def, att, dmg) {
    if (!def.isAlive) return;
    def.currentHp -= dmg; def.morale = Math.max(0, def.morale - dmg * 0.1);
    if (Math.random() < 0.15) this.pendingBloodBursts.push({ x: def.x, y: 1.2, z: def.z, damage: 18 });
    if (def.currentHp <= 0) {
      def.isAlive = false; def.status = 'dead'; att.kills++;
      this.pendingBloodBursts.push({ x: def.x, y: 1.0, z: def.z, damage: 40 });
      if (def.team === 'player') this.playerCasualties++; else this.opponentCasualties++;
    }
  }

  executeAttack(attacker, defender) {
    attacker.strikeT = this.elapsedTime;
    const isRanged = (attacker.unitType === 'ARCHERS' || (attacker.unitType === 'CHARIOTS' && Math.hypot(defender.x - attacker.x, defender.z - attacker.z) > 10));

    if (isRanged) {
      this.projectiles.push({
        startX: attacker.x,
        startY: 2.2,
        startZ: attacker.z,
        targetX: defender.x + (Math.random() * 2 - 1) * 2.2,
        targetY: 0.5,
        targetZ: defender.z + (Math.random() * 2 - 1) * 2.2,
        progress: 0,
        speed: Math.min(2.2, Math.max(0.7, 62 / Math.max(14, Math.hypot(defender.x - attacker.x, defender.z - attacker.z)))),
        attacker: attacker,
        target: defender,
        damage: attacker.attack * 0.95
      });
      if (Math.random() < 0.25 && window.warAudio) window.warAudio.playArrowVolley();
      return;
    }

    // Melee strike with Visceral Blood Blast!
    const charged = attacker.chargeBonus > 1.0;
    const attackDirX = defender.x - attacker.x;
    const attackDirZ = defender.z - attacker.z;
    const attackAngle = Math.atan2(attackDirX, attackDirZ);
    let angleDiff = Math.abs(attackAngle - defender.facingAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    let flankMult = 1.0;
    if (angleDiff > 1.8) {
      flankMult = 1.7; // Flanked/Rear hit!
      defender.morale = Math.max(5, defender.morale - 12);
    }

    let classBonus = 1.0;
    if (attacker.unitType === 'SPEARMEN' && (defender.unitType === 'CAVALRY' || defender.unitType === 'ELEPHANTS')) {
      classBonus = 1.6;
    }
    if (attacker.unitType === 'ELEPHANTS') {
      classBonus = 1.7;
      defender.morale -= 15;
      if (Math.random() < 0.15 && window.warAudio) window.warAudio.playElephantTrumpet();
    }
    if (attacker.chargeBonus > 1.0) {
      classBonus *= attacker.chargeBonus;
      attacker.chargeBonus = 1.0;
    }

    const effectiveDefense = Math.max(0, defender.defense * (flankMult > 1.2 ? 0.6 : 1.0));
    const baseDmg = attacker.attack * classBonus * flankMult * (0.85 + Math.random() * 0.35);
    const damage = Math.max(5, baseDmg * (1 - effectiveDefense / (effectiveDefense + 55)));

    defender.currentHp -= damage;
    defender.morale = Math.max(0, defender.morale - (damage * 0.25));
    {
      let power = 14, lift = 0;
      switch (attacker.unitType) {
        case 'ELEPHANTS': power = 80; lift = 2.6; break;
        case 'COMMANDERS': power = 30; break;
        case 'SPEARMEN': power = 18; break;
        case 'CAVALRY': power = charged ? 48 : 22; lift = charged ? 0.8 : 0; break;
        case 'CHARIOTS': power = charged ? 55 : 24; lift = charged ? 1.0 : 0; break;
      }
      this.applyHit(defender, attacker, power, lift);
      const big = attacker.unitType === 'COMMANDERS' || defender.unitType === 'COMMANDERS' || defender.unitType === 'ELEPHANTS';
      if (Math.random() < (big ? 0.9 : 0.3)) this.pendingBloodBursts.push({ x: (attacker.x + defender.x) / 2, y: 1.6, z: (attacker.z + defender.z) / 2, damage: 0, spark: true });
    }

    // TRIGGER BLOOD BLAST EMISSION!
    this.pendingBloodBursts.push({
      x: defender.x,
      y: 1.4,
      z: defender.z,
      damage: damage
    });

    if (Math.random() < 0.25 && window.warAudio) window.warAudio.playSwordClash();

    // Check fatality
    if (defender.currentHp <= 0) {
      defender.isAlive = false;
      defender.status = 'dead';
      attacker.kills++;

      // Extra lethal blood burst on death!
      this.pendingBloodBursts.push({
        x: defender.x,
        y: 1.0,
        z: defender.z,
        damage: damage * 2.0
      });

      if (defender.team === 'player') this.playerCasualties++;
      else this.opponentCasualties++;

      if (defender.isCommander) {
        this.addEvent('COMMANDER SLAIN!', `${defender.team === 'player' ? 'Your' : 'Enemy'} Commander has been cut down!`);
        this.units.filter(u => u.team === defender.team && u.isAlive).forEach(u => {
          u.morale = Math.max(5, u.morale - 40);
        });
      }
    }
  }

  updateProjectiles(deltaSec) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.progress += p.speed * deltaSec;

      if (p.progress >= 1.0) {
        const def = p.target;
        this.pendingImpacts.push({ x: p.targetX, z: p.targetZ });
        if (def && def.isAlive) {
          const dmg = Math.max(4, p.damage * (1 - def.defense / (def.defense + 60)));
          def.currentHp -= dmg;
          def.morale = Math.max(0, def.morale - 4);
          this.applyHit(def, p.attacker, 7, 0);

          // Arrow blood impact
          this.pendingBloodBursts.push({
            x: def.x,
            y: 1.5,
            z: def.z,
            damage: dmg
          });

          if (def.currentHp <= 0) {
            def.isAlive = false;
            def.status = 'dead';
            p.attacker.kills++;
            if (def.team === 'player') this.playerCasualties++;
            else this.opponentCasualties++;
          }
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  // Decisive Annihilation Check: Battle continues until ALL opposition units are killed!
  checkTotalAnnihilation(playerAlive, opponentAlive) {
    if (this.isOver) return;

    if (playerAlive === 0 && opponentAlive === 0) {
      this.isOver = true;
      this.phase = 9;
      this.phaseName = this.phaseDescriptions[8];
      this.winner = 'DRAW';
      this.addEvent('MUTUAL DESTRUCTION', 'Every single warrior on both sides has fallen in glorious sacrifice.');
    } else if (playerAlive === 0) {
      this.isOver = true;
      this.phase = 9;
      this.phaseName = this.phaseDescriptions[8];
      this.winner = 'opposition';
      this.addEvent('TOTAL DEFEAT', 'Your host has been completely annihilated! The enemy stands as sole masters of Kurukshetra.');
    } else if (opponentAlive === 0) {
      this.isOver = true;
      this.phase = 9;
      this.phaseName = this.phaseDescriptions[8];
      this.winner = 'player';
      this.addEvent('TOTAL ANNIHILATION VICTORY!', 'Every enemy soldier has been slain! Your surviving host raises their weapons in eternal glory!');
      if (window.warAudio) window.warAudio.playVictory();
    }
  }

  // Tactical Order Commands
  orderCavalryCharge() {
    if (this.orderCooldowns.cavalryCharge > 0) return false;
    this.orderCooldowns.cavalryCharge = 18000;
    this.units.filter(u => u.team === 'player' && u.isAlive && (u.unitType === 'CAVALRY' || u.unitType === 'CHARIOTS')).forEach(u => {
      u.chargeBonus = 1.9;
      u.speed *= 1.4;
      u.morale = 100;
    });
    this.addEvent('COMMAND ORDER', 'Cavalry & Chariot charge ordered with maximum kinetic shock!');
    if (window.warAudio) window.warAudio.playWarDrum(45, 1.2, 1.0);
    return true;
  }

  orderReinforceFlank(flank = 'left') {
    if (this.orderCooldowns.reinforceFlank > 0) return false;
    this.orderCooldowns.reinforceFlank = 15000;
    const targetSector = flank === 'left' ? 'left_flank' : 'right_flank';
    this.units.filter(u => u.team === 'player' && u.isAlive && u.sector === 'reserve').forEach(u => {
      u.sector = targetSector;
      u.morale = Math.min(100, u.morale + 30);
    });
    this.addEvent('COMMAND ORDER', `Reserves shifted to reinforce the ${flank.toUpperCase()} flank!`);
    return true;
  }

  orderReinforceCenter() {
    if (this.orderCooldowns.reinforceCenter > 0) return false;
    this.orderCooldowns.reinforceCenter = 15000;
    this.units.filter(u => u.team === 'player' && u.isAlive && (u.unitType === 'SPEARMEN' || u.unitType === 'SWORDSMEN')).forEach(u => {
      u.defense += 12;
      u.morale = 100;
    });
    this.addEvent('COMMAND ORDER', 'Center Line reinforced! Shields locked with unbreakable discipline!');
    return true;
  }

  orderArcherVolley() {
    if (this.orderCooldowns.archerVolley > 0) return false;
    this.orderCooldowns.archerVolley = 12000;
    this.units.filter(u => u.team === 'player' && u.isAlive && u.unitType === 'ARCHERS').forEach(u => {
      u.attackCooldown = 0;
      u.attack += 15;
    });
    this.addEvent('COMMAND ORDER', 'Sky-Darkening Archer Volley unleashed!');
    if (window.warAudio) window.warAudio.playArrowVolley();
    return true;
  }

  orderReformVyuha() {
    if (this.orderCooldowns.reformVyuha > 0) return false;
    this.orderCooldowns.reformVyuha = 20000;
    this.units.filter(u => u.team === 'player' && u.isAlive).forEach(u => {
      if (u.status === 'routing') u.status = 'marching';
      u.morale = 100;
    });
    this.addEvent('COMMAND ORDER', 'Sacred horns resound! The Vyuha locks back into geometric alignment!');
    if (window.warAudio) window.warAudio.playShankha();
    return true;
  }

  orderWarCry() {
    if (this.orderCooldowns.warCry > 0) return false;
    this.orderCooldowns.warCry = 25000;
    this.units.filter(u => u.team === 'player' && u.isAlive).forEach(u => {
      u.morale = 100;
      u.attack += 14;
    });
    this.addEvent('COMMAND ORDER', 'Thunderous War Cry! All warriors fight with divine vigor!');
    if (window.warAudio) window.warAudio.playShankha();
    return true;
  }

  addEvent(tag, text) {
    const t = Math.floor(this.elapsedTime);
    this.battleEvents.unshift({
      time: `${Math.floor(t / 60)}:${('0' + (t % 60)).slice(-2)}`,
      tag: tag,
      text: text
    });
    if (this.battleEvents.length > 25) this.battleEvents.pop();
  }

  // Calculate detailed Vyuha Accuracy & Strategic Matchup Score
  calculateStrategicScore() {
    const playerAliveCount = this.units.filter(u => u.team === 'player' && u.isAlive).length;
    const opponentAliveCount = this.units.filter(u => u.team === 'opposition' && u.isAlive).length;
    const playerSimTotal = this.units.filter(u => u.team === 'player').length;
    const opponentSimTotal = this.units.filter(u => u.team === 'opposition').length;

    // Scale final numbers to configured army sizes
    const finalPlayerSurvivors = Math.round((playerAliveCount / playerSimTotal) * this.playerTotalInitial);
    const finalOpponentSurvivors = Math.round((opponentAliveCount / opponentSimTotal) * this.opponentTotalInitial);

    // Vyuha Geometric Accuracy Rating Calculation
    const playerV = VYUHAS[this.playerConfig.vyuhaId];
    const opponentV = VYUHAS[this.opponentConfig.vyuhaId];
    const playerP = ATTACK_PATTERNS[this.playerConfig.attackPatternId];
    const opponentP = ATTACK_PATTERNS[this.opponentConfig.attackPatternId];

    let vyuhaAccuracy = 75;
    if (playerV.counters.includes(opponentV.id)) vyuhaAccuracy += 15;
    if (playerV.counteredBy.includes(opponentV.id)) vyuhaAccuracy -= 12;

    let patternAccuracy = 75;
    if (playerP.countersPattern && playerP.countersPattern.includes(opponentP.id)) patternAccuracy += 15;
    if (playerP.counteredByPattern && playerP.counteredByPattern.includes(opponentP.id)) patternAccuracy -= 12;

    const survivalRate = Math.round((finalPlayerSurvivors / this.playerTotalInitial) * 100);
    const linePenetrationScore = Math.min(100, Math.round(((this.opponentCasualties / Math.max(1, opponentSimTotal)) * 100)));

    const grandScore = Math.round(
      (survivalRate * 0.30) +
      (vyuhaAccuracy * 0.25) +
      (patternAccuracy * 0.25) +
      (linePenetrationScore * 0.20)
    );

    let rank = 'Senapati (Commander)';
    if (grandScore >= 90) rank = 'Maharathi (Supreme Master of War)';
    else if (grandScore >= 75) rank = 'Atirathi (Grand Master of Battle)';
    else if (grandScore >= 55) rank = 'Rathi (Elite Chariot Champion)';

    return {
      winner: this.winner,
      winningPartyName: this.winner === 'player' ? (CHARACTERS[this.playerConfig.characterId]?.name || 'Allied Forces') : (CHARACTERS[this.opponentConfig.characterId]?.name || 'Opposition Host'),
      playerInitial: this.playerTotalInitial,
      playerSurvivors: finalPlayerSurvivors,
      playerCasualties: this.playerTotalInitial - finalPlayerSurvivors,
      opponentInitial: this.opponentTotalInitial,
      opponentSurvivors: finalOpponentSurvivors,
      opponentCasualties: this.opponentTotalInitial - finalOpponentSurvivors,
      vyuhaAccuracy: Math.min(100, Math.max(30, vyuhaAccuracy)),
      patternAccuracy: Math.min(100, Math.max(30, patternAccuracy)),
      survivalRate,
      linePenetrationScore,
      grandScore,
      rank
    };
  }
}

window.WarSimulation = WarSimulation;
