export const zones = [
  { name: 'Hazotte présidentielle', sectors: [21, 22], color: 'violet' },
  { name: 'Hazotte centrale', sectors: [20, 23], color: 'rouge' },
  { name: 'Hazotte latérale', sectors: [19, 24], color: 'vert' },
  { name: 'Jacquet présidentielle', sectors: [4, 5], color: 'violet' },
  { name: 'Jacquet centrale', sectors: [3, 6], color: 'rouge' },
  { name: 'Jacquet latérale', sectors: [2, 7], color: 'vert' },
  { name: 'Virage', sectors: [17, 18, 25, 26], color: 'ambre' },
  { name: 'Schuth', sectors: [11, 12, 13], color: 'bleu' },
];

export const zoneColors: Record<string, string> = {
  violet: '#9865c4', rouge: '#ea3426', vert: '#498c70', ambre: '#d78546', bleu: '#708cca',
};

export const maxSeats = 9;
export const pitch = { length: 105, width: 68 };

// Totaux de zones HTML et nombre de rangs relevés sur le guichet pour Nancy–Dijon.
// Le total est réparti entre les rangées du modèle. Les identifiants et l'état des sièges sont simulés.
const survey: Record<number, [rows: number, seats: number]> = {
  2: [17, 468], 3: [14, 257], 4: [14, 407], 5: [12, 211], 6: [14, 260], 7: [14, 416],
  11: [21, 255], 12: [21, 507], 13: [21, 597],
  17: [18, 238], 18: [18, 571], 19: [20, 632], 20: [20, 625], 21: [20, 660],
  22: [20, 680], 23: [20, 625], 24: [20, 632], 25: [18, 545], 26: [18, 234],
};

export type Vec3 = [number, number, number];

type PlanPoint = [number, number];

export type StadiumSection = {
  id: number;
  stand: string;
  rotation: number;
  width: number;
  rows: number;
  total: number;
  zoneIndex: number;
  tier: boolean;
  start: PlanPoint;
  end: PlanPoint;
  startOffset: PlanPoint;
  endOffset: PlanPoint;
};

const perimeter: PlanPoint[] = [
  [-51, 42], [51, 42], [57.6, 40], [62, 34],
  [62, -34], [57.6, -40], [49, -42], [-49, -42],
  [-57.6, -40], [-62, -34], [-62, 34], [-57.6, 40],
];

const edges = [
  { ids: [1, 2, 3, 4, 5, 6, 7, 8], stand: 'Jacquet', rows: 16 },
  { ids: [9], stand: 'Virage', rows: 18 },
  { ids: [10], stand: 'Virage', rows: 18 },
  { ids: [11, 12, 13, 14, 15, 16], stand: 'Schuth', rows: 21 },
  { ids: [17], stand: 'Virage', rows: 18 },
  { ids: [18], stand: 'Virage', rows: 18 },
  { ids: [19, 20, 21, 22, 23, 24], stand: 'Hazotte', rows: 20 },
  { ids: [25], stand: 'Virage', rows: 18 },
  { ids: [26], stand: 'Virage', rows: 18 },
  { ids: [27, 28, 29, 30, 31, 32], stand: 'Piantoni', rows: 18 },
  { ids: [33], stand: 'Virage', rows: 18 },
  { ids: [34], stand: 'Virage', rows: 18 },
];

function lerp(a: PlanPoint, b: PlanPoint, t: number): PlanPoint {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

const outward = perimeter.map(([x, z], i): PlanPoint => {
  const [nextX, nextZ] = perimeter[(i + 1) % perimeter.length];
  const length = Math.hypot(nextX - x, nextZ - z);
  return [(z - nextZ) / length, (nextX - x) / length];
});

// Ce même sommet en biseau est partagé par les deux travées adjacentes à chaque profondeur.
const joins = outward.map(([x, z], i): PlanPoint => {
  const [px, pz] = outward[(i + outward.length - 1) % outward.length];
  const scale = 1 + px * x + pz * z;
  return [(px + x) / scale, (pz + z) / scale];
});

function makeEdge(edge: typeof edges[number], index: number, tier = false) {
  const start = perimeter[index];
  const offset = joins[index];
  const next = (index + 1) % perimeter.length;
  const end = perimeter[next];
  const endOffset = joins[next];
  return edge.ids.map((id, slot): StadiumSection => {
    const a = slot / edge.ids.length;
    const b = (slot + 1) / edge.ids.length;
    const [rows, total] = survey[id] ?? [edge.rows, edge.rows * 18];
    return {
      id, stand: edge.stand, tier, rows, total,
      start: lerp(start, end, a), end: lerp(start, end, b),
      startOffset: lerp(offset, endOffset, a), endOffset: lerp(offset, endOffset, b),
      width: Math.hypot(end[0] - start[0], end[1] - start[1]) / edge.ids.length,
      rotation: Math.atan2(outward[index][0], outward[index][1]),
      zoneIndex: zones.findIndex(zone => zone.sectors.includes(id)),
    };
  });
}

export const sections = [
  ...edges.flatMap((edge, index) => makeEdge(edge, index)),
  ...makeEdge({ ids: [35, 36, 37, 38, 39, 40], stand: 'Hazotte', rows: 9 }, 6, true),
];
export const sectionsById = Object.fromEntries(sections.map(section => [section.id, section]));

export const tread = .78;
const rise = .45;
const frontHeight = .69;
export const lowerRows = 21;
const upperDepth = lowerRows * tread + 1.85;
const upperElevation = frontHeight + (lowerRows - 1) * rise - .4;

export function structureRows(section: StadiumSection) {
  return section.tier ? 9 : lowerRows;
}

export function rowPosition(row: number): Vec3 {
  return [0, frontHeight + (row - 1) * rise, (row - .5) * tread];
}

export function toWorld(section: StadiumSection, [x, y, z]: Vec3): Vec3 {
  const t = .5 + x / section.width;
  const [px, pz] = lerp(section.start, section.end, t);
  const [ox, oz] = lerp(section.startOffset, section.endOffset, t);
  const depth = z + (section.tier ? upperDepth : 0);
  return [px + ox * depth, y + (section.tier ? upperElevation : 0), pz + oz * depth];
}

// Les deux accès d'Hazotte chevauchent volontairement une jonction : les bords
// 19 droite / 20 gauche et 23 droite / 24 gauche forment chacun une seule ouverture.
type EntranceKind = 'corner' | 'shared';
const entrances: Partial<Record<number, [left?: EntranceKind, right?: EntranceKind]>> = {
  1: ['corner'], 8: [undefined, 'corner'], 11: ['corner'], 16: [undefined, 'corner'],
  18: [undefined, 'corner'], 19: [undefined, 'shared'], 20: ['shared'],
  23: [undefined, 'shared'], 24: ['shared'], 25: ['corner'], 27: ['corner'], 32: [undefined, 'corner'],
};

export const entranceRows = 5;
export function entranceKind(section: StadiumSection, side: number) {
  return entrances[section.id]?.[side];
}

export function rowEdges(section: StadiumSection, row: number): [number, number] {
  if (row > entranceRows) return [0, 0];
  const width = (side: number) => {
    const kind = entranceKind(section, side);
    return kind === 'shared' ? 1.2 : kind === 'corner' ? Math.min(section.width * .23, 2.35) : 0;
  };
  return [width(0), width(1)];
}

export function seatsInRow(section: StadiumSection, row: number) {
  const count = Math.floor(section.total / section.rows) + Number(row <= section.total % section.rows);
  const aisle = section.stand === 'Hazotte' || (section.stand === 'Schuth' && section.id !== 11)
    || [2, 7, 18, 25].includes(section.id);
  const gap = aisle ? 1.3 : .35;
  const split = Math.floor(count / 2);
  const [left, right] = rowEdges(section, row);
  const spacing = (section.width - left - right - 1 - gap) / count;
  const center = (left - right) / 2;
  const [_, y, z] = rowPosition(row);
  // Un groupe libre dans quelques rangs permet de tester le choix de places côte à côte.
  const hasGroup = row === 3 || row === Math.ceil(section.rows / 2);
  const firstFree = Math.max(1, split - 4);
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const x = center + (index + .5 - count / 2) * spacing + (index < split ? -gap / 2 : gap / 2);
    const free = section.zoneIndex >= 0 && (
      hasGroup && number >= firstFree && number <= split ||
      (number * 19 + row * 11 + section.id * 7) % 23 < 4
    );
    return { id: `${row}-${number}`, row, number, free, position: [x, y + .29, z] as Vec3,
      width: Math.min(.48, spacing * .82) };
  });
}

export function adjacentSeats(section: StadiumSection, quantity: number) {
  for (let row = 1; row <= section.rows; row++) {
    const seats = seatsInRow(section, row);
    let run: string[] = [];
    for (const [index, seat] of seats.entries()) {
      if (index && seat.position[0] - seats[index - 1].position[0] > .9) run = [];
      if (!seat.free) {
        run = [];
        continue;
      }
      run.push(seat.id);
      if (run.length === quantity) return run;
    }
  }
  return [];
}
