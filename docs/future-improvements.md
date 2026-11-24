# Future improvements

Polish ideas found during the 2026-11 review, not yet built. Roughly ordered by value.

## Needs a check in the running client first

- **Unread dot on hover.** Unread state is mirrored from Discord's hidden pill
  (`listItem_ > div[aria-hidden]:first-child [class*="visible"]`). If Discord also
  marks the pill `visible` on hover, the dot would flash while hovering. If so,
  switch `read-state.js` to `GuildReadStateStore.hasUnread(guildId)`.
- **Unread DMs.** Discord lists unread DM conversations under the home item
  (`#guild-list-unread-dms`). Unverified how they render as text rows (name,
  avatar hiding, click target).

## Polish

- **Muted servers.** Discord dims muted guilds; text rows look identical to
  unmuted ones. Could dim via `UserGuildSettingsStore.isMuted(guildId)`.
- **Resize handle.** Double-click to reset to the default width; show the
  current width while dragging.
- **Plugin context menu.** Shift+right-click (separators) is undiscoverable,
  has no keyboard navigation (arrows/Enter), and clamps its position with a
  hard-coded 220×200 instead of measuring the menu.
- **Drag inside folders.** Only root items (servers, folders, separators) can be
  reordered; servers inside an expanded folder can't be dragged.

## Out of scope for now

- **Creating real Discord folders** (drop a server onto another). The plugin's
  ordering is local; creating folders means writing Discord's guild-folder user
  settings through internal modules, which is fragile and can corrupt the
  user's real folder layout if it goes wrong.
