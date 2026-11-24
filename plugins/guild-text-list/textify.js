import styles from "./styles.module.css";
import { scheduleReadStateSync } from "./read-state.js";
import { isExcluded, HIDDEN_ITEMS, SPECIAL_ITEMS, LIST_ITEM } from "./selectors.js";
import {
  getGuildName,
  isFolderButton,
  normalizeFolderName,
  normalizeText,
  getFolderId,
} from "./dom-utils.js";

// The DOM observer stays live, so every write here must be a no-op when the
// value is already set: classList.add/setAttribute still emit a mutation record
// for unchanged values, which would re-enter the observer forever.
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

// Discord opens its guild menu from the original (hidden) treeitem, so replay
// the right-click there at the pointer position
const forwardContextMenu = (target, event) => {
  event.preventDefault();
  event.stopPropagation();
  target.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: event.clientX,
      clientY: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
    }),
  );
};

const processed = new Map();
const processedFolders = new Map();

export const syncFolderSelection = () => {
  const selectedId = shelter?.flux?.storesFlat?.SelectedGuildStore?.getGuildId?.();
  for (const row of document.querySelectorAll(`.${styles.folderChildren} [data-guild-id]`)) {
    if (row.getAttribute("data-guild-id") === selectedId) {
      row.setAttribute("data-is-selected", "true");
    } else {
      row.removeAttribute("data-is-selected");
    }
  }
};

const ensureFolderChildren = (folderGroup) => {
  let container = folderGroup.querySelector(`.${styles.folderChildren}`);
  if (!container) {
    container = document.createElement("div");
    container.className = styles.folderChildren;
    folderGroup.append(container);
  }
  return container;
};

const clearFolderChildren = (folderGroup) => {
  const container = folderGroup.querySelector(`.${styles.folderChildren}`);
  if (container) container.remove();
};

const getFolderGuildsFromDom = (folderGroup, folderId) => {
  const root = folderGroup.querySelector(`#folder-items-${folderId}`);
  if (!root) return [];

  const guilds = [];
  const seen = new Set();

  // find every guild treeitem inside the folder — catches all icon types
  for (const treeitem of root.querySelectorAll('[data-list-item-id^="guildsnav___"]')) {
    const listItemId = treeitem.getAttribute("data-list-item-id");
    const guildId = listItemId?.slice("guildsnav___".length);
    if (!guildId || !/^[0-9]+$/.test(guildId) || seen.has(guildId)) continue;
    seen.add(guildId);

    const dnd = treeitem.closest("[data-dnd-name]");
    const name = normalizeText(dnd?.getAttribute?.("data-dnd-name"));

    guilds.push({ id: guildId, name });
  }

  return guilds;
};

const renderFolderChildren = (folderGroup, folderId, GuildStore) => {
  // hide Discord's original icon grid
  const origItems = folderGroup.querySelector(`#folder-items-${folderId}`);
  if (origItems) origItems.classList.add(styles.folderItemsHidden);

  // hide the folder background overlay
  const bg = folderGroup.querySelector('[class*="folderGroupBackground"]');
  if (bg) bg.classList.add(styles.folderBgHidden);

  // hide wrapper/end elements
  for (const w of folderGroup.querySelectorAll('[class*="wrapper_"], [class*="folderEndWrapper"]')) {
    w.classList.add(styles.folderBgHidden);
  }

  const container = ensureFolderChildren(folderGroup);
  container.replaceChildren();

  const guilds = getFolderGuildsFromDom(folderGroup, folderId);
  for (const { id: gid, name: domName } of guilds) {
    const name = GuildStore?.getGuild?.(gid)?.name || domName || gid;

    const row = document.createElement("div");
    row.className = styles.guildRow;
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "-1");
    row.setAttribute("data-guild-id", gid);
    row.style.cursor = "pointer";

    // check if this guild is currently selected
    const selectedGuildId = GuildStore && shelter?.flux?.storesFlat?.SelectedGuildStore?.getGuildId?.();
    if (selectedGuildId === gid) {
      row.setAttribute("data-is-selected", "true");
    }

    const label = document.createElement("div");
    label.className = styles.guildLabel;
    label.textContent = name;
    label.setAttribute("title", name);
    row.append(label);

    const findOriginal = () =>
      folderGroup.querySelector(`[data-list-item-id='guildsnav___${gid}']`) ||
      document.querySelector(`[data-list-item-id='guildsnav___${gid}']`);

    row.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        // clear selection on all folder children
        for (const r of container.querySelectorAll("[data-is-selected]")) {
          r.removeAttribute("data-is-selected");
        }
        row.setAttribute("data-is-selected", "true");

        const target = findOriginal();
        if (target instanceof HTMLElement) target.click();
      },
      true,
    );

    row.addEventListener("contextmenu", (event) => {
      if (event.shiftKey) return; // shift+right-click is the plugin's own menu
      const target = findOriginal();
      if (target instanceof HTMLElement) forwardContextMenu(target, event);
    });

    container.append(row);
  }
  scheduleReadStateSync();
};

export const textifyGuild = (elem) => {
  if (!(elem instanceof HTMLElement)) return;
  if (isFolderButton(elem)) return;

  const listItemId = elem.getAttribute("data-list-item-id");
  const suffix = listItemId?.slice("guildsnav___".length) ?? "";

  if (HIDDEN_ITEMS.has(suffix)) {
    const listItem = elem.closest(LIST_ITEM) || elem.closest('div[class*="listItem"]') || elem;
    addClass(listItem, styles.hiddenItem);
    return;
  }

  if (isExcluded(listItemId)) return;

  const isSpecial = SPECIAL_ITEMS.has(suffix);

  const name = isSpecial ? SPECIAL_ITEMS.get(suffix) : getGuildName(elem);
  if (!name) return;

  const listItemWrap = elem.closest(LIST_ITEM) || elem.closest('div[class*="listItem"]');
  const listItem = listItemWrap || elem;

  addClass(listItem, styles.guildRow);

  // for special items without a listItem wrapper (Add Server, etc),
  // hide all original children and override Discord's circle styling
  if (isSpecial && !listItemWrap) {
    for (const child of Array.from(elem.children)) {
      if (!child.classList.contains(styles.guildLabel) && child.style.display !== "none") {
        child.style.display = "none";
      }
    }
  }

  // pin Add Server: hide original, create a fixed-bottom clone
  if (suffix === "create-join-button") {
    addClass(listItem, styles.hiddenItem);

    const nav = elem.closest('nav[aria-label="Servers sidebar"]');
    if (nav && !nav.querySelector(`.${styles.addServerBottom}`)) {
      const bottomBtn = document.createElement("div");
      bottomBtn.className = `${styles.guildRow} ${styles.addServerBottom}`;
      bottomBtn.setAttribute("role", "button");
      bottomBtn.style.cursor = "pointer";

      const btnLabel = document.createElement("div");
      btnLabel.className = styles.guildLabel;
      btnLabel.textContent = name;
      bottomBtn.append(btnLabel);

      bottomBtn.addEventListener("click", () => elem.click());
      nav.append(bottomBtn);
    }
    return;
  }

  let label = listItem.querySelector(`.${styles.guildLabel}`);
  if (!label) {
    label = document.createElement("div");
    label.className = styles.guildLabel;
    listItem.append(label);
  }

  setText(label, name);
  setAttr(label, "title", name);
  if (/^[0-9]+$/.test(suffix)) setAttr(listItem, "data-guild-id", suffix);

  if (!processed.has(listItem)) {
    // hide the row's whole icon subtree (the direct child holding the treeitem);
    // waiting for an <img> skipped acronym servers and icons still loading
    let iconNode = null;
    if (listItemWrap) {
      iconNode = elem;
      while (iconNode.parentElement && iconNode.parentElement !== listItem) {
        iconNode = iconNode.parentElement;
      }
    }
    // invisible but still rendered: display:none would make the treeitem
    // unfocusable and break Discord's arrow-key navigation of the list
    if (iconNode) iconNode.classList.add(styles.iconHidden);

    // special items without wrapper: clicking the label should trigger the original element
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
      handleContextMenu,
    });
  }
};

export const textifyFolder = (elem, { observeDom, GuildStore }) => {
  if (!(elem instanceof HTMLElement)) return;

  const header = elem.closest("[data-dnd-name]");
  const dndName = header?.getAttribute("data-dnd-name");
  const hidden = elem.querySelector('span[class*="hiddenVisually"]');
  const name = normalizeText(
    dndName || normalizeFolderName(hidden?.textContent),
  );
  if (!name) return;

  const listItem = elem.closest(LIST_ITEM) || elem.closest('div[class*="listItem"]') || elem;
  const folderGroup = elem.closest('[class*="folderGroup"]');
  const folderId = getFolderId(elem);
  if (!folderGroup || !folderId) return;

  addClass(listItem, styles.folderRow);
  addClass(listItem, styles.guildRow);
  addClass(elem, styles.folderButtonHidden);
  const isExpanded = elem.getAttribute("aria-expanded") === "true";
  toggleClass(listItem, styles.folderExpanded, isExpanded);
  // folders already open at startup never get a toggle click, so render here too
  const hasChildren = !!folderGroup.querySelector(`.${styles.folderChildren}`);
  if (isExpanded && !hasChildren) {
    queueMicrotask(() => renderFolderChildren(folderGroup, folderId, GuildStore));
  } else if (!isExpanded && hasChildren) {
    clearFolderChildren(folderGroup);
  }

  let label = listItem.querySelector(`.${styles.folderLabel}`);
  if (!label) {
    label = document.createElement("div");
    label.className = `${styles.guildLabel} ${styles.folderLabel}`;

    const caret = document.createElement("span");
    caret.className = styles.folderCaret;
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
    if (header) header.classList.add(styles.folderHeaderHidden);

    const iconWrap = elem.querySelector('[aria-hidden="true"]');
    const previousDisplay = iconWrap?.style.display ?? "";
    if (iconWrap) {
      iconWrap.classList.add(styles.folderIconHidden);
      iconWrap.style.display = "none";
    }

    const handleToggle = (event) => {
      if (event.defaultPrevented) return;
      if (event.target instanceof Node && elem.contains(event.target)) return;

      event.preventDefault();
      event.stopPropagation();

      elem.click();

      const syncExpanded = () => {
        const isExpanded = elem.getAttribute("aria-expanded") === "true";
        if (isExpanded) {
          listItem.classList.add(styles.folderExpanded);
        } else {
          listItem.classList.remove(styles.folderExpanded);
        }

        if (!isExpanded) {
          clearFolderChildren(folderGroup);
          return;
        }

        const render = () =>
          renderFolderChildren(folderGroup, folderId, GuildStore);
        render();

        const unobs = observeDom(`#folder-items-${folderId} *`, () => {
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
      folderGroup,
    });
  }
};

export const cleanupGuilds = () => {
  for (const [listItem, data] of processed) {
    const label = listItem.querySelector(`.${styles.guildLabel}`);
    if (label) label.remove();

    if (data?.iconNode) {
      data.iconNode.classList.remove(styles.iconHidden);
    }

    // restore hidden children for special items without wrapper
    if (data?.isSpecialNoWrap) {
      for (const child of Array.from(listItem.children)) {
        if (child.style.display === "none") child.style.display = "";
      }
    }

    if (data?.handleClick) {
      listItem.removeEventListener("click", data.handleClick);
    }
    if (data?.handleContextMenu) {
      listItem.removeEventListener("contextmenu", data.handleContextMenu);
    }

    listItem.classList.remove(styles.guildRow);
    listItem.classList.remove(styles.hiddenItem);
    listItem.removeAttribute("data-guild-id");
  }
  processed.clear();

  // remove cloned Add Server button
  for (const btn of document.querySelectorAll(`.${styles.addServerBottom}`)) {
    btn.remove();
  }
};

export const cleanupFolders = () => {
  for (const [listItem, data] of processedFolders) {
    const label = listItem.querySelector(`.${styles.folderLabel}`);
    if (label) label.remove();

    if (data?.iconWrap) {
      data.iconWrap.style.display = data.previousDisplay;
      data.iconWrap.classList.remove(styles.folderIconHidden);
    }

    if (data?.handleToggle) {
      listItem.removeEventListener("click", data.handleToggle, true);
    }

    if (data?.elem) {
      data.elem.classList.remove(styles.folderButtonHidden);
    }

    if (data?.folderGroup) {
      clearFolderChildren(data.folderGroup);

      if (data?.elem?.getAttribute?.("aria-expanded") === "true") {
        data.elem.click();
      }
    }

    listItem.classList.remove(styles.folderRow, styles.guildRow, styles.folderExpanded);
  }
  processedFolders.clear();
};
