// Bot Commander AI: Personalities, Vyuha Counter-Analysis & Tactical Decision Making

const BOT_PERSONALITIES = [
  {
    id: 'bhishma',
    name: 'Bhishma the Grandmaster',
    title: 'Supreme Commander of Kauravas',
    avatar: 'assets/bot_commander.jpg',
    personality: 'DEFENSIVE',
    motto: 'Impenetrable as Mount Meru. A patient defense breaks all fiery arrogance.',
    favoredVyuhas: ['kurma', 'padma', 'shakata'],
    preferredDoctrine: 'DEFENSIVE',
    unitBias: {
      SPEARMEN: 1.4,
      INFANTRY: 1.3,
      ELEPHANTS: 1.1,
      ARCHERS: 1.2,
      CAVALRY: 0.7,
      CHARIOTS: 0.8,
      SWORDSMEN: 0.9,
      COMMANDERS: 1.2
    },
    tacticalCooldown: 12000
  },
  {
    id: 'drona',
    name: 'Guru Drona',
    title: 'Master of Divine Astras & Formations',
    avatar: 'assets/bot_commander.jpg',
    personality: 'BALANCED',
    motto: 'The battlefield is a chessboard of sacred geometry. Every move is calculated.',
    favoredVyuhas: ['chakravyuha', 'krauncha', 'garuda'],
    preferredDoctrine: 'BALANCED',
    unitBias: {
      ARCHERS: 1.3,
      CHARIOTS: 1.4,
      SWORDSMEN: 1.1,
      INFANTRY: 1.0,
      SPEARMEN: 1.0,
      CAVALRY: 1.0,
      ELEPHANTS: 0.9,
      COMMANDERS: 1.3
    },
    tacticalCooldown: 10000
  },
  {
    id: 'karna',
    name: 'Karna the Radiant',
    title: 'King of Anga & Master Archer',
    avatar: 'assets/bot_commander.jpg',
    personality: 'FLANKING',
    motto: 'Strike with the speed of morning sunbeams. Encircle and overwhelm the flanks!',
    favoredVyuhas: ['garuda', 'ardhachandra'],
    preferredDoctrine: 'FLANKING',
    unitBias: {
      CAVALRY: 1.6,
      ARCHERS: 1.4,
      CHARIOTS: 1.3,
      SWORDSMEN: 1.2,
      INFANTRY: 0.8,
      SPEARMEN: 0.8,
      ELEPHANTS: 0.7,
      COMMANDERS: 1.2
    },
    tacticalCooldown: 9000
  },
  {
    id: 'ashwatthama',
    name: 'Ashwatthama the Wrathful',
    title: 'Unstoppable Maharathi of Destruction',
    avatar: 'assets/bot_commander.jpg',
    personality: 'AGGRESSIVE',
    motto: 'No defense survives pure relentless fury. Trample their vanguard into dust!',
    favoredVyuhas: ['makara', 'krauncha'],
    preferredDoctrine: 'AGGRESSIVE',
    unitBias: {
      ELEPHANTS: 1.7,
      CAVALRY: 1.3,
      SWORDSMEN: 1.4,
      CHARIOTS: 1.2,
      INFANTRY: 0.9,
      SPEARMEN: 0.7,
      ARCHERS: 0.8,
      COMMANDERS: 1.3
    },
    tacticalCooldown: 8000
  }
];

class BotCommanderAI {
  constructor() {
    this.personality = null;
    this.chosenVyuha = null;
    this.armySize = 1000;
    this.composition = {};
    this.doctrine = 'BALANCED';
    this.lastTacticalActionTime = 0;
    this.tacticalLog = [];
  }

  // Select personality and analyze player's setup
  init(playerCommanderName, playerArmySize, playerVyuhaId, playerComposition, playerDoctrine) {
    // Select personality (can pick based on player's doctrine or random formidable rival)
    const pIndex = Math.floor(Math.random() * BOT_PERSONALITIES.length);
    this.personality = BOT_PERSONALITIES[pIndex];

    // Army Size: Bot chooses an army size reasonably matched to the player, with tactical variance (±10% to 20%)
    const sizeVariance = (Math.random() * 0.2 - 0.08); // e.g. -8% to +12%
    this.armySize = Math.max(50, Math.min(5000, Math.round(playerArmySize * (1 + sizeVariance))));

    // Intelligent Vyuha Counter Selection
    this.chosenVyuha = this.selectCounterVyuha(playerVyuhaId, this.personality);

    // Army Composition based on personality bias & chosen Vyuha
    this.composition = this.generateComposition(this.armySize, this.chosenVyuha, this.personality);

    // Doctrine
    this.doctrine = this.personality.preferredDoctrine;

    return {
      personality: this.personality,
      armySize: this.armySize,
      vyuhaId: this.chosenVyuha,
      composition: this.composition,
      doctrine: this.doctrine
    };
  }

  // Analyzes the player's chosen formation and selects an optimal counter or personality-favored formation
  selectCounterVyuha(playerVyuhaId, botPersonality) {
    const counterMap = {
      // Garuda (wings): counter with Ardhachandra (envelop wings) or Kurma (dense shield)
      garuda: ['ardhachandra', 'kurma'],
      // Kurma (turtle): counter with Krauncha (needle piercer) or Makara (heavy elephants)
      kurma: ['krauncha', 'makara'],
      // Krauncha (wedge): counter with Ardhachandra (swallow wedge) or Shakata (impenetrable cart)
      krauncha: ['ardhachandra', 'shakata'],
      // Padma (lotus): counter with Garuda (speed envelopment) or Chakravyuha (labyrinths)
      padma: ['garuda', 'chakravyuha'],
      // Chakravyuha (spiral): counter with Krauncha (concentrated drill) or Makara (beast assault)
      chakravyuha: ['krauncha', 'makara'],
      // Ardhachandra (crescent): counter with Padma (concentric fort) or Shakata (cart fort)
      ardhachandra: ['padma', 'shakata'],
      // Makara (crocodile): counter with Kurma (iron shell) or Ardhachandra (surround flank)
      makara: ['kurma', 'ardhachandra'],
      // Shakata (cart): counter with Chakravyuha (spiral) or Garuda (air/wing mobility)
      shakata: ['chakravyuha', 'garuda']
    };

    const directCounters = counterMap[playerVyuhaId] || ['padma', 'kurma'];

    // 70% chance bot uses strategic counter logic; 30% bot sticks to personality signature
    if (Math.random() < 0.70) {
      // Pick one of the counter vyuhas that also meshes with personality, if available
      const personalityMatch = directCounters.find(v => botPersonality.favoredVyuhas.includes(v));
      return personalityMatch || directCounters[Math.floor(Math.random() * directCounters.length)];
    } else {
      const favs = botPersonality.favoredVyuhas;
      return favs[Math.floor(Math.random() * favs.length)];
    }
  }

  // Generates army composition matching exact army size
  generateComposition(totalSoldiers, vyuhaId, personality) {
    const comp = {};
    const baseRatios = { ...UNIT_CLASSES };
    let totalWeight = 0;
    const weights = {};

    Object.keys(baseRatios).forEach(key => {
      const baseRatio = baseRatios[key].ratio;
      const bias = personality.unitBias[key] || 1.0;
      // Also apply Vyuha-specific synergies
      let vyuhaMod = 1.0;
      if (vyuhaId === 'makara' && key === 'ELEPHANTS') vyuhaMod = 1.8;
      if (vyuhaId === 'garuda' && key === 'CAVALRY') vyuhaMod = 1.7;
      if (vyuhaId === 'ardhachandra' && key === 'ARCHERS') vyuhaMod = 1.5;
      if (vyuhaId === 'kurma' && key === 'SPEARMEN') vyuhaMod = 1.6;
      if (vyuhaId === 'krauncha' && key === 'CHARIOTS') vyuhaMod = 1.6;

      const weight = baseRatio * bias * vyuhaMod;
      weights[key] = weight;
      totalWeight += weight;
    });

    let assigned = 0;
    const keys = Object.keys(weights);
    keys.forEach((key, idx) => {
      if (idx === keys.length - 1) {
        // Last one takes remainder to guarantee exact sum
        comp[key] = Math.max(1, totalSoldiers - assigned);
      } else {
        const count = Math.max(1, Math.floor((weights[key] / totalWeight) * totalSoldiers));
        comp[key] = count;
        assigned += count;
      }
    });

    return comp;
  }

  // In-Battle Tactical Decision Loop (evaluated every 2-3 seconds during the battle simulation)
  evaluateBattleTactics(battleState, currentTime) {
    if (currentTime - this.lastTacticalActionTime < this.personality.tacticalCooldown) {
      return null;
    }

    const { botUnits, playerUnits, phase } = battleState;
    if (!botUnits || botUnits.length === 0) return null;

    // Check flank status
    let leftFlankHurt = 0;
    let rightFlankHurt = 0;
    let centerHurt = 0;
    let totalBotAlive = 0;

    botUnits.forEach(u => {
      if (!u.isAlive) return;
      totalBotAlive++;
      if (u.currentHp < u.maxHp * 0.45) {
        if (u.sector && u.sector.includes('left')) leftFlankHurt++;
        else if (u.sector && u.sector.includes('right')) rightFlankHurt++;
        else centerHurt++;
      }
    });

    // Check Player's formation condition
    let playerExposedCenter = false;
    let playerLowMoraleUnits = 0;
    playerUnits.forEach(u => {
      if (u.isAlive && u.morale < 35) playerLowMoraleUnits++;
    });

    let decision = null;

    // Tactical Order 1: Reinforce Left Flank if taking heavy punishment
    if (leftFlankHurt > 8) {
      decision = {
        action: 'REINFORCE_LEFT',
        title: `${this.personality.name} Orders Reserve Wings to Left Flank!`,
        description: 'Deploying heavy infantry to plug the crumbling left defensive line.',
        effect: 'morale_boost_left',
        targetSector: 'left_flank'
      };
    }
    // Tactical Order 2: Reinforce Right Flank
    else if (rightFlankHurt > 8) {
      decision = {
        action: 'REINFORCE_RIGHT',
        title: `${this.personality.name} Bolsters the Right Flank!`,
        description: 'Shifting spear formations to halt enemy flanking maneuvers.',
        effect: 'morale_boost_right',
        targetSector: 'right_flank'
      };
    }
    // Tactical Order 3: Exploit Broken Player Morale with All-Out Cavalry Charge
    else if (playerLowMoraleUnits > 15 || phase >= 5) {
      decision = {
        action: 'CAVALRY_SHOCK_CHARGE',
        title: `${this.personality.name} Unleashes Heavy Shock Cavalry!`,
        description: 'Sensing hesitation in your ranks, enemy cavalry charges into the breach!',
        effect: 'cavalry_speed_charge',
        targetSector: 'all'
      };
    }
    // Tactical Order 4: War Elephants Trample Vanguard
    else if (this.personality.id === 'ashwatthama' && phase >= 3) {
      decision = {
        action: 'ELEPHANT_RAMPAGE',
        title: `Ashwatthama Commands War Elephants Forward!`,
        description: 'Colossal war beasts crash directly into your frontline shield wall!',
        effect: 'elephant_charge',
        targetSector: 'vanguard'
      };
    }
    // Tactical Order 5: Reform Vyuha & Defensive Rally
    else if (centerHurt > 10) {
      decision = {
        action: 'REFORM_VYUHA',
        title: `${this.personality.name} Commands: Reform Vyuha & Close Ranks!`,
        description: 'Enemy commanders rally wavering lines and restore formation cohesion.',
        effect: 'rally_morale',
        targetSector: 'center'
      };
    }

    if (decision) {
      this.lastTacticalActionTime = currentTime;
      this.tacticalLog.push({ time: currentTime, ...decision });
    }

    return decision;
  }
}

window.BotCommanderAI = BotCommanderAI;
window.BOT_PERSONALITIES = BOT_PERSONALITIES;
