import type {App, Plugin} from 'obsidian';

const CONFIG = '潮线/每日复盘任务设置.json';
const TEMPLATE = '潮线/模板/每日复盘任务.md';
const ROUTINE = 'daily_review';

// Opt-in, separate from repeat-task completion: a dated note is never reused for
// another day, and missing dates are not backfilled with overdue tasks.
export async function ensureDailyReviewTask(app: App, date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !await app.vault.adapter.exists(CONFIG)) return;
  const config = JSON.parse(await app.vault.adapter.read(CONFIG)) as {enabled?: boolean; start_date?: string};
  if (!config.enabled || (config.start_date && date < config.start_date)) return;
  const template = app.vault.getFileByPath(TEMPLATE);
  if (!template) return;
  const taskPath = `任务/完成每日复盘｜${date}.md`;
  if (!app.vault.getAbstractFileByPath(taskPath)) {
    const content = await app.vault.read(template);
    const header = ['---', 'status: open', `scheduled: "${date}"`, 'list: 复盘与规划', 'priority: medium', 'project: "[[个人规划系统]]"', `routine_id: ${ROUTINE}`, `routine_date: "${date}"`, '---', ''].join('\n');
    try { await app.vault.create(taskPath, header + '\n' + content.replaceAll('{{date}}', date)); }
    catch (error) { if (!app.vault.getAbstractFileByPath(taskPath)) throw error; }
  }
  // Do not count a previous day's unchecked routine as unfinished work. Keep the
  // original content and distinguish this rollover from an actual completion.
  for (const file of app.vault.getMarkdownFiles()) {
    if (!file.path.startsWith('任务/完成每日复盘｜')) continue;
    const fm = app.metadataCache.getFileCache(file)?.frontmatter;
    if (fm?.routine_id !== ROUTINE || !fm.routine_date || String(fm.routine_date) >= date || fm.routine_closed_on || !['open', 'in_progress'].includes(String(fm.status))) continue;
    await app.fileManager.processFrontMatter(file, current => {
      const record = current as Record<string, unknown>;
      if (record.routine_id !== ROUTINE || String(record.routine_date) >= date || record.routine_closed_on || !['open', 'in_progress'].includes(String(record.status))) return;
      record.status = 'cancelled';
      record.routine_closed_on = date;
      record.routine_closed_reason = '跨日时未勾选完成；保留正文，不计逾期，不补记完成。';
    });
  }
  const diaryPath = `日记/${date}.md`;
  const link = `[[${taskPath.slice(0, -3)}|打开当天的独立复盘任务]]`;
  const addition = '\n\n## 每日复盘入口\n\n' + link + '\n';
  const diary = app.vault.getFileByPath(diaryPath);
  if (diary) await app.vault.process(diary, content => content.includes(link) ? content : content.trimEnd() + addition);
  else {
    try { await app.vault.create(diaryPath, '---\n---\n' + addition); }
    catch (error) {
      const created = app.vault.getFileByPath(diaryPath);
      if (!created) throw error;
      await app.vault.process(created, content => content.includes(link) ? content : content.trimEnd() + addition);
    }
  }
}

export function installDailyReviewTasks(plugin: Plugin & {clock(): {date: string}}) {
  let running = false, completedDate = '';
  const check = async () => {
    const date = plugin.clock().date;
    if (running || completedDate === date) return;
    running = true;
    try { await ensureDailyReviewTask(plugin.app, date); completedDate = date; }
    catch (error) { console.error('Tideline daily review generation failed', error); }
    finally { running = false; }
  };
  plugin.app.workspace.onLayoutReady(() => {
    void check();
    plugin.registerInterval(window.setInterval(() => { void check(); }, 60000));
  });
}
