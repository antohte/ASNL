import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { AnimationMixer, Box3, Group, NoToneMapping, PMREMGenerator, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import crestUrl from '../maquette-asnl/ecusson-asnl-metal-laque.glb?url';

function Studio() {
  const { gl, scene, invalidate } = useThree();
  useLayoutEffect(() => {
    const room = new RoomEnvironment();
    const generator = new PMREMGenerator(gl);
    const lighting = generator.fromScene(room, .035);
    scene.environment = lighting.texture;
    scene.environmentIntensity = .8;
    scene.environmentRotation.y = Math.PI / 5;
    room.dispose();
    generator.dispose();
    invalidate();
    return () => {
      scene.environment = null;
      lighting.dispose();
    };
  }, [gl, scene, invalidate]);
  return <><directionalLight position={[-2, 2.8, 3]} intensity={1.65} /><directionalLight position={[1.5, .8, -2.5]} intensity={1} /></>;
}

function Crest({ playing, onReady }: { playing: boolean; onReady: () => void }) {
  const asset = useLoader(GLTFLoader, crestUrl);
  const object = useMemo(() => asset.scene.clone(), [asset]);
  const mixer = useMemo(() => new AnimationMixer(object), [object]);
  const pivot = useRef<Group>(null);
  const bounds = useMemo(() => {
    const box = new Box3().setFromObject(object);
    return { center: box.getCenter(new Vector3()), height: box.getSize(new Vector3()).y };
  }, [object]);
  useEffect(() => {
    const clip = asset.animations[0];
    if (clip) mixer.clipAction(clip).play();
    return () => { mixer.stopAllAction(); mixer.uncacheRoot(object); };
  }, [asset, mixer, object]);
  const ready = useRef(false);
  useFrame((_, delta) => {
    if (playing) mixer.update(Math.min(delta, .05));
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  });
  return <group ref={pivot} rotation={[.075, -.37, 0]} scale={1 / bounds.height}>
    <primitive object={object} position={bounds.center.clone().negate()} />
  </group>;
}

export default function CrestCanvas({ playing, onReady, onFailure }: {
  playing: boolean; onReady: () => void; onFailure: () => void;
}) {
  return <Canvas
    aria-hidden="true"
    orthographic
    flat
    camera={{ position: [0,0,3], near: .1, far: 12 }}
    dpr={[1, 1.65]}
    frameloop={playing ? 'always' : 'demand'}
    gl={{ alpha: true, antialias: true, toneMapping: NoToneMapping }}
    onCreated={({ gl, camera, size }) => {
      gl.domElement.addEventListener('webglcontextlost', onFailure, { once: true });
      camera.zoom = size.height / 1.17;
      camera.updateProjectionMatrix();
    }}
  >
    <FrameCamera />
    <Studio />
    <Suspense fallback={null}><Crest playing={playing} onReady={onReady} /></Suspense>
  </Canvas>;
}

function FrameCamera() {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    camera.zoom = Math.min(size.height, size.width) / 1.17;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, invalidate]);
  return null;
}
