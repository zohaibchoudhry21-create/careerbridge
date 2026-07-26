const VISEME_KEYS = [
  'viseme_sil',
  'viseme_PP',
  'viseme_FF',
  'viseme_TH',
  'viseme_DD',
  'viseme_kk',
  'viseme_CH',
  'viseme_SS',
  'viseme_nn',
  'viseme_RR',
  'viseme_aa',
  'viseme_E',
  'viseme_I',
  'viseme_O',
  'viseme_U',
];

const MOUTH_SHAPE_KEYS = ['mouthOpen', 'jawOpen', 'Jaw_Open', 'V_Open'];

function setMorph(mesh, name, value) {
  const index = mesh.morphTargetDictionary?.[name];
  if (index == null || !mesh.morphTargetInfluences) return false;
  mesh.morphTargetInfluences[index] = value;
  return true;
}

function meshHasSpeechMorphs(mesh) {
  const names = Object.keys(mesh.morphTargetDictionary || {});
  if (names.some((n) => /^viseme_/i.test(n))) return true;
  return names.some((n) => MOUTH_SHAPE_KEYS.includes(n));
}

/** Avaturn T2 (and RPM) face meshes with Oculus visemes / ARKit jaw. */
export function collectAvatarFaceMeshes(root) {
  const meshes = [];
  root.traverse((obj) => {
    if (obj.isSkinnedMesh && meshHasSpeechMorphs(obj)) {
      meshes.push(obj);
    }
  });
  return meshes;
}

function clearSpeechMorphs(mesh) {
  VISEME_KEYS.forEach((key) => setMorph(mesh, key, 0));
  MOUTH_SHAPE_KEYS.forEach((key) => setMorph(mesh, key, 0));
  setMorph(mesh, 'mouthSmile', 0);
}

/**
 * Drive mouth from normalized speech level (0–1). Prefers Oculus visemes (Avaturn T2).
 */
export function applyAvatarMouthOpen(faceMeshes, level) {
  const open = Math.min(1, Math.max(0, Number(level) || 0));

  faceMeshes.forEach((mesh) => {
    clearSpeechMorphs(mesh);
    setMorph(mesh, 'viseme_aa', open * 0.95);
    setMorph(mesh, 'viseme_O', open * 0.3);
    setMorph(mesh, 'viseme_sil', Math.max(0, 1 - open * 1.15));
    MOUTH_SHAPE_KEYS.forEach((key) => setMorph(mesh, key, open * 0.85));
  });
}

export function resetAvatarMouth(faceMeshes) {
  faceMeshes.forEach((mesh) => clearSpeechMorphs(mesh));
}
