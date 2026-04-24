import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const DEG = Math.PI / 180;

function materialSet() {
  const stone = new THREE.MeshStandardMaterial({
    name: 'Warm_Ivory_Limestone',
    color: 0xeee7dc,
    roughness: 0.82,
    metalness: 0.02
  });

  const stoneLight = new THREE.MeshStandardMaterial({
    name: 'Warm_White_Stone',
    color: 0xf6f1e7,
    roughness: 0.78,
    metalness: 0.01
  });

  const stoneShadow = new THREE.MeshStandardMaterial({
    name: 'Warm_Stone_Interior_Shadow',
    color: 0xcbbba6,
    roughness: 0.86,
    metalness: 0
  });

  const stoneGrain = new THREE.MeshBasicMaterial({
    name: 'Subtle_Limestone_Grain',
    color: 0x8d8172,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
  });

  const matteBlack = new THREE.MeshStandardMaterial({
    name: 'Matte_Black',
    color: 0x111111,
    roughness: 0.76,
    metalness: 0.18
  });

  const graphite = new THREE.MeshStandardMaterial({
    name: 'Dark_Graphite',
    color: 0x242322,
    roughness: 0.58,
    metalness: 0.42
  });

  const leatherBlack = new THREE.MeshStandardMaterial({
    name: 'Black_Leather',
    color: 0x080808,
    roughness: 0.48,
    metalness: 0.08
  });

  const glossyBlack = new THREE.MeshPhysicalMaterial({
    name: 'Glossy_Black_Helmet',
    color: 0x050505,
    roughness: 0.22,
    metalness: 0.18,
    clearcoat: 0.85,
    clearcoatRoughness: 0.16
  });

  const brushedSteel = new THREE.MeshStandardMaterial({
    name: 'Brushed_Steel',
    color: 0xa9a39a,
    roughness: 0.34,
    metalness: 0.9
  });

  const gunmetal = new THREE.MeshStandardMaterial({
    name: 'Soft_Gunmetal',
    color: 0x54504a,
    roughness: 0.42,
    metalness: 0.72
  });

  const brass = new THREE.MeshStandardMaterial({
    name: 'Subtle_Brass_Trim',
    color: 0xc69a56,
    roughness: 0.28,
    metalness: 0.86
  });

  const orange = new THREE.MeshStandardMaterial({
    name: 'Muted_Burnt_Orange',
    color: 0xb7653d,
    roughness: 0.48,
    metalness: 0.22
  });

  const orangeGlass = new THREE.MeshPhysicalMaterial({
    name: 'Muted_Orange_Reflective_Visor',
    color: 0xb76a4c,
    emissive: 0x2d1209,
    emissiveIntensity: 0.08,
    roughness: 0.14,
    metalness: 0.18,
    transparent: true,
    opacity: 0.72,
    transmission: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.05
  });

  const lensGlass = new THREE.MeshPhysicalMaterial({
    name: 'Dark_Lens_Glass',
    color: 0x15191c,
    roughness: 0.08,
    metalness: 0.08,
    transparent: true,
    opacity: 0.72,
    transmission: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.03
  });

  const screen = new THREE.MeshStandardMaterial({
    name: 'Dark_Blank_Laptop_Screen',
    color: 0x090909,
    roughness: 0.2,
    metalness: 0.3
  });

  const cube = new THREE.MeshPhysicalMaterial({
    name: 'Warm_Frosted_Emissive_Cube',
    color: 0xffe2a5,
    emissive: 0xffb764,
    emissiveIntensity: 1.45,
    roughness: 0.24,
    metalness: 0,
    transparent: true,
    opacity: 0.86,
    transmission: 0.34,
    thickness: 0.36
  });

  const page = new THREE.MeshStandardMaterial({
    name: 'Cream_Book_Pages',
    color: 0xe8ddcb,
    roughness: 0.72,
    metalness: 0
  });

  const soccerWhite = new THREE.MeshStandardMaterial({
    name: 'Muted_Soccer_Ball_White',
    color: 0xe7e1d8,
    roughness: 0.56,
    metalness: 0.02
  });

  const orbit = new THREE.MeshBasicMaterial({
    name: 'Subtle_Graphite_Orbit_Line',
    color: 0x56514b,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
  });

  const orbitDash = new THREE.MeshBasicMaterial({
    name: 'Faint_Dashed_Inner_Orbit',
    color: 0x8b847b,
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });

  const shadow = new THREE.ShadowMaterial({
    name: 'Transparent_Studio_Contact_Shadow',
    color: 0x7f7467,
    transparent: true,
    opacity: 0.18
  });

  return {
    stone,
    stoneLight,
    stoneShadow,
    stoneGrain,
    matteBlack,
    graphite,
    leatherBlack,
    glossyBlack,
    brushedSteel,
    gunmetal,
    brass,
    orange,
    orangeGlass,
    lensGlass,
    screen,
    cube,
    page,
    soccerWhite,
    orbit,
    orbitDash,
    shadow
  };
}

function group(name) {
  const g = new THREE.Group();
  g.name = name;
  return g;
}

function roundedBox(name, width, height, depth, radius, material, segments = 5) {
  const geometry = new RoundedBoxGeometry(width, height, depth, segments, radius);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(name, radiusTop, radiusBottom, height, material, radialSegments = 96) {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, 1, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function tubeFromPoints(name, points, radius, material, tubularSegments = 20, radialSegments = 8) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function lookAtFromNormal(object, normal) {
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
  object.quaternion.copy(quaternion);
}

function extrudedRing(name, outerRadius, innerRadius, depth, material) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 8,
    curveSegments: 128,
    steps: 1
  });
  geometry.center();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function bladeGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.09, 0.02);
  shape.lineTo(0.21, -0.02);
  shape.lineTo(0.24, -0.72);
  shape.quadraticCurveTo(0.14, -1.04, -0.22, -1.27);
  shape.quadraticCurveTo(-0.1, -0.56, -0.09, 0.02);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelSize: 0.01,
    bevelThickness: 0.006,
    bevelSegments: 2
  });
  geometry.center();
  return geometry;
}

function addStoneGrain(root, mats) {
  const grain = group('Subtle_Stone_Grain_Details');
  let seed = 18;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const circle = new THREE.CircleGeometry(1, 10);
  const addDot = (x, y, z, scale) => {
    const dot = new THREE.Mesh(circle, mats.stoneGrain);
    dot.name = 'Limestone_Pore';
    dot.position.set(x, y, z);
    dot.scale.setScalar(scale);
    grain.add(dot);
  };

  for (let i = 0; i < 95; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 0.72 + rand() * 0.36;
    const x = Math.cos(angle) * radius + 0.03;
    const y = Math.sin(angle) * radius + 1.88;
    if (Math.hypot(x - 0.03, y - 1.88) > 0.72) {
      addDot(x, y, 0.275, 0.006 + rand() * 0.011);
    }
  }

  for (let i = 0; i < 60; i += 1) {
    addDot(-1.48 + rand() * 1.1, 0.58 + rand() * 0.72, 0.815, 0.006 + rand() * 0.012);
  }

  for (let i = 0; i < 36; i += 1) {
    addDot(0.18 + rand() * 1.1, 0.56 + rand() * 0.56, 0.825, 0.005 + rand() * 0.01);
  }

  root.add(grain);
}

function createPedestal(mats) {
  const root = group('Pedestal_And_Plinths');

  const bottom = cylinder('Large_Circular_Stone_Pedestal', 2.62, 2.68, 0.28, mats.stoneLight, 160);
  bottom.position.set(0, 0.14, 0);
  root.add(bottom);

  const frontStep = cylinder('Inset_Lower_Circular_Step', 2.16, 2.22, 0.18, mats.stone, 160);
  frontStep.position.set(-0.08, 0.39, 0.1);
  root.add(frontStep);

  const graphiteDisk = cylinder('Thin_Graphite_Display_Disk', 1.82, 1.82, 0.055, mats.gunmetal, 160);
  graphiteDisk.position.set(-0.22, 0.51, 0.24);
  root.add(graphiteDisk);

  const centerBlock = roundedBox('Front_Center_Ivory_Block', 1.42, 0.58, 0.66, 0.055, mats.stoneLight);
  centerBlock.position.set(-0.42, 0.79, 0.49);
  root.add(centerBlock);

  const leftBlock = roundedBox('Left_Front_Ivory_Block', 1.05, 0.82, 0.58, 0.055, mats.stoneLight);
  leftBlock.position.set(-1.34, 0.92, 0.54);
  root.add(leftBlock);

  const rightBlock = roundedBox('Right_Lower_Ivory_Block', 1.34, 0.52, 0.8, 0.06, mats.stone);
  rightBlock.position.set(1.12, 0.7, 0.35);
  root.add(rightBlock);

  const cameraPlinth = cylinder('Left_Middle_Camera_Cylindrical_Plinth', 0.58, 0.6, 0.84, mats.stoneLight, 96);
  cameraPlinth.position.set(-1.42, 1.03, 0.18);
  root.add(cameraPlinth);

  const rearCylinder = cylinder('Rear_Left_Tall_Stone_Cylinder', 0.74, 0.78, 1.95, mats.stone, 128);
  rearCylinder.position.set(-0.62, 1.54, -0.22);
  root.add(rearCylinder);

  const rightPillar = cylinder('Upper_Right_Stone_Pillar', 0.43, 0.45, 1.86, mats.stoneLight, 96);
  rightPillar.position.set(1.15, 1.64, -0.12);
  root.add(rightPillar);

  const laptopSlab = roundedBox('Angled_Upper_Laptop_Stone_Slab', 1.48, 0.12, 0.92, 0.045, mats.stone);
  laptopSlab.position.set(-0.56, 2.83, 0.04);
  laptopSlab.rotation.set(0, -10 * DEG, -9 * DEG);
  root.add(laptopSlab);

  const capShelf = roundedBox('Upper_Right_Cap_Stone_Shelf', 0.96, 0.16, 0.78, 0.045, mats.stone);
  capShelf.position.set(1.04, 2.56, -0.12);
  capShelf.rotation.set(0, 7 * DEG, 2 * DEG);
  root.add(capShelf);

  addStoneGrain(root, mats);
  return root;
}

function createOrbitRings(mats) {
  const root = group('Orbit_Halo_Rings');
  root.position.set(0, 1.85, -0.72);

  const outer = new THREE.Mesh(new THREE.TorusGeometry(2.92, 0.008, 8, 192), mats.orbit);
  outer.name = 'Large_Thin_Outer_Orbit_Halo';
  outer.castShadow = false;
  outer.receiveShadow = false;
  root.add(outer);

  const dashRoot = group('Faint_Dashed_Inner_Orbit_Line');
  const radius = 2.48;
  const dash = 6.2 * DEG;
  const gap = 5.2 * DEG;
  let index = 0;
  for (let a = 0; a < Math.PI * 2; a += dash + gap) {
    const points = [];
    for (let i = 0; i <= 9; i += 1) {
      const t = a + (dash * i) / 9;
      points.push(new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius, 0));
    }
    const segment = tubeFromPoints(`Inner_Orbit_Dash_${index}`, points, 0.005, mats.orbitDash, 8, 5);
    segment.castShadow = false;
    segment.receiveShadow = false;
    dashRoot.add(segment);
    index += 1;
  }
  root.add(dashRoot);

  return root;
}

function createCentralArch(mats) {
  const root = group('Central_Stone_Arch');
  root.position.set(0.03, 1.88, 0.02);

  const arch = extrudedRing('Large_Hollow_Circular_Stone_Arch', 1.07, 0.68, 0.42, mats.stoneLight);
  arch.position.set(0, 0, 0);
  root.add(arch);

  const innerBack = new THREE.Mesh(new THREE.CircleGeometry(0.65, 96), mats.stoneShadow);
  innerBack.name = 'Warm_Recessed_Circular_Back_Panel';
  innerBack.position.set(0, 0, -0.235);
  innerBack.receiveShadow = true;
  root.add(innerBack);

  const shelf = roundedBox('Thin_Graphite_Cube_Shelf_Inside_Arch', 1.08, 0.075, 0.48, 0.035, mats.gunmetal);
  shelf.position.set(0, -0.37, 0.2);
  root.add(shelf);

  const innerCrescent = new THREE.Mesh(new THREE.TorusGeometry(0.675, 0.018, 8, 128, Math.PI), mats.gunmetal);
  innerCrescent.name = 'Subtle_Inner_Arch_Shadow_Crescent';
  innerCrescent.position.set(0, -0.01, 0.235);
  innerCrescent.rotation.set(0, 0, Math.PI);
  innerCrescent.castShadow = false;
  innerCrescent.receiveShadow = true;
  root.add(innerCrescent);

  return root;
}

function createGlowingCube(mats) {
  const root = group('AI_Data_Glowing_Cube');
  root.position.set(0.03, 1.55, 0.31);

  const cube = roundedBox('AI_Data_Glowing_Cube_Core', 0.36, 0.36, 0.36, 0.028, mats.cube, 4);
  cube.position.set(0, 0, 0);
  root.add(cube);

  const inner = roundedBox('AI_Data_Inner_Warm_Core', 0.22, 0.22, 0.22, 0.018, mats.cube, 3);
  inner.name = 'AI_Data_Inner_Warm_Core';
  inner.scale.setScalar(0.78);
  inner.material = mats.cube.clone();
  inner.material.name = 'Warmer_Inner_Cube_Glow';
  inner.material.opacity = 0.48;
  inner.material.emissiveIntensity = 2.2;
  root.add(inner);

  const light = new THREE.PointLight(0xffc27b, 1.9, 2.4, 2);
  light.name = 'Cube_Soft_Warm_Light';
  light.position.set(0, 0.03, 0.04);
  light.castShadow = true;
  root.add(light);

  return root;
}

function createLaptop(mats) {
  const root = group('Laptop_Engineer_Builder');
  root.position.set(-0.74, 3.1, 0.18);
  root.rotation.set(2 * DEG, -16 * DEG, -8 * DEG);

  const base = roundedBox('Laptop_Dark_Graphite_Base', 1.26, 0.055, 0.78, 0.035, mats.graphite, 4);
  base.position.set(0, 0, 0.02);
  root.add(base);

  const screenBack = roundedBox('Laptop_Thin_Open_Screen_Back', 1.24, 0.82, 0.045, 0.035, mats.graphite, 4);
  screenBack.position.set(0, 0.47, -0.39);
  screenBack.rotation.set(-12 * DEG, 0, 0);
  root.add(screenBack);

  const display = roundedBox('Laptop_Dark_Blank_Screen', 1.12, 0.69, 0.012, 0.02, mats.screen, 3);
  display.position.set(0, 0.47, -0.363);
  display.rotation.set(-12 * DEG, 0, 0);
  root.add(display);

  const hinge = cylinder('Laptop_Subtle_Hinge', 0.025, 0.025, 1.12, mats.gunmetal, 32);
  hinge.rotation.set(0, 0, 90 * DEG);
  hinge.position.set(0, 0.06, -0.35);
  root.add(hinge);

  const keyboardPlate = roundedBox('Laptop_Quiet_Keyboard_Field', 0.82, 0.009, 0.38, 0.018, mats.matteBlack, 2);
  keyboardPlate.position.set(-0.02, 0.034, 0.08);
  root.add(keyboardPlate);

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const key = roundedBox(`Laptop_Minimal_Key_${row}_${col}`, 0.055, 0.008, 0.035, 0.006, mats.graphite, 1);
      key.position.set(-0.31 + col * 0.077, 0.045, -0.03 + row * 0.07);
      root.add(key);
    }
  }

  const trackpad = roundedBox('Laptop_Graphite_Trackpad', 0.28, 0.008, 0.16, 0.012, mats.gunmetal, 2);
  trackpad.position.set(0, 0.045, 0.29);
  root.add(trackpad);

  const cameraDot = new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), mats.gunmetal);
  cameraDot.name = 'Laptop_Tiny_Blank_Camera_Dot';
  cameraDot.position.set(0, 0.81, -0.353);
  cameraDot.rotation.set(-12 * DEG, 0, 0);
  root.add(cameraDot);

  return root;
}

function createGraduationCap(mats) {
  const root = group('Graduation_Cap_Researcher_Student');
  root.position.set(1.12, 2.95, -0.08);
  root.rotation.set(2 * DEG, 10 * DEG, 4 * DEG);

  const board = roundedBox('Graduation_Cap_Matte_Black_Mortarboard', 1.02, 0.055, 1.02, 0.025, mats.matteBlack, 3);
  board.rotation.set(0, 0, 8 * DEG);
  root.add(board);

  const capBody = cylinder('Graduation_Cap_Soft_Black_Crown', 0.38, 0.42, 0.32, mats.leatherBlack, 64);
  capBody.position.set(0.05, -0.19, 0.03);
  root.add(capBody);

  const button = cylinder('Graduation_Cap_Center_Button', 0.045, 0.045, 0.03, mats.graphite, 32);
  button.position.set(0, 0.045, 0.01);
  root.add(button);

  const cord = tubeFromPoints(
    'Graduation_Cap_Muted_Orange_Tassel_Cord',
    [
      new THREE.Vector3(0.05, 0.04, 0.02),
      new THREE.Vector3(0.42, -0.04, 0.22),
      new THREE.Vector3(0.46, -0.42, 0.26)
    ],
    0.012,
    mats.orange,
    24,
    8
  );
  root.add(cord);

  for (let i = 0; i < 6; i += 1) {
    const strand = tubeFromPoints(
      `Graduation_Cap_Tassel_Strand_${i}`,
      [
        new THREE.Vector3(0.44 + (i - 2.5) * 0.012, -0.42, 0.26),
        new THREE.Vector3(0.43 + (i - 2.5) * 0.018, -0.68, 0.27)
      ],
      0.004,
      mats.matteBlack,
      4,
      5
    );
    root.add(strand);
  }

  const tasselBand = cylinder('Graduation_Cap_Tassel_Copper_Band', 0.035, 0.035, 0.045, mats.brass, 24);
  tasselBand.position.set(0.44, -0.4, 0.26);
  root.add(tasselBand);

  return root;
}

function createCamera(mats) {
  const root = group('Camera_Filmmaker');
  root.position.set(-1.39, 1.59, 0.58);
  root.rotation.set(0, 7 * DEG, 0);

  const body = roundedBox('Camera_Matte_Black_Professional_Body', 0.74, 0.48, 0.34, 0.06, mats.matteBlack, 5);
  root.add(body);

  const grip = roundedBox('Camera_Right_Grip', 0.16, 0.4, 0.38, 0.045, mats.leatherBlack, 4);
  grip.position.set(0.39, -0.02, 0.03);
  root.add(grip);

  const prism = roundedBox('Camera_Top_Viewfinder_Prism', 0.32, 0.22, 0.28, 0.035, mats.matteBlack, 4);
  prism.position.set(-0.06, 0.32, -0.03);
  root.add(prism);

  const lensRear = cylinder('Camera_Lens_Rear_Ring', 0.27, 0.29, 0.18, mats.graphite, 72);
  lensRear.rotation.set(90 * DEG, 0, 0);
  lensRear.position.set(0, 0, 0.24);
  root.add(lensRear);

  const lensBarrel = cylinder('Camera_Lens_Glass_Barrel', 0.24, 0.27, 0.36, mats.matteBlack, 72);
  lensBarrel.rotation.set(90 * DEG, 0, 0);
  lensBarrel.position.set(0, 0, 0.47);
  root.add(lensBarrel);

  const focusRing = cylinder('Camera_Textured_Focus_Ring', 0.255, 0.255, 0.055, mats.gunmetal, 72);
  focusRing.rotation.set(90 * DEG, 0, 0);
  focusRing.position.set(0, 0, 0.36);
  root.add(focusRing);

  for (let i = 0; i < 22; i += 1) {
    const ridge = roundedBox(`Camera_Focus_Ring_Ridge_${i}`, 0.012, 0.06, 0.018, 0.004, mats.graphite, 1);
    const a = (i / 22) * Math.PI * 2;
    ridge.position.set(Math.cos(a) * 0.265, Math.sin(a) * 0.265, 0.36);
    ridge.rotation.set(0, 0, a);
    root.add(ridge);
  }

  const glass = cylinder('Camera_Subtle_Convex_Lens_Glass', 0.205, 0.205, 0.018, mats.lensGlass, 72);
  glass.rotation.set(90 * DEG, 0, 0);
  glass.position.set(0, 0, 0.66);
  root.add(glass);

  const glassHighlight = new THREE.Mesh(new THREE.CircleGeometry(0.055, 28), mats.brass);
  glassHighlight.name = 'Camera_Soft_Lens_Warm_Highlight';
  glassHighlight.position.set(-0.06, 0.065, 0.672);
  glassHighlight.scale.set(1, 0.42, 1);
  root.add(glassHighlight);

  const shutter = cylinder('Camera_Top_Shutter_Dial', 0.08, 0.08, 0.055, mats.gunmetal, 36);
  shutter.position.set(0.24, 0.27, -0.06);
  root.add(shutter);

  return root;
}

function createWrench(mats) {
  const root = group('Wrench_Tinkerer');
  root.position.set(-0.47, 1.52, 0.63);
  root.rotation.set(0, -4 * DEG, -19 * DEG);

  const handle = roundedBox('Wrench_Brushed_Metal_Handle', 0.12, 1.08, 0.055, 0.045, mats.brushedSteel, 5);
  handle.position.set(0, 0, 0);
  root.add(handle);

  const handleSlot = roundedBox('Wrench_Dark_Recessed_Handle_Slot', 0.055, 0.58, 0.058, 0.026, mats.gunmetal, 4);
  handleSlot.position.set(0, -0.16, 0.004);
  handleSlot.scale.set(0.85, 1, 1);
  root.add(handleSlot);

  const head = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.048, 16, 56, Math.PI * 1.52), mats.brushedSteel);
  head.name = 'Wrench_Open_Crescent_Head';
  head.position.set(0, 0.63, 0);
  head.rotation.set(0, 0, -138 * DEG);
  head.castShadow = true;
  head.receiveShadow = true;
  root.add(head);

  const jawTop = roundedBox('Wrench_Upper_Jaw', 0.16, 0.055, 0.058, 0.02, mats.brushedSteel, 3);
  jawTop.position.set(0.15, 0.77, 0);
  jawTop.rotation.set(0, 0, 31 * DEG);
  root.add(jawTop);

  const jawBottom = roundedBox('Wrench_Lower_Jaw', 0.16, 0.055, 0.058, 0.02, mats.brushedSteel, 3);
  jawBottom.position.set(0.17, 0.51, 0);
  jawBottom.rotation.set(0, 0, -31 * DEG);
  root.add(jawBottom);

  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.022, 12, 36), mats.brushedSteel);
  baseRing.name = 'Wrench_Rounded_Handle_End';
  baseRing.position.set(0, -0.59, 0);
  root.add(baseRing);

  return root;
}

function createPen(mats) {
  const root = group('Pen_Writing');
  root.position.set(-1.25, 0.82, 0.98);
  root.rotation.set(0, 0, -3 * DEG);

  const barrel = cylinder('Pen_Matte_Black_Barrel', 0.052, 0.052, 0.86, mats.matteBlack, 40);
  barrel.position.set(0, 0.17, 0);
  root.add(barrel);

  const cap = cylinder('Pen_Upper_Black_Cap', 0.058, 0.058, 0.36, mats.leatherBlack, 40);
  cap.position.set(0, 0.55, 0);
  root.add(cap);

  const topBand = cylinder('Pen_Subtle_Brass_Top_Band', 0.061, 0.061, 0.025, mats.brass, 40);
  topBand.position.set(0, 0.74, 0);
  root.add(topBand);

  const centerBand = cylinder('Pen_Subtle_Brass_Center_Band', 0.058, 0.058, 0.03, mats.brass, 40);
  centerBand.position.set(0, 0.36, 0);
  root.add(centerBand);

  const clip = roundedBox('Pen_Brass_Clip', 0.018, 0.38, 0.014, 0.008, mats.brass, 2);
  clip.position.set(0.055, 0.55, 0.035);
  clip.rotation.set(0, 0, -3 * DEG);
  root.add(clip);

  const nib = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.18, 4), mats.brass);
  nib.name = 'Pen_Fountain_Nib';
  nib.position.set(0, -0.37, 0);
  nib.rotation.set(0, 45 * DEG, Math.PI);
  nib.castShadow = true;
  nib.receiveShadow = true;
  root.add(nib);

  const nibCut = roundedBox('Pen_Nib_Black_Slit', 0.008, 0.12, 0.006, 0.002, mats.matteBlack, 1);
  nibCut.position.set(0, -0.37, 0.054);
  root.add(nibCut);

  return root;
}

function createChefKnife(mats) {
  const root = group('Chef_Knife_Cooking');
  root.position.set(-0.08, 1.0, 0.98);
  root.rotation.set(2 * DEG, 4 * DEG, -24 * DEG);

  const blade = new THREE.Mesh(bladeGeometry(), mats.brushedSteel);
  blade.name = 'Chef_Knife_Brushed_Steel_Blade';
  blade.position.set(0.02, -0.32, 0);
  blade.castShadow = true;
  blade.receiveShadow = true;
  root.add(blade);

  const bladeHighlight = roundedBox('Chef_Knife_Soft_Blade_Highlight', 0.012, 0.78, 0.006, 0.003, mats.stoneLight, 1);
  bladeHighlight.material = mats.stoneLight.clone();
  bladeHighlight.material.name = 'Soft_Blade_Edge_Highlight';
  bladeHighlight.material.transparent = true;
  bladeHighlight.material.opacity = 0.38;
  bladeHighlight.position.set(0.075, -0.41, 0.028);
  bladeHighlight.rotation.set(0, 0, -2 * DEG);
  root.add(bladeHighlight);

  const handle = roundedBox('Chef_Knife_Black_Handle', 0.17, 0.62, 0.11, 0.045, mats.leatherBlack, 5);
  handle.position.set(0, 0.43, 0);
  root.add(handle);

  const bolster = roundedBox('Chef_Knife_Steel_Bolster', 0.19, 0.08, 0.115, 0.025, mats.gunmetal, 3);
  bolster.position.set(0, 0.08, 0);
  root.add(bolster);

  for (let i = 0; i < 2; i += 1) {
    const rivet = cylinder(`Chef_Knife_Handle_Rivet_${i}`, 0.024, 0.024, 0.008, mats.brushedSteel, 24);
    rivet.rotation.set(90 * DEG, 0, 0);
    rivet.position.set(0, 0.3 + i * 0.2, 0.06);
    root.add(rivet);
  }

  return root;
}

function createBook(mats) {
  const root = group('Book_Reading');
  root.position.set(1.14, 0.74, 0.78);
  root.rotation.set(0, -8 * DEG, 0);

  const pages = roundedBox('Book_Cream_Page_Block', 1.16, 0.24, 0.72, 0.045, mats.page, 4);
  pages.position.set(0.02, 0, 0);
  root.add(pages);

  const cover = roundedBox('Book_Closed_Black_Cover', 1.24, 0.08, 0.78, 0.035, mats.leatherBlack, 4);
  cover.position.set(0, 0.16, 0);
  root.add(cover);

  const lowerCover = roundedBox('Book_Lower_Black_Cover', 1.24, 0.055, 0.78, 0.035, mats.leatherBlack, 4);
  lowerCover.position.set(0, -0.155, 0);
  root.add(lowerCover);

  const spine = roundedBox('Book_Black_Spine', 0.14, 0.32, 0.79, 0.04, mats.matteBlack, 4);
  spine.position.set(-0.62, 0, 0);
  root.add(spine);

  for (let i = 0; i < 3; i += 1) {
    const line = roundedBox(`Book_Subtle_Brass_Spine_Line_${i}`, 0.012, 0.34, 0.015, 0.003, mats.brass, 1);
    line.position.set(-0.697, 0, -0.22 + i * 0.22);
    root.add(line);
  }

  for (let i = 0; i < 9; i += 1) {
    const pageLine = roundedBox(`Book_Fine_Page_Edge_Line_${i}`, 0.96, 0.006, 0.006, 0.002, mats.stoneShadow, 1);
    pageLine.position.set(0.08, -0.12 + i * 0.026, 0.38);
    root.add(pageLine);
  }

  const bookmark = roundedBox('Book_Tiny_Muted_Orange_Bookmark_Ribbon', 0.07, 0.012, 0.42, 0.008, mats.orange, 2);
  bookmark.position.set(0.5, -0.2, 0.42);
  bookmark.rotation.set(0, 0, 2 * DEG);
  root.add(bookmark);

  const ribbonTail = roundedBox('Book_Hanging_Orange_Ribbon_Tail', 0.055, 0.22, 0.018, 0.006, mats.orange, 2);
  ribbonTail.position.set(0.62, -0.27, 0.48);
  ribbonTail.rotation.set(12 * DEG, 0, -11 * DEG);
  root.add(ribbonTail);

  return root;
}

function createSoccerBall(mats) {
  const root = group('Soccer_Ball_Football');
  root.position.set(1.27, 1.39, 0.36);
  root.rotation.set(0, -15 * DEG, 10 * DEG);

  const radius = 0.36;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mats.soccerWhite);
  ball.name = 'Soccer_Ball_Muted_White_Base';
  ball.castShadow = true;
  ball.receiveShadow = true;
  root.add(ball);

  const patchGeometry = new THREE.CircleGeometry(1, 5);
  const patchNormals = [
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0.82, 0.18, 0.54),
    new THREE.Vector3(-0.78, 0.22, 0.58),
    new THREE.Vector3(0.18, 0.83, 0.52),
    new THREE.Vector3(-0.18, -0.78, 0.6),
    new THREE.Vector3(0.52, -0.52, 0.68),
    new THREE.Vector3(-0.5, 0.55, 0.66),
    new THREE.Vector3(0.06, 0.08, -1)
  ];

  patchNormals.forEach((normal, index) => {
    const n = normal.normalize();
    const patch = new THREE.Mesh(patchGeometry, mats.matteBlack);
    patch.name = `Soccer_Ball_Subdued_Black_Pentagon_${index}`;
    patch.position.copy(n.clone().multiplyScalar(radius + 0.004));
    patch.scale.setScalar(index === 0 ? 0.118 : 0.095);
    lookAtFromNormal(patch, n);
    patch.castShadow = false;
    patch.receiveShadow = true;
    root.add(patch);
  });

  const seamMaterial = mats.gunmetal.clone();
  seamMaterial.name = 'Soccer_Ball_Faint_Seams';
  seamMaterial.transparent = true;
  seamMaterial.opacity = 0.32;
  for (let i = 0; i < 3; i += 1) {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.006, 0.003, 6, 96), seamMaterial);
    seam.name = `Soccer_Ball_Faint_Great_Circle_Seam_${i}`;
    seam.rotation.set(i === 0 ? 90 * DEG : 0, i === 1 ? 90 * DEG : 0, i === 2 ? 45 * DEG : 0);
    root.add(seam);
  }

  return root;
}

function createRacingHelmet(mats) {
  const root = group('Formula_1_Racing_Helmet');
  root.position.set(1.13, 1.15, 0.92);
  root.rotation.set(0, -18 * DEG, 0);

  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.58, 64, 40, 0, Math.PI * 2, 0.08 * Math.PI, 0.78 * Math.PI), mats.glossyBlack);
  shell.name = 'Formula_1_Glossy_Black_Helmet_Shell';
  shell.scale.set(1.06, 0.88, 0.96);
  shell.castShadow = true;
  shell.receiveShadow = true;
  root.add(shell);

  const lowerRim = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.025, 12, 96), mats.matteBlack);
  lowerRim.name = 'Formula_1_Helmet_Lower_Rim';
  lowerRim.position.set(0, -0.36, 0);
  lowerRim.scale.set(1.06, 0.48, 1);
  lowerRim.rotation.set(90 * DEG, 0, 0);
  root.add(lowerRim);

  const visorFrame = roundedBox('Formula_1_Helmet_Black_Visor_Frame', 0.82, 0.32, 0.07, 0.09, mats.matteBlack, 8);
  visorFrame.position.set(0, 0.06, 0.52);
  visorFrame.rotation.set(-4 * DEG, 0, 0);
  root.add(visorFrame);

  const visor = roundedBox('Formula_1_Helmet_Muted_Orange_Reflective_Visor', 0.72, 0.22, 0.045, 0.075, mats.orangeGlass, 8);
  visor.position.set(0, 0.08, 0.565);
  visor.rotation.set(-4 * DEG, 0, 0);
  root.add(visor);

  const chin = roundedBox('Formula_1_Helmet_Sculpted_Chin_Guard', 0.72, 0.22, 0.22, 0.08, mats.glossyBlack, 6);
  chin.position.set(0, -0.22, 0.45);
  chin.rotation.set(6 * DEG, 0, 0);
  root.add(chin);

  const mouthVent = roundedBox('Formula_1_Helmet_Subtle_Front_Vent', 0.44, 0.045, 0.018, 0.018, mats.gunmetal, 3);
  mouthVent.position.set(0, -0.21, 0.57);
  root.add(mouthVent);

  for (let i = 0; i < 3; i += 1) {
    const slit = roundedBox(`Formula_1_Helmet_Vent_Slit_${i}`, 0.09, 0.014, 0.012, 0.005, mats.matteBlack, 2);
    slit.position.set(-0.11 + i * 0.11, -0.22, 0.584);
    root.add(slit);
  }

  const sideLeft = cylinder('Formula_1_Helmet_Left_Visor_Pivot', 0.07, 0.07, 0.03, mats.gunmetal, 32);
  sideLeft.rotation.set(0, 0, 90 * DEG);
  sideLeft.position.set(-0.45, 0.02, 0.32);
  root.add(sideLeft);

  const sideRight = cylinder('Formula_1_Helmet_Right_Visor_Pivot', 0.07, 0.07, 0.03, mats.gunmetal, 32);
  sideRight.rotation.set(0, 0, 90 * DEG);
  sideRight.position.set(0.45, 0.02, 0.32);
  root.add(sideRight);

  const copperStripe = new THREE.Mesh(new THREE.TorusGeometry(0.59, 0.012, 8, 120, Math.PI * 0.76), mats.orange);
  copperStripe.name = 'Formula_1_Helmet_Subtle_Copper_Arc_Accent';
  copperStripe.position.set(0, 0.02, 0.03);
  copperStripe.rotation.set(81 * DEG, 0, 18 * DEG);
  root.add(copperStripe);

  const highlight = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.006, 6, 100, Math.PI * 0.72), mats.stoneLight);
  highlight.name = 'Formula_1_Helmet_Soft_Studio_Highlight';
  highlight.material = mats.stoneLight.clone();
  highlight.material.name = 'Soft_Helmet_Clearcoat_Highlight';
  highlight.material.transparent = true;
  highlight.material.opacity = 0.26;
  highlight.position.set(-0.08, 0.1, 0.1);
  highlight.rotation.set(84 * DEG, 0, 33 * DEG);
  root.add(highlight);

  return root;
}

function createLightingAndCamera(scene, options = {}) {
  const { includeHemisphere = true } = options;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.name = 'Camera_Hero_Front_Three_Quarter';
  camera.position.set(6.2, 3.3, 14.2);
  const controlsTarget = new THREE.Vector3(0.02, 1.72, 0.12);
  camera.lookAt(controlsTarget);
  scene.add(camera);

  if (includeHemisphere) {
    const ambient = new THREE.HemisphereLight(0xfffbf4, 0xcfc2b4, 2.1);
    ambient.name = 'Gentle_Warm_Ambient_Fill';
    scene.add(ambient);
  }

  const key = new THREE.DirectionalLight(0xfff1df, 4.2);
  key.name = 'Key_Softbox_Upper_Left';
  key.position.set(-4.2, 6.2, 4.8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 12;
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -2;
  key.shadow.bias = -0.0002;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffd8b8, 0.72);
  fill.name = 'Soft_Right_Warm_Fill';
  fill.position.set(4.2, 2.6, 3.2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.46);
  rim.name = 'Very_Subtle_Back_Rim';
  rim.position.set(0.5, 3.8, -4.2);
  scene.add(rim);

  return { camera, controlsTarget };
}

function createRenderOnlyElements(mats, backgroundMode) {
  const root = group('Render_Only_Transparent_Studio_Ground');

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), mats.shadow);
  plane.name = 'Transparent_Shadow_Catcher_Plane';
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.006;
  plane.receiveShadow = true;
  plane.castShadow = false;
  root.add(plane);

  if (backgroundMode === 'cream') {
    const backdropMat = new THREE.MeshBasicMaterial({
      name: 'Warm_Ivory_Render_Backdrop',
      color: 0xf5f1e8
    });
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), backdropMat);
    backdrop.name = 'Cream_Background_Plane_For_Preview';
    backdrop.position.set(0, 2.2, -3.2);
    root.add(backdrop);
  }

  return root;
}

export function createSculptureScene(options = {}) {
  const { includeRenderOnly = false, backgroundMode = 'transparent' } = options;
  const mats = materialSet();

  const scene = new THREE.Scene();
  scene.name = 'Premium_Editorial_Portfolio_Hero_Sculpture';

  const sculpture = group('Portfolio_Hero_Sculpture_Complete_Editable_Artifact');
  sculpture.add(createOrbitRings(mats));
  sculpture.add(createPedestal(mats));
  sculpture.add(createCentralArch(mats));
  sculpture.add(createGlowingCube(mats));
  sculpture.add(createLaptop(mats));
  sculpture.add(createGraduationCap(mats));
  sculpture.add(createCamera(mats));
  sculpture.add(createWrench(mats));
  sculpture.add(createPen(mats));
  sculpture.add(createChefKnife(mats));
  sculpture.add(createBook(mats));
  sculpture.add(createSoccerBall(mats));
  sculpture.add(createRacingHelmet(mats));
  scene.add(sculpture);

  if (includeRenderOnly) {
    scene.add(createRenderOnlyElements(mats, backgroundMode));
  }

  const { camera, controlsTarget } = createLightingAndCamera(scene, {
    includeHemisphere: includeRenderOnly
  });

  scene.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = object.castShadow ?? true;
      object.receiveShadow = object.receiveShadow ?? true;
    }
  });

  return { scene, camera, controlsTarget, materials: mats };
}
