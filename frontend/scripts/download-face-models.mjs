import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/models');
const base =
  'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
  // Optional stranger / primary-face matching (FaceRecognitionNet)
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const url = `${base}/${file}`;
  const dest = path.join(outDir, file);
  console.log('Downloading', file);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${file}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(dest, buffer);
}

console.log('Face-api models saved to public/models');
