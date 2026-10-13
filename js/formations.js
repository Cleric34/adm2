// Formations Engine: The 8 Great Vyuhas of Ancient Indian Warfare
const VYUHAS = {
  padma: {
    id: 'padma',
    name: 'Padma Vyuha',
    sanskritName: 'पद्मव्यूह (The Divine Lotus)',
    title: 'Concentric Layered Citadel',
    description: 'A multi-layered circular lotus formation. The outer petals absorb and deflect incoming charges, while the center core houses elite archers and the Commander in impregnable defense.',
    strengths: ['Supreme defensive resilience (+35% Defense)', 'Resistant to flank attacks', 'Protects archers and commanders within inner petals'],
    weaknesses: ['Slow forward march speed (-20% Speed)', 'Low shock charge impact', 'Vulnerable to concentrated spearhead piercers'],
    counteredBy: ['krauncha', 'makara'],
    counters: ['ardhachandra', 'garuda'],
    geometry: 'Concentric Petal Rings',
    lore: 'Used on the 7th day of Kurukshetra by Drona. An impenetrable fortress of men that rotates like blooming petals.',
    generateSlots: function(totalCount, comp) {
      const slots = [];
      // Reserve center for commander & elite
      const coreCount = Math.max(1, Math.floor(totalCount * 0.05));
      const innerCount = Math.floor(totalCount * 0.25);
      const outerCount = totalCount - coreCount - innerCount;

      // Center Core
      for (let i = 0; i < coreCount; i++) {
        const angle = (i / coreCount) * Math.PI * 2;
        const r = 4 + (i * 2) % 6;
        slots.push({
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          role: 'center_commander',
          sector: 'core',
          layer: 0
        });
      }

      // Inner Petals (Archers & Elite Chariots)
      for (let i = 0; i < innerCount; i++) {
        const angle = (i / innerCount) * Math.PI * 2;
        // Wavy petal shape
        const petal = Math.sin(angle * 6) * 5;
        const r = 18 + petal + ((i % 3) * 2.5);
        slots.push({
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          role: 'inner_guard',
          sector: 'inner',
          layer: 1
        });
      }

      // Outer Petals (Infantry, Spearmen, Shield wall)
      for (let i = 0; i < outerCount; i++) {
        const angle = (i / outerCount) * Math.PI * 2;
        const petal = Math.sin(angle * 8) * 8;
        const r = 36 + petal + ((i % 4) * 2.5);
        slots.push({
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          role: 'outer_petal',
          sector: 'outer',
          layer: 2
        });
      }
      return slots;
    }
  },

  garuda: {
    id: 'garuda',
    name: 'Garuda Vyuha',
    sanskritName: 'गरुड़व्यूह (The Celestial Eagle)',
    title: 'Winged Envelopment & Swift Strike',
    description: 'Modeled after the mythical eagle king. Possesses an acute spear-like beak in the front, expansive flanking wings designed to envelop the enemy flanks, and a heavy tail reserve.',
    strengths: ['Devastating flanking speed (+30% Wing Speed)', 'High shock charge bonus (+25% Shock Damage)', 'Rapid pincers crush enemy wings'],
    weaknesses: ['Center spine is narrow', 'If wings fail to close, core can be isolated', 'Vulnerable to crescent containment'],
    counteredBy: ['ardhachandra', 'kurma'],
    counters: ['padma', 'shakata'],
    geometry: 'Beak, Swept Wings, Body, Tail',
    lore: 'Deployed by Bhishma on the 3rd day to sweep across the Pandava ranks with lightning-fast cavalry wings.',
    generateSlots: function(totalCount, comp) {
      const slots = [];
      const beakCount = Math.floor(totalCount * 0.15);
      const wingCount = Math.floor(totalCount * 0.25); // Each wing
      const bodyCount = Math.floor(totalCount * 0.20);
      const tailCount = totalCount - beakCount - (wingCount * 2) - bodyCount;

      // Beak (Forward Point)
      for (let i = 0; i < beakCount; i++) {
        const row = Math.floor(i / 5);
        const col = (i % 5) - 2;
        slots.push({
          x: col * (3 + row * 0.8),
          z: -42 + row * 4,
          role: 'beak_vanguard',
          sector: 'vanguard',
          layer: 0
        });
      }

      // Left Wing (Sweeping out and slightly forward)
      for (let i = 0; i < wingCount; i++) {
        const t = i / wingCount;
        const x = -15 - t * 45;
        const z = -20 + Math.sin(t * Math.PI) * 15 + (i % 4) * 3;
        slots.push({
          x: x,
          z: z,
          role: 'left_wing',
          sector: 'left_flank',
          layer: 1
        });
      }

      // Right Wing
      for (let i = 0; i < wingCount; i++) {
        const t = i / wingCount;
        const x = 15 + t * 45;
        const z = -20 + Math.sin(t * Math.PI) * 15 + (i % 4) * 3;
        slots.push({
          x: x,
          z: z,
          role: 'right_wing',
          sector: 'right_flank',
          layer: 1
        });
      }

      // Body (Center & Commander)
      for (let i = 0; i < bodyCount; i++) {
        const row = Math.floor(i / 6);
        const col = (i % 6) - 2.5;
        slots.push({
          x: col * 4.5,
          z: -10 + row * 4,
          role: 'body_center',
          sector: 'center',
          layer: 2
        });
      }

      // Tail (Reserves & Rearguard)
      for (let i = 0; i < tailCount; i++) {
        const row = Math.floor(i / 8);
        const col = (i % 8) - 3.5;
        slots.push({
          x: col * 4,
          z: 18 + row * 3.5,
          role: 'tail_reserve',
          sector: 'reserve',
          layer: 3
        });
      }
      return slots;
    }
  },

  krauncha: {
    id: 'krauncha',
    name: 'Krauncha Vyuha',
    sanskritName: 'क्रौञ्चव्यूह (The Heron Piercer)',
    title: 'Lethal Armor-Piercing Wedge',
    description: 'An elongated needle-point spearhead formation modeled after a crane. Concentrates tremendous kinetic mass into a narrow vanguard to shatter the thickest shield wall.',
    strengths: ['Ultimate penetration power (+40% Frontal Breach)', 'Decimates static defensive formations', 'High focus fire on enemy commanders'],
    weaknesses: ['Exposed flanks during deep penetration', 'Vulnerable to crescent envelopment (Ardhachandra)', 'Cannot easily change direction'],
    counteredBy: ['ardhachandra', 'kurma'],
    counters: ['padma', 'shakata'],
    geometry: 'Sharp Needle Wedge & Swept Tail',
    lore: 'Arjuna deployed Krauncha Vyuha on the 2nd day to shatter the fortified Kaurava center.',
    generateSlots: function(totalCount, comp) {
      const slots = [];
      const beakCount = Math.floor(totalCount * 0.30);
      const wingCount = Math.floor(totalCount * 0.18);
      const neckBodyCount = Math.floor(totalCount * 0.24);
      const tailCount = totalCount - beakCount - (wingCount * 2) - neckBodyCount;

      // Piercing Beak (Triangle wedge point)
      for (let i = 0; i < beakCount; i++) {
        const row = Math.floor(Math.sqrt(i * 2));
        const colInRow = i - Math.floor((row * (row + 1)) / 2);
        const x = (colInRow - row / 2) * 3.8;
        const z = -50 + row * 3.8;
        slots.push({
          x: x,
          z: z,
          role: 'krauncha_beak',
          sector: 'vanguard',
          layer: 0
        });
      }

      // Left swept wing
      for (let i = 0; i < wingCount; i++) {
        const t = i / wingCount;
        slots.push({
          x: -12 - t * 38,
          z: -15 + t * 25 + (i % 3) * 3,
          role: 'krauncha_left_wing',
          sector: 'left_flank',
          layer: 1
        });
      }

      // Right swept wing
      for (let i = 0; i < wingCount; i++) {
        const t = i / wingCount;
        slots.push({
          x: 12 + t * 38,
          z: -15 + t * 25 + (i % 3) * 3,
          role: 'krauncha_right_wing',
          sector: 'right_flank',
          layer: 1
        });
      }

      // Neck & Heart
      for (let i = 0; i < neckBodyCount; i++) {
        const row = Math.floor(i / 5);
        const col = (i % 5) - 2;
        slots.push({
          x: col * 3.5,
          z: -18 + row * 3.8,
          role: 'krauncha_heart',
          sector: 'center',
          layer: 2
        });
      }

      // Tail
      for (let i = 0; i < tailCount; i++) {
        const row = Math.floor(i / 6);
        const col = (i % 6) - 2.5;
        slots.push({
          x: col * 4,
          z: 15 + row * 3.8,
          role: 'krauncha_tail',
          sector: 'reserve',
          layer: 3
        });
      }
      return slots;
    }
  },

  makara: {
    id: 'makara',
    name: 'Makara Vyuha',
    sanskritName: 'मकरव्यूह (The Armored Crocodile)',
    title: 'Heavy Beast Trampling Juggernaut',
    description: 'An aggressive amphibious predator formation. Places massive armored war elephants and heavy chariots at the jaws to crush and trample enemy infantry beneath colossal weight.',
    strengths: ['Highest shock & trample damage (+35% Trample Power)', 'Causes fear and morale collapse in infantry', 'Devastating against loose lines'],
    weaknesses: ['Low agility and turning speed', 'Vulnerable to agile archers and cavalry encircling from behind', 'Elephants can go berserk if isolated'],
    counteredBy: ['ardhachandra', 'kurma'],
    counters: ['krauncha', 'garuda'],
    geometry: 'Serrated Jaws, Armored Torso, Sweeping Tail',
    lore: 'Used by both Bhishma and Dhrishtadyumna to deliver heavy beast-driven breakthroughs.',
    generateSlots: function(totalCount, comp) {
      const slots = [];
      const jawCount = Math.floor(totalCount * 0.28);
      const torsoCount = Math.floor(totalCount * 0.44);
      const tailCount = totalCount - jawCount - torsoCount;

      // Jaws (Left jaw and Right jaw)
      const halfJaw = Math.floor(jawCount / 2);
      for (let i = 0; i < halfJaw; i++) {
        const t = i / halfJaw;
        slots.push({
          x: -8 - t * 24,
          z: -45 + t * 25 + (i % 3) * 3,
          role: 'makara_left_jaw',
          sector: 'vanguard_left',
          layer: 0
        });
      }
      for (let i = 0; i < halfJaw; i++) {
        const t = i / halfJaw;
        slots.push({
          x: 8 + t * 24,
          z: -45 + t * 25 + (i % 3) * 3,
          role: 'makara_right_jaw',
          sector: 'vanguard_right',
          layer: 0
        });
      }

      // Torso (Heavy Elephants & Spearmen)
      for (let i = 0; i < torsoCount; i++) {
        const row = Math.floor(i / 8);
        const col = (i % 8) - 3.5;
        slots.push({
          x: col * 4.8,
          z: -18 + row * 4,
          role: 'makara_torso',
          sector: 'center',
          layer: 1
        });
      }

      // Tail
      for (let i = 0; i < tailCount; i++) {
        const row = Math.floor(i / 4);
        const col = (i % 4) - 1.5;
        slots.push({
          x: col * 3.8 + Math.sin(row) * 6,
          z: 16 + row * 4,
          role: 'makara_tail',
          sector: 'reserve',
          layer: 2
        });
      }
      return slots;
    }
  },

  shakata: {
    id: 'shakata',
    name: 'Shakata Vyuha',
    sanskritName: 'शकटव्यूह (The Fortified Cart)',
    title: 'Impenetrable Wagon Citadel',
    description: 'A fortified rectangular cart/bastion formation. Armored wagons and spearmen bristle outward in a defensive perimeter, creating a mobile field fortress virtually immune to cavalry charges.',
    strengths: ['Massive anti-cavalry and anti-shock bonus (+45% Defense vs Charges)', 'Shielded center for archers to fire with impunity', 'Very high morale cohesion'],
    weaknesses: ['Nearly immobile (-30% March Speed)', 'Incapable of aggressive offensive pursuit', 'Vulnerable to heavy siege chariots and concentrated fire'],
    counteredBy: ['chakravyuha', 'garuda'],
    counters: ['krauncha', 'makara'],
    geometry: 'Armored Box Perimeter & Central Fort',
    lore: 'Drona deployed the Shakata Vyuha on the 11th day to protect King Duryodhana from capture.',
    generateSlots: function(totalCount, comp) {
      const slots = [];
      const perimeterCount = Math.floor(totalCount * 0.60);
      const innerCount = totalCount - perimeterCount;

      // Outer Box Perimeter
      const width = 60;
      const depth = 45;
      for (let i = 0; i < perimeterCount; i++) {
        const perimeter = 2 * (width + depth);
        const d = (i / perimeterCount) * perimeter;
        let x, z;
        if (d < width) {
          x = -width / 2 + d;
          z = -depth / 2;
        } else if (d < width + depth) {
          x = width / 2;
          z = -depth / 2 + (d - width);
        } else if (d < 2 * width + depth) {
          x = width / 2 - (d - (width + depth));
          z = depth / 2;
        } else {
          x = -width / 2;
          z = depth / 2 - (d - (2 * width + depth));
        }
        slots.push({
          x: x + (Math.random() * 2 - 1),
          z: z + (Math.random() * 2 - 1),
          role: 'shakata_wall',
          sector: 'perimeter',
          layer: 0
        });
      }

      // Inner Archers & Commander Reserve
      for (let i = 0; i < innerCount; i++) {
        const row = Math.floor(i / 7);
        const col = (i % 7) - 3;
        slots.push({
          x: col * 5,
          z: -12 + row * 4,
          role: 'shakata_core',
          sector: 'center',
          layer: 1
        });
      }
      return slots;
    }
  },

  kurma: {
    id: 'kurma',
    name: 'Kurma Vyuha',
    sanskritName: 'कूर्मव्यूह (The Armored Tortoise)',
    title: 'Indestructible Iron Shell',
    description: 'A densely packed domed tortoise formation. Every warrior locks shields tightly over their heads and sides, making the army impervious to arrow rain as it steadily grinds forward.',
    strengths: ['Immune to archer volleys (+60% Missile Defense)', 'Extremely resilient front line', 'Unbreakable battle morale (+20 Morale)'],
    weaknesses: ['Very slow advance', 'Restricted weapon swing room (-15% Melee Attack)', 'Can be outflanked by fast cavalry wings'],
    counteredBy: ['krauncha', 'makara'],
    counters: ['garuda', 'ardhachandra'],
    geometry: 'Dense Interlocking Dome / Oval',
    lore: 'Bhishma formed the Kurma Vyuha on the 8th day, repelling waves of Pandava arrows with ironclad patience.',
    generateSlots: function(totalCount, comp) {
      const slots = [];
      const a = 32; // ellipse x-radius
      const b = 24; // ellipse z-radius
      
      // Distribute evenly in concentric rings inside the oval
      let placed = 0;
      const rings = 6;
      for (let r = 1; r <= rings; r++) {
        const ringFraction = r / rings;
        const ringUnits = Math.floor((totalCount * (2 * r - 1)) / (rings * rings));
        const actualUnits = (r === rings) ? (totalCount - placed) : ringUnits;
        for (let i = 0; i < actualUnits; i++) {
          const theta = (i / actualUnits) * Math.PI * 2;
          const rx = a * ringFraction;
          const rz = b * ringFraction;
          slots.push({
            x: Math.cos(theta) * rx,
            z: Math.sin(theta) * rz,
            role: r === rings ? 'shell_perimeter' : (r === 1 ? 'kurma_commander' : 'shell_body'),
            sector: r === rings ? 'perimeter' : 'center',
            layer: rings - r
          });
        }
        placed += actualUnits;
      }
      return slots;
    }
  },

  ardhachandra: {
    id: 'ardhachandra',
    name: 'Ardhachandra Vyuha',
    sanskritName: 'अर्धचन्द्रव्यूह (The Crescent Moon)',
    title: 'Flanking Envelopment Trap',
    description: 'A curved crescent formation. The center retreats slightly while the two horns curve forward around the enemy, clamping shut to encircle and annihilate the invading force.',
    strengths: ['Supreme encirclement ability (+40% Encirclement Penalty on enemy)', 'Direct counter to spearheads and wedges', 'Traps enemy center in crossfire'],
    weaknesses: ['Center line is thin and under immense pressure', 'If center collapses before horns close, formation splits in two', 'Vulnerable to broad defensive shields'],
    counteredBy: ['padma', 'shakata'],
    counters: ['krauncha', 'garuda'],
    geometry: 'Concave Crescent Arc with Swept Horns',
    lore: 'Arjuna favored the Ardhachandra Vyuha on the 12th day, trapping Kaurava charges in its lethal horns.',
    generateSlots: function(totalCount, comp) {
      const slots = [];
      const hornCount = Math.floor(totalCount * 0.28); // Each horn
      const centerCount = totalCount - (hornCount * 2);

      // Left Horn
      for (let i = 0; i < hornCount; i++) {
        const t = i / hornCount;
        const angle = Math.PI * 0.5 + t * Math.PI * 0.45;
        const r = 38 + (i % 3) * 3;
        slots.push({
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r - 15,
          role: 'left_horn',
          sector: 'left_flank',
          layer: 0
        });
      }

      // Right Horn
      for (let i = 0; i < hornCount; i++) {
        const t = i / hornCount;
        const angle = Math.PI * 0.5 - t * Math.PI * 0.45;
        const r = 38 + (i % 3) * 3;
        slots.push({
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r - 15,
          role: 'right_horn',
          sector: 'right_flank',
          layer: 0
        });
      }

      // Recessed Center (Archers, Spearmen & Commander)
      for (let i = 0; i < centerCount; i++) {
        const row = Math.floor(i / 8);
        const col = (i % 8) - 3.5;
        slots.push({
          x: col * 4.2,
          z: 2 + row * 3.8,
          role: 'recessed_center',
          sector: 'center',
          layer: 1
        });
      }
      return slots;
    }
  },

  chakravyuha: {
    id: 'chakravyuha',
    name: 'Chakravyuha',
    sanskritName: 'चक्रव्यूह (The Spinning Disc of Death)',
    title: 'Rotating Labyrinth Spiral',
    description: 'The legendary multi-tiered rotating disc formation. Seven concentric spiral rings rotate continuously. Warriors entering the breach find the entrance closed behind them, attacked from all 360 degrees.',
    strengths: ['Deadly attrition and disorientation', 'Disrupts enemy unit cohesion completely', 'Virtually impossible to retreat from once entered'],
    weaknesses: ['Requires supreme tactical discipline', 'If central commander falls, spiral unravels', 'Can be shattered by high-velocity chariots'],
    counteredBy: ['krauncha', 'makara'],
    counters: ['shakata', 'padma'],
    geometry: '7 Concentric Rotating Spiral Rings',
    lore: 'Constructed by Guru Drona on the 13th day of Kurukshetra. The most feared formation in ancient history, conquered only by Abhimanyu.',
    generateSlots: function(totalCount, comp) {
      const slots = [];
      const spiralTurns = 3.5;
      const maxRadius = 45;
      
      // Central Hub for Commander & Inner Guard
      const hubCount = Math.max(1, Math.floor(totalCount * 0.08));
      for (let i = 0; i < hubCount; i++) {
        const angle = (i / hubCount) * Math.PI * 2;
        slots.push({
          x: Math.cos(angle) * 5,
          z: Math.sin(angle) * 5,
          role: 'chakra_hub',
          sector: 'core',
          layer: 0
        });
      }

      // Archimedean Spiral Rings
      const ringCount = totalCount - hubCount;
      for (let i = 0; i < ringCount; i++) {
        const t = (i / ringCount);
        const theta = t * Math.PI * 2 * spiralTurns;
        const r = 8 + t * (maxRadius - 8);
        
        // Add corridor gaps for authentic rotating maze effect
        const jitter = ((i % 3) - 1) * 1.8;
        slots.push({
          x: Math.cos(theta) * (r + jitter),
          z: Math.sin(theta) * (r + jitter),
          role: 'chakra_ring',
          sector: t > 0.6 ? 'outer' : 'inner',
          layer: Math.floor(t * 7) + 1
        });
      }
      return slots;
    }
  }
};

// Unit class metadata & colors for tactical preview
const UNIT_CLASSES = {
  INFANTRY:   { name: 'Infantry',   color: '#3498db', icon: '⚔️', ratio: 0.35, hp: 100, atk: 18, def: 15, spd: 1.8, range: 2.5 },
  ARCHERS:    { name: 'Archers',    color: '#2ecc71', icon: '🏹', ratio: 0.20, hp: 70,  atk: 26, def: 8,  spd: 1.7, range: 45.0 },
  SWORDSMEN:  { name: 'Swordsmen',  color: '#e74c3c', icon: '🗡️', ratio: 0.15, hp: 95,  atk: 28, def: 14, spd: 2.1, range: 2.8 },
  SPEARMEN:   { name: 'Spearmen',   color: '#9b59b6', icon: '🔱', ratio: 0.10, hp: 110, atk: 20, def: 22, spd: 1.6, range: 4.0 },
  CAVALRY:    { name: 'Cavalry',    color: '#f39c12', icon: '🐎', ratio: 0.08, hp: 160, atk: 32, def: 18, spd: 3.8, range: 3.2 },
  ELEPHANTS:  { name: 'Elephants',  color: '#e67e22', icon: '🐘', ratio: 0.04, hp: 650, atk: 55, def: 35, spd: 1.9, range: 5.0 },
  CHARIOTS:   { name: 'Chariots',   color: '#d4af37', icon: '🛞', ratio: 0.05, hp: 320, atk: 45, def: 24, spd: 3.4, range: 30.0 },
  COMMANDERS: { name: 'Commanders', color: '#ff0055', icon: '👑', ratio: 0.03, hp: 900, atk: 65, def: 40, spd: 2.4, range: 3.5 }
};

// 2D Canvas Preview Generator for Vyuha Selection
function renderVyuhaPreview(canvas, vyuhaId, armyComposition, totalArmySize, isOpponent = false) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Background grid
  ctx.fillStyle = '#141210';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#2d241e';
  ctx.lineWidth = 1;
  const gridSize = 25;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const vyuha = VYUHAS[vyuhaId] || VYUHAS.padma;
  // Sample a representative number of slots for preview (e.g. 150 points)
  const previewSampleCount = Math.min(220, Math.max(60, Math.floor(totalArmySize * 0.25)));
  const slots = vyuha.generateSlots(previewSampleCount, armyComposition);

  // Draw formation contour line
  ctx.strokeStyle = isOpponent ? 'rgba(155, 89, 182, 0.35)' : 'rgba(212, 175, 55, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  if (vyuhaId === 'padma' || vyuhaId === 'kurma' || vyuhaId === 'chakravyuha') {
    ctx.arc(w / 2, h / 2, w * 0.38, 0, Math.PI * 2);
  } else if (vyuhaId === 'ardhachandra') {
    ctx.arc(w / 2, h / 2 - 15, w * 0.35, Math.PI * 0.2, Math.PI * 0.8);
  } else if (vyuhaId === 'krauncha') {
    ctx.moveTo(w / 2, h * 0.15);
    ctx.lineTo(w * 0.2, h * 0.8);
    ctx.lineTo(w * 0.8, h * 0.8);
    ctx.closePath();
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Scale and center
  const scale = (w * 0.42) / 45;
  const cx = w / 2;
  const cy = h / 2 + (isOpponent ? -10 : 10);
  const rot = isOpponent ? Math.PI : 0;

  // Flatten composition into unit types array
  const unitTypes = [];
  const comp = armyComposition || {};
  Object.keys(UNIT_CLASSES).forEach(type => {
    const count = Math.max(1, Math.round(((comp[type] || (totalArmySize * UNIT_CLASSES[type].ratio)) / totalArmySize) * previewSampleCount));
    for (let i = 0; i < count; i++) unitTypes.push(type);
  });

  // Draw slots as colored dots with glow
  slots.forEach((s, idx) => {
    // Rotate if opponent
    const rx = Math.cos(rot) * s.x - Math.sin(rot) * s.z;
    const rz = Math.sin(rot) * s.x + Math.cos(rot) * s.z;

    const px = cx + rx * scale;
    const py = cy + rz * scale;

    const unitType = unitTypes[idx % unitTypes.length] || 'INFANTRY';
    const unitMeta = UNIT_CLASSES[unitType] || UNIT_CLASSES.INFANTRY;

    // Draw unit glow
    ctx.fillStyle = isOpponent ? '#a855f7' : unitMeta.color;
    ctx.beginPath();
    const dotSize = (unitType === 'COMMANDERS' || unitType === 'ELEPHANTS') ? 4.5 : (unitType === 'CHARIOTS' || unitType === 'CAVALRY') ? 3.5 : 2.5;
    ctx.arc(px, py, dotSize, 0, Math.PI * 2);
    ctx.fill();

    // Ring for elite units
    if (unitType === 'COMMANDERS') {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });

  // Label
  ctx.fillStyle = '#e8d8b8';
  ctx.font = 'bold 12px "Cinzel", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(vyuha.name.toUpperCase(), w / 2, h - 14);
}

window.VYUHAS = VYUHAS;
window.UNIT_CLASSES = UNIT_CLASSES;
window.renderVyuhaPreview = renderVyuhaPreview;
