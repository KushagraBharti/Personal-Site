import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createSculptureScene } from './src/createSculptureScene.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'exports');
await fs.mkdir(outDir, { recursive: true });

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class NodeFileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer;
        this.onloadend?.();
      }, (error) => {
        this.error = error;
        this.onerror?.(error);
      });
    }

    readAsDataURL(blob) {
      blob.arrayBuffer().then((buffer) => {
        const base64 = Buffer.from(buffer).toString('base64');
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
        this.onloadend?.();
      }, (error) => {
        this.error = error;
        this.onerror?.(error);
      });
    }
  };
}

const { scene } = createSculptureScene({ includeRenderOnly: false });

function exportScene(options) {
  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => resolve(result),
      (error) => reject(error),
      {
        onlyVisible: true,
        trs: false,
        binary: options.binary,
        includeCustomExtensions: true,
        maxTextureSize: 1024
      }
    );
  });
}

const glb = await exportScene({ binary: true });
await fs.writeFile(path.join(outDir, 'portfolio-hero-sculpture.glb'), Buffer.from(glb));

const gltf = await exportScene({ binary: false });
await fs.writeFile(
  path.join(outDir, 'portfolio-hero-sculpture.gltf'),
  JSON.stringify(gltf, null, 2)
);

const metadata = {
  title: 'Premium editorial personal portfolio hero sculpture',
  generatedAt: new Date().toISOString(),
  format: ['glb', 'gltf'],
  editableObjectGroups: [
    'Pedestal_And_Plinths',
    'Orbit_Halo_Rings',
    'Central_Stone_Arch',
    'AI_Data_Glowing_Cube',
    'Laptop_Engineer_Builder',
    'Graduation_Cap_Researcher_Student',
    'Camera_Filmmaker',
    'Wrench_Tinkerer',
    'Pen_Writing',
    'Chef_Knife_Cooking',
    'Book_Reading',
    'Soccer_Ball_Football',
    'Formula_1_Racing_Helmet'
  ],
  palette: {
    background: 'warm ivory / cream',
    stone: 'warm ivory limestone / matte ceramic',
    blackObjects: 'matte black / dark graphite / black leather',
    metals: 'brushed steel / gunmetal / subtle brass',
    accent: 'muted burnt orange / copper',
    cube: 'warm translucent frosted glass emissive'
  },
  intendedCamera: 'Camera_Hero_Front_Three_Quarter',
  notes:
    'Procedural web-friendly mesh scene. No labels, text, logos, or external image textures.'
};

await fs.writeFile(path.join(outDir, 'portfolio-hero-sculpture.metadata.json'), JSON.stringify(metadata, null, 2));

console.log(`Exported GLB, GLTF, and metadata to ${outDir}`);
