import type {IndexEvent, JournalEntry} from '../data/types.ts';

export type TimelineEntry = IndexEvent & {kind: 'event' | 'journal'; endTime?: string};

export function timelineEntries(date: string, events: IndexEvent[], journal: JournalEntry[]): TimelineEntry[] {
  const result: TimelineEntry[] = events.map(event => ({...event, kind: 'event'}));
  for (const entry of journal) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(entry.time);
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59 || !entry.text.trim()) continue;
    result.push({id: `tideline-journal:${date}:${entry.id}`, date, time: `${match[1].padStart(2, '0')}:${match[2]}`,
      title: entry.text, description: `随手记，来自日记/${date}.md。`, kind: 'journal'});
  }
  const sorted = result.sort((a, b) => a.time.localeCompare(b.time));
  const merged: TimelineEntry[] = [];
  const pauses = new Map<string, {entry: TimelineEntry; seconds: number}>();
  for (const entry of sorted) {
    const match = entry.kind === 'journal' && /^Inference 学习[｜|](开始学习|暂停学习|恢复学习|结束学习)[｜|](.+?)[｜|]累计有效 (.+)$/.exec(entry.title);
    if (!match) { merged.push(entry); continue; }
    const [, action, topic, effort] = match;
    const precise = /（(\d{2}):(\d{2}):(\d{2})）$/.exec(effort);
    const [h, m] = entry.time.split(':').map(Number);
    const seconds = precise && Number(precise[1]) === h && Number(precise[2]) === m && Number(precise[3]) < 60 ? h * 3600 + m * 60 + Number(precise[3]) : h * 3600 + m * 60;
    const pause = pauses.get(topic);
    if (action === '恢复学习' && pause && seconds >= pause.seconds && seconds - pause.seconds <= 120) {
      const gap = seconds - pause.seconds;
      const duration = `${Math.floor(gap / 60)}分${gap % 60}秒`;
      const original = pause.entry.title;
      pause.entry.endTime = entry.time;
      pause.entry.title = `Inference 学习｜短暂暂停后恢复 · ${duration}｜${topic}`;
      pause.entry.description = `${pause.entry.time} ${original}\n${entry.time} ${entry.title}\n原始随手记保留在日记/${date}.md。`;
      pauses.delete(topic);
      continue;
    }
    pauses.delete(topic);
    merged.push(entry);
    if (action === '暂停学习') pauses.set(topic, {entry, seconds});
  }
  return merged;
}
