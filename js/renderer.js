// Realistic 3D Kurukshetra Battlefield Renderer with Articulated Human Warriors, Realistic War Beasts & Visceral Blood Blast Engine

class BattlefieldRenderer {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    this.unitMeshes = new Map();
    this.projectileMeshes = [];
    this.dustParticles = null;
    this.bloodParticles = [];
    this.groundBloodDecals = [];

    this.targetCameraPos = null;
    this.targetLookAt = null;
    this.currentLookAt = new THREE.Vector3(0, 0, 0);

    this.currentViewMode = 'OVERVIEW';
    this.materials = {};
  }

  init(containerElement) {
    this.container = containerElement;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene & Atmosphere (Sunset over Kurukshetra plains - NO mountains)
    this.scene = new THREE.Scene();
    const sky = document.createElement('canvas'); sky.width = 4; sky.height = 512;
    const sg = sky.getContext('2d'), gr = sg.createLinearGradient(0, 0, 0, 512);
    [[0, '#14122b'], [0.22, '#3b2447'], [0.36, '#a8483a'], [0.46, '#e8924a'], [0.5, '#b8693c'], [1, '#b8693c']].forEach(s => gr.addColorStop(s[0], s[1]));
    sg.fillStyle = gr; sg.fillRect(0, 0, 4, 512);
    this.scene.background = new THREE.CanvasTexture(sky);
    this.scene.fog = new THREE.FogExp2(0xb8693c, 0.0017);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.8, 2500);
    this.camera.position.set(0, 115, 220);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
      this.controls.minDistance = 3.5; // Allows extreme close-up human inspection!
      this.controls.maxDistance = 550;
      this.controls.target.set(0, 0, 0);
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Terrain (Dusty battlefield plain)
    this.createBattlefieldTerrain();

    // 7. Ambient Dust Particle System
    this.createDustParticles();

    // 8. Reusable Materials
    this.prepareMaterials();

    // Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.setupRaycasting();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffbe8c, 0.95);
    this.scene.add(ambientLight);

    // Low Sun on horizon
    const sunLight = new THREE.DirectionalLight(0xfffae0, 1.5);
    sunLight.position.set(130, 80, -260);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 700;
    const d = 180;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    // Counter dusk glow
    const skyFill = new THREE.DirectionalLight(0x7a4e80, 0.45);
    skyFill.position.set(-110, 45, 200);
    this.scene.add(skyFill);
  }

  createBattlefieldTerrain() {
    const geo = new THREE.PlaneGeometry(3200, 3200, 96, 96);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 0.9 * (Math.abs(x) < 600 && Math.abs(y) < 600 ? 1 : 0);
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#5a4128';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = ['#3f2d1a', '#6e5232', '#4b3721', '#7d6240'][(Math.random() * 4) | 0];
      ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(80, 80);

    const mat = new THREE.MeshLambertMaterial({ map: tex, color: 0xb9b3a4 });
    const terrain = new THREE.Mesh(geo, mat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    this.scene.add(terrain);
  }

  createDustParticles() {
    const count = 900;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = Math.random() * 25 + 0.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;

      vels[i * 3 + 0] = (Math.random() - 0.5) * 0.25;
      vels[i * 3 + 1] = (Math.random() - 0.5) * 0.06;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.userData.vels = vels;

    const mat = new THREE.PointsMaterial({
      color: 0xebb47a,
      size: 0.28,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });

    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
  }

  prepareMaterials() {
    this.materials = {
      skin: new THREE.MeshLambertMaterial({ color: 0xd49b6a }),
      skinShadow: new THREE.MeshLambertMaterial({ color: 0x9e6a45 }),
      hairDark: new THREE.MeshLambertMaterial({ color: 0x1f140e }),
      goldArmor: new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.75, roughness: 0.3 }),
      goldTrim: new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.2 }),
      steelArmor: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.35 }),
      darkSteel: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 }),
      royalRed: new THREE.MeshLambertMaterial({ color: 0xa81c1c }),
      royalPurple: new THREE.MeshLambertMaterial({ color: 0x6b21a8 }),
      steelBlade: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 }),
      bronze: new THREE.MeshStandardMaterial({ color: 0xcd7f32, metalness: 0.7, roughness: 0.4 }),
      wood: new THREE.MeshLambertMaterial({ color: 0x543216 }),
      elephantSkin: new THREE.MeshLambertMaterial({ color: 0x474542 }),
      elephantEarInner: new THREE.MeshLambertMaterial({ color: 0x6e5252 }),
      ivoryTusk: new THREE.MeshStandardMaterial({ color: 0xfffff0, roughness: 0.4 }),
      horseCoatBrown: new THREE.MeshLambertMaterial({ color: 0x5a2d0c }),
      horseCoatBlack: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
      bloodRed: new THREE.MeshBasicMaterial({ color: 0x8b0000, transparent: true, opacity: 0.85 })
    };
  }

  // ==========================================================
  // REALISTIC ANATOMICAL HUMAN WARRIOR BUILDER
  // ==========================================================
  createArticulatedHumanWarrior(unit) {
    const group = new THREE.Group();
    const isPlayer = unit.team === 'player';
    const armorMat = isPlayer ? this.materials.goldArmor : this.materials.steelArmor;
    const clothMat = isPlayer ? this.materials.royalRed : this.materials.royalPurple;
    const trimMat = isPlayer ? this.materials.goldTrim : this.materials.bronze;

    // 1. Torso & Anatomical Cuirass (Molded pectoral plates)
    const torsoGroup = new THREE.Group();
    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.8, 8), armorMat);
    chest.position.y = 1.45;
    chest.castShadow = true;
    torsoGroup.add(chest);

    // Golden / Bronze Emblem on Chest
    const chestEmblem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8), trimMat);
    chestEmblem.rotation.x = Math.PI / 2;
    chestEmblem.position.set(0, 1.55, 0.33);
    torsoGroup.add(chestEmblem);

    // Pauldrons (Shoulder Guards)
    for (let sx of [-0.44, 0.44]) {
      const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), trimMat);
      pauldron.position.set(sx, 1.75, 0);
      torsoGroup.add(pauldron);
    }

    // 2. Head, Face & Ancient Indian Mukuta (Helmet/Crown)
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.22, 6), this.materials.skin);
    neck.position.y = 1.9;
    torsoGroup.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), this.materials.skin);
    head.position.y = 2.12;
    head.castShadow = true;
    torsoGroup.add(head);

    // Hair / Beard
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 5), this.materials.hairDark);
    beard.rotation.x = -Math.PI / 3;
    beard.position.set(0, 2.0, 0.18);
    torsoGroup.add(beard);

    // Mukuta Helmet / Turban with golden peak
    const mukuta = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.45, 6), trimMat);
    mukuta.position.y = 2.4;
    torsoGroup.add(mukuta);

    // Gem on Mukuta
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), isPlayer ? this.materials.goldTrim : this.materials.royalRed);
    gem.position.set(0, 2.3, 0.24);
    torsoGroup.add(gem);

    // 3. Silk Dhoti / Pleated Battle Kilt
    const dhoti = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.42, 0.65, 8), clothMat);
    dhoti.position.y = 0.95;
    torsoGroup.add(dhoti);

    // Royal Sash flowing backwards
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.04), clothMat);
    sash.position.set(-0.25, 0.9, -0.22);
    sash.rotation.x = -0.3;
    torsoGroup.add(sash);

    // 4. Legs, Greaves & Boots
    for (let lx of [-0.18, 0.18]) {
      // Thigh
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.45, 6), this.materials.skin);
      thigh.position.set(lx, 0.65, 0);
      torsoGroup.add(thigh);

      // Greave (Armored shin)
      const greave = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.45, 6), armorMat);
      greave.position.set(lx, 0.26, 0);
      torsoGroup.add(greave);

      // Boot
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.26), this.materials.wood);
      boot.position.set(lx, 0.06, 0.05);
      torsoGroup.add(boot);
    }

    // 5. Arms, Hands & Weaponry
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.45, 1.65, 0);

    const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.55, 6), this.materials.skin);
    lArm.position.y = -0.25;
    leftArmGroup.add(lArm);

    // Armored Vambrace
    const lVambrace = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.28, 6), armorMat);
    lVambrace.position.y = -0.35;
    leftArmGroup.add(lVambrace);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.45, 1.65, 0);

    const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.55, 6), this.materials.skin);
    rArm.position.y = -0.25;
    rightArmGroup.add(rArm);

    const rVambrace = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.28, 6), armorMat);
    rVambrace.position.y = -0.35;
    rightArmGroup.add(rVambrace);

    // Attach Authentic Ancient Indian Weapons based on unit type or commander
    this.attachWeapons(unit, leftArmGroup, rightArmGroup, torsoGroup, armorMat, trimMat);

    group.add(torsoGroup);
    group.add(leftArmGroup);
    group.add(rightArmGroup);

    group.userData.torsoGroup = torsoGroup;
    group.userData.leftArmGroup = leftArmGroup;
    group.userData.rightArmGroup = rightArmGroup;

    return group;
  }

  attachWeapons(unit, lArm, rArm, torso, armorMat, trimMat) {
    const uType = unit.unitType;
    const charData = unit.isCommander ? (CHARACTERS[unit.charId] || CHARACTERS.arjuna) : null;
    const weaponType = charData ? charData.weaponType : (
      uType === 'ARCHERS' ? 'BOW' :
      uType === 'SPEARMEN' ? 'SPEAR' :
      uType === 'SWORDSMEN' ? 'SWORD' :
      uType === 'COMMANDERS' ? 'MACE' : 'SWORD'
    );

    if (weaponType === 'MACE') {
      // Colossal Spiked Gada (Bhima / Duryodhana style)
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 6), this.materials.wood);
      handle.position.set(0, -0.4, 0.4);
      handle.rotation.x = -Math.PI / 4;
      rArm.add(handle);

      // Heavy Fluted Mace Head
      const maceHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), trimMat);
      maceHead.position.set(0, -0.9, 0.9);
      rArm.add(maceHead);

      // Spikes on mace head
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), this.materials.steelBlade);
        spike.position.set(Math.cos(angle) * 0.24, -0.9, 0.9 + Math.sin(angle) * 0.24);
        spike.rotation.z = angle;
        rArm.add(spike);
      }

    } else if (weaponType === 'BOW') {
      // Recurve Longbow (Gandiva / Vijaya style)
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 6, 16, Math.PI), trimMat);
      bow.position.set(0, -0.4, 0.3);
      bow.rotation.y = Math.PI / 2;
      lArm.add(bow);

      // Quiver with arrows on back
      const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.9, 6), this.materials.wood);
      quiver.position.set(0.18, 1.55, -0.32);
      quiver.rotation.z = -0.35;
      torso.add(quiver);

      // Arrow in right hand
      const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), this.materials.wood);
      arrow.position.set(0, -0.35, 0.2);
      arrow.rotation.x = -Math.PI / 2;
      rArm.add(arrow);

    } else if (weaponType === 'SPEAR') {
      // Ancient Heavy Spear / Trishul
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.4, 6), this.materials.wood);
      shaft.position.set(0, 0.2, 0.3);
      shaft.rotation.x = -0.2;
      rArm.add(shaft);

      const spearHead = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 4), this.materials.steelBlade);
      spearHead.position.set(0, 1.9, -0.06);
      rArm.add(spearHead);

      // Red Tassel below spearhead
      const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.2, 6), this.materials.royalRed);
      tassel.position.set(0, 1.6, -0.02);
      rArm.add(tassel);

      // Embossed Round Shield in left hand
      this.attachShield(lArm, trimMat, armorMat);

    } else {
      // Curved Talwar Sword & Round Shield
      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.35, 6), trimMat);
      hilt.position.set(0, -0.45, 0.1);
      hilt.rotation.x = -Math.PI / 4;
      rArm.add(hilt);

      // Curved steel blade
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.16), this.materials.steelBlade);
      blade.position.set(0, -0.85, 0.45);
      blade.rotation.x = -Math.PI / 4;
      rArm.add(blade);

      // Round Shield in left hand
      this.attachShield(lArm, trimMat, armorMat);
    }
  }

  attachShield(lArm, trimMat, armorMat) {
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 12), armorMat);
    shield.rotation.x = Math.PI / 2;
    shield.position.set(0, -0.35, 0.2);
    lArm.add(shield);

    // Rim & Boss
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.03, 6, 16), trimMat);
    rim.position.set(0, -0.35, 0.24);
    lArm.add(rim);

    const boss = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), trimMat);
    boss.position.set(0, -0.35, 0.28);
    lArm.add(boss);
  }

  // ==========================================================
  // REALISTIC ANCIENT INDIAN WAR ELEPHANT BUILDER
  // ==========================================================
  createRealisticWarElephant(unit) {
    const group = new THREE.Group();
    const isPlayer = unit.team === 'player';
    const clothMat = isPlayer ? this.materials.royalRed : this.materials.royalPurple;
    const goldMat = this.materials.goldTrim;

    // 1. Massive Arched Torso with heavy grey skin
    const body = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), this.materials.elephantSkin);
    body.scale.set(1.15, 1.25, 1.7);
    body.position.y = 3.6;
    body.castShadow = true;
    group.add(body);

    // 2. Massive Head & Sculpted Forehead
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 10), this.materials.elephantSkin);
    head.scale.set(1.1, 1.2, 1.1);
    head.position.set(0, 4.4, -3.2);
    head.castShadow = true;
    group.add(head);

    // Golden Head Armor Cap (Frontal Diadem)
    const headPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 0.15, 8), goldMat);
    headPlate.rotation.x = Math.PI / 4;
    headPlate.position.set(0, 5.2, -3.2);
    group.add(headPlate);

    // 3. Flapping Wide Ears with pinkish inner shade
    for (let ex of [-1.8, 1.8]) {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 1.4), this.materials.elephantSkin);
      ear.position.set(ex, 4.3, -2.4);
      ear.rotation.y = ex > 0 ? 0.35 : -0.35;
      group.add(ear);

      const earInner = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), this.materials.elephantEarInner);
      earInner.position.set(ex > 0 ? ex - 0.11 : ex + 0.11, 4.3, -2.4);
      earInner.rotation.y = ex > 0 ? Math.PI / 2 + 0.35 : -Math.PI / 2 - 0.35;
      group.add(earInner);
    }

    // 4. Segmented S-Curved Trunk
    const trunkSegments = 5;
    for (let i = 0; i < trunkSegments; i++) {
      const t = i / trunkSegments;
      const r1 = 0.55 * (1 - t * 0.5);
      const r2 = 0.55 * (1 - (t + 0.2) * 0.5);
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, 0.75, 8), this.materials.elephantSkin);
      seg.position.set(0, 3.6 - i * 0.55, -4.2 - Math.sin(t * Math.PI) * 0.7);
      seg.rotation.x = 0.4 - t * 0.8;
      group.add(seg);
    }

    // 5. Curved Long Ivory Tusks with serrated gold/iron caps
    for (let tx of [-0.9, 0.9]) {
      const tusk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.06, 2.5, 8), this.materials.ivoryTusk);
      tusk.position.set(tx, 3.4, -4.5);
      tusk.rotation.x = -1.2;
      tusk.rotation.z = tx > 0 ? -0.2 : 0.2;
      group.add(tusk);

      // Serrated blade cap on tip
      const tipCap = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 4), goldMat);
      tipCap.position.set(tx * 1.1, 4.3, -5.6);
      tipCap.rotation.x = -1.2;
      group.add(tipCap);
    }

    // 6. Richly Embroidered Saddle Carpet (Jhool) draped over back
    const jhool = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.8, 2.4, 10, 1, true, 0, Math.PI), clothMat);
    jhool.rotation.x = Math.PI / 2;
    jhool.position.set(0, 3.9, 0);
    group.add(jhool);

    // Golden fringe border on carpet
    const fringeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 3.6), goldMat);
    fringeL.position.set(-2.7, 2.7, 0);
    group.add(fringeL);
    const fringeR = fringeL.clone();
    fringeR.position.x = 2.7;
    group.add(fringeR);

    // 7. Four Heavy Columnar Legs
    for (let lx of [-1.5, 1.5]) {
      for (let lz of [-1.8, 1.8]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.82, 3.2, 10), this.materials.elephantSkin);
        leg.position.set(lx, 1.6, lz);
        leg.castShadow = true;
        group.add(leg);

        // Nails
        for (let a of [-0.3, 0, 0.3]) {
          const nail = new THREE.Mesh(new THREE.SphereGeometry(0.12, 4, 4), this.materials.ivoryTusk);
          nail.position.set(lx + Math.sin(a) * 0.7, 0.12, lz - Math.cos(a) * 0.7);
          group.add(nail);
        }
      }
    }

    // 8. Ornate Howdah Tower with 4 Pillars & Domed Canopy
    const howdahBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, 3.2), this.materials.wood);
    howdahBase.position.set(0, 5.5, 0.2);
    group.add(howdahBase);

    // Carved Pillars
    for (let px of [-1.2, 1.2]) {
      for (let pz of [-1.3, 1.5]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 6), goldMat);
        pillar.position.set(px, 6.6, 0.2 + pz);
        group.add(pillar);
      }
    }

    // Domed Royal Canopy
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 8), clothMat);
    canopy.position.set(0, 8.2, 0.3);
    group.add(canopy);

    // Archers in howdah
    const archer1 = this.createMiniWarriorFigure(clothMat);
    archer1.position.set(-0.6, 6.2, 0.6);
    group.add(archer1);

    const archer2 = this.createMiniWarriorFigure(clothMat);
    archer2.position.set(0.6, 6.2, 0.6);
    group.add(archer2);

    // Mahout sitting on neck
    const mahout = this.createMiniWarriorFigure(clothMat);
    mahout.position.set(0, 5.0, -1.8);
    group.add(mahout);

    group.scale.set(1.1, 1.1, 1.1);
    return group;
  }

  createMiniWarriorFigure(clothMat) {
    const f = new THREE.Group();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 1.0, 6), clothMat);
    f.add(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), this.materials.skin);
    h.position.y = 0.65;
    f.add(h);
    const mukuta = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 6), this.materials.goldTrim);
    mukuta.position.y = 0.9;
    f.add(mukuta);
    return f;
  }

  // ==========================================================
  // REALISTIC ROYAL WAR CHARIOT (RATHA) BUILDER
  // ==========================================================
  createRealisticWarChariot(unit) {
    const group = new THREE.Group();
    const isPlayer = unit.team === 'player';
    const clothMat = isPlayer ? this.materials.royalRed : this.materials.royalPurple;
    const goldMat = this.materials.goldTrim;

    // Chariot Carriage
    const carriage = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 3.2), this.materials.wood);
    carriage.position.set(0, 1.4, 0.2);
    carriage.castShadow = true;
    group.add(carriage);

    // 12-Spoke Golden Wheels
    for (let wx of [-1.45, 1.45]) {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(wx, 1.2, 0.2);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.12, 8, 20), goldMat);
      wheelGroup.add(rim);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.3, 8), goldMat);
      hub.rotation.z = Math.PI / 2;
      wheelGroup.add(hub);

      // 12 Spokes
      for (let s = 0; s < 12; s++) {
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 4), goldMat);
        spoke.rotation.z = (s / 12) * Math.PI;
        wheelGroup.add(spoke);
      }
      group.add(wheelGroup);
    }

    // Royal Canopy
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.6, 6), goldMat);
    mast.position.set(0, 3.0, 1.2);
    group.add(mast);

    const parasol = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.0, 8), clothMat);
    parasol.position.set(0, 4.6, 1.2);
    group.add(parasol);

    // Standard Flag with emblem
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), clothMat);
    flag.position.set(-1.0, 4.4, 1.2);
    group.add(flag);

    // Archer & Driver figures
    const royalArcher = this.createArticulatedHumanWarrior(unit);
    royalArcher.scale.set(0.85, 0.85, 0.85);
    royalArcher.position.set(0, 1.4, -0.4);
    group.add(royalArcher);

    // Two Armored War Horses in front
    for (let hx of [-0.9, 0.9]) {
      const horse = this.createArmoredWarHorse(clothMat);
      horse.position.set(hx, 0, -3.2);
      group.add(horse);
    }

    return group;
  }

  // ==========================================================
  // REALISTIC ARMORED WAR HORSE & CAVALRY
  // ==========================================================
  createArmoredWarHorse(clothMat) {
    const h = new THREE.Group();
    // Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 2.6, 8), this.materials.horseCoatBrown);
    body.rotation.x = Math.PI / 2;
    body.position.y = 1.6;
    body.castShadow = true;
    h.add(body);

    // Neck & Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.4, 6), this.materials.horseCoatBrown);
    neck.position.set(0, 2.4, -1.2);
    neck.rotation.x = -0.55;
    h.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 1.1), this.materials.horseCoatBrown);
    head.position.set(0, 2.9, -1.8);
    h.add(head);

    // Golden Chamfron (Head Armor)
    const chamfron = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.15), this.materials.goldTrim);
    chamfron.position.set(0, 3.0, -1.9);
    h.add(chamfron);

    // 4 Legs
    for (let lx of [-0.4, 0.4]) {
      for (let lz of [-0.8, 0.8]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 1.6, 6), this.materials.horseCoatBrown);
        leg.position.set(lx, 0.8, lz);
        leg.castShadow = true;
        h.add(leg);
      }
    }
    return h;
  }

  createRealisticCavalry(unit) {
    const group = new THREE.Group();
    const clothMat = unit.team === 'player' ? this.materials.royalRed : this.materials.royalPurple;

    const horse = this.createArmoredWarHorse(clothMat);
    group.add(horse);

    const rider = this.createArticulatedHumanWarrior(unit);
    rider.scale.set(0.9, 0.9, 0.9);
    rider.position.set(0, 1.4, -0.2);
    group.add(rider);

    return group;
  }

  // Master Unit Mesh Factory
  // Cheap 3-mesh soldier with shared geometry/materials for large armies
  createLiteWarrior(unit) {
    const L = this._lite || (this._lite = {
      body: new THREE.CylinderGeometry(0.38, 0.32, 1.5, 6),
      head: new THREE.SphereGeometry(0.24, 6, 5),
      spear: new THREE.CylinderGeometry(0.04, 0.04, 2.8, 4),
      mat: {
        player: new THREE.MeshLambertMaterial({ color: 0xc9a43a }),
        opposition: new THREE.MeshLambertMaterial({ color: 0x8e2b2b })
      }
    });
    const g = new THREE.Group();
    const body = new THREE.Mesh(L.body, L.mat[unit.team] || L.mat.player); body.position.y = 1.1;
    const head = new THREE.Mesh(L.head, this.materials.skin); head.position.y = 2.05;
    const wp = new THREE.Mesh(L.spear, this.materials.wood); wp.position.set(0.5, 1.5, 0.2);
    if (unit.unitType === 'ARCHERS') wp.scale.y = 0.55;
    g.add(body, head, wp);
    return g;
  }


  // ---------- Merged, vertex-coloured models: one draw call per unit ----------
  _g() { return this._G || (this._G = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 8), cone: new THREE.ConeGeometry(0.5, 1, 8), sph: new THREE.SphereGeometry(0.5, 8, 6) }); }

  _merge(parts, grp = 'body', pv = [0, 0, 0]) {
    const pos = [], nor = [], col = [];
    const c = new THREE.Color(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
    for (const p of parts) {
      if ((p.grp || 'body') !== grp) continue;
      const g = this._g()[p.g].toNonIndexed();
      m.compose(v.set(p.p[0] - pv[0], p.p[1] - pv[1], p.p[2] - pv[2]), q.setFromEuler(e.set(...(p.r || [0, 0, 0]))), sc.set(...(p.s || [1, 1, 1])));
      g.applyMatrix4(m);
      c.set(p.c);
      const a = g.attributes.position.array, n = g.attributes.normal.array;
      for (let i = 0; i < a.length; i++) { pos.push(a[i]); nor.push(n[i]); }
      for (let i = 0; i < a.length / 3; i++) col.push(c.r, c.g, c.b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return geo;
  }

  _human(kind, T, y, legs, ox = 0, oz = 0, P = [], anim = true) {
    const SKIN = '#c58a5b', STEEL = '#a9b0b9', WOOD = '#5a3a1c';
    const add = (g, c, p, s, r, grp) => P.push({ g, c, p: [p[0] + ox, p[1] + y, p[2] + oz], s, r, grp: anim ? grp : undefined });
    if (legs) { add('cyl', SKIN, [-0.17, 0.4, 0], [0.22, 0.8, 0.22]); add('cyl', SKIN, [0.17, 0.4, 0], [0.22, 0.8, 0.22]); }
    add('cyl', T.cloth, [0, 0.85, 0], [0.8, 0.55, 0.6]);
    add('cyl', kind === 'archer' ? T.cloth : STEEL, [0, 1.3, 0], [0.62, 0.7, 0.42]);
    add('box', T.dark, [0, 1.1, 0], [0.66, 0.14, 0.46]);
    add('cyl', SKIN, [-0.4, 1.3, 0.05], [0.16, 0.7, 0.16], [0, 0, 0.12], 'arm2');
    add('cyl', SKIN, [0.4, 1.3, 0.05], [0.16, 0.7, 0.16], [0, 0, -0.12], 'arm');
    add('sph', SKIN, [0, 1.85, 0], [0.36, 0.38, 0.36]);
    if (kind === 'archer') add('sph', T.cloth, [0, 1.95, 0], [0.42, 0.3, 0.42]);
    else { add('sph', STEEL, [0, 1.96, 0], [0.42, 0.34, 0.42]); add('cone', T.cloth, [0, 2.27, -0.05], [0.1, 0.3, 0.1]); }
    if (kind === 'spear') {
      add('cyl', WOOD, [0.55, 1.5, 0.35], [0.07, 3.0, 0.07], [0.25, 0, 0], 'arm');
      add('cone', STEEL, [0.55, 3.2, 0.78], [0.14, 0.42, 0.14], [0.25, 0, 0], 'arm');
    }
    if (kind === 'sword' || kind === 'infantry') add('box', STEEL, [0.55, 1.5, 0.55], [0.07, kind === 'sword' ? 1.2 : 0.95, 0.14], [1.1, 0, 0], 'arm');
    if (kind === 'spear' || kind === 'infantry') {
      add('cyl', T.trim, [-0.35, 1.3, 0.35], [0.85, 0.08, 0.85], [Math.PI / 2, 0, 0], 'arm2');
      add('sph', T.dark, [-0.35, 1.3, 0.42], [0.22, 0.22, 0.22], undefined, 'arm2');
    }
    if (kind === 'archer') {
      add('box', WOOD, [-0.5, 1.5, 0.4], [0.06, 0.9, 0.06], undefined, 'arm2');
      add('box', WOOD, [-0.5, 2.0, 0.3], [0.06, 0.5, 0.06], [-0.5, 0, 0], 'arm2');
      add('box', WOOD, [-0.5, 1.0, 0.3], [0.06, 0.5, 0.06], [0.5, 0, 0], 'arm2');
      add('cyl', WOOD, [0.15, 1.45, -0.4], [0.2, 0.8, 0.2], [0.4, 0, 0]);
    }
    if (anim) P.pv = { arm: [0.4 + ox, 1.6 + y, oz], arm2: [-0.4 + ox, 1.6 + y, oz] };
    return P;
  }

  _horse(T, ox, oz, sc, P) {
    const coat = T.horse, DARK = '#2a211c';
    const add = (g, c, p, s, r) => P.push({ g, c, p: [ox + p[0] * sc, p[1] * sc, oz + p[2] * sc], s: s.map(x => x * sc), r });
    add('box', coat, [0, 1.45, 0], [0.95, 0.95, 1.9]);
    [[-0.3, 0.65], [0.3, 0.65], [-0.3, -0.65], [0.3, -0.65]].forEach(l => { add('cyl', coat, [l[0], 0.6, l[1]], [0.2, 1.2, 0.2]); add('cyl', DARK, [l[0], 0.08, l[1]], [0.24, 0.16, 0.24]); });
    add('box', coat, [0, 2.1, 0.95], [0.4, 1.0, 0.45], [-0.45, 0, 0]);
    add('box', coat, [0, 2.45, 1.45], [0.32, 0.4, 0.75], [0.55, 0, 0]);
    add('box', DARK, [0, 2.3, 0.8], [0.12, 0.9, 0.2], [-0.45, 0, 0]);
    add('cone', DARK, [0, 1.4, -1.15], [0.22, 0.9, 0.22], [2.7, 0, 0]);
    add('box', T.cloth, [0, 1.95, -0.05], [1.0, 0.12, 1.0]);
    return P;
  }

  _elephant(T, P = []) {
    const hide = '#5f5d58', leg = '#4d4b47', WOOD = '#6b4a2b', IV = '#f3ecd5';
    const add = (g, c, p, s, r) => P.push({ g, c, p, s, r });
    add('sph', hide, [0, 3.2, 0], [3.1, 3.2, 4.4]);
    [[-1.1, 1.3], [1.1, 1.3], [-1.1, -1.3], [1.1, -1.3]].forEach(l => add('cyl', leg, [l[0], 1.1, l[1]], [1.1, 2.3, 1.1]));
    P.push({ g: 'sph', c: hide, p: [0, 3.7, 2.9], s: [2.0, 2.2, 2.2], grp: 'head' });
    [[3.2, 3.9], [2.5, 4.3], [1.8, 4.5], [1.1, 4.5]].forEach((t, i) => P.push({ g: 'cyl', c: hide, p: [0, t[0], t[1]], s: [0.8 - i * 0.12, 0.95, 0.8 - i * 0.12], r: [-0.25 + i * 0.12, 0, 0], grp: 'head' }));
    [-0.6, 0.6].forEach(x => P.push({ g: 'cone', c: IV, p: [x, 2.7, 4.25], s: [0.28, 1.7, 0.28], r: [Math.PI / 2 + 0.35, 0, 0], grp: 'head' }));
    [-1, 1].forEach(x => P.push({ g: 'sph', c: '#6e5a58', p: [x * 1.6, 3.8, 2.0], s: [0.28, 1.8, 1.6], grp: 'head' }));
    add('box', T.cloth, [0, 4.75, -0.2], [3.3, 0.2, 3.2]);
    add('box', T.dark, [-1.65, 3.9, -0.2], [0.14, 1.5, 3.0]); add('box', T.dark, [1.65, 3.9, -0.2], [0.14, 1.5, 3.0]);
    add('box', T.trim, [0, 4.5, 1.45], [3.3, 0.18, 0.18]); add('box', T.trim, [0, 4.5, -1.85], [3.3, 0.18, 0.18]);
    add('box', WOOD, [0, 5.2, -0.2], [1.9, 0.7, 2.0]);
    add('cyl', WOOD, [0.9, 6.3, -1.0], [0.1, 3.0, 0.1]); add('box', T.cloth, [1.5, 7.3, -1.0], [1.2, 0.9, 0.06]);
    this._human('archer', T, 4.15, false, 0, -0.2, P, false);
    this._human('sword', T, 3.55, false, 0, 2.55, P, false);
    P.pv = { head: [0, 3.4, 1.7] };
    return P;
  }

  _chariot(T, P = []) {
    const WOOD = '#5a3a1c', DARK = '#2a211c';
    const add = (g, c, p, s, r) => P.push({ g, c, p, s, r });
    add('box', WOOD, [0, 1.0, 0], [2.0, 0.2, 2.2]);
    add('box', T.cloth, [-1.0, 1.5, 0], [0.12, 0.9, 2.2]); add('box', T.cloth, [1.0, 1.5, 0], [0.12, 0.9, 2.2]); add('box', T.cloth, [0, 1.5, -1.05], [2.0, 0.9, 0.12]);
    [-1, 1].forEach(x => { add('cyl', DARK, [x * 1.15, 0.85, 0], [1.7, 0.18, 1.7], [0, 0, Math.PI / 2]); add('cyl', T.trim, [x * 1.22, 0.85, 0], [0.4, 0.2, 0.4], [0, 0, Math.PI / 2]); });
    add('box', WOOD, [0, 1.0, 2.4], [0.14, 0.14, 3.0]);
    this._horse(T, -0.65, 3.4, 0.9, P); this._horse(T, 0.65, 3.4, 0.9, P);
    this._human('archer', T, 1.1, false, -0.4, -0.1, P, false);
    this._human('spear', T, 1.1, false, 0.45, 0.2, P, false);
    add('cyl', WOOD, [0, 3.6, -0.95], [0.08, 3.4, 0.08]); add('box', T.cloth, [0.5, 4.8, -0.95], [1.0, 0.8, 0.05]);
    return P;
  }

  createModel(unit) {
    const key = unit.unitType + '_' + unit.team;
    const protos = this._protos || (this._protos = {});
    const KIND = { ELEPHANTS: 'elephant', CHARIOTS: 'chariot', CAVALRY: 'cavalry', ARCHERS: 'archer', SPEARMEN: 'spear', SWORDSMEN: 'sword' };
    const kind = KIND[unit.unitType] || 'infantry';
    if (!protos[key]) {
      const T = unit.team === 'player'
        ? { cloth: '#e0a82c', dark: '#97691a', trim: '#fff1b8', horse: '#e9e2d2' }
        : { cloth: '#7a2fae', dark: '#431a5e', trim: '#dcbdf2', horse: '#2b2422' };
      let P;
      switch (kind) {
        case 'elephant': P = this._elephant(T); break;
        case 'chariot': P = this._chariot(T); break;
        case 'cavalry': P = this._horse(T, 0, 0, 1, []); this._human('spear', T, 1.15, false, 0, -0.05, P); break;
        case 'archer': P = this._human('archer', T, 0, true); break;
        case 'spear': P = this._human('spear', T, 0, true); break;
        case 'sword': P = this._human('sword', T, 0, true); break;
        default: P = this._human('infantry', T, 0, true);
      }
      const pv = P.pv || {}, geos = {};
      for (const grp of new Set(P.map(p => p.grp || 'body'))) geos[grp] = this._merge(P, grp, pv[grp] || [0, 0, 0]);
      if (!this._arrowGeo) this._arrowGeo = this._merge([
        { g: 'box', c: '#3a2412', p: [0, 0, 0], s: [0.05, 0.05, 1.5] },
        { g: 'cone', c: '#cfd3d8', p: [0, 0, 0.85], s: [0.13, 0.26, 0.13], r: [Math.PI / 2, 0, 0] },
        { g: 'box', c: '#e8e4d8', p: [0, 0.08, -0.65], s: [0.02, 0.16, 0.3] },
        { g: 'box', c: '#e8e4d8', p: [0.08, 0, -0.65], s: [0.16, 0.02, 0.3] }]);
      protos[key] = { geos, pv };
    }
    const { geos, pv } = protos[key];
    const mat = this._vcMat || (this._vcMat = new THREE.MeshLambertMaterial({ vertexColors: true }));
    const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
    const ud = g.userData; ud.model = true; ud.inner = inner; ud.kind = kind; ud.ph = Math.random() * 6.28; ud.pv = pv;
    for (const k in geos) { const m = new THREE.Mesh(geos[k], mat); const p = pv[k] || [0, 0, 0]; m.position.set(p[0], p[1], p[2]); inner.add(m); ud[k] = m; }
    if (kind === 'archer') { const a = new THREE.Mesh(this._arrowGeo, mat); a.position.set(-0.45, 1.6, 0.75); a.visible = false; inner.add(a); ud.arrow = a; }
    const h = ((parseInt(String(unit.id).split('_')[1], 10) || 0) * 37 % 10) / 10;
    g.scale.setScalar((kind === 'elephant' ? 0.85 : 0.95) + h * 0.1);
    return g;
  }

  // ---------- Combat animation ----------
  animUnit(g, u, sim) {
    const ud = g.userData, t = sim.elapsedTime, ph = ud.ph, K = ud.kind, I = ud.inner, pv = ud.pv;
    const cd = Math.max(0, u.attackCooldown || 0);
    const since = t - (u.strikeT === undefined ? -9 : u.strikeT), sinceHit = t - (u.hitT === undefined ? -9 : u.hitT);
    const eng = u.status === 'engaged', mov = u.status === 'marching' || u.status === 'charging' || u.status === 'routing';
    const ele = K === 'elephant', mounted = K === 'cavalry' || K === 'chariot', ranged = K === 'archer';
    const C = (x) => Math.min(1, Math.max(0, x)), L = (a, b, k) => a + (b - a) * k;
    let by = 0, rx = 0, rz = 0, pz = 0;
    if (mov) { const f = ele ? 3.4 : mounted ? 10 : 8, s = Math.sin(t * f + ph); by = Math.abs(s) * (ele ? 0.16 : mounted ? 0.26 : 0.13); rz = s * (ele ? 0.03 : 0.045); rx = mounted ? s * 0.04 : 0.07; }
    else by = Math.sin(t * 2 + ph) * 0.015;
    const wind = (eng && !ranged && cd < 0.35) ? 1 - cd / 0.35 : 0;
    const stride = mov ? Math.sin(t * 8 + ph) * 0.5 : 0;

    if (ele) {
      const hd = ud.head; let hr = Math.sin(t * 3.4 + ph) * (mov ? 0.06 : 0.02);
      if (since < 0.45) {
        hr = since < 0.14 ? L(-0.55, 0.5, since / 0.14) : L(0.5, 0, C((since - 0.14) / 0.31));
        pz += since < 0.14 ? 0.6 * since / 0.14 : 0.6 * (1 - C((since - 0.14) / 0.3));
        rx += since < 0.3 ? 0.08 : 0;
      } else if (wind > 0) { hr = -0.55 * wind; rx -= 0.2 * wind; by += 0.5 * wind; }
      if (hd) hd.rotation.x = hr;
    } else if (!mounted || ud.arm) {
      const arm = ud.arm, arm2 = ud.arm2;
      if (arm && ranged) {
        const aim = eng ? 1 : 0, draw = (aim && cd < 0.9 && since > 0.15) ? C(1 - cd / 0.9) : 0;
        const rec = since < 0.15 ? (1 - since / 0.15) : 0;
        arm.rotation.x = aim ? -1.2 - draw * 0.25 : stride * -0.6; arm.position.z = pv.arm[2] - draw * 0.5 + rec * 0.2; arm.position.y = pv.arm[1];
        if (arm2) arm2.rotation.x = aim ? -1.4 : stride * 0.6;
        if (ud.arrow) { ud.arrow.visible = draw > 0.05; ud.arrow.position.z = 0.75 - draw * 0.4; }
        if (aim) rx -= draw * 0.08;
      } else if (arm) {
        const rest = eng ? -0.55 : -0.2 + stride * 0.4;
        if (K === 'spear' || (K === 'cavalry')) {
          let dz = 0;
          if (since < 0.32) dz = since < 0.12 ? L(0, 0.75, since / 0.12) : L(0.75, 0, C((since - 0.12) / 0.2));
          else if (wind > 0) dz = -0.5 * wind;
          arm.position.z = pv.arm[2] + dz; arm.rotation.x = rest - (since < 0.12 ? 0.2 : 0);
          if (K === 'cavalry') { rx += wind > 0 ? -0.18 * wind : 0; if (since < 0.25) rx += 0.12 * (1 - since / 0.25); }
        } else {
          let th = rest;
          if (since < 0.3) th = since < 0.12 ? L(-2.2, 0.5, since / 0.12) : L(0.5, rest, C((since - 0.12) / 0.18));
          else if (wind > 0) th = L(rest, -2.2, wind);
          arm.rotation.x = th;
          if (since < 0.12) rx += 0.15 * since / 0.12;
        }
        if (arm2) arm2.rotation.x = sinceHit < 0.3 ? -1.0 * (1 - sinceHit / 0.3) - 0.25 : (eng ? -0.3 : -stride * 0.8);
      }
    }
    if (sinceHit < 0.3) { const k = 1 - sinceHit / 0.3, m = ele ? 0.08 : mounted ? 0.45 : 1; rx -= k * 0.4 * m; pz -= k * 0.35 * m; }
    const lift = u.hitLift || 0;
    if (lift > 0 && sinceHit < 0.7) { const q = Math.sin(Math.PI * sinceHit / 0.7); by += q * lift; rx -= q * 0.9; }
    I.position.set(0, by, pz); I.rotation.set(rx, 0, rz);
  }

  animDead(g, u, dt) {
    const ud = g.userData;
    if (ud.fall === undefined) {
      const fx = Math.sin(g.rotation.y), fz = Math.cos(g.rotation.y), dot = (u.hitDX || 0) * fx + (u.hitDZ || 0) * fz;
      ud.fall = dot < 0 ? -Math.PI / 2 : Math.PI / 2; ud.slide = 3 + (u.hitLift || 0) * 3; ud.t0 = 0;
    }
    const I = ud.inner; ud.t0 += dt;
    if (ud.kind === 'elephant') { I.rotation.z = THREE.MathUtils.lerp(I.rotation.z, ud.fall > 0 ? 1.4 : -1.4, 0.04); I.position.y = THREE.MathUtils.lerp(I.position.y, 0.9, 0.04); }
    else { I.rotation.x = THREE.MathUtils.lerp(I.rotation.x, ud.fall, 0.14); I.position.y = THREE.MathUtils.lerp(I.position.y, 0.25, 0.14); }
    if (ud.head) ud.head.rotation.x = THREE.MathUtils.lerp(ud.head.rotation.x, 0.4, 0.05);
    if (ud.slide > 0.05) { g.position.x += (u.hitDX || 0) * ud.slide * dt; g.position.z += (u.hitDZ || 0) * ud.slide * dt; ud.slide *= 0.9; }
  }

  createUnitMesh(unit) {
    const mesh = unit.isCommander ? this.createArticulatedHumanWarrior(unit) : this.createModel(unit);
    const bigCaster = unit.isCommander || unit.unitType === 'ELEPHANTS';
    mesh.traverse(o => { if (o.isMesh) o.castShadow = bigCaster; });

    mesh.position.set(unit.x, 0, unit.z);
    mesh.rotation.y = unit.facingAngle;
    mesh.userData.unitId = unit.id;

    this.scene.add(mesh);
    this.unitMeshes.set(unit.id, mesh);
    return mesh;
  }

  // ==========================================================
  // VISCERAL BLOOD BLAST & COMBAT GORE ENGINE
  // ==========================================================
  initFX() {
    const N = 3500, f = this.fx = { N, i: 0, pos: new Float32Array(N * 3), col: new Float32Array(N * 3), vel: new Float32Array(N * 3), life: new Float32Array(N), max: new Float32Array(N), kind: new Uint8Array(N) };
    for (let i = 0; i < N; i++) f.pos[i * 3 + 1] = -100;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(f.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(f.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.fxPts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, depthWrite: false }));
    this.fxPts.frustumCulled = false; this.scene.add(this.fxPts);
  }

  emitFX(x, y, z, n, kind) {
    const f = this.fx; if (!f) return;
    for (let k = 0; k < n; k++) {
      const i = f.i; f.i = (f.i + 1) % f.N; const o = i * 3, a = Math.random() * 6.283;
      f.pos[o] = x + (Math.random() - 0.5) * 0.4; f.pos[o + 1] = y + Math.random() * 0.4; f.pos[o + 2] = z + (Math.random() - 0.5) * 0.4;
      const sp = kind === 0 ? 3 + Math.random() * 5 : kind === 1 ? 4 + Math.random() * 6 : 0.5 + Math.random() * 1.5;
      f.vel[o] = Math.cos(a) * sp; f.vel[o + 2] = Math.sin(a) * sp; f.vel[o + 1] = kind === 2 ? 0.8 + Math.random() * 1.6 : 1 + Math.random() * 5;
      f.kind[i] = kind; f.max[i] = f.life[i] = kind === 0 ? 0.5 + Math.random() * 0.6 : kind === 1 ? 0.15 + Math.random() * 0.2 : 0.6 + Math.random() * 0.6;
    }
  }

  triggerBloodBlast(x, y, z, damage = 30) {
    this.emitFX(x, y, z, Math.min(16, 5 + Math.floor(damage * 0.18)), 0);
    if (damage > 26 || Math.random() < 0.2) this.createGroundBloodStain(x, z);
  }

  updateBloodParticles(dt) {
    const f = this.fx; if (!f) return;
    const C = [[0.55, 0.03, 0.03], [1, 0.82, 0.4], [0.66, 0.55, 0.42]];
    for (let i = 0; i < f.N; i++) {
      if (f.life[i] <= 0) continue;
      const o = i * 3, kd = f.kind[i]; f.life[i] -= dt;
      if (f.life[i] <= 0) { f.pos[o + 1] = -100; continue; }
      f.pos[o] += f.vel[o] * dt; f.pos[o + 1] += f.vel[o + 1] * dt; f.pos[o + 2] += f.vel[o + 2] * dt;
      if (kd === 2) { f.vel[o] *= 0.96; f.vel[o + 2] *= 0.96; } else f.vel[o + 1] -= 16 * dt;
      if (f.pos[o + 1] < 0.05) { f.pos[o + 1] = 0.05; f.vel[o] = f.vel[o + 1] = f.vel[o + 2] = 0; if (kd === 0) f.life[i] *= 0.9; }
      const fade = Math.min(1, f.life[i] / f.max[i] * 2), c = C[kd];
      f.col[o] = c[0] * fade; f.col[o + 1] = c[1] * fade; f.col[o + 2] = c[2] * fade;
    }
    this.fxPts.geometry.attributes.position.needsUpdate = true; this.fxPts.geometry.attributes.color.needsUpdate = true;
  }

  // ---------- Arrows: one instanced mesh for flying + stuck arrows ----------
  initArrows() {
    if (!this._arrowGeo) this._arrowGeo = this._merge([
      { g: 'box', c: '#3a2412', p: [0, 0, 0], s: [0.05, 0.05, 1.5] },
      { g: 'cone', c: '#cfd3d8', p: [0, 0, 0.85], s: [0.13, 0.26, 0.13], r: [Math.PI / 2, 0, 0] },
      { g: 'box', c: '#e8e4d8', p: [0, 0.08, -0.65], s: [0.02, 0.16, 0.3] },
      { g: 'box', c: '#e8e4d8', p: [0.08, 0, -0.65], s: [0.16, 0.02, 0.3] }]);
    this.arrowIM = new THREE.InstancedMesh(this._arrowGeo, this._vcMat || (this._vcMat = new THREE.MeshLambertMaterial({ vertexColors: true })), 900);
    this.arrowIM.frustumCulled = false; this.arrowIM.count = 0; this.arrowIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.arrowIM); this.stuck = []; this._clock = 0; this._d = new THREE.Object3D();
  }

  addStuck(x, z) { this.stuck.push({ x, z, ry: Math.random() * 6.28, t0: this._clock }); if (this.stuck.length > 300) this.stuck.shift(); }

  createGroundBloodStain(x, z) {
    if (this.groundBloodDecals.length > 250) {
      const old = this.groundBloodDecals.shift();
      this.scene.remove(old);
    }

    const radius = Math.random() * 1.4 + 0.8;
    const geo = new THREE.CircleGeometry(radius, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x4a0a0a,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });

    const decal = new THREE.Mesh(geo, mat);
    decal.rotation.x = -Math.PI / 2;
    decal.position.set(x + (Math.random() * 0.6 - 0.3), 0.04, z + (Math.random() * 0.6 - 0.3));
    this.scene.add(decal);
    this.groundBloodDecals.push(decal);
  }

  updateBloodParticles(deltaSec) {
    for (let i = this.bloodParticles.length - 1; i >= 0; i--) {
      const pSys = this.bloodParticles[i];
      const pos = pSys.geometry.attributes.position;
      const vels = pSys.userData.velocities;
      pSys.userData.life -= pSys.userData.decay;

      for (let j = 0; j < vels.length; j++) {
        let x = pos.getX(j) + vels[j].vx * deltaSec;
        let y = pos.getY(j) + vels[j].vy * deltaSec;
        let z = pos.getZ(j) + vels[j].vz * deltaSec;

        vels[j].vy -= 9.8 * deltaSec; // Gravity pulling blood to ground

        if (y < 0.05) y = 0.05; // Splat on ground
        pos.setXYZ(j, x, y, z);
      }
      pos.needsUpdate = true;
      pSys.material.opacity = pSys.userData.life;

      if (pSys.userData.life <= 0) {
        this.scene.remove(pSys);
        this.bloodParticles.splice(i, 1);
      }
    }
  }

  // ==========================================================
  // UPDATE LOOP (SYNCHRONIZES WITH SIMULATION)
  // ==========================================================
  update(simulation, deltaSec) {
    if (!this.fx) this.initFX();
    if (!this.arrowIM) this.initArrows();
    // 1. Process Blood Bursts triggered by simulation
    if (simulation.pendingBloodBursts && simulation.pendingBloodBursts.length > 0) {
      simulation.pendingBloodBursts.forEach(b => {
        if (b.spark) this.emitFX(b.x, b.y, b.z, 7, 1); else this.triggerBloodBlast(b.x, b.y, b.z, b.damage);
      });
      simulation.pendingBloodBursts = [];
    }

    if (simulation.pendingImpacts && simulation.pendingImpacts.length) { for (const im of simulation.pendingImpacts) { this.emitFX(im.x, 0.3, im.z, 3, 2); this.addStuck(im.x, im.z); } simulation.pendingImpacts = []; }
    this.updateBloodParticles(deltaSec);

    // 2. Synchronize Unit Meshes & Animate Actions
    this.liteMode = simulation.units.length > 160;
    simulation.units.forEach(unit => {
      let mesh = this.unitMeshes.get(unit.id);
      if (mesh && mesh.userData.removed) return;
      if (!mesh) {
        mesh = this.createUnitMesh(unit);
      }

      if (!unit.isAlive) {
        // Slain warrior collapsed in blood pool
        if (mesh.userData.deadAt === undefined) mesh.userData.deadAt = simulation.elapsedTime;
        if (simulation.elapsedTime - mesh.userData.deadAt > (mesh.userData.kind === 'elephant' ? 9 : 3.5) && !mesh.userData.isCmdr) {
          this.scene.remove(mesh);
          mesh.userData.removed = true;
        } else if (mesh.userData.model) {
          this.animDead(mesh, unit, deltaSec);
        } else if (mesh.position.y > 0.1) {
          mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, Math.PI / 2, 0.2);
          mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, 0.05, 0.2);
        }
        return;
      }

      // Check if winning army is celebrating!
      if (simulation.isOver && unit.team === simulation.winner) {
        // Victorious warrior raises weapon to the heavens!
        if (mesh.userData.rightArmGroup) {
          mesh.userData.rightArmGroup.rotation.x = -Math.PI * 0.85; // Weapon held high!
        }
        if (mesh.userData.arm) mesh.userData.arm.rotation.x = -2.8;
        mesh.position.y = Math.abs(Math.sin(simulation.elapsedTime * 6)) * 0.25;
        return;
      }

      // Smooth position interpolation
      mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, unit.x, 0.28);
      mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, unit.z, 0.28);
      { let dA = unit.facingAngle - mesh.rotation.y; dA = Math.atan2(Math.sin(dA), Math.cos(dA)); mesh.rotation.y += dA * 0.2; }
      if (mesh.userData.model) { this.animUnit(mesh, unit, simulation); return; }

      // Walking stride & attack animations
      if (unit.status === 'marching' || unit.status === 'charging' || unit.status === 'routing') {
        const strideSpeed = unit.speed * 8;
        mesh.position.y = Math.abs(Math.sin(simulation.elapsedTime * strideSpeed)) * 0.3;
        if (!mesh.userData.torsoGroup) mesh.rotation.z = Math.sin(simulation.elapsedTime * strideSpeed + unit.attack) * 0.05;
        if (mesh.userData.torsoGroup) {
          mesh.userData.torsoGroup.rotation.y = Math.sin(simulation.elapsedTime * strideSpeed) * 0.15;
        }
      } else if (unit.status === 'engaged') {
        // High-frequency attack thrust / strike animation
        mesh.position.y = Math.abs(Math.sin(simulation.elapsedTime * 12)) * 0.15;
        if (!mesh.userData.rightArmGroup) { mesh.rotation.x = Math.sin(simulation.elapsedTime * 13 + unit.attack) * 0.1; mesh.rotation.z = 0; }
        if (mesh.userData.rightArmGroup) {
          { const cdn = Math.max(0, unit.attackCooldown || 0), sn = simulation.elapsedTime - (unit.strikeT === undefined ? -9 : unit.strikeT); const wd = cdn < 0.45 ? 1 - cdn / 0.45 : 0; mesh.userData.rightArmGroup.rotation.x = sn < 0.35 ? (sn < 0.14 ? THREE.MathUtils.lerp(-2.4, 0.4, sn / 0.14) : THREE.MathUtils.lerp(0.4, -0.4, Math.min(1, (sn - 0.14) / 0.21))) : THREE.MathUtils.lerp(-0.4, -2.4, wd); if (mesh.userData.torsoGroup) mesh.userData.torsoGroup.rotation.y = sn < 0.2 ? 0.35 * (1 - sn / 0.2) : -0.25 * wd; }
        }
      }
    });

    // 3. Render 3D Ballistic Arrows
    this.renderProjectiles(simulation.projectiles);

    // 4. Update Dust Particles
    if (this.dustParticles) {
      const pos = this.dustParticles.geometry.attributes.position;
      const vels = this.dustParticles.geometry.userData.vels;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i) + vels[i * 3 + 0];
        let y = pos.getY(i) + vels[i * 3 + 1];
        let z = pos.getZ(i) + vels[i * 3 + 2];
        if (y < 0.3 || y > 30) vels[i * 3 + 1] *= -1;
        if (x < -200 || x > 200) vels[i * 3 + 0] *= -1;
        if (z < -200 || z > 200) vels[i * 3 + 2] *= -1;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // 5. Camera Interpolation
    this.updateCamera(simulation, deltaSec);

    // 6. Render Frame
    if (this.controls) this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  renderProjectiles(sp) {
    const im = this.arrowIM, d = this._d; this._clock += 0.016; let n = 0;
    for (let i = 0; i < sp.length && n < 600; i++, n++) {
      const p = sp[i], dist = Math.hypot(p.targetX - p.startX, p.targetZ - p.startZ), apex = 0.22 * dist;
      const pos = (t) => [THREE.MathUtils.lerp(p.startX, p.targetX, t), THREE.MathUtils.lerp(p.startY, p.targetY, t) + Math.sin(t * Math.PI) * apex, THREE.MathUtils.lerp(p.startZ, p.targetZ, t)];
      const a = pos(Math.min(1, p.progress)), b = pos(Math.min(1, p.progress + 0.04));
      d.position.set(a[0], a[1], a[2]); d.lookAt(b[0], b[1], b[2]); d.scale.setScalar(1); d.updateMatrix(); im.setMatrixAt(n, d.matrix);
    }
    this.stuck = this.stuck.filter(s => this._clock - s.t0 < 5);
    for (const s of this.stuck) {
      if (n >= 900) break;
      d.position.set(s.x, 0.5, s.z); d.rotation.set(-1.15, s.ry, 0); d.scale.setScalar(1); d.updateMatrix(); im.setMatrixAt(n++, d.matrix);
    }
    im.count = n; im.instanceMatrix.needsUpdate = true;
  }

  // Camera Presets
  setCameraView(viewMode, simulation) {
    this.currentViewMode = viewMode;
    const pCenter = simulation.playerArmyCenter;
    const bCenter = simulation.botArmyCenter;
    const midX = (pCenter.x + bCenter.x) / 2;
    const midZ = (pCenter.z + bCenter.z) / 2;

    switch (viewMode) {
      case 'OVERVIEW':
        this.targetCameraPos = new THREE.Vector3(0, 135, 270);
        this.targetLookAt = new THREE.Vector3(midX, 5, midZ);
        break;
      case 'PLAYER_FORMATION':
        this.targetCameraPos = new THREE.Vector3(pCenter.x, 18, pCenter.z + 45);
        this.targetLookAt = new THREE.Vector3(bCenter.x, 4, bCenter.z);
        break;
      case 'BOT_FORMATION':
        this.targetCameraPos = new THREE.Vector3(bCenter.x, 18, bCenter.z - 45);
        this.targetLookAt = new THREE.Vector3(pCenter.x, 4, pCenter.z);
        break;
      case 'LEFT_FLANK':
        this.targetCameraPos = new THREE.Vector3(-60, 24, midZ + 25);
        this.targetLookAt = new THREE.Vector3(-40, 3, midZ);
        break;
      case 'RIGHT_FLANK':
        this.targetCameraPos = new THREE.Vector3(60, 24, midZ + 25);
        this.targetLookAt = new THREE.Vector3(40, 3, midZ);
        break;
      case 'CENTRE':
        this.targetCameraPos = new THREE.Vector3(midX, 22, midZ + 32);
        this.targetLookAt = new THREE.Vector3(midX, 2, midZ);
        break;
      case 'CAVALRY':
        const cav = simulation.units.find(u => u.isAlive && u.unitType === 'CAVALRY');
        if (cav) {
          this.targetCameraPos = new THREE.Vector3(cav.x - 12, 8, cav.z + 16);
          this.targetLookAt = new THREE.Vector3(cav.x, 2, cav.z);
        }
        break;
      case 'ELEPHANTS':
        const ele = simulation.units.find(u => u.isAlive && u.unitType === 'ELEPHANTS');
        if (ele) {
          this.targetCameraPos = new THREE.Vector3(ele.x - 16, 12, ele.z + 20);
          this.targetLookAt = new THREE.Vector3(ele.x, 4, ele.z);
        }
        break;
      case 'CHARIOTS':
        const ratha = simulation.units.find(u => u.isAlive && u.unitType === 'CHARIOTS');
        if (ratha) {
          this.targetCameraPos = new THREE.Vector3(ratha.x + 12, 8, ratha.z + 16);
          this.targetLookAt = new THREE.Vector3(ratha.x, 3, ratha.z);
        }
        break;
    }
  }

  updateCamera(simulation, deltaSec) {
    if (this.targetCameraPos && this.targetLookAt) {
      this.camera.position.lerp(this.targetCameraPos, 0.08);
      this.currentLookAt.lerp(this.targetLookAt, 0.08);
      this.camera.lookAt(this.currentLookAt);

      if (this.controls) {
        this.controls.target.copy(this.currentLookAt);
      }

      if (this.camera.position.distanceTo(this.targetCameraPos) < 1.0) {
        this.targetCameraPos = null;
        this.targetLookAt = null;
      }
    }
  }

  setupRaycasting() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener('click', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const meshes = Array.from(this.unitMeshes.values()).filter(m => !m.userData.removed);
      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let root = intersects[0].object;
        while (root.parent && root.parent !== this.scene) {
          root = root.parent;
        }
        const unitId = root.userData.unitId;
        if (unitId && window.onUnitClicked) {
          window.onUnitClicked(unitId);
        }
      }
    });
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.BattlefieldRenderer = BattlefieldRenderer;
