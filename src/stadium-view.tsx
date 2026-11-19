import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, events, useThree, type ThreeEvent } from '@react-three/fiber';
import { BoxGeometry, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, InstancedMesh, Object3D, Sprite, SRGBColorSpace, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { entranceKind, entranceRows, pitch, rowEdges, rowPosition, seatsInRow, sections, structureRows, toWorld, tread, zoneColors, zones, type StadiumSection, type Vec3 } from './stadium-layout';

type Action = 'in' | 'out' | 'left' | 'right' | 'reset';

type StadiumProps = {
  focus?: StadiumSection;
  zoneIndex: number;
  selected: string[];
  activeRow: number;
  canSelect: boolean;
  onSector: (section: StadiumSection) => void;
  onSeat: (seat: string, row: number) => void;
  onHover: (label: string) => void;
  onFailure: () => void;
  command: { action: Action; sequence: number } | null;
};

type Instance = { position: Vec3; size: Vec3; color: string; rotation?: number };

const red = '#bd342d';
const concrete = '#a9a7a4';
const dark = '#57595d';
const freeGreen = '#3db66c';

type Slab = {
  section: StadiumSection;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  bottom: number;
  top: number;
  color: string;
};

const terraceRows = sections.flatMap(section => Array.from({ length: structureRows(section) }, (_, index) => {
  const row = index + 1;
  const [, height] = rowPosition(row);
  const [left, right] = rowEdges(section, row);
  return { section, row, x0: -section.width / 2 + left, x1: section.width / 2 - right,
    z0: index * tread, z1: row * tread, bottom: 0, top: height,
    color: row % 2 ? concrete : '#b7afa9' };
}));

// Each slab uses the same outward-offset lines as its neighbors, including in the corners.
const prismFaces = [
  4, 7, 6, 4, 6, 5, 0, 1, 2, 0, 2, 3,
  0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2,
  2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0,
] as const;
const facesPerSlab = prismFaces.length / 3;

function slabGeometry(slabs: Slab[]) {
  const positions: number[] = [];
  const colors: number[] = [];
  const tint = new Color();
  for (const { section, x0, x1, z0, z1, bottom, top, color: shade } of slabs) {
    const points: Vec3[] = [
      [x0, bottom, z0], [x1, bottom, z0], [x1, bottom, z1], [x0, bottom, z1],
      [x0, top, z0], [x1, top, z0], [x1, top, z1], [x0, top, z1],
    ];
    const world = points.map(point => toWorld(section, point));
    tint.set(shade);
    for (const point of prismFaces) {
      positions.push(...world[point]);
      colors.push(tint.r, tint.g, tint.b);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const stadiumSeats = sections.flatMap(section => Array.from({ length: section.rows }, (_, i) => seatsInRow(section, i + 1))
  .flat().map(seat => ({ ...seat, section, position: toWorld(section, seat.position) })));

const unitCube = new BoxGeometry();
const seatPan = new BoxGeometry(1, .12, .38).translate(0, -.04, 0);
const seatBack = new BoxGeometry(1, .36, .09).translate(0, .13, .15);
const chair = mergeGeometries([seatPan, seatBack]);
seatPan.dispose();
seatBack.dispose();

const color = new Color();
const transform = new Object3D();
const ignoreRaycast = () => {};

function Instances({ items, kind = 'box', onClick, onHover, onLeave }: {
  items: Instance[];
  kind?: 'box' | 'chair';
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onHover?: (event: ThreeEvent<PointerEvent>) => void;
  onLeave?: () => void;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const invalidate = useThree(state => state.invalidate);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    items.forEach(({ position, size, color: tint, rotation = 0 }, index) => {
      transform.position.set(...position);
      transform.rotation.set(0, rotation, 0);
      transform.scale.set(...size);
      transform.updateMatrix();
      mesh.current!.setMatrixAt(index, transform.matrix);
      mesh.current!.setColorAt(index, color.set(tint));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
    invalidate();
  }, [items, invalidate]);
  if (!items.length) return null;
  return <instancedMesh ref={mesh} args={[kind === 'chair' ? chair : unitCube, undefined, items.length]}
    raycast={onClick || onHover ? InstancedMesh.prototype.raycast : ignoreRaycast}
    onClick={onClick} onPointerMove={onHover} onPointerOut={onLeave}>
    <meshStandardMaterial roughness={.86} />
  </instancedMesh>;
}

function Field() {
  const blocks: Instance[] = [
    { position: [0, -.72, 0], size: [170, 1.02, 143], color: '#aba9a7' },
    { position: [0, -.2, 0], size: [118, .12, 79], color: '#cc3d30' },
    { position: [0, -.16, 0], size: [110, .11, 73], color: '#327047' },
  ];
  for (let n = 0; n < 12; n++) blocks.push({
    position: [(n - 5.5) * pitch.length / 12, -.12, 0], size: [pitch.length / 12, .07, pitch.width],
    color: n % 2 ? '#39784d' : '#438757',
  });
  const marking = (x: number, z: number, width: number, depth: number) => blocks.push({
    position: [x, -.07, z], size: [width, .035, depth], color: '#f4f1e9',
  });
  marking(0, 0, .23, pitch.width);
  for (const side of [-1, 1]) {
    marking(0, side * pitch.width / 2, pitch.length, .23);
    marking(side * pitch.length / 2, 0, .23, pitch.width);
    for (const [length, width] of [[16.5, 40.3], [5.5, 18.3]]) {
      marking(side * (pitch.length / 2 - length), 0, .22, width);
      marking(side * (pitch.length / 2 - length / 2), -width / 2, length, .22);
      marking(side * (pitch.length / 2 - length / 2), width / 2, length, .22);
    }
    const goal = side * pitch.length / 2;
    blocks.push(
      { position: [goal, 1.18, -3.66], size: [.15, 2.45, .15], color: '#ffffff' },
      { position: [goal, 1.18, 3.66], size: [.15, 2.45, .15], color: '#ffffff' },
      { position: [goal, 2.38, 0], size: [.15, .15, 7.47], color: '#ffffff' },
      { position: [side * 41.5, -.06, 0], size: [.36, .04, .36], color: '#ffffff' },
    );
  }
  return <>
    <Instances items={blocks} />
    <mesh position={[0, -.049, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[9.03, 9.26, 64]} /><meshBasicMaterial color="#f4f1e9" />
    </mesh>
    <mesh position={[0, -.042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[.22, 14]} /><meshBasicMaterial color="#f4f1e9" />
    </mesh>
  </>;
}

const architecture = sections.flatMap(section => {
  const last = structureRows(section);
  const [, height] = rowPosition(last);
  const depth = last * tread;
  const edge = section.width / 2;
  const isJacquet = section.stand === 'Jacquet';
  const slabs: Slab[] = [];
  const slab = (x0: number, x1: number, z0: number, z1: number, bottom: number, top: number, color: string) => {
    slabs.push({ section, x0, x1, z0, z1, bottom, top, color });
  };

  // La coursive, le mur arrière et son couronnement se raccordent en biseau dans les virages.
  const belowUpperTier = section.stand === 'Hazotte' && !section.tier;
  const facadeTop = height + (isJacquet ? 3.7 : 1.25);
  if (belowUpperTier) {
    slab(-edge, edge, depth, depth + 1.85, 0, height, '#959696');
  } else {
    slab(-edge, edge, depth, depth + 1.55, 0, height, '#959696');
    slab(-edge, edge, depth + 1.43, depth + 2.04, 0, facadeTop, dark);
    slab(-edge, edge, depth + 1.1, depth + 2.26, facadeTop, facadeTop + .22, '#7d7e80');
    slab(-edge, edge, depth + 1.23, depth + 1.46, height + .37, height + .54, red);
  }

  if (isJacquet) {
    // Les loges suivent la même ligne et la même cote d'un bout à l'autre de Jacquet.
    slab(-edge, edge, depth + 1.31, depth + 1.45, height + .9, facadeTop - .38, '#636e73');
    for (let i = 0; i <= 3; i++) {
      const x = -edge + section.width * (i + .5) / 4;
      slab(x - .07, x + .07, depth + 1.26, depth + 1.36, height + .9, facadeTop - .38, '#444a4c');
    }
  }

  const cuts = rowEdges(section, 1);
  const portalEnd = entranceRows * tread;
  const [, portalTop] = rowPosition(entranceRows + 1);
  // Garde-corps côté terrain, interrompu à chacune des ouvertures.
  slab(-edge + cuts[0], edge - cuts[1], -.16, -.04, .23, .86, '#686a6b');
  for (const [index, width] of cuts.entries()) {
    if (!width) continue;
    const x0 = index === 0 ? -edge : edge - width;
    const x1 = x0 + width;
    const shared = entranceKind(section, index) === 'shared';
    const left = x0 + (shared && index === 0 ? 0 : .04);
    const right = x1 - (shared && index === 1 ? 0 : .04);

    // Le palier et le linteau suivent le biseau du secteur et restent en retrait du terrain.
    slab(left, right, -.22, portalEnd, -.05, .09, '#797775');
    slab(left, right, portalEnd - .12, portalEnd - .02, .09, portalTop - .34, '#39383a');
    slab(left, right, portalEnd - .43, portalEnd + .02, portalTop - .34, portalTop - .05, '#aaa6a1');
    for (const [side, x] of [x0 + .08, x1 - .19].entries()) {
      if (shared && side === index) continue;
      slab(x, x + .11, -.22, portalEnd - .42, .09, .84, '#a19e9a');
      slab(x - .02, x + .13, -.22, portalEnd - .42, .83, .94, '#626567');
    }
    slab(left, right, -1.15, -.22, -.08, .09, '#b8b6b2');
  }
  return slabs;
});
const architectureGeometry = slabGeometry(architecture);

const jacquetLogeSeats: Instance[] = sections.filter(section => section.stand === 'Jacquet').flatMap(section => {
  const capacity = Math.floor((section.width - 1.6) / .58);
  return [19, 20, 21].flatMap(row => {
    const [, height, depth] = rowPosition(row);
    return Array.from({ length: capacity }, (_, index) => ({
      position: toWorld(section, [(index - (capacity - 1) / 2) * .58, height + .29, depth]),
      size: [.47, 1, 1] as Vec3, color: '#b5322b', rotation: section.rotation,
    }));
  });
});

function Label({ text, position, pitchAngle, unavailable = false, activate, hover, leave }: {
  text: string;
  position: Vec3;
  pitchAngle?: number;
  unavailable?: boolean;
  activate?: () => void;
  hover?: () => void;
  leave?: () => void;
}) {
  const onPitch = pitchAngle !== undefined;
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = onPitch ? 480 : 128;
    canvas.height = 112;
    const ctx = canvas.getContext('2d')!;
    if (!onPitch) {
      ctx.fillStyle = unavailable ? '#68666a' : '#241d20';
      ctx.beginPath();
      ctx.roundRect(4, 4, canvas.width - 8, 104, 38);
      ctx.fill();
      ctx.strokeStyle = '#f5efeb';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.font = `${onPitch ? "800 82px" : "700 65px"} system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (onPitch) {
      ctx.strokeStyle = '#264b34';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 5;
      ctx.strokeText(text, canvas.width / 2, 58, canvas.width - 16);
    }
    ctx.fillText(text, canvas.width / 2, 58, canvas.width - 16);
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [text, onPitch, unavailable]);
  useEffect(() => () => texture.dispose(), [texture]);
  if (pitchAngle !== undefined) {
    return <mesh position={position} rotation={[-Math.PI / 2, 0, pitchAngle]} raycast={ignoreRaycast}>
      <planeGeometry args={[25, 5.83]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>;
  }
  return <sprite position={position} scale={[4.9, 4.3, 1]}
    raycast={hover ? Sprite.prototype.raycast : ignoreRaycast}
    onClick={hover ? event => {
      if (event.delta > 6) return;
      event.stopPropagation();
      activate?.();
    } : undefined}
    onPointerMove={hover ? event => { event.stopPropagation(); hover(); } : undefined}
    onPointerOut={leave}>
    <spriteMaterial map={texture} depthTest={false} transparent toneMapped={false} />
  </sprite>;
}

function Controls({ focus, command }: Pick<StadiumProps, 'focus' | 'command'>) {
  const { camera, gl, invalidate, size } = useThree();
  const orbit = useRef<OrbitControls>(null);
  const narrow = size.width / size.height < 1.2;
  const applyPreset = (controls: OrbitControls) => {
    if (focus) {
      const [_, rise, back] = rowPosition(focus.rows);
      controls.target.set(...toWorld(focus, [0, rise * .51, back * .48]));
      camera.position.set(...toWorld(focus, [focus.width * .18, narrow ? 41 : 31, back * .4 - (narrow ? 29 : 23)]));
      controls.minDistance = 7;
      controls.maxDistance = 118;
    } else {
      controls.target.set(0, 1, 0);
      const overview: Vec3 = narrow ? [155, 226, 202] : [121, 164, 156];
      camera.position.set(...overview);
      controls.minDistance = 68;
      controls.maxDistance = 425;
    }
    controls.update();
    invalidate();
  };

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minPolarAngle = .13;
    controls.maxPolarAngle = Math.PI / 2 - .1;
    controls.rotateSpeed = .75;
    controls.zoomSpeed = .75;
    const redraw = () => invalidate();
    controls.addEventListener('change', redraw);
    orbit.current = controls;
    return () => {
      controls.removeEventListener('change', redraw);
      controls.dispose();
      orbit.current = null;
    };
  }, [camera, gl, invalidate]);

  useEffect(() => {
    if (orbit.current) applyPreset(orbit.current);
  }, [focus, narrow]);

  useEffect(() => {
    const controls = orbit.current;
    if (!controls || !command) return;
    const { action } = command;
    if (action === 'reset') {
      applyPreset(controls);
      return;
    }
    const offset = camera.position.clone().sub(controls.target);
    if (action === 'in' || action === 'out') {
      const distance = offset.length() * (action === 'in' ? .78 : 1.28);
      offset.setLength(Math.max(controls.minDistance, Math.min(distance, controls.maxDistance)));
    } else {
      offset.applyAxisAngle(new Vector3(0, 1, 0), action === 'left' ? .36 : -.36);
    }
    camera.position.copy(controls.target).add(offset);
    controls.update();
    invalidate();
  }, [command]);
  return null;
}

function StadiumScene({ focus, zoneIndex, selected, activeRow, canSelect, onSector, onSeat, onHover, command }: StadiumProps) {
  const canvas = useThree(state => state.gl.domElement);
  const showSector = (section?: StadiumSection) => {
    const active = section && section.zoneIndex >= 0;
    canvas.style.cursor = active ? 'pointer' : '';
    onHover(section ? `${section.stand} · Secteur ${section.id}${active ? '' : ' · Indisponible dans cet aperçu'}` : '');
  };
  const clearHover = () => {
    canvas.style.cursor = '';
    onHover('');
  };
  useEffect(clearHover, [focus, zoneIndex, canSelect]);

  const steps = useMemo(() => slabGeometry(terraceRows.map(row => {
    const zone = zones[row.section.zoneIndex];
    const tinted = !focus && zone && (zoneIndex < 0 || row.section.zoneIndex === zoneIndex);
    const tint = tinted ? new Color(row.color).lerp(new Color(zoneColors[zone.color]), .23).getStyle() : row.color;
    return { ...row, color: tint };
  })), [focus, zoneIndex]);
  useEffect(() => () => steps.dispose(), [steps]);
  const sectionUnder = (faceIndex?: number | null) => faceIndex == null ? undefined : terraceRows[Math.floor(faceIndex / facesPerSlab)]?.section;

  const details = useMemo(() => focus ? stadiumSeats.filter(seat => seat.section.id === focus.id) : [], [focus]);
  const seats = useMemo<Instance[]>(() => stadiumSeats.filter(seat => seat.section.id !== focus?.id).map<Instance>(seat => {
    const activeZone = zones[seat.section.zoneIndex];
    const tinted = !focus && activeZone && (zoneIndex < 0 || seat.section.zoneIndex === zoneIndex);
    return { position: seat.position, size: [seat.width, 1, 1],
      rotation: seat.section.rotation,
      color: tinted ? zoneColors[activeZone.color] : '#777173' };
  }).concat(jacquetLogeSeats), [focus, zoneIndex]);
  const detailMeshes = useMemo<Instance[]>(() => details.map(seat => ({
    position: seat.position, size: [seat.width, 1, 1], rotation: seat.section.rotation,
    color: selected.includes(seat.id) ? '#ee382d'
      : seat.free ? seat.row === activeRow ? '#92edaa' : freeGreen : '#a09a96',
  })), [details, selected, activeRow]);

  return <>
    <hemisphereLight color="#fff6ea" groundColor="#57434a" intensity={2.1} />
    <directionalLight position={[-48, 104, 41]} intensity={2} />
    <directionalLight position={[80, 50, -100]} color="#dfe8ff" intensity={.45} />
    <Controls focus={focus} command={command} />
    <Field />
    <mesh geometry={architectureGeometry} raycast={ignoreRaycast} dispose={null}>
      <meshStandardMaterial vertexColors roughness={.89} />
    </mesh>
    <mesh geometry={steps} raycast={focus ? ignoreRaycast : undefined}
      onClick={!focus ? event => {
        const section = sectionUnder(event.faceIndex);
        if (event.delta <= 6 && section && section.zoneIndex >= 0) onSector(section);
      } : undefined}
      onPointerMove={!focus ? event => showSector(sectionUnder(event.faceIndex)) : undefined}
      onPointerOut={!focus ? clearHover : undefined}>
      <meshStandardMaterial vertexColors roughness={.91} />
    </mesh>
    <Instances items={seats} kind="chair" />
    <Instances items={detailMeshes} kind="chair" onClick={canSelect ? event => {
      if (event.delta > 6 || event.instanceId === undefined) return;
      const seat = details[event.instanceId];
      if (seat.free) onSeat(seat.id, seat.row);
    } : undefined} onHover={canSelect ? event => {
      const seat = details[event.instanceId ?? -1];
      if (!seat) return;
      const chosen = selected.includes(seat.id);
      canvas.style.cursor = seat.free ? 'pointer' : '';
      onHover(`Rang ${seat.row} · Place ${seat.number} · ${chosen ? 'Sélectionnée' : seat.free ? 'Libre dans la démo' : 'Indisponible'}`);
    } : undefined} onLeave={canSelect ? clearHover : undefined} />
    {!focus && <>
      <Label text="JACQUET" position={[0, -.026, 30]} pitchAngle={0} />
      <Label text="HAZOTTE" position={[0, -.026, -30]} pitchAngle={0} />
      <Label text="PIANTONI" position={[-47, -.026, 0]} pitchAngle={-Math.PI / 2} />
      <Label text="SCHUTH" position={[47, -.026, 0]} pitchAngle={Math.PI / 2} />
    </>}
    {!focus && sections.map(section => {
      const [, height, depth] = rowPosition(structureRows(section));
      const available = section.zoneIndex >= 0;
      return <Label key={section.id} text={String(section.id)} unavailable={!available}
        position={toWorld(section, [0, height * .58 + 2.1, depth * .56])}
        activate={available ? () => onSector(section) : undefined} hover={() => showSector(section)} leave={clearHover} />;
    })}
  </>;
}

export default function StadiumView(props: StadiumProps) {
  return <Canvas events={state => ({
    ...events(state),
    filter: intersections => [
      ...intersections.filter(hit => hit.object instanceof Sprite),
      ...intersections.filter(hit => !(hit.object instanceof Sprite)),
    ],
  })} aria-hidden="true" frameloop="demand" dpr={[1, 1.5]}
    camera={{ position: [121, 164, 156], fov: 41, near: .35, far: 700 }}
    gl={{ alpha: true, antialias: true }}
    fallback={<p className="stadium-loading">Utilise la liste pour choisir ton secteur.</p>}
    onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', props.onFailure, { once: true })}>
    <StadiumScene {...props} />
  </Canvas>;
}
