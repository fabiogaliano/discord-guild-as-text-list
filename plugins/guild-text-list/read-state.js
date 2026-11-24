import styles from "./styles.module.css";
import { NAV, LIST_ITEM } from "./selectors.js";

// Discord keeps rendering its own unread pill and mention badge inside the
// (hidden) icon markup, so we mirror them onto the text rows. Class names are
// hashed (e.g. "item__o8_Xq visible__o8_Xq"), so match on stable fragments.
const PILL_VISIBLE = ':scope > div[aria-hidden="true"]:first-child [class*="visible"]';
const PILL_SELECTED = ':scope > div[aria-hidden="true"]:first-child [class*="selected"]';
const MENTION_BADGE = '[class*="numberBadge"]';

const readSource = (sourceItem) => {
  if (!sourceItem) return { unread: false, mentions: 0 };
  const unread =
    !!sourceItem.querySelector(PILL_VISIBLE) && !sourceItem.querySelector(PILL_SELECTED);
  const badge = sourceItem.querySelector(MENTION_BADGE);
  const mentions = badge ? parseInt(badge.textContent, 10) || 0 : 0;
  return { unread, mentions };
};

const applyState = (row, { unread, mentions }) => {
  // guarded writes: an unchanged attribute still emits a mutation, which would
  // wake the DOM observer and re-trigger this sync
  const isUnread = unread || mentions > 0;
  if (isUnread !== row.hasAttribute("data-gtl-unread")) {
    if (isUnread) row.setAttribute("data-gtl-unread", "true");
    else row.removeAttribute("data-gtl-unread");
  }

  let badge = row.querySelector(`:scope > .${styles.mentionBadge}`);
  if (mentions > 0) {
    if (!badge) {
      badge = document.createElement("div");
      badge.className = styles.mentionBadge;
      row.append(badge);
    }
    const text = mentions > 99 ? "99+" : String(mentions);
    if (badge.textContent !== text) badge.textContent = text;
  } else {
    badge?.remove();
  }
};

const syncReadState = () => {
  const nav = document.querySelector(NAV);
  if (!nav) return;

  // root guild rows and folder headers are Discord's own list items
  for (const row of nav.querySelectorAll(`.${styles.guildRow}:not(.${styles.addServerBottom})`)) {
    if (row.closest(`.${styles.folderChildren}`)) continue;
    applyState(row, readSource(row));
  }

  // folder children are our own rows; their source is the hidden original
  for (const row of nav.querySelectorAll(`.${styles.folderChildren} [data-guild-id]`)) {
    const gid = row.getAttribute("data-guild-id");
    const src = nav
      .querySelector(`[data-list-item-id="guildsnav___${gid}"]`)
      ?.closest(LIST_ITEM);
    applyState(row, readSource(src));
  }
};

let frame = 0;
export const scheduleReadStateSync = () => {
  if (frame) return;
  // wait a frame so React has committed the badge/pill change we react to
  frame = requestAnimationFrame(() => {
    frame = 0;
    syncReadState();
  });
};

export const setupReadState = () => {
  const store = shelter.flux.storesFlat.GuildReadStateStore;
  store?.addChangeListener?.(scheduleReadStateSync);

  // fallback for builds where the store is renamed: these cover new messages and reads
  const events = ["MESSAGE_CREATE", "MESSAGE_ACK", "BULK_ACK", "CHANNEL_SELECT"];
  const unsubs = store?.addChangeListener
    ? []
    : events.map((e) => shelter.plugin.scoped.flux.subscribe(e, scheduleReadStateSync));

  scheduleReadStateSync();

  return () => {
    store?.removeChangeListener?.(scheduleReadStateSync);
    for (const u of unsubs) u?.();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    for (const el of document.querySelectorAll(`.${styles.mentionBadge}`)) el.remove();
    for (const el of document.querySelectorAll("[data-gtl-unread]")) el.removeAttribute("data-gtl-unread");
  };
};
