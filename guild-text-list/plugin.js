(function(exports) {

"use strict";

//#region plugins/guild-text-list/selectors.js
const NAV = "nav[aria-label=\"Servers sidebar\"]";
const GUILD_SELECTOR = `${NAV} [data-list-item-id^="guildsnav___"]`;
const FOLDER_SELECTOR = `${NAV} [role="treeitem"][aria-owns^="folder-items-"]`;
const LIST_ITEM = "div[class*=\"listItem_\"]";
const ROOT_GROUP = `${NAV} [role="group"][aria-label="Servers"]`;
const HIDDEN_ITEMS = new Set(["guild-discover-button", "app-download-button"]);
const SPECIAL_ITEMS = new Map([["home", "DMs"], ["create-join-button", "+ Add Server"]]);
const isExcluded = (listItemId) => {
	if (!listItemId) return true;
	const suffix = listItemId.slice("guildsnav___".length);
	if (!suffix) return true;
	if (HIDDEN_ITEMS.has(suffix)) return true;
	if (SPECIAL_ITEMS.has(suffix)) return false;
	return !/^[0-9]+$/.test(suffix);
};

//#endregion
//#region plugins/guild-text-list/styles.module.css
shelter.plugin.scoped.ui.injectCss(`:root, nav[aria-label="Servers sidebar"] {
  --gtl-fg: var(--interactive-text-default, var(--interactive-normal, #4e5058));
  --gtl-fg-muted: var(--channels-default, var(--text-muted, #6d6f78));
  --gtl-fg-hover: var(--interactive-text-hover, var(--interactive-hover, #2e3338));
  --gtl-fg-strong: var(--interactive-text-active, var(--interactive-active, #060607));
  --gtl-bg: var(--background-base-lower, var(--background-secondary, #f2f3f5));
  --gtl-bg-hover: var(--background-mod-subtle, var(--background-modifier-hover, #0000000a));
  --gtl-bg-selected: var(--background-mod-normal, var(--background-modifier-selected, #00000014));
  --gtl-bg-floating: var(--background-surface-higher, var(--background-floating, #fff));
  --gtl-border: var(--border-subtle, var(--background-modifier-accent, #0000000f));
  --gtl-accent: var(--brand-500, #5865f2);
  --gtl-danger: var(--status-danger, #d83a42);
}

.iyJNSW_sidebar {
  width: var(--guild-text-w, 220px);
  background: var(--gtl-bg);
  flex-direction: column;
  min-width: 140px;
  max-width: 380px;
  display: flex;
  position: relative;
}

.iyJNSW_sidebar [class*="folderGroup"] {
  width: 100%;
  background: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
}

.iyJNSW_sidebar [class*="folderGroupBackground"], .iyJNSW_hiddenItem {
  display: none !important;
}

.iyJNSW_iconHidden {
  inset: 0;
  overflow: hidden;
  opacity: 0 !important;
  pointer-events: none !important;
  position: absolute !important;
}

.iyJNSW_guildRow:has(:focus-visible) {
  outline: 2px solid var(--gtl-accent);
  outline-offset: -2px;
}

nav[aria-label="Servers sidebar"] div[class*="listItem"]:has([data-list-item-id="guildsnav___guild-discover-button"]), nav[aria-label="Servers sidebar"] div[class*="listItem"]:has([data-list-item-id="guildsnav___app-download-button"]), nav[aria-label="Servers sidebar"] [data-list-item-id="guildsnav___guild-discover-button"], nav[aria-label="Servers sidebar"] [data-list-item-id="guildsnav___app-download-button"] {
  display: none !important;
}

nav[aria-label="Servers sidebar"] div[class*="listItem_"] > div[aria-hidden="true"]:first-child, nav[aria-label="Servers sidebar"] [class*="pill"] {
  display: none !important;
}

nav[aria-label="Servers sidebar"] [class*="guildSeparator"] {
  align-self: stretch;
  background: var(--gtl-border) !important;
  width: calc(100% - 32px) !important;
  height: 1px !important;
  margin: 6px 16px !important;
}

nav[aria-label="Servers sidebar"] .vc-ranb-button {
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  align-self: stretch;
  height: 28px;
  font-weight: 500;
  width: calc(100% - 16px) !important;
  color: var(--gtl-fg-muted) !important;
  background: none !important;
  justify-content: flex-start !important;
  margin: 0 8px 2px !important;
  padding: 0 12px 0 26px !important;
  font-size: 13px !important;
}

nav[aria-label="Servers sidebar"] .vc-ranb-button:hover {
  background-color: var(--gtl-bg-hover) !important;
  color: var(--gtl-fg-hover) !important;
}

nav[aria-label="Servers sidebar"] [class*="unreadMentionsBar"] {
  border-radius: 10px !important;
  width: fit-content !important;
  min-width: 0 !important;
  height: 20px !important;
  margin: 0 auto !important;
  padding: 0 10px !important;
  font-size: 11px !important;
  line-height: 20px !important;
}

.iyJNSW_resizeHandle {
  cursor: col-resize;
  z-index: 100;
  width: 4px;
  height: 100%;
  position: absolute;
  top: 0;
  right: -2px;
}

.iyJNSW_resizeHandle:after {
  content: "";
  background: var(--gtl-accent);
  opacity: 0;
  border-radius: 1px;
  width: 2px;
  height: 100%;
  transition: opacity .15s;
  position: absolute;
  top: 0;
  left: 1px;
}

.iyJNSW_resizeHandle:hover:after, .iyJNSW_resizeHandle:active:after {
  opacity: .5;
}

.iyJNSW_guildRow {
  box-sizing: border-box;
  width: calc(100% - 16px);
  height: 32px;
  color: var(--gtl-fg);
  cursor: pointer;
  border-radius: 6px;
  align-items: center;
  gap: 8px;
  margin: 1px 8px;
  padding: 0 12px;
  transition: background-color .1s, color .1s;
  display: flex;
  position: relative;
}

.iyJNSW_guildRow:hover {
  background-color: var(--gtl-bg-hover);
  color: var(--gtl-fg-hover);
}

.iyJNSW_guildRow:not(.iyJNSW_folderRow):has([role="treeitem"][aria-selected="true"]), .iyJNSW_guildRow[aria-selected="true"], .iyJNSW_guildRow[data-is-selected="true"] {
  background-color: var(--gtl-bg-selected);
  color: var(--gtl-fg-strong);
}

.iyJNSW_guildRow:before {
  content: "";
  background: var(--gtl-accent);
  opacity: 0;
  border-radius: 50%;
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  transition: opacity .12s;
}

.iyJNSW_folderRow:before {
  display: none;
}

.iyJNSW_guildRow[data-gtl-unread="true"]:before {
  opacity: 1;
}

.iyJNSW_guildRow[data-gtl-unread="true"] .iyJNSW_guildLabel {
  color: var(--gtl-fg-strong);
  font-weight: 600;
}

.iyJNSW_folderRow[data-gtl-unread="true"] .iyJNSW_folderLabel {
  color: var(--gtl-fg-strong);
}

.iyJNSW_folderExpanded[data-gtl-unread="true"] .iyJNSW_folderLabel {
  color: var(--gtl-fg-muted);
}

.iyJNSW_folderExpanded > .iyJNSW_mentionBadge {
  display: none;
}

.iyJNSW_mentionBadge {
  background: var(--gtl-danger);
  color: #fff;
  text-align: center;
  border-radius: 8px;
  flex-shrink: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
}

.iyJNSW_guildLabel {
  color: inherit;
  white-space: nowrap;
  text-overflow: ellipsis;
  pointer-events: none;
  cursor: grab;
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 32px;
  overflow: hidden;
}

.iyJNSW_guildLabel:active {
  cursor: grabbing;
}

.iyJNSW_folderRow {
  box-sizing: border-box;
  cursor: pointer;
  border-top: 1px solid var(--gtl-border);
  background: none;
  border-radius: 0;
  align-items: center;
  min-height: 24px;
  margin: 8px 8px 2px;
  padding: 14px 4px 2px;
  display: flex;
  width: calc(100% - 16px) !important;
}

.iyJNSW_folderRow:hover {
  background: none;
}

.iyJNSW_folderLabel {
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--gtl-fg-muted);
  white-space: nowrap;
  text-overflow: ellipsis;
  pointer-events: auto;
  user-select: none;
  cursor: pointer;
  flex: 1;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 0;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  transition: color .12s;
  display: inline-flex;
  overflow: hidden;
}

.iyJNSW_folderRow:hover .iyJNSW_folderLabel {
  color: var(--gtl-fg-hover);
}

.iyJNSW_folderCaret {
  opacity: .6;
  flex-shrink: 0;
  align-items: center;
  transition: transform .15s cubic-bezier(.25, 1, .5, 1);
  display: inline-flex;
}

.iyJNSW_folderExpanded .iyJNSW_folderCaret {
  transform: rotate(90deg);
}

.iyJNSW_folderIconHidden {
  display: none;
}

.iyJNSW_folderChildren {
  pointer-events: auto;
  width: 100%;
  padding: 0;
  position: relative;
  overflow: hidden;
}

.iyJNSW_folderChildren .iyJNSW_guildRow {
  width: calc(100% - 16px);
  height: 30px;
  margin: 1px 8px;
  padding-left: 24px;
  animation: .15s cubic-bezier(.25, 1, .5, 1) both iyJNSW_slideIn;
}

.iyJNSW_folderChildren .iyJNSW_guildLabel {
  font-size: 14px;
  line-height: 30px;
}

@keyframes iyJNSW_slideIn {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.iyJNSW_addServerBottom {
  border-top: 1px solid var(--gtl-border);
  background: var(--gtl-bg);
  flex-shrink: 0;
  height: 44px;
  padding: 0 12px;
  position: relative;
  border-radius: 0 !important;
  width: 100% !important;
  margin: auto 0 0 !important;
}

nav[aria-label="Servers sidebar"] .iyJNSW_guildRow[class*="circleIconButton"] {
  width: calc(100% - 16px) !important;
  height: 32px !important;
  color: var(--gtl-fg) !important;
  background-color: #0000 !important;
  border-radius: 6px !important;
  justify-content: flex-start !important;
  padding: 0 12px !important;
}

.iyJNSW_folderItemsHidden, .iyJNSW_folderHeaderHidden, .iyJNSW_folderButtonHidden {
  opacity: 0 !important;
  pointer-events: none !important;
  width: 0 !important;
  height: 0 !important;
  position: absolute !important;
  overflow: hidden !important;
}

.iyJNSW_folderBgHidden, .iyJNSW_folderOpenWrapperHidden {
  display: none !important;
}

.iyJNSW_separator {
  box-sizing: border-box;
  cursor: grab;
  width: calc(100% - 24px);
  margin: 6px 12px;
  padding: 0;
}

.iyJNSW_separator:active {
  cursor: grabbing;
}

.iyJNSW_separatorNew {
  animation: .22s cubic-bezier(.25, 1, .5, 1) both iyJNSW_separatorIn;
}

@keyframes iyJNSW_separatorIn {
  from {
    opacity: 0;
    transform: scaleX(.4);
  }

  to {
    opacity: 1;
    transform: scaleX(1);
  }
}

.iyJNSW_dragging {
  z-index: 10;
  box-shadow: 0 0 0 1px var(--gtl-border),
    0 4px 12px #0000001f;
  border-radius: 6px;
  position: relative;
  background-color: var(--gtl-bg-floating) !important;
  color: var(--gtl-fg-strong) !important;
  cursor: grabbing !important;
}

.iyJNSW_separator.iyJNSW_dragging {
  box-shadow: none;
  background: none !important;
}

.iyJNSW_separator.iyJNSW_dragging .iyJNSW_separatorLine {
  background: var(--gtl-accent);
  height: 2px;
}

.iyJNSW_dragActive, .iyJNSW_dragActive * {
  cursor: grabbing !important;
  user-select: none !important;
}

.iyJNSW_dragActive .iyJNSW_guildRow:not(.iyJNSW_dragging):hover {
  background-color: #0000;
}

.iyJNSW_separatorLine {
  background: var(--gtl-border);
  width: 100%;
  height: 1px;
}

.iyJNSW_rootMenu {
  z-index: 999999;
  background: var(--gtl-bg-floating);
  min-width: 180px;
  color: var(--gtl-fg-hover);
  border: .5px solid var(--gtl-border);
  transform-origin: 0 0;
  border-radius: 8px;
  padding: 4px;
  font-size: 14px;
  animation: .125s cubic-bezier(.25, 1, .5, 1) iyJNSW_menuIn;
  position: fixed;
  box-shadow: 0 0 0 .5px #0000000d, 0 2px 4px #0000000a, 0 4px 12px #00000014;
}

@keyframes iyJNSW_menuIn {
  from {
    opacity: 0;
    transform: scale(.96);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.iyJNSW_rootMenuButton {
  appearance: none;
  text-align: left;
  width: 100%;
  color: inherit;
  cursor: pointer;
  background: none;
  border: 0;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 14px;
  transition: background-color .1s;
  display: block;
}

.iyJNSW_rootMenuButton:hover {
  background-color: var(--gtl-bg-hover);
}

.iyJNSW_rootMenuDanger {
  color: var(--gtl-danger);
}

.iyJNSW_rootMenuDanger:hover {
  background-color: var(--gtl-danger);
  color: #fff;
}

@media (prefers-reduced-motion: reduce) {
  .iyJNSW_guildRow, .iyJNSW_folderCaret, .iyJNSW_folderLabel, .iyJNSW_rootMenu, .iyJNSW_rootMenuButton, .iyJNSW_separatorNew, .iyJNSW_guildRow:before, .iyJNSW_resizeHandle:after {
    transition: none;
    animation: none;
  }

  .iyJNSW_folderChildren .iyJNSW_guildRow {
    animation: none;
  }
}
`);
var styles_module_default = {
	"slideIn": "iyJNSW_slideIn",
	"guildLabel": "iyJNSW_guildLabel",
	"folderBgHidden": "iyJNSW_folderBgHidden",
	"folderHeaderHidden": "iyJNSW_folderHeaderHidden",
	"folderRow": "iyJNSW_folderRow",
	"mentionBadge": "iyJNSW_mentionBadge",
	"hiddenItem": "iyJNSW_hiddenItem",
	"separatorNew": "iyJNSW_separatorNew",
	"separatorIn": "iyJNSW_separatorIn",
	"resizeHandle": "iyJNSW_resizeHandle",
	"addServerBottom": "iyJNSW_addServerBottom",
	"rootMenu": "iyJNSW_rootMenu",
	"folderLabel": "iyJNSW_folderLabel",
	"rootMenuButton": "iyJNSW_rootMenuButton",
	"rootMenuDanger": "iyJNSW_rootMenuDanger",
	"folderIconHidden": "iyJNSW_folderIconHidden",
	"folderExpanded": "iyJNSW_folderExpanded",
	"separator": "iyJNSW_separator",
	"dragging": "iyJNSW_dragging",
	"folderButtonHidden": "iyJNSW_folderButtonHidden",
	"separatorLine": "iyJNSW_separatorLine",
	"folderItemsHidden": "iyJNSW_folderItemsHidden",
	"folderChildren": "iyJNSW_folderChildren",
	"sidebar": "iyJNSW_sidebar",
	"iconHidden": "iyJNSW_iconHidden",
	"guildRow": "iyJNSW_guildRow",
	"dragActive": "iyJNSW_dragActive",
	"menuIn": "iyJNSW_menuIn",
	"folderCaret": "iyJNSW_folderCaret",
	"folderOpenWrapperHidden": "iyJNSW_folderOpenWrapperHidden"
};

//#endregion
//#region plugins/guild-text-list/read-state.js
const PILL_VISIBLE = ":scope > div[aria-hidden=\"true\"]:first-child [class*=\"visible\"]";
const PILL_SELECTED = ":scope > div[aria-hidden=\"true\"]:first-child [class*=\"selected\"]";
const MENTION_BADGE = "[class*=\"numberBadge\"]";
const readSource = (sourceItem) => {
	if (!sourceItem) return {
		unread: false,
		mentions: 0
	};
	const unread = !!sourceItem.querySelector(PILL_VISIBLE) && !sourceItem.querySelector(PILL_SELECTED);
	const badge = sourceItem.querySelector(MENTION_BADGE);
	const mentions = badge ? parseInt(badge.textContent, 10) || 0 : 0;
	return {
		unread,
		mentions
	};
};
const applyState = (row, { unread, mentions }) => {
	const isUnread = unread || mentions > 0;
	if (isUnread !== row.hasAttribute("data-gtl-unread")) if (isUnread) row.setAttribute("data-gtl-unread", "true");
else row.removeAttribute("data-gtl-unread");
	let badge = row.querySelector(`:scope > .${styles_module_default.mentionBadge}`);
	if (mentions > 0) {
		if (!badge) {
			badge = document.createElement("div");
			badge.className = styles_module_default.mentionBadge;
			row.append(badge);
		}
		const text = mentions > 99 ? "99+" : String(mentions);
		if (badge.textContent !== text) badge.textContent = text;
	} else badge?.remove();
};
const syncReadState = () => {
	const nav = document.querySelector(NAV);
	if (!nav) return;
	for (const row of nav.querySelectorAll(`.${styles_module_default.guildRow}:not(.${styles_module_default.addServerBottom})`)) {
		if (row.closest(`.${styles_module_default.folderChildren}`)) continue;
		applyState(row, readSource(row));
	}
	for (const row of nav.querySelectorAll(`.${styles_module_default.folderChildren} [data-guild-id]`)) {
		const gid = row.getAttribute("data-guild-id");
		const src = nav.querySelector(`[data-list-item-id="guildsnav___${gid}"]`)?.closest(LIST_ITEM);
		applyState(row, readSource(src));
	}
};
let frame = 0;
const scheduleReadStateSync = () => {
	if (frame) return;
	frame = requestAnimationFrame(() => {
		frame = 0;
		syncReadState();
	});
};
const setupReadState = () => {
	const store$1 = shelter.flux.storesFlat.GuildReadStateStore;
	store$1?.addChangeListener?.(scheduleReadStateSync);
	const events = [
		"MESSAGE_CREATE",
		"MESSAGE_ACK",
		"BULK_ACK",
		"CHANNEL_SELECT"
	];
	const unsubs = store$1?.addChangeListener ? [] : events.map((e) => shelter.plugin.scoped.flux.subscribe(e, scheduleReadStateSync));
	scheduleReadStateSync();
	return () => {
		store$1?.removeChangeListener?.(scheduleReadStateSync);
		for (const u of unsubs) u?.();
		if (frame) cancelAnimationFrame(frame);
		frame = 0;
		for (const el of document.querySelectorAll(`.${styles_module_default.mentionBadge}`)) el.remove();
		for (const el of document.querySelectorAll("[data-gtl-unread]")) el.removeAttribute("data-gtl-unread");
	};
};

//#endregion
//#region plugins/guild-text-list/dom-utils.js
const normalizeText = (value) => (value || "").replace(/\s+/g, " ").trim();
const getGuildName = (elem) => {
	const dnd = elem.closest("[data-dnd-name]");
	const dndName = dnd?.getAttribute("data-dnd-name");
	if (dndName) return normalizeText(dndName);
	const hidden = elem.querySelector("span[class*=\"hiddenVisually\"]");
	return normalizeText(hidden?.textContent);
};
const isFolderButton = (elem) => typeof elem?.getAttribute === "function" && (elem.getAttribute("aria-owns")?.startsWith("folder-items-") || elem.closest("[class*=\"folderHeader\"]"));
const normalizeFolderName = (value) => {
	if (!value) return "";
	const [name] = value.split(",");
	return normalizeText(name);
};
const getFolderId = (folderButton) => {
	const owns = folderButton?.getAttribute?.("aria-owns");
	if (!owns?.startsWith("folder-items-")) return null;
	return owns.slice("folder-items-".length);
};
const getFolderIdFromGroup = (folderGroup) => {
	const btn = folderGroup?.querySelector?.("[role=\"treeitem\"][aria-owns^=\"folder-items-\"]");
	const owns = btn?.getAttribute?.("aria-owns");
	if (!owns?.startsWith("folder-items-")) return null;
	return owns.slice("folder-items-".length);
};

//#endregion
//#region plugins/guild-text-list/textify.js
const addClass = (el, cls) => {
	if (!el.classList.contains(cls)) el.classList.add(cls);
};
const toggleClass = (el, cls, on) => {
	if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
};
const setText = (el, text) => {
	if (el.textContent !== text) el.textContent = text;
};
const setAttr = (el, name, value) => {
	if (el.getAttribute(name) !== value) el.setAttribute(name, value);
};
const forwardContextMenu = (target, event) => {
	event.preventDefault();
	event.stopPropagation();
	target.dispatchEvent(new MouseEvent("contextmenu", {
		bubbles: true,
		cancelable: true,
		view: window,
		clientX: event.clientX,
		clientY: event.clientY,
		screenX: event.screenX,
		screenY: event.screenY
	}));
};
const processed = new Map();
const processedFolders = new Map();
const syncFolderSelection = () => {
	const selectedId = shelter?.flux?.storesFlat?.SelectedGuildStore?.getGuildId?.();
	for (const row of document.querySelectorAll(`.${styles_module_default.folderChildren} [data-guild-id]`)) if (row.getAttribute("data-guild-id") === selectedId) row.setAttribute("data-is-selected", "true");
else row.removeAttribute("data-is-selected");
};
const ensureFolderChildren = (folderGroup) => {
	let container = folderGroup.querySelector(`.${styles_module_default.folderChildren}`);
	if (!container) {
		container = document.createElement("div");
		container.className = styles_module_default.folderChildren;
		folderGroup.append(container);
	}
	return container;
};
const clearFolderChildren = (folderGroup) => {
	const container = folderGroup.querySelector(`.${styles_module_default.folderChildren}`);
	if (container) container.remove();
};
const getFolderGuildsFromDom = (folderGroup, folderId) => {
	const root = folderGroup.querySelector(`#folder-items-${folderId}`);
	if (!root) return [];
	const guilds = [];
	const seen = new Set();
	for (const treeitem of root.querySelectorAll("[data-list-item-id^=\"guildsnav___\"]")) {
		const listItemId = treeitem.getAttribute("data-list-item-id");
		const guildId = listItemId?.slice("guildsnav___".length);
		if (!guildId || !/^[0-9]+$/.test(guildId) || seen.has(guildId)) continue;
		seen.add(guildId);
		const dnd = treeitem.closest("[data-dnd-name]");
		const name = normalizeText(dnd?.getAttribute?.("data-dnd-name"));
		guilds.push({
			id: guildId,
			name
		});
	}
	return guilds;
};
const renderFolderChildren = (folderGroup, folderId, GuildStore$1) => {
	const origItems = folderGroup.querySelector(`#folder-items-${folderId}`);
	if (origItems) origItems.classList.add(styles_module_default.folderItemsHidden);
	const bg = folderGroup.querySelector("[class*=\"folderGroupBackground\"]");
	if (bg) bg.classList.add(styles_module_default.folderBgHidden);
	for (const w of folderGroup.querySelectorAll("[class*=\"wrapper_\"], [class*=\"folderEndWrapper\"]")) w.classList.add(styles_module_default.folderBgHidden);
	const container = ensureFolderChildren(folderGroup);
	container.replaceChildren();
	const guilds = getFolderGuildsFromDom(folderGroup, folderId);
	for (const { id: gid, name: domName } of guilds) {
		const name = GuildStore$1?.getGuild?.(gid)?.name || domName || gid;
		const row = document.createElement("div");
		row.className = styles_module_default.guildRow;
		row.setAttribute("role", "button");
		row.setAttribute("tabindex", "-1");
		row.setAttribute("data-guild-id", gid);
		row.style.cursor = "pointer";
		const selectedGuildId = GuildStore$1 && shelter?.flux?.storesFlat?.SelectedGuildStore?.getGuildId?.();
		if (selectedGuildId === gid) row.setAttribute("data-is-selected", "true");
		const label = document.createElement("div");
		label.className = styles_module_default.guildLabel;
		label.textContent = name;
		label.setAttribute("title", name);
		row.append(label);
		const findOriginal = () => folderGroup.querySelector(`[data-list-item-id='guildsnav___${gid}']`) || document.querySelector(`[data-list-item-id='guildsnav___${gid}']`);
		row.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			for (const r of container.querySelectorAll("[data-is-selected]")) r.removeAttribute("data-is-selected");
			row.setAttribute("data-is-selected", "true");
			const target = findOriginal();
			if (target instanceof HTMLElement) target.click();
		}, true);
		row.addEventListener("contextmenu", (event) => {
			if (event.shiftKey) return;
			const target = findOriginal();
			if (target instanceof HTMLElement) forwardContextMenu(target, event);
		});
		container.append(row);
	}
	scheduleReadStateSync();
};
const textifyGuild = (elem) => {
	if (!(elem instanceof HTMLElement)) return;
	if (isFolderButton(elem)) return;
	const listItemId = elem.getAttribute("data-list-item-id");
	const suffix = listItemId?.slice("guildsnav___".length) ?? "";
	if (HIDDEN_ITEMS.has(suffix)) {
		const listItem$1 = elem.closest(LIST_ITEM) || elem.closest("div[class*=\"listItem\"]") || elem;
		addClass(listItem$1, styles_module_default.hiddenItem);
		return;
	}
	if (isExcluded(listItemId)) return;
	const isSpecial = SPECIAL_ITEMS.has(suffix);
	const name = isSpecial ? SPECIAL_ITEMS.get(suffix) : getGuildName(elem);
	if (!name) return;
	const listItemWrap = elem.closest(LIST_ITEM) || elem.closest("div[class*=\"listItem\"]");
	const listItem = listItemWrap || elem;
	addClass(listItem, styles_module_default.guildRow);
	if (isSpecial && !listItemWrap) {
		for (const child of Array.from(elem.children)) if (!child.classList.contains(styles_module_default.guildLabel) && child.style.display !== "none") child.style.display = "none";
	}
	if (suffix === "create-join-button") {
		addClass(listItem, styles_module_default.hiddenItem);
		const nav = elem.closest("nav[aria-label=\"Servers sidebar\"]");
		if (nav && !nav.querySelector(`.${styles_module_default.addServerBottom}`)) {
			const bottomBtn = document.createElement("div");
			bottomBtn.className = `${styles_module_default.guildRow} ${styles_module_default.addServerBottom}`;
			bottomBtn.setAttribute("role", "button");
			bottomBtn.style.cursor = "pointer";
			const btnLabel = document.createElement("div");
			btnLabel.className = styles_module_default.guildLabel;
			btnLabel.textContent = name;
			bottomBtn.append(btnLabel);
			bottomBtn.addEventListener("click", () => elem.click());
			nav.append(bottomBtn);
		}
		return;
	}
	let label = listItem.querySelector(`.${styles_module_default.guildLabel}`);
	if (!label) {
		label = document.createElement("div");
		label.className = styles_module_default.guildLabel;
		listItem.append(label);
	}
	setText(label, name);
	setAttr(label, "title", name);
	if (/^[0-9]+$/.test(suffix)) setAttr(listItem, "data-guild-id", suffix);
	if (!processed.has(listItem)) {
		let iconNode = null;
		if (listItemWrap) {
			iconNode = elem;
			while (iconNode.parentElement && iconNode.parentElement !== listItem) iconNode = iconNode.parentElement;
		}
		if (iconNode) iconNode.classList.add(styles_module_default.iconHidden);
		const handleClick = isSpecial && !listItemWrap ? null : (event) => {
			if (event.defaultPrevented) return;
			if (event.target instanceof Node && elem.contains(event.target)) return;
			elem.click();
		};
		const handleContextMenu = (event) => {
			if (event.defaultPrevented) return;
			if (event.target instanceof Node && elem.contains(event.target)) return;
			forwardContextMenu(elem, event);
		};
		if (handleClick) listItem.addEventListener("click", handleClick);
		listItem.addEventListener("contextmenu", handleContextMenu);
		processed.set(listItem, {
			iconNode,
			isSpecialNoWrap: isSpecial && !listItemWrap,
			handleClick,
			handleContextMenu
		});
	}
};
const textifyFolder = (elem, { observeDom: observeDom$1, GuildStore: GuildStore$1 }) => {
	if (!(elem instanceof HTMLElement)) return;
	const header = elem.closest("[data-dnd-name]");
	const dndName = header?.getAttribute("data-dnd-name");
	const hidden = elem.querySelector("span[class*=\"hiddenVisually\"]");
	const name = normalizeText(dndName || normalizeFolderName(hidden?.textContent));
	if (!name) return;
	const listItem = elem.closest(LIST_ITEM) || elem.closest("div[class*=\"listItem\"]") || elem;
	const folderGroup = elem.closest("[class*=\"folderGroup\"]");
	const folderId = getFolderId(elem);
	if (!folderGroup || !folderId) return;
	addClass(listItem, styles_module_default.folderRow);
	addClass(listItem, styles_module_default.guildRow);
	addClass(elem, styles_module_default.folderButtonHidden);
	const isExpanded = elem.getAttribute("aria-expanded") === "true";
	toggleClass(listItem, styles_module_default.folderExpanded, isExpanded);
	const hasChildren = !!folderGroup.querySelector(`.${styles_module_default.folderChildren}`);
	if (isExpanded && !hasChildren) queueMicrotask(() => renderFolderChildren(folderGroup, folderId, GuildStore$1));
else if (!isExpanded && hasChildren) clearFolderChildren(folderGroup);
	let label = listItem.querySelector(`.${styles_module_default.folderLabel}`);
	if (!label) {
		label = document.createElement("div");
		label.className = `${styles_module_default.guildLabel} ${styles_module_default.folderLabel}`;
		const caret = document.createElement("span");
		caret.className = styles_module_default.folderCaret;
		caret.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
		label.append(caret);
		const text = document.createElement("span");
		text.className = "shelter-folder-text";
		label.append(text);
		listItem.append(label);
	}
	const textNode = label.querySelector(".shelter-folder-text");
	if (textNode) setText(textNode, name);
	setAttr(label, "title", name);
	if (!processedFolders.has(listItem)) {
		if (header) header.classList.add(styles_module_default.folderHeaderHidden);
		const iconWrap = elem.querySelector("[aria-hidden=\"true\"]");
		const previousDisplay = iconWrap?.style.display ?? "";
		if (iconWrap) {
			iconWrap.classList.add(styles_module_default.folderIconHidden);
			iconWrap.style.display = "none";
		}
		const handleToggle = (event) => {
			if (event.defaultPrevented) return;
			if (event.target instanceof Node && elem.contains(event.target)) return;
			event.preventDefault();
			event.stopPropagation();
			elem.click();
			const syncExpanded = () => {
				const isExpanded$1 = elem.getAttribute("aria-expanded") === "true";
				if (isExpanded$1) listItem.classList.add(styles_module_default.folderExpanded);
else listItem.classList.remove(styles_module_default.folderExpanded);
				if (!isExpanded$1) {
					clearFolderChildren(folderGroup);
					return;
				}
				const render = () => renderFolderChildren(folderGroup, folderId, GuildStore$1);
				render();
				const unobs = observeDom$1(`#folder-items-${folderId} *`, () => {
					unobs();
					render();
				});
				setTimeout(unobs, 250);
			};
			queueMicrotask(syncExpanded);
			setTimeout(syncExpanded, 50);
		};
		listItem.addEventListener("click", handleToggle, true);
		processedFolders.set(listItem, {
			iconWrap,
			previousDisplay,
			handleToggle,
			label,
			elem,
			folderGroup
		});
	}
};
const cleanupGuilds = () => {
	for (const [listItem, data] of processed) {
		const label = listItem.querySelector(`.${styles_module_default.guildLabel}`);
		if (label) label.remove();
		if (data?.iconNode) data.iconNode.classList.remove(styles_module_default.iconHidden);
		if (data?.isSpecialNoWrap) {
			for (const child of Array.from(listItem.children)) if (child.style.display === "none") child.style.display = "";
		}
		if (data?.handleClick) listItem.removeEventListener("click", data.handleClick);
		if (data?.handleContextMenu) listItem.removeEventListener("contextmenu", data.handleContextMenu);
		listItem.classList.remove(styles_module_default.guildRow);
		listItem.classList.remove(styles_module_default.hiddenItem);
		listItem.removeAttribute("data-guild-id");
	}
	processed.clear();
	for (const btn of document.querySelectorAll(`.${styles_module_default.addServerBottom}`)) btn.remove();
};
const cleanupFolders = () => {
	for (const [listItem, data] of processedFolders) {
		const label = listItem.querySelector(`.${styles_module_default.folderLabel}`);
		if (label) label.remove();
		if (data?.iconWrap) {
			data.iconWrap.style.display = data.previousDisplay;
			data.iconWrap.classList.remove(styles_module_default.folderIconHidden);
		}
		if (data?.handleToggle) listItem.removeEventListener("click", data.handleToggle, true);
		if (data?.elem) data.elem.classList.remove(styles_module_default.folderButtonHidden);
		if (data?.folderGroup) {
			clearFolderChildren(data.folderGroup);
			if (data?.elem?.getAttribute?.("aria-expanded") === "true") data.elem.click();
		}
		listItem.classList.remove(styles_module_default.folderRow, styles_module_default.guildRow, styles_module_default.folderExpanded);
	}
	processedFolders.clear();
};

//#endregion
//#region plugins/guild-text-list/context-menu.js
let rootMenu = null;
let rootMenuCleanup = null;
const closeRootMenu = () => {
	rootMenuCleanup?.();
	rootMenuCleanup = null;
	rootMenu?.remove();
	rootMenu = null;
};
const openRootMenu = (x, y, items) => {
	closeRootMenu();
	const menu = document.createElement("div");
	menu.className = styles_module_default.rootMenu;
	for (const item of items) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = item.danger ? `${styles_module_default.rootMenuButton} ${styles_module_default.rootMenuDanger}` : styles_module_default.rootMenuButton;
		btn.textContent = item.label;
		btn.addEventListener("click", () => {
			item.onClick();
			closeRootMenu();
		});
		menu.append(btn);
	}
	menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - 220))}px`;
	menu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - 200))}px`;
	document.body.append(menu);
	rootMenu = menu;
	const onDocDown = (ev) => {
		if (!(ev.target instanceof Node) || !menu.contains(ev.target)) closeRootMenu();
	};
	const onKey = (ev) => {
		if (ev.key === "Escape") closeRootMenu();
	};
	const cleanup = () => {
		document.removeEventListener("pointerdown", onDocDown, true);
		window.removeEventListener("keydown", onKey, true);
	};
	rootMenuCleanup = cleanup;
	setTimeout(() => {
		document.addEventListener("pointerdown", onDocDown, true);
		window.addEventListener("keydown", onKey, true);
	}, 0);
};

//#endregion
//#region plugins/guild-text-list/reorder.js
let rootContainer = null;
let isDragging = false;
let dragNode = null;
let dragStart = null;
let didDrag = false;
let activePointerId = null;
let rafPending = false;
let isApplyingOrder = false;
let lastApplyAt = 0;
const getRootContainer = () => {
	rootContainer = document.querySelector(ROOT_GROUP);
	return rootContainer;
};
const newSepId = () => {
	if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
const createSeparator = (id, { animate = false } = {}) => {
	const el = document.createElement("div");
	el.className = animate ? `${styles_module_default.separator} ${styles_module_default.separatorNew}` : styles_module_default.separator;
	el.setAttribute("data-shelter-separator-id", id);
	const line = document.createElement("div");
	line.className = styles_module_default.separatorLine;
	el.append(line);
	return el;
};
const ensureSeparatorExists = (id) => {
	rootContainer = rootContainer || getRootContainer();
	if (!(rootContainer instanceof HTMLElement)) return null;
	const existing = Array.from(rootContainer.querySelectorAll(`.${styles_module_default.separator}`)).find((el$1) => el$1.getAttribute("data-shelter-separator-id") === id);
	if (existing) return existing;
	const el = createSeparator(id);
	rootContainer.append(el);
	return el;
};
const getKeyForRootChild = (node) => {
	if (!(node instanceof HTMLElement)) return null;
	if (node.classList.contains(styles_module_default.separator)) {
		const id = node.getAttribute("data-shelter-separator-id");
		return id ? `s:${id}` : null;
	}
	if (node.matches("[class*=\"folderGroup\"]")) {
		const folderId = getFolderIdFromGroup(node);
		return folderId ? `f:${folderId}` : null;
	}
	if (node.matches("div[class*=\"listItem\"]")) {
		const treeitem = node.querySelector("[role=\"treeitem\"][data-list-item-id^=\"guildsnav___\"]");
		const listItemId = treeitem?.getAttribute?.("data-list-item-id");
		if (!listItemId) return null;
		if (isExcluded(listItemId)) return null;
		const suffix = listItemId.slice("guildsnav___".length);
		if (!/^[0-9]+$/.test(suffix)) return null;
		return `g:${suffix}`;
	}
	return null;
};
const saveRootOrder = (store$1) => {
	rootContainer = rootContainer || getRootContainer();
	if (!(rootContainer instanceof HTMLElement)) return;
	const keys = [];
	for (const child of Array.from(rootContainer.children)) {
		const key = getKeyForRootChild(child);
		if (key) keys.push(key);
	}
	store$1.rootOrderV1 = keys;
	store$1.rootOrderV1SavedAt = Date.now();
	store$1.rootOrderV1SaveCount = (store$1.rootOrderV1SaveCount || 0) + 1;
};
const applyStoredRootOrder = (store$1) => {
	if (isDragging) return;
	if (isApplyingOrder) return;
	const now = Date.now();
	if (now - lastApplyAt < 50) return;
	rootContainer = rootContainer || getRootContainer();
	if (!(rootContainer instanceof HTMLElement)) return;
	isApplyingOrder = true;
	lastApplyAt = now;
	let desired = [];
	try {
		const raw = store$1.rootOrderV1;
		if (raw && typeof raw.length === "number") for (let i = 0; i < raw.length; i++) desired.push(raw[i]);
	} catch {
		store$1.rootOrderV1 = [];
		desired = [];
	}
	const desiredSet = new Set(desired);
	const children = Array.from(rootContainer.children);
	const byKey = new Map();
	const presentKeys = [];
	const unknown = [];
	for (const child of children) {
		const key = getKeyForRootChild(child);
		if (!key) continue;
		presentKeys.push(key);
		if (!byKey.has(key)) byKey.set(key, child);
	}
	const presentSet = new Set(presentKeys);
	const allSeparatorsExist = desired.every((k) => typeof k !== "string" || !k.startsWith("s:") || presentSet.has(k));
	if (allSeparatorsExist) {
		const desiredPresent = desired.filter((k) => typeof k === "string" && (k.startsWith("s:") || byKey.has(k)));
		const presentInDesired = presentKeys.filter((k) => desiredSet.has(k));
		const alreadyOrdered = desiredPresent.length === presentInDesired.length && desiredPresent.every((k, i) => k === presentInDesired[i]);
		if (alreadyOrdered) {
			isApplyingOrder = false;
			return;
		}
	}
	for (const key of desired) {
		if (typeof key !== "string") continue;
		if (key.startsWith("s:")) {
			const sep = ensureSeparatorExists(key.slice(2));
			if (sep) rootContainer.append(sep);
			continue;
		}
		const el = byKey.get(key);
		if (el) rootContainer.append(el);
	}
	for (const child of children) {
		const key = getKeyForRootChild(child);
		if (!key) continue;
		if (!desiredSet.has(key)) unknown.push(child);
	}
	for (const el of unknown) rootContainer.append(el);
	queueMicrotask(() => {
		isApplyingOrder = false;
	});
};
const getRootDraggableNode = (target) => {
	rootContainer = rootContainer || getRootContainer();
	if (!(rootContainer instanceof HTMLElement)) return null;
	if (!(target instanceof HTMLElement)) return null;
	if (target.closest(`.${styles_module_default.folderChildren}`)) return null;
	const sep = target.closest(`.${styles_module_default.separator}`);
	if (sep && sep.parentElement === rootContainer) return sep;
	const folderGroup = target.closest("[class*=\"folderGroup\"]");
	if (folderGroup && folderGroup.parentElement === rootContainer) return folderGroup;
	const listItem = target.closest("div[class*=\"listItem\"]");
	if (listItem && listItem.parentElement === rootContainer) return listItem;
	return null;
};
const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const animateShift = (mutate) => {
	if (prefersReducedMotion()) return mutate();
	const kids = Array.from(rootContainer.children).filter((el) => el !== dragNode);
	const before = new Map(kids.map((el) => [el, el.getBoundingClientRect().top]));
	mutate();
	for (const el of kids) {
		const delta = before.get(el) - el.getBoundingClientRect().top;
		if (!delta) continue;
		el.style.transition = "none";
		el.style.transform = `translateY(${delta}px)`;
		el.getBoundingClientRect();
		el.style.transition = "transform 160ms cubic-bezier(0.25, 1, 0.5, 1)";
		el.style.transform = "";
		el.addEventListener("transitionend", () => el.style.transition = "", { once: true });
	}
};
const layoutRect = (el) => {
	const r = el.getBoundingClientRect();
	const t = getComputedStyle(el).transform;
	const dy = t && t !== "none" ? new DOMMatrixReadOnly(t).m42 : 0;
	return {
		top: r.top - dy,
		height: r.height
	};
};
const reorderOnPointer = (clientY) => {
	if (!(rootContainer instanceof HTMLElement)) return;
	if (!(dragNode instanceof HTMLElement)) return;
	let overNode = null;
	for (const child of rootContainer.children) {
		if (child === dragNode || !getKeyForRootChild(child)) continue;
		const r$1 = layoutRect(child);
		if (r$1.height && clientY >= r$1.top && clientY < r$1.top + r$1.height) {
			overNode = child;
			break;
		}
	}
	if (!overNode) return;
	const r = layoutRect(overNode);
	const ref = clientY < r.top + r.height / 2 ? overNode : overNode.nextSibling;
	if (ref === dragNode || dragNode.nextSibling === ref) return;
	animateShift(() => rootContainer.insertBefore(dragNode, ref));
};
const suppressNextClick = () => {
	const swallow = (e) => {
		e.preventDefault();
		e.stopPropagation();
	};
	window.addEventListener("click", swallow, {
		capture: true,
		once: true
	});
	setTimeout(() => window.removeEventListener("click", swallow, true), 0);
};
const EDGE = 48;
const MAX_SPEED = 14;
const setupDragAndContextMenu = (store$1) => {
	let lastY = 0;
	let origNext = null;
	let scrollFrame = 0;
	const autoScrollTick = () => {
		scrollFrame = 0;
		if (!isDragging || !didDrag) return;
		const scroller = rootContainer?.closest("[class*=\"scroller\"]");
		if (!scroller) return;
		const r = scroller.getBoundingClientRect();
		let speed = 0;
		if (lastY < r.top + EDGE) speed = -MAX_SPEED * Math.min(1, (r.top + EDGE - lastY) / EDGE);
else if (lastY > r.bottom - EDGE) speed = MAX_SPEED * Math.min(1, (lastY - (r.bottom - EDGE)) / EDGE);
		if (!speed) return;
		const before = scroller.scrollTop;
		scroller.scrollTop += speed;
		if (scroller.scrollTop !== before) reorderOnPointer(lastY);
		scrollFrame = requestAnimationFrame(autoScrollTick);
	};
	const onPointerDown = (event) => {
		if (event.button !== 0) return;
		const node = getRootDraggableNode(event.target);
		if (!node) return;
		isDragging = true;
		didDrag = false;
		dragNode = node;
		dragStart = {
			x: event.clientX,
			y: event.clientY
		};
		activePointerId = event.pointerId;
	};
	const onPointerMove = (event) => {
		if (!isDragging) return;
		if (activePointerId !== null && event.pointerId !== activePointerId) return;
		if (!dragStart) return;
		const dx = Math.abs(event.clientX - dragStart.x);
		const dy = Math.abs(event.clientY - dragStart.y);
		if (!didDrag && dx + dy < 6) return;
		if (!didDrag) origNext = dragNode?.nextSibling ?? null;
		didDrag = true;
		lastY = event.clientY;
		if (!scrollFrame) scrollFrame = requestAnimationFrame(autoScrollTick);
		if (dragNode instanceof HTMLElement && !dragNode.classList.contains(styles_module_default.dragging)) {
			dragNode.classList.add(styles_module_default.dragging);
			document.body.classList.add(styles_module_default.dragActive);
		}
		if (rafPending) return;
		rafPending = true;
		requestAnimationFrame(() => {
			rafPending = false;
			reorderOnPointer(event.clientY);
		});
	};
	const endDrag = ({ cancel = false } = {}) => {
		if (!isDragging) return;
		if (scrollFrame) cancelAnimationFrame(scrollFrame);
		scrollFrame = 0;
		if (dragNode instanceof HTMLElement) dragNode.classList.remove(styles_module_default.dragging);
		document.body.classList.remove(styles_module_default.dragActive);
		if (didDrag && cancel) {
			if (dragNode && rootContainer && (!origNext || origNext.parentElement === rootContainer)) animateShift(() => rootContainer.insertBefore(dragNode, origNext));
		} else if (didDrag) saveRootOrder(store$1);
		if (didDrag) suppressNextClick();
		origNext = null;
		isDragging = false;
		dragNode = null;
		dragStart = null;
		didDrag = false;
		activePointerId = null;
	};
	const onContextMenu = (event) => {
		if (!event.shiftKey) return;
		const node = getRootDraggableNode(event.target);
		if (!node) return;
		event.preventDefault();
		event.stopPropagation();
		const key = getKeyForRootChild(node);
		if (!key) return;
		if (key.startsWith("s:")) {
			openRootMenu(event.clientX, event.clientY, [{
				label: "Remove separator",
				onClick: () => {
					node.remove();
					saveRootOrder(store$1);
				},
				danger: true
			}]);
			return;
		}
		openRootMenu(event.clientX, event.clientY, [{
			label: "Insert separator above",
			onClick: () => {
				const id = newSepId();
				const sep = createSeparator(id, { animate: true });
				rootContainer = rootContainer || getRootContainer();
				if (rootContainer) rootContainer.insertBefore(sep, node);
				saveRootOrder(store$1);
			}
		}, {
			label: "Insert separator below",
			onClick: () => {
				const id = newSepId();
				const sep = createSeparator(id, { animate: true });
				rootContainer = rootContainer || getRootContainer();
				if (rootContainer) rootContainer.insertBefore(sep, node.nextSibling);
				saveRootOrder(store$1);
			}
		}]);
	};
	window.addEventListener("pointerdown", onPointerDown, true);
	window.addEventListener("pointermove", onPointerMove, true);
	const onPointerEnd = () => endDrag();
	const onKeyDown = (event) => {
		if (event.key !== "Escape" || !isDragging || !didDrag) return;
		event.preventDefault();
		event.stopPropagation();
		endDrag({ cancel: true });
	};
	window.addEventListener("pointerup", onPointerEnd, true);
	window.addEventListener("pointercancel", onPointerEnd, true);
	window.addEventListener("keydown", onKeyDown, true);
	window.addEventListener("contextmenu", onContextMenu, true);
	return () => {
		closeRootMenu();
		window.removeEventListener("pointerdown", onPointerDown, true);
		window.removeEventListener("pointermove", onPointerMove, true);
		window.removeEventListener("pointerup", onPointerEnd, true);
		window.removeEventListener("pointercancel", onPointerEnd, true);
		window.removeEventListener("keydown", onKeyDown, true);
		if (scrollFrame) cancelAnimationFrame(scrollFrame);
		window.removeEventListener("contextmenu", onContextMenu, true);
	};
};

//#endregion
//#region plugins/guild-text-list/resize.js
const setupResize = (store$1, observeDom$1) => {
	let attached = null;
	let isDragging$1 = false;
	let startX = 0;
	let startW = 0;
	const onPointerMove = (e) => {
		if (!isDragging$1 || !attached) return;
		const newW = Math.max(120, Math.min(360, startW + e.clientX - startX));
		attached.nav.style.setProperty("--guild-text-w", `${newW}px`);
	};
	const onPointerUp = () => {
		if (!isDragging$1) return;
		isDragging$1 = false;
		document.body.style.cursor = "";
		document.body.style.userSelect = "";
		if (attached) store$1.sidebarWidth = Math.round(attached.nav.getBoundingClientRect().width);
	};
	const attach = (nav) => {
		if (attached?.nav === nav) return;
		attached?.detach();
		const saved = store$1.sidebarWidth;
		if (typeof saved === "number") nav.style.setProperty("--guild-text-w", `${saved}px`);
		nav.classList.add(styles_module_default.sidebar);
		const handle = document.createElement("div");
		handle.className = styles_module_default.resizeHandle;
		nav.append(handle);
		const onPointerDown = (e) => {
			if (e.button !== 0) return;
			e.preventDefault();
			e.stopPropagation();
			isDragging$1 = true;
			startX = e.clientX;
			startW = nav.getBoundingClientRect().width;
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";
		};
		handle.addEventListener("pointerdown", onPointerDown);
		attached = {
			nav,
			detach: () => {
				handle.removeEventListener("pointerdown", onPointerDown);
				handle.remove();
				nav.classList.remove(styles_module_default.sidebar);
				nav.style.removeProperty("--guild-text-w");
				attached = null;
			}
		};
	};
	window.addEventListener("pointermove", onPointerMove);
	window.addEventListener("pointerup", onPointerUp);
	window.addEventListener("pointercancel", onPointerUp);
	const current = document.querySelector(NAV);
	if (current) attach(current);
	const unobserve = observeDom$1(NAV, (nav) => {
		if (!nav.isConnected) return;
		if (attached && !attached.nav.isConnected) attached.detach();
		attach(nav);
	});
	return () => {
		unobserve();
		window.removeEventListener("pointermove", onPointerMove);
		window.removeEventListener("pointerup", onPointerUp);
		window.removeEventListener("pointercancel", onPointerUp);
		attached?.detach();
		document.body.style.cursor = "";
		document.body.style.userSelect = "";
	};
};

//#endregion
//#region plugins/guild-text-list/index.js
const { plugin, flux } = shelter;
const { observeDom } = plugin.scoped;
const { GuildStore } = flux.storesFlat;
const { store } = plugin;
try {
	store.rootOrderV1 ??= [];
} catch {
	store.rootOrderV1 = [];
}
const folderCtx = {
	observeDom,
	GuildStore
};
let orderScheduled = false;
const scheduleRootOrder = () => {
	if (orderScheduled) return;
	orderScheduled = true;
	queueMicrotask(() => {
		orderScheduled = false;
		applyStoredRootOrder(store);
	});
};
const processItem = (elem) => {
	textifyGuild(elem);
	textifyFolder(elem, folderCtx);
	scheduleRootOrder();
	scheduleReadStateSync();
};
let teardowns = [];
function onLoad() {
	for (const elem of document.querySelectorAll(`${GUILD_SELECTOR}, ${FOLDER_SELECTOR}`)) processItem(elem);
	teardowns.push(observeDom(`${GUILD_SELECTOR}, ${FOLDER_SELECTOR}`, processItem));
	teardowns.push(setupDragAndContextMenu(store));
	teardowns.push(setupResize(store, observeDom));
	teardowns.push(setupReadState());
	plugin.scoped.flux.subscribe("CHANNEL_SELECT", () => {
		queueMicrotask(syncFolderSelection);
	});
}
function onUnload() {
	for (const t of teardowns) t?.();
	teardowns = [];
	cleanupGuilds();
	cleanupFolders();
}

//#endregion
exports.onLoad = onLoad
exports.onUnload = onUnload
return exports;
})({});