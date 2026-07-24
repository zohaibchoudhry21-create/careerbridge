import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  INTERVIEWER_ANIMATION_URLS,
  INTERVIEWER_MODEL_URL,
  INTERVIEWER_STATE_CLIP_KEY,
} from '../config/interviewerAvatarConfig';
import {
  applyAvatarMouthOpen,
  collectAvatarFaceMeshes,
  resetAvatarMouth,
} from '../utils/avatarMouthMorphs';
import { findAvatarHead, findAvatarNeck } from '../utils/avatarRig';

const CROSSFADE_SEC = 0.35;

function useInterviewerAnimationClips() {
  const idle = useGLTF(INTERVIEWER_ANIMATION_URLS.idle);
  const thinking = useGLTF(INTERVIEWER_ANIMATION_URLS.thinking);
  const listening = useGLTF(INTERVIEWER_ANIMATION_URLS.listening);
  const speaking = useGLTF(INTERVIEWER_ANIMATION_URLS.speaking);

  return useMemo(() => {
    const firstClip = (clips, stateKey) => {
      if (!clips?.length) return [];
      const cloned = clips[0].clone();
      cloned.name = stateKey;
      return [cloned];
    };

    return [
      ...firstClip(idle.animations, INTERVIEWER_STATE_CLIP_KEY.idle),
      ...firstClip(thinking.animations, INTERVIEWER_STATE_CLIP_KEY.thinking),
      ...firstClip(listening.animations, INTERVIEWER_STATE_CLIP_KEY.listening),
      ...firstClip(speaking.animations, INTERVIEWER_STATE_CLIP_KEY.speaking),
    ];
  }, [idle.animations, thinking.animations, listening.animations, speaking.animations]);
}

function InterviewerAvatarModel({ state, mouthOpenLevel, presenceLevel }) {
  const groupRef = useRef(null);
  const headRef = useRef(null);
  const neckRef = useRef(null);
  const faceMeshesRef = useRef([]);
  const { scene } = useGLTF(INTERVIEWER_MODEL_URL);
  const animationClips = useInterviewerAnimationClips();
  const { actions, mixer } = useAnimations(animationClips, groupRef);
  const activeClipRef = useRef(null);

  useLayoutEffect(() => {
    faceMeshesRef.current = collectAvatarFaceMeshes(scene);
    headRef.current = findAvatarHead(scene);
    neckRef.current = findAvatarNeck(scene);

    if (!groupRef.current) return;

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 1.72 / maxDim;

    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.set(-center.x * scale, -center.y * scale - 0.92 * scale, -center.z * scale);
  }, [scene]);

  useEffect(() => {
    const clipKey = INTERVIEWER_STATE_CLIP_KEY[state] || INTERVIEWER_STATE_CLIP_KEY.idle;
    const next = actions[clipKey];
    if (!next) return undefined;

    next.reset().fadeIn(CROSSFADE_SEC).play();
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.setEffectiveWeight(1);

    const prev = activeClipRef.current;
    if (prev && prev !== next) {
      prev.fadeOut(CROSSFADE_SEC);
    }
    activeClipRef.current = next;

    return () => {
      if (activeClipRef.current === next) {
        next.fadeOut(CROSSFADE_SEC);
      }
    };
  }, [actions, state]);

  useFrame((_, delta) => {
    mixer?.update(delta);

    const faceMeshes = faceMeshesRef.current;
    if (state === 'speaking') {
      applyAvatarMouthOpen(faceMeshes, mouthOpenLevel);
    } else {
      resetAvatarMouth(faceMeshes);
    }

    const head = headRef.current;
    const neck = neckRef.current;
    const t = performance.now() / 1000;

    if (state === 'thinking') {
      if (neck) {
        neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, -0.14, 0.05);
        neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, 0.05, 0.05);
      }
      if (head) {
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, -0.1, 0.05);
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.06, 0.05);
      }
    } else if (state === 'listening') {
      const lean = 0.03 + (presenceLevel ?? 0.5) * 0.05;
      if (neck) {
        neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, Math.sin(t * 0.75) * 0.05, 0.06);
        neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, lean, 0.06);
      }
      if (head) {
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0, 0.08);
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.02, 0.08);
      }
    } else {
      if (neck) {
        neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, 0, 0.08);
        neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, 0, 0.08);
      }
      if (head) {
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0, 0.08);
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0, 0.08);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function Scene({ state, mouthOpenLevel, presenceLevel }) {
  return (
    <>
      <ambientLight intensity={0.62} />
      <directionalLight position={[2, 4, 3]} intensity={1.15} castShadow />
      <directionalLight position={[-2, 2, -2]} intensity={0.4} />
      <Suspense fallback={null}>
        <InterviewerAvatarModel
          state={state}
          mouthOpenLevel={mouthOpenLevel}
          presenceLevel={presenceLevel}
        />
        <Environment preset="city" />
      </Suspense>
    </>
  );
}

export default function InterviewerAvatar3DScene({
  className = '',
  height = 280,
  state = 'idle',
  mouthOpenLevel = 0,
  presenceLevel = 0.5,
}) {
  return (
    <div
      className={`w-full rounded-xl overflow-hidden bg-gradient-to-b from-surface-container-low to-surface-container ${className}`}
      style={{ height }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.42, 1.55], fov: 36, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Scene state={state} mouthOpenLevel={mouthOpenLevel} presenceLevel={presenceLevel} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(INTERVIEWER_MODEL_URL);
Object.values(INTERVIEWER_ANIMATION_URLS).forEach((url) => useGLTF.preload(url));
