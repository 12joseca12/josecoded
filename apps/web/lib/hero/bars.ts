// Writes the fill of the three cycle bars as `--p` (0..1) on each `<li>`: the bars before the
// highlighted one are full, the ones after it empty (home-v7 scene.js:371). CSS draws it with
// `scaleX(var(--p))`, so one write per frame is all the cost.

export type BarWriter = (index: number, fill: number) => void;

export function createBarWriter(list: Element | null): BarWriter {
  const bars = list ? [...list.children].filter((el): el is HTMLElement => el instanceof HTMLElement) : [];
  const last: string[] = [];
  return (index, fill) => {
    bars.forEach((bar, i) => {
      const value = (i === index ? fill : i < index ? 1 : 0).toFixed(3);
      if (last[i] === value) return;
      last[i] = value;
      bar.style.setProperty('--p', value);
    });
  };
}
