// Keep sleeping hours visible at a compressed scale, including overnight schedules.
export function awakeMinutes(value: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(':').map(Number);
  return h <= 24 && m < 60 && (h < 24 || m === 0) ? h * 60 + m : null;
}
export function timelineHours(wake = '06:00', sleep = '24:00') {
  let start = awakeMinutes(wake), end = awakeMinutes(sleep);
  if (start === null || end === null || start === end || Math.abs(start - end) === 1440) { start = 360; end = 1440; }
  const a = start, b = end;
  const awake = (b - a + 1440) % 1440;
  const isAwake = (m: number) => a < b ? m >= a && m < b : m >= a || m < b;
  const bounds = [...new Set([0, a, b, 1440])].sort((x, y) => x - y);
  const position = (time: string) => {
    const t = awakeMinutes(time) ?? 0;
    let x = 0;
    for (let i = 1; i < bounds.length; i++) {
      const lo = bounds[i - 1], hi = Math.min(t, bounds[i]);
      if (hi > lo) x += (hi - lo) * (isAwake((lo + bounds[i]) / 2) ? .9 / awake : .1 / (1440 - awake));
    }
    return Math.max(0, Math.min(1, x));
  };
  const format = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const ticks: {time: string; position: number}[] = [];
  // Wake/sleep boundaries take precedence over ordinary clock ticks.
  for (const m of [...new Set([0, a, b, 1440, 360, 720, 1080])]) {
    const time = format(m), x = position(time);
    if (ticks.some(t => Math.abs(t.position - x) < .065)) continue;
    ticks.push({time, position: x});
  }
  ticks.sort((x, y) => x.position - y.position);
  return {position, ticks, awake, label: `清醒时段 ${format(a)}–${format(b)}；睡眠时段压缩显示`};
}
