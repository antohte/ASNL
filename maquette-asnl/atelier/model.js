import * as THREE from 'three';
import { contours } from 'd3-contour';
import { mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import sourceUrl from './logo-source.png';

const bevel = 0.0038;
const bodyHalfDepth = 0.035;
const reliefReferenceDepth = 0.025;
const fullTurn = Math.PI * 2;
export const rotationSeconds = 30;

function segmentDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = dx * dx + dy * dy;
  const t = length ? THREE.MathUtils.clamp(((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / length, 0, 1) : 0;
  return Math.hypot(point[0] - start[0] - dx * t, point[1] - start[1] - dy * t);
}

function simplify(points) {
  let index = 0;
  let distance = 0.3;
  for (let i = 1; i < points.length - 1; i++) {
    const candidate = segmentDistance(points[i], points[0], points.at(-1));
    if (candidate > distance) {
      distance = candidate;
      index = i;
    }
  }
  if (!index) return [points[0], points.at(-1)];
  return [...simplify(points.slice(0, index + 1)).slice(0, -1), ...simplify(points.slice(index))];
}

function polygonArea(ring) {
  return Math.abs(ring.slice(1).reduce((sum, [x, y], i) =>
    sum + ring[i][0] * y - ring[i][1] * x, 0)) / 2;
}

function trace(values, width, height, threshold) {
  const polygons = contours().size([width, height]).contour(values, threshold).coordinates;
  const project = ([x, y]) => new THREE.Vector2((x - width / 2) / height, (height / 2 - y) / height);
  return polygons.filter(([outer]) => polygonArea(outer) >= 1.2).map(([outer, ...holes]) => {
    const shape = new THREE.Shape(simplify(outer).slice(0, -1).map(project));
    shape.holes = holes
      .filter(hole => polygonArea(hole) >= 0.8)
      .map(hole => new THREE.Path(simplify(hole).slice(0, -1).map(project)));
    return shape;
  });
}

async function readShapes() {
  const image = new Image();
  image.src = sourceUrl;
  await image.decode();
  const { naturalWidth: width, naturalHeight: height } = image;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, width, height);
  const alpha = new Float32Array(width * height);
  const red = new Float32Array(alpha.length);
  for (let point = 0; point < alpha.length; point++) {
    const i = point * 4;
    alpha[point] = data[i + 3];
    red[point] = Math.min(data[i] - data[i + 1], data[i] - data[i + 2]) * alpha[point] / 255;
  }
  return {
    base: trace(alpha, width, height, 110),
    artwork: trace(red, width, height, 78)
  };
}

function extrude(shapes, depth, edge) {
  const raw = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: edge,
    bevelSize: edge,
    bevelSegments: 2,
    steps: 1
  });
  raw.deleteAttribute('uv');
  const originalNormals = raw.getAttribute('normal');
  const smooth = toCreasedNormals(raw, Math.PI / 5);
  const normals = smooth.getAttribute('normal');
  // Keep the faces flat so highlights follow the beveled edges instead of the triangulation.
  for (let i = 0; i < normals.count; i++) {
    const z = originalNormals.getZ(i);
    if (Math.abs(z) > 0.9999) normals.setXYZ(i, 0, 0, Math.sign(z));
  }
  const compact = mergeVertices(smooth);
  if (smooth !== raw) smooth.dispose();
  raw.dispose();
  return compact;
}

export async function createCrest() {
  const { base, artwork } = await readShapes();
  if (base.length !== 1 || artwork.length < 10) throw new Error('Le contour de l’écusson n’a pas pu être reconstruit.');

  const crest = new THREE.Group();
  crest.name = 'Ecusson_ASNL';

  const bodyMaterial = new THREE.MeshStandardMaterial({
    name: 'Métal blanc satiné', color: '#eeece7', metalness: 0.78, roughness: 0.34
  });
  const reliefMaterial = new THREE.MeshStandardMaterial({
    name: 'Métal rouge anodisé', color: '#e31c14', metalness: 0.87, roughness: 0.3
  });
  const body = new THREE.Mesh(extrude(base, (bodyHalfDepth - bevel) * 2, bevel), bodyMaterial);
  body.name = 'Écusson blanc';
  body.geometry.translate(0, 0, -(bodyHalfDepth - bevel));
  body.castShadow = true;
  body.receiveShadow = true;
  crest.add(body);

  // The bevel intersects the base slightly, leaving no seam when seen from the side.
  const artworkGeometry = extrude(artwork, reliefReferenceDepth, 0.00125);
  const raisedParts = [];
  for (const face of [1, -1]) {
    const relief = new THREE.Mesh(artworkGeometry, reliefMaterial);
    relief.name = face === 1 ? 'Motifs rouges en relief — recto' : 'Motifs rouges en relief — verso';
    relief.position.z = face * (bodyHalfDepth - 0.0008);
    relief.rotation.y = face === 1 ? 0 : Math.PI;
    relief.castShadow = true;
    raisedParts.push(relief);
    crest.add(relief);
  }

  return {
    crest,
    setRelief(percent) {
      for (const part of raisedParts) part.scale.z = percent / (100 * reliefReferenceDepth);
    },
    setFinish(satin) {
      reliefMaterial.roughness = satin;
      bodyMaterial.roughness = satin + 0.035;
    }
  };
}

export function makeSpin() {
  const times = [0, 1, 2, 3, 4].map(step => rotationSeconds * step / 4);
  const axis = new THREE.Vector3(0, 1, 0);
  const values = times.flatMap(time =>
    new THREE.Quaternion().setFromAxisAngle(axis, fullTurn * time / rotationSeconds).toArray()
  );
  return new THREE.AnimationClip('Rotation lente', rotationSeconds, [
    new THREE.QuaternionKeyframeTrack('Ecusson_ASNL.quaternion', times, values)
  ]);
}
