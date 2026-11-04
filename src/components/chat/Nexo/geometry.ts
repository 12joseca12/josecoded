export const eyeCentres = { left: { x: 78, y: 72 }, right: { x: 122, y: 72 } } as const;

export interface EyeShape {
  x0: number;
  y0: number;
  qx: number;
  qy: number;
  x1: number;
  y1: number;
}

export interface MouthShape {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  top: number;
  bottom: number;
}

const round = (value: number) => Number(value.toFixed(2)).toString();

export function eyePath(centre: { x: number; y: number }, shape: EyeShape, mirror: boolean) {
  const sign = mirror ? -1 : 1;
  const point = (dx: number, dy: number) =>
    `${round(centre.x + sign * dx)} ${round(centre.y + dy)}`;
  return `M${point(shape.x0, shape.y0)}Q${point(shape.qx, shape.qy)} ${point(shape.x1, shape.y1)}`;
}

export function mouthPath(shape: MouthShape) {
  const middle = round((shape.x0 + shape.x1) / 2);
  const start = `${round(shape.x0)} ${round(shape.y0)}`;
  const end = `${round(shape.x1)} ${round(shape.y1)}`;
  return `M${start}Q${middle} ${round(shape.top)} ${end}Q${middle} ${round(shape.bottom)} ${start}Z`;
}

export const orbit = {
  centre: { x: 100, y: 148 },
  radius: 88,
  elevation: 0.26,
  tiltDegrees: 7,
  biasDegrees: -5,
  spark: 0.11,
  restPrecession: 0.25,
  restPhase: 0.35,
} as const;

export interface OrbitPaths {
  front: string;
  back: string;
  sparkFront: string;
  sparkBack: string;
}

interface Sample {
  x: number;
  y: number;
  depth: number;
}

const turn = Math.PI * 2;
const degrees = Math.PI / 180;
const tilt = orbit.tiltDegrees * degrees;
const bias = orbit.biasDegrees * degrees;
const lift = Math.sqrt(1 - orbit.elevation ** 2);

function sample(theta: number, azimuth: number): Sample {
  const px = orbit.radius * Math.cos(theta);
  const pz = orbit.radius * Math.sin(theta);
  const ax = Math.cos(azimuth);
  const az = Math.sin(azimuth);
  const along = ax * px + az * pz;
  const y = (az * px - ax * pz) * Math.sin(tilt);
  const x = px * Math.cos(tilt) + ax * along * (1 - Math.cos(tilt));
  const z = pz * Math.cos(tilt) + az * along * (1 - Math.cos(tilt));
  const screenY = y * lift + z * orbit.elevation;
  return {
    x: x * Math.cos(bias) - screenY * Math.sin(bias),
    y: x * Math.sin(bias) + screenY * Math.cos(bias),
    depth: z * lift - y * orbit.elevation,
  };
}

const point = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;

function split(samples: Sample[]) {
  const sides = { front: "", back: "" };
  let side: keyof typeof sides = "front";
  samples.forEach((current, index) => {
    const previous = samples[index - 1];
    const next: keyof typeof sides = current.depth >= 0 ? "front" : "back";
    if (!previous) {
      side = next;
      sides[side] += `M${point(current.x, current.y)}`;
      return;
    }
    if (next !== side) {
      const share = previous.depth / (previous.depth - current.depth);
      const cross = point(
        previous.x + (current.x - previous.x) * share,
        previous.y + (current.y - previous.y) * share,
      );
      sides[side] += `L${cross}`;
      side = next;
      sides[side] += `M${cross}`;
    }
    sides[side] += `L${point(current.x, current.y)}`;
  });
  return sides;
}

const ringSteps = 120;
const sparkSteps = 18;

export function orbitPaths(precession: number, phase: number): OrbitPaths {
  const azimuth = precession * turn;
  const ring = split(
    Array.from({ length: ringSteps + 1 }, (_, index) =>
      sample((index / ringSteps) * turn, azimuth),
    ),
  );
  const spark = split(
    Array.from({ length: sparkSteps + 1 }, (_, index) =>
      sample((phase + (index / sparkSteps) * orbit.spark) * turn, azimuth),
    ),
  );
  return {
    front: ring.front,
    back: ring.back,
    sparkFront: spark.front,
    sparkBack: spark.back,
  };
}
