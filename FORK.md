# hu127 maintained fork

This fork carries local enhancements independently of upstream PR acceptance.

- Staggered timeline captions, numbered anchors, and timed journal entries.
- Configurable wake/sleep times in Tideline Settings → Device and Obsidian Settings → Tideline. Sleeping hours occupy 10% of the full-day timeline; the awake interval occupies 90%. Overnight schedules are supported; original event times are preserved. Defaults: 06:00–24:00.
- Opt-in separate daily review task instances.
- Open daily recurring tasks use the current day in the task model without rewriting historical notes.

Build: `npm ci && npm run typecheck && npm test && npm run build`. Output: `dist/`. Copy main.js, styles.css and manifest.json to the vault’s `.obsidian/plugins/tideline/`, preserving data.json. Reload Tideline afterwards.

Completion metadata: `completed` remains YYYY-MM-DD; `completed_at` stores the actual ISO 8601 instant with explicit timezone. Task completion/reopen/undo preserve this contract. Completed calendar events with `completed_at` render and sort at the completion instant in device local time, independently of any scheduled/start time. Imported date-only history is not assigned a guessed completion time.
