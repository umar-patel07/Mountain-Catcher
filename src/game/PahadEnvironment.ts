import * as THREE from 'three';
import { PahadData } from '../types';

export interface EnvironmentResult {
  scene: THREE.Scene;
  pahadMeshes: { id: number; mesh: THREE.Group; beacon: THREE.Mesh }[];
  soccerBall: { mesh: THREE.Mesh; x: number; y: number; z: number; vx: number; vz: number };
  updateEnvironment: (delta: number, currentPahads?: PahadData[]) => void;
  dispose: () => void;
}

export function createPlaygroundEnvironment(
  scene: THREE.Scene,
  pahads: PahadData[]
): EnvironmentResult {
  const envGroup = new THREE.Group();
  scene.add(envGroup);

  // 1. Lighting
  // Warm sunny golden afternoon lighting (like in the poster!)
  const hemiLight = new THREE.HemisphereLight(0xfff3d6, 0x5a7052, 0.85);
  hemiLight.position.set(0, 50, 0);
  envGroup.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfffae0, 1.4);
  sunLight.position.set(22, 36, 18);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 100;
  const shadowRange = 30;
  sunLight.shadow.camera.left = -shadowRange;
  sunLight.shadow.camera.right = shadowRange;
  sunLight.shadow.camera.top = shadowRange;
  sunLight.shadow.camera.bottom = -shadowRange;
  sunLight.shadow.bias = -0.0005;
  envGroup.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0xffecc2, 0.45);
  envGroup.add(ambientLight);

  // 2. Playground Ground (Sandy clay with grass tufts and chalk markings)
  const groundSize = 56;
  const groundGeom = new THREE.PlaneGeometry(groundSize, groundSize, 32, 32);
  // Add subtle terrain elevation variance
  const posAttr = groundGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    // Keep central playground flat, slightly elevate edges
    const dist = Math.sqrt(vx * vx + vy * vy);
    const zOffset = dist > 18 ? (dist - 18) * 0.04 : 0;
    posAttr.setZ(i, zOffset);
  }
  groundGeom.computeVertexNormals();

  // Procedural canvas ground texture with sand, dirt patches, chalk lines
  const groundCanvas = document.createElement('canvas');
  groundCanvas.width = 1024;
  groundCanvas.height = 1024;
  const gCtx = groundCanvas.getContext('2d')!;
  
  // Base warm sand/dirt
  gCtx.fillStyle = '#c8955c';
  gCtx.fillRect(0, 0, 1024, 1024);

  // Random dirt noise & grass patches
  for (let i = 0; i < 600; i++) {
    const rx = Math.random() * 1024;
    const ry = Math.random() * 1024;
    const rad = 20 + Math.random() * 80;
    gCtx.fillStyle = Math.random() > 0.4 ? 'rgba(163, 114, 64, 0.25)' : 'rgba(122, 168, 86, 0.3)';
    gCtx.beginPath();
    gCtx.arc(rx, ry, rad, 0, Math.PI * 2);
    gCtx.fill();
  }

  // White chalk circle in center
  gCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  gCtx.lineWidth = 10;
  gCtx.setLineDash([20, 15]);
  gCtx.beginPath();
  gCtx.arc(512, 512, 280, 0, Math.PI * 2);
  gCtx.stroke();
  gCtx.setLineDash([]);

  // Chalk crosslines
  gCtx.beginPath();
  gCtx.moveTo(512, 100);
  gCtx.lineTo(512, 924);
  gCtx.moveTo(100, 512);
  gCtx.lineTo(924, 512);
  gCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  gCtx.lineWidth = 6;
  gCtx.stroke();

  const groundTexture = new THREE.CanvasTexture(groundCanvas);
  groundTexture.wrapS = THREE.ClampToEdgeWrapping;
  groundTexture.wrapT = THREE.ClampToEdgeWrapping;

  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTexture,
    roughness: 0.88,
    metalness: 0.05,
  });

  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  envGroup.add(ground);

  // 3. Perimeter Walls & Wooden Fencing
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xd4c2a5,
    roughness: 0.9,
  });
  const brickTextureCanvas = document.createElement('canvas');
  brickTextureCanvas.width = 512;
  brickTextureCanvas.height = 256;
  const bCtx = brickTextureCanvas.getContext('2d')!;
  bCtx.fillStyle = '#b48a6a';
  bCtx.fillRect(0, 0, 512, 256);
  // Bricks pattern
  bCtx.fillStyle = '#8b5a3e';
  for (let y = 0; y < 256; y += 32) {
    const shift = (y / 32) % 2 === 0 ? 0 : 32;
    for (let x = -shift; x < 512; x += 64) {
      bCtx.strokeRect(x + 2, y + 2, 60, 28);
    }
  }
  // Graffiti: "GOOD FRIENDS HIGHER PLACES"
  bCtx.fillStyle = 'rgba(37, 99, 235, 0.85)';
  bCtx.font = 'bold 26px "Fredoka", sans-serif';
  bCtx.fillText('GOOD FRIENDS', 60, 90);
  bCtx.fillStyle = 'rgba(220, 38, 38, 0.85)';
  bCtx.fillText('HIGHER PLACES :)', 80, 130);

  bCtx.fillStyle = 'rgba(217, 119, 6, 0.85)';
  bCtx.font = 'bold 22px "Fredoka", sans-serif';
  bCtx.fillText("IT'S YOUR TURN TO CLIMB!", 50, 190);

  const wallTexture = new THREE.CanvasTexture(brickTextureCanvas);
  wallMat.map = wallTexture;
  wallMat.needsUpdate = true;

  // Back Wall
  const backWallGeom = new THREE.BoxGeometry(48, 4.5, 1);
  const backWall = new THREE.Mesh(backWallGeom, wallMat);
  backWall.position.set(0, 2.25, -21);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  envGroup.add(backWall);

  // Wooden fence posts along left, right, and front boundaries
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.8,
  });
  const fencePlankMat = new THREE.MeshStandardMaterial({
    color: 0xa06d3b,
    roughness: 0.75,
  });

  function createFenceSegment(startX: number, startZ: number, endX: number, endZ: number) {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const len = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const fenceGroup = new THREE.Group();
    fenceGroup.position.set(startX, 0, startZ);
    fenceGroup.rotation.y = angle;

    const postsCount = Math.floor(len / 3.5);
    for (let i = 0; i <= postsCount; i++) {
      const pz = (i / postsCount) * len;
      const postGeom = new THREE.CylinderGeometry(0.12, 0.14, 2.0, 8);
      const post = new THREE.Mesh(postGeom, woodMat);
      post.position.set(0, 1.0, pz);
      post.castShadow = true;
      fenceGroup.add(post);
    }

    // Horizontal rails
    [0.7, 1.4].forEach(ry => {
      const railGeom = new THREE.BoxGeometry(0.1, 0.16, len);
      const rail = new THREE.Mesh(railGeom, fencePlankMat);
      rail.position.set(0, ry, len / 2);
      rail.castShadow = true;
      fenceGroup.add(rail);
    });

    envGroup.add(fenceGroup);
  }

  createFenceSegment(-21, -21, -21, 21); // Left fence
  createFenceSegment(21, -21, 21, 21);  // Right fence
  createFenceSegment(-21, 21, 21, 21);  // Front fence

  // 4. Playground Trees and Foliage
  function createStylizedTree(tx: number, tz: number, scale: number = 1) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(tx, 0, tz);

    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.35 * scale, 0.5 * scale, 4.2 * scale, 8);
    const trunk = new THREE.Mesh(trunkGeom, woodMat);
    trunk.position.y = 2.1 * scale;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Leafy canopy (stylized overlapping spheres)
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f,
      roughness: 0.7,
      metalness: 0.05,
    });
    const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4 * scale, 1), foliageMat);
    canopy1.position.y = 4.8 * scale;
    canopy1.castShadow = true;
    treeGroup.add(canopy1);

    const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.9 * scale, 1), foliageMat);
    canopy2.position.set(0.6 * scale, 5.8 * scale, 0.3 * scale);
    canopy2.castShadow = true;
    treeGroup.add(canopy2);

    envGroup.add(treeGroup);
  }

  createStylizedTree(-17, -17, 1.1);
  createStylizedTree(16, -17, 1.2);
  createStylizedTree(-18, 14, 0.95);
  createStylizedTree(18, 12, 1.05);

  // 5. Playground Benches, Tires, and Wooden Crates
  function createBench(bx: number, bz: number, rotY: number) {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(bx, 0, bz);
    benchGroup.rotation.y = rotY;

    // Legs
    [-0.9, 0.9].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.45), woodMat);
      leg.position.set(lx, 0.3, 0);
      leg.castShadow = true;
      benchGroup.add(leg);
    });

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.55), fencePlankMat);
    seat.position.set(0, 0.6, 0);
    seat.castShadow = true;
    benchGroup.add(seat);

    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 0.08), fencePlankMat);
    back.position.set(0, 1.0, -0.24);
    back.castShadow = true;
    benchGroup.add(back);

    envGroup.add(benchGroup);
  }

  createBench(-12, -18, 0.1);
  createBench(12, -18, -0.1);

  // Wooden crates
  function createCrate(cx: number, cz: number, size: number, rot: number) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), fencePlankMat);
    crate.position.set(cx, size / 2, cz);
    crate.rotation.y = rot;
    crate.castShadow = true;
    crate.receiveShadow = true;
    envGroup.add(crate);
  }
  createCrate(-14, 6, 1.2, 0.3);
  createCrate(-13, 7.5, 0.9, -0.2);

  // Playground Tires half buried in ground
  function createTire(tx: number, tz: number, rotZ: number) {
    const tireGeom = new THREE.TorusGeometry(0.65, 0.22, 12, 18);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1f2429, roughness: 0.9 });
    const tire = new THREE.Mesh(tireGeom, tireMat);
    tire.position.set(tx, 0.45, tz);
    tire.rotation.y = rotZ;
    tire.castShadow = true;
    envGroup.add(tire);
  }
  createTire(13, 5, 0.4);
  createTire(14, 6.2, 0.6);

  // 6. Interactive Soccer Ball in the yard!
  const ballGeom = new THREE.SphereGeometry(0.32, 16, 16);
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
  });
  const soccerBallMesh = new THREE.Mesh(ballGeom, ballMat);
  soccerBallMesh.position.set(2, 0.32, 1);
  soccerBallMesh.castShadow = true;
  envGroup.add(soccerBallMesh);

  const soccerBall = {
    mesh: soccerBallMesh,
    x: 2,
    y: 0.32,
    z: 1,
    vx: 0,
    vz: 0,
  };

  // 7. BUILD THE PAHADS! (Brown Earthy Raised Hills with Lush Grass Tops)
  const pahadMeshes: { id: number; mesh: THREE.Group; beacon: THREE.Mesh }[] = [];

  const earthBrownMat = new THREE.MeshStandardMaterial({
    color: 0x8a5430,
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true,
  });

  const topGrassMat = new THREE.MeshStandardMaterial({
    color: 0x559b36,
    roughness: 0.75,
    metalness: 0.05,
  });

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x6e6e6e,
    roughness: 0.92,
    flatShading: true,
  });

  pahads.forEach((pahad) => {
    const pahadGroup = new THREE.Group();
    pahadGroup.position.set(pahad.x, 0, pahad.z);

    // Natural mound geometry: Cylinder / Truncated cone with vertex perturbations
    const radialSegments = 24;
    const heightSegments = 6;
    const moundGeom = new THREE.CylinderGeometry(
      pahad.radius * 0.95, // Top radius
      pahad.radius * 1.35, // Base radius (sloping outward naturally)
      pahad.height,
      radialSegments,
      heightSegments
    );

    // Deform vertices slightly for organic rocky earth look
    const pos = moundGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vy = pos.getY(i);
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      // Keep top plateau smooth and flat for easy player walking
      if (vy < pahad.height / 2 - 0.1) {
        const noise = (Math.sin(vx * 2.5) + Math.cos(vz * 2.5)) * 0.12;
        pos.setX(i, vx + noise);
        pos.setZ(i, vz + noise);
      }
    }
    moundGeom.computeVertexNormals();

    const moundMesh = new THREE.Mesh(moundGeom, earthBrownMat);
    moundMesh.position.y = pahad.height / 2;
    moundMesh.castShadow = true;
    moundMesh.receiveShadow = true;
    pahadGroup.add(moundMesh);

    // Lush Green Grass Plateau Top
    const grassTopGeom = new THREE.CylinderGeometry(
      pahad.radius * 0.96,
      pahad.radius * 0.97,
      0.16,
      radialSegments
    );
    const grassTop = new THREE.Mesh(grassTopGeom, topGrassMat);
    grassTop.position.y = pahad.height + 0.06;
    grassTop.receiveShadow = true;
    pahadGroup.add(grassTop);

    // Rim of small decorative rocks and stepping stone ramps
    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI * 2;
      const rx = Math.cos(angle) * (pahad.radius * 1.22);
      const rz = Math.sin(angle) * (pahad.radius * 1.22);
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.25, 0),
        rockMat
      );
      rock.position.set(rx, 0.25, rz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      pahadGroup.add(rock);
    }

    // Wildflowers on the grass top
    const flowerColors = [0xf59e0b, 0xef4444, 0xec4899, 0xffffff];
    for (let f = 0; f < 10; f++) {
      const fAngle = Math.random() * Math.PI * 2;
      const fDist = Math.random() * (pahad.radius * 0.7);
      const flowerGeom = new THREE.SphereGeometry(0.06, 6, 6);
      const flowerMat = new THREE.MeshBasicMaterial({
        color: flowerColors[f % flowerColors.length],
      });
      const flower = new THREE.Mesh(flowerGeom, flowerMat);
      flower.position.set(
        Math.cos(fAngle) * fDist,
        pahad.height + 0.16,
        Math.sin(fAngle) * fDist
      );
      pahadGroup.add(flower);
    }

    // Wooden signpost marking the Pahad
    const postGeom = new THREE.CylinderGeometry(0.06, 0.08, 1.2, 6);
    const post = new THREE.Mesh(postGeom, woodMat);
    post.position.set(-pahad.radius * 0.75, pahad.height + 0.6, -pahad.radius * 0.2);
    post.castShadow = true;
    pahadGroup.add(post);

    const signGeom = new THREE.BoxGeometry(0.7, 0.35, 0.08);
    const sign = new THREE.Mesh(signGeom, fencePlankMat);
    sign.position.set(-pahad.radius * 0.75, pahad.height + 1.0, -pahad.radius * 0.2);
    pahadGroup.add(sign);

    // Glowing Occupancy Beacon / Safe Crown
    const beaconGeom = new THREE.TorusGeometry(pahad.radius * 0.85, 0.04, 8, 24);
    beaconGeom.rotateX(Math.PI / 2);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.6,
    });
    const beacon = new THREE.Mesh(beaconGeom, beaconMat);
    beacon.position.y = pahad.height + 0.12;
    pahadGroup.add(beacon);

    envGroup.add(pahadGroup);
    pahadMeshes.push({ id: pahad.id, mesh: pahadGroup, beacon });
  });

  // Environmental animation loop (beacon pulsing, soccer ball physics)
  let envTime = 0;
  const updateEnvironment = (delta: number, currentPahads?: PahadData[]) => {
    envTime += delta;

    // Beacon gentle pulsing & occupancy status
    pahadMeshes.forEach(p => {
      const data = currentPahads?.find(pd => pd.id === p.id);
      const isOccupied = data ? data.isOccupied : true;
      const mat = p.beacon.material as THREE.MeshBasicMaterial;
      if (isOccupied) {
        mat.color.setHex(0x4ade80); // Emerald green for safe/occupied
        mat.opacity = 0.45 + Math.sin(envTime * 3 + p.id) * 0.2;
      } else {
        mat.color.setHex(0xf59e0b); // Pulsing amber warning for empty / snatchable!
        mat.opacity = 0.6 + Math.sin(envTime * 6 + p.id) * 0.35;
      }
    });

    // Soccer ball physics
    soccerBall.x += soccerBall.vx * delta;
    soccerBall.z += soccerBall.vz * delta;
    soccerBall.vx *= 0.94; // friction
    soccerBall.vz *= 0.94;

    // Ball bounds
    if (Math.abs(soccerBall.x) > 19) {
      soccerBall.vx = -soccerBall.vx * 0.6;
      soccerBall.x = Math.sign(soccerBall.x) * 19;
    }
    if (Math.abs(soccerBall.z) > 19) {
      soccerBall.vz = -soccerBall.vz * 0.6;
      soccerBall.z = Math.sign(soccerBall.z) * 19;
    }

    soccerBall.mesh.position.set(soccerBall.x, soccerBall.y, soccerBall.z);
    const ballSpeed = Math.sqrt(soccerBall.vx * soccerBall.vx + soccerBall.vz * soccerBall.vz);
    if (ballSpeed > 0.05) {
      soccerBall.mesh.rotation.x += soccerBall.vz * delta * 4;
      soccerBall.mesh.rotation.z -= soccerBall.vx * delta * 4;
    }
  };

  const dispose = () => {
    groundTexture.dispose();
    wallTexture.dispose();
    envGroup.traverse(obj => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat.dispose();
      }
    });
    scene.remove(envGroup);
  };

  return {
    scene,
    pahadMeshes,
    soccerBall,
    updateEnvironment,
    dispose,
  };
}
