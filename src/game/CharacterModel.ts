import * as THREE from 'three';
import { PlayerEntity } from '../types';

export interface CharacterMeshContainer {
  root: THREE.Group;
  torso: THREE.Mesh;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  catcherTriangle: THREE.Group;
  auraRing: THREE.Mesh;
  safeShield: THREE.Mesh;
  playerTagCanvas: HTMLCanvasElement;
  playerTagTexture: THREE.CanvasTexture;
  playerTagSprite: THREE.Sprite;
  updateAnimation: (delta: number, entity: PlayerEntity, isCatcher: boolean) => void;
  dispose: () => void;
}

export function createCharacterMesh(player: PlayerEntity): CharacterMeshContainer {
  const root = new THREE.Group();
  root.position.set(player.x, player.y, player.z);

  // Materials
  const skinMat = new THREE.MeshLambertMaterial({ color: player.skinColor });
  const shirtMat = new THREE.MeshLambertMaterial({ color: player.shirtColor });
  const pantsMat = new THREE.MeshLambertMaterial({ color: player.pantsColor });
  const shoeMat = new THREE.MeshLambertMaterial({ color: 0x22262c });
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a202c });
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x8b3a3a });
  const hairMat = new THREE.MeshLambertMaterial({ color: player.hairColor });

  // 1. Torso (Hoodie)
  const torsoGeom = new THREE.BoxGeometry(0.55, 0.65, 0.38);
  // Soften torso edges with rounded corners or bevel look
  const torso = new THREE.Mesh(torsoGeom, shirtMat);
  torso.position.y = 0.85;
  torso.castShadow = true;
  torso.receiveShadow = true;
  root.add(torso);

  // Hoodie pocket detail
  const pocketGeom = new THREE.BoxGeometry(0.38, 0.18, 0.05);
  const pocketMat = new THREE.MeshLambertMaterial({ color: player.shirtColor });
  const pocket = new THREE.Mesh(pocketGeom, pocketMat);
  pocket.position.set(0, -0.15, 0.2);
  torso.add(pocket);

  // Hoodie collar / drawstrings
  const collarGeom = new THREE.CylinderGeometry(0.2, 0.22, 0.08, 12);
  const collar = new THREE.Mesh(collarGeom, shirtMat);
  collar.position.y = 0.35;
  torso.add(collar);

  // 2. Head Group
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.35;
  root.add(headGroup);

  // Stylized head shape (cute rounded box / sphere hybrid)
  const headGeom = new THREE.SphereGeometry(0.32, 16, 16);
  headGeom.scale(1, 1.05, 0.95);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Big Cartoon Eyes
  [-0.11, 0.11].forEach(x => {
    const eyeWhiteGeom = new THREE.SphereGeometry(0.085, 12, 12);
    eyeWhiteGeom.scale(0.8, 1.1, 0.3);
    const eyeWhite = new THREE.Mesh(eyeWhiteGeom, whiteMat);
    eyeWhite.position.set(x, 0.04, 0.27);
    headGroup.add(eyeWhite);

    const pupilGeom = new THREE.SphereGeometry(0.045, 10, 10);
    pupilGeom.scale(0.8, 1, 0.2);
    const pupil = new THREE.Mesh(pupilGeom, eyeMat);
    pupil.position.set(x, 0.04, 0.29);
    headGroup.add(pupil);

    // Eye glint
    const glintGeom = new THREE.SphereGeometry(0.015, 6, 6);
    const glint = new THREE.Mesh(glintGeom, whiteMat);
    glint.position.set(x + 0.015, 0.065, 0.3);
    headGroup.add(glint);

    // Eyebrows
    const browGeom = new THREE.BoxGeometry(0.08, 0.02, 0.02);
    const brow = new THREE.Mesh(browGeom, hairMat);
    brow.position.set(x, 0.15, 0.27);
    brow.rotation.z = x < 0 ? 0.15 : -0.15;
    headGroup.add(brow);
  });

  // Nose & Cute Smile
  const noseGeom = new THREE.SphereGeometry(0.03, 8, 8);
  const nose = new THREE.Mesh(noseGeom, skinMat);
  nose.position.set(0, -0.01, 0.32);
  headGroup.add(nose);

  const mouthGeom = new THREE.BoxGeometry(0.09, 0.03, 0.02);
  const mouth = new THREE.Mesh(mouthGeom, mouthMat);
  mouth.position.set(0, -0.12, 0.28);
  headGroup.add(mouth);

  // Hair generation depending on character
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  if (player.hairStyle === 'cap') {
    // Kabir's cool backwards/tilted baseball cap
    const capBaseGeom = new THREE.SphereGeometry(0.33, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMat = new THREE.MeshLambertMaterial({ color: 0x1f2937 });
    const capBase = new THREE.Mesh(capBaseGeom, capMat);
    capBase.position.y = 0.05;
    hairGroup.add(capBase);

    const visorGeom = new THREE.BoxGeometry(0.28, 0.03, 0.22);
    const visorMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const visor = new THREE.Mesh(visorGeom, visorMat);
    visor.position.set(0, 0.06, -0.32);
    visor.rotation.x = -0.2;
    hairGroup.add(visor);
  } else if (player.hairStyle === 'ponytail') {
    // Riya's cute ponytail
    const hairCap = new THREE.SphereGeometry(0.33, 14, 14, 0, Math.PI * 2, 0, Math.PI / 1.8);
    const cap = new THREE.Mesh(hairCap, hairMat);
    cap.position.y = 0.03;
    hairGroup.add(cap);

    const tailGeom = new THREE.ConeGeometry(0.12, 0.45, 10);
    const tail = new THREE.Mesh(tailGeom, hairMat);
    tail.position.set(0, 0.15, -0.38);
    tail.rotation.x = -1.2;
    hairGroup.add(tail);

    const bandGeom = new THREE.TorusGeometry(0.06, 0.02, 8, 12);
    const bandMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const band = new THREE.Mesh(bandGeom, bandMat);
    band.position.set(0, 0.15, -0.34);
    hairGroup.add(band);
  } else if (player.hairStyle === 'bob') {
    // Sana's wavy bob
    const hairCap = new THREE.SphereGeometry(0.34, 14, 14);
    const cap = new THREE.Mesh(hairCap, hairMat);
    cap.scale.set(1.04, 1.05, 1.05);
    cap.position.set(0, 0.05, -0.05);
    hairGroup.add(cap);
  } else {
    // Spiky / messy runner hair (Aarav / Vihaan)
    const hairCap = new THREE.SphereGeometry(0.33, 14, 14, 0, Math.PI * 2, 0, Math.PI / 1.7);
    const cap = new THREE.Mesh(hairCap, hairMat);
    cap.position.y = 0.04;
    hairGroup.add(cap);

    // Spikes
    for (let i = 0; i < 5; i++) {
      const spikeGeom = new THREE.ConeGeometry(0.07, 0.16, 6);
      const spike = new THREE.Mesh(spikeGeom, hairMat);
      const angle = (i - 2) * 0.35;
      spike.position.set(Math.sin(angle) * 0.22, 0.35, Math.cos(angle) * 0.12);
      spike.rotation.z = -angle * 0.5;
      spike.rotation.x = 0.2;
      hairGroup.add(spike);
    }
  }

  // 3. Arms
  function createArm(isLeft: boolean): THREE.Group {
    const armGroup = new THREE.Group();
    armGroup.position.set(isLeft ? -0.35 : 0.35, 1.05, 0);

    // Upper arm
    const upperGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.32, 8);
    upperGeom.translate(0, -0.16, 0);
    const upper = new THREE.Mesh(upperGeom, shirtMat);
    upper.castShadow = true;
    armGroup.add(upper);

    // Forearm & Hand
    const handGeom = new THREE.SphereGeometry(0.075, 8, 8);
    handGeom.scale(1, 1.3, 0.9);
    handGeom.translate(0, -0.36, 0);
    const hand = new THREE.Mesh(handGeom, skinMat);
    armGroup.add(hand);

    root.add(armGroup);
    return armGroup;
  }

  const leftArm = createArm(true);
  const rightArm = createArm(false);

  // 4. Legs
  function createLeg(isLeft: boolean): THREE.Group {
    const legGroup = new THREE.Group();
    legGroup.position.set(isLeft ? -0.16 : 0.16, 0.55, 0);

    // Leg (Pants)
    const legGeom = new THREE.CylinderGeometry(0.09, 0.08, 0.45, 8);
    legGeom.translate(0, -0.22, 0);
    const leg = new THREE.Mesh(legGeom, pantsMat);
    leg.castShadow = true;
    legGroup.add(leg);

    // Shoe / Sneaker
    const shoeGeom = new THREE.BoxGeometry(0.14, 0.11, 0.26);
    shoeGeom.translate(0, -0.45, 0.05);
    const shoe = new THREE.Mesh(shoeGeom, shoeMat);
    shoe.castShadow = true;
    legGroup.add(shoe);

    // Shoe sole white stripe
    const soleGeom = new THREE.BoxGeometry(0.145, 0.03, 0.27);
    soleGeom.translate(0, -0.49, 0.05);
    const sole = new THREE.Mesh(soleGeom, whiteMat);
    legGroup.add(sole);

    root.add(legGroup);
    return legGroup;
  }

  const leftLeg = createLeg(true);
  const rightLeg = createLeg(false);

  // 5. CATCHER Glowing Inverted Red Triangle
  const catcherTriangle = new THREE.Group();
  catcherTriangle.position.y = 2.15;

  // Inverted cone / 3-sided pyramid pointing down
  const coneGeom = new THREE.ConeGeometry(0.24, 0.42, 3);
  coneGeom.rotateX(Math.PI); // Inverted so it points downwards!
  const redGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    emissive: 0xff1111,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.3,
  });
  const coneMesh = new THREE.Mesh(coneGeom, redGlowMat);
  catcherTriangle.add(coneMesh);

  // Triangle floating text or inner diamond
  const innerGeom = new THREE.OctahedronGeometry(0.09);
  const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const inner = new THREE.Mesh(innerGeom, innerMat);
  inner.position.y = 0.02;
  catcherTriangle.add(inner);

  root.add(catcherTriangle);
  catcherTriangle.visible = player.role === 'CATCHER';

  // 6. Ground Aura Ring for Catcher
  const auraGeom = new THREE.RingGeometry(0.55, 0.75, 24);
  auraGeom.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xff2222,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });
  const auraRing = new THREE.Mesh(auraGeom, auraMat);
  auraRing.position.y = 0.03;
  root.add(auraRing);
  auraRing.visible = player.role === 'CATCHER';

  // 7. Safe Shield Halo (when on Pahad)
  const safeGeom = new THREE.RingGeometry(0.55, 0.7, 24);
  safeGeom.rotateX(-Math.PI / 2);
  const safeMat = new THREE.MeshBasicMaterial({
    color: 0x4ade80,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });
  const safeShield = new THREE.Mesh(safeGeom, safeMat);
  safeShield.position.y = 0.03;
  root.add(safeShield);
  safeShield.visible = player.state === 'ON_PAHAD';

  // 8. Overhead Player Name/Role Badge Sprite
  const playerTagCanvas = document.createElement('canvas');
  playerTagCanvas.width = 256;
  playerTagCanvas.height = 64;
  const playerTagTexture = new THREE.CanvasTexture(playerTagCanvas);
  playerTagTexture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({
    map: playerTagTexture,
    transparent: true,
    depthTest: false,
  });
  const playerTagSprite = new THREE.Sprite(spriteMat);
  playerTagSprite.scale.set(1.4, 0.35, 1);
  playerTagSprite.position.y = 1.9;
  root.add(playerTagSprite);

  // Render tag sprite canvas
  const renderTagCanvas = (isCatcher: boolean) => {
    const ctx = playerTagCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 256, 64);

    // Pill background
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(10, 8, 236, 48, 24);
    ctx.fillStyle = isCatcher ? 'rgba(220, 38, 38, 0.95)' : 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = isCatcher ? '#fecaca' : player.hexColor;
    ctx.stroke();

    // Badge circle
    ctx.beginPath();
    ctx.arc(36, 32, 16, 0, Math.PI * 2);
    ctx.fillStyle = isCatcher ? '#991b1b' : player.hexColor;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isCatcher ? 'C' : player.badge, 36, 32);

    // Text Label
    ctx.font = 'bold 20px "Fredoka", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    const label = isCatcher ? 'CATCHER' : player.name;
    ctx.fillText(label, 64, 33);

    ctx.restore();
    playerTagTexture.needsUpdate = true;
  };

  renderTagCanvas(player.role === 'CATCHER');

  // Animation state tracker
  let animTime = Math.random() * 10;
  let lastRole = player.role;

  const updateAnimation = (delta: number, entity: PlayerEntity, isCatcher: boolean) => {
    animTime += delta;

    // Sync position
    root.position.set(entity.x, entity.y, entity.z);

    // Smooth rotation towards velocity/facing
    root.rotation.y = entity.rotation;

    // Check if role changed to update tag
    if (isCatcher !== (lastRole === 'CATCHER')) {
      lastRole = isCatcher ? 'CATCHER' : 'PAHAD_PLAYER';
      renderTagCanvas(isCatcher);
      catcherTriangle.visible = isCatcher;
      auraRing.visible = isCatcher;
    }

    // Update safe shield
    safeShield.visible = !isCatcher && entity.state === 'ON_PAHAD';

    // Catcher indicators motion
    if (isCatcher) {
      catcherTriangle.position.y = 2.15 + Math.sin(animTime * 6) * 0.08;
      catcherTriangle.rotation.y = animTime * 3;
      auraRing.rotation.z = animTime * 1.5;
      const pulse = 0.5 + Math.sin(animTime * 8) * 0.2;
      (auraRing.material as THREE.MeshBasicMaterial).opacity = pulse;
    }

    // Safe shield gentle rotation
    if (safeShield.visible) {
      safeShield.rotation.z = animTime * 1.2;
    }

    // Movement speed
    const horizSpeed = Math.sqrt(entity.vx * entity.vx + entity.vz * entity.vz);
    const isMoving = horizSpeed > 0.3;

    if (entity.state === 'CAUGHT') {
      // Caught stagger / spin
      torso.position.y = 0.85 + Math.sin(animTime * 14) * 0.05;
      torso.rotation.z = Math.sin(animTime * 10) * 0.2;
      leftArm.rotation.x = -1.2;
      rightArm.rotation.x = -1.2;
      headGroup.rotation.y = Math.sin(animTime * 12) * 0.3;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
    } else if (entity.isAirborne) {
      // Jump pose
      leftArm.rotation.x = -1.5;
      rightArm.rotation.x = -1.5;
      leftLeg.rotation.x = -0.4;
      rightLeg.rotation.x = -0.4;
      torso.position.y = 0.9;
    } else if (isMoving) {
      // Running cycle
      const strideFreq = 12 * Math.min(1.6, horizSpeed / 3.5);
      const swing = Math.sin(animTime * strideFreq);

      // Legs swing
      leftLeg.rotation.x = swing * 0.75;
      rightLeg.rotation.x = -swing * 0.75;

      // Arms swing opposite to legs
      leftArm.rotation.x = -swing * 0.85;
      rightArm.rotation.x = swing * 0.85;

      // Subtle torso lean into running + bounce
      torso.position.y = 0.85 + Math.abs(Math.sin(animTime * strideFreq)) * 0.08;
      torso.rotation.x = 0.15; // Lean forward
      headGroup.position.y = 1.35 + Math.abs(Math.sin(animTime * strideFreq)) * 0.06;
      headGroup.rotation.x = -0.05;
    } else {
      // Idle breathing
      const breath = Math.sin(animTime * 2.5);
      torso.position.y = 0.85 + breath * 0.02;
      torso.rotation.x = 0;
      torso.rotation.z = 0;
      headGroup.position.y = 1.35 + breath * 0.02;
      headGroup.rotation.y = Math.sin(animTime * 0.8) * 0.08; // Looking around gently
      leftArm.rotation.x = Math.sin(animTime * 2.5) * 0.05;
      rightArm.rotation.x = -Math.sin(animTime * 2.5) * 0.05;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
    }
  };

  const dispose = () => {
    try {
      playerTagTexture.dispose();
      root.traverse(obj => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
        if ((obj as THREE.Mesh).material) {
          const mat = (obj as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach(m => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });
    } catch {
      // ignore
    }
    if (root.parent) {
      root.parent.remove(root);
    }
  };

  return {
    root,
    torso,
    head: headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    catcherTriangle,
    auraRing,
    safeShield,
    playerTagCanvas,
    playerTagTexture,
    playerTagSprite,
    updateAnimation,
    dispose,
  };
}
