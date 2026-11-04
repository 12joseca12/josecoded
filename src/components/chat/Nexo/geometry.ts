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
  centre: { x: 100, y: 158 },
  tilt: -12,
  radiusX: 88,
  radiusY: 18,
  highlight: 0.22,
} as const;

export const orbitBack = `M${-orbit.radiusX} 0A${orbit.radiusX} ${orbit.radiusY} 0 0 1 ${orbit.radiusX} 0`;
export const orbitFront = `M${orbit.radiusX} 0A${orbit.radiusX} ${orbit.radiusY} 0 0 1 ${-orbit.radiusX} 0`;
