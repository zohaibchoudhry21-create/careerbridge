/** Mixamo / Avaturn / RPM-style humanoid bone names. */
export function findAvatarBone(root, namePattern) {
  let bone = null;
  root.traverse((obj) => {
    if (bone || !obj.isBone) return;
    if (namePattern.test(obj.name)) {
      bone = obj;
    }
  });
  return bone;
}

export function findAvatarHead(root) {
  return (
    findAvatarBone(root, /^(mixamorig)?Head$/i) ||
    findAvatarBone(root, /Head$/i)
  );
}

export function findAvatarNeck(root) {
  return (
    findAvatarBone(root, /^(mixamorig)?Neck$/i) ||
    findAvatarBone(root, /Neck$/i)
  );
}
