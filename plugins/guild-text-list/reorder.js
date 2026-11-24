import styles from "./styles.module.css";
import { isExcluded, ROOT_GROUP } from "./selectors.js";
import { getFolderIdFromGroup } from "./dom-utils.js";
import { openRootMenu, closeRootMenu } from "./context-menu.js";

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
  el.className = animate ? `${styles.separator} ${styles.separatorNew}` : styles.separator;
  el.setAttribute("data-shelter-separator-id", id);

  const line = document.createElement("div");
  line.className = styles.separatorLine;
  el.append(line);

  return el;
};

const ensureSeparatorExists = (id) => {
  rootContainer = rootContainer || getRootContainer();
  if (!(rootContainer instanceof HTMLElement)) return null;

  const existing = Array.from(
    rootContainer.querySelectorAll(`.${styles.separator}`),
  ).find((el) => el.getAttribute("data-shelter-separator-id") === id);
  if (existing) return existing;

  const el = createSeparator(id);
  rootContainer.append(el);
  return el;
};

export const getKeyForRootChild = (node) => {
  if (!(node instanceof HTMLElement)) return null;

  if (node.classList.contains(styles.separator)) {
    const id = node.getAttribute("data-shelter-separator-id");
    return id ? `s:${id}` : null;
  }

  if (node.matches('[class*="folderGroup"]')) {
    const folderId = getFolderIdFromGroup(node);
    return folderId ? `f:${folderId}` : null;
  }

  if (node.matches('div[class*="listItem"]')) {
    const treeitem = node.querySelector(
      '[role="treeitem"][data-list-item-id^="guildsnav___"]',
    );
    const listItemId = treeitem?.getAttribute?.("data-list-item-id");
    if (!listItemId) return null;
    if (isExcluded(listItemId)) return null;
    const suffix = listItemId.slice("guildsnav___".length);
    if (!/^[0-9]+$/.test(suffix)) return null;
    return `g:${suffix}`;
  }

  return null;
};

export const saveRootOrder = (store) => {
  rootContainer = rootContainer || getRootContainer();
  if (!(rootContainer instanceof HTMLElement)) return;

  const keys = [];
  for (const child of Array.from(rootContainer.children)) {
    const key = getKeyForRootChild(child);
    if (key) keys.push(key);
  }
  store.rootOrderV1 = keys;
  store.rootOrderV1SavedAt = Date.now();
  store.rootOrderV1SaveCount = (store.rootOrderV1SaveCount || 0) + 1;
};

export const applyStoredRootOrder = (store) => {
  if (isDragging) return;
  if (isApplyingOrder) return;
  const now = Date.now();
  if (now - lastApplyAt < 50) return;
  rootContainer = rootContainer || getRootContainer();
  if (!(rootContainer instanceof HTMLElement)) return;

  isApplyingOrder = true;
  lastApplyAt = now;

  // shelter store is a Solid proxy — reading can throw if data is corrupted
  let desired = [];
  try {
    const raw = store.rootOrderV1;
    if (raw && typeof raw.length === "number") {
      for (let i = 0; i < raw.length; i++) desired.push(raw[i]);
    }
  } catch {
    // corrupted store data from previous plugin version — reset it
    store.rootOrderV1 = [];
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

  // Skip the re-append (and its full-list reflow) when the DOM already matches
  // the saved order. A plain guild switch never reorders the list, so this
  // turns the per-switch cost from "move every row" into "compare keys".
  const presentSet = new Set(presentKeys);
  const allSeparatorsExist = desired.every(
    (k) => typeof k !== "string" || !k.startsWith("s:") || presentSet.has(k),
  );
  if (allSeparatorsExist) {
    const desiredPresent = desired.filter(
      (k) => typeof k === "string" && (k.startsWith("s:") || byKey.has(k)),
    );
    const presentInDesired = presentKeys.filter((k) => desiredSet.has(k));
    const alreadyOrdered =
      desiredPresent.length === presentInDesired.length &&
      desiredPresent.every((k, i) => k === presentInDesired[i]);
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

  if (target.closest(`.${styles.folderChildren}`)) return null;

  const sep = target.closest(`.${styles.separator}`);
  if (sep && sep.parentElement === rootContainer) return sep;

  const folderGroup = target.closest('[class*="folderGroup"]');
  if (folderGroup && folderGroup.parentElement === rootContainer) return folderGroup;

  const listItem = target.closest('div[class*="listItem"]');
  if (listItem && listItem.parentElement === rootContainer) return listItem;

  return null;
};

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// FLIP: rows jump to their new slot in the DOM, then glide from where they
// were, so the list visibly makes room for the dragged row instead of snapping
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
    el.addEventListener("transitionend", () => (el.style.transition = ""), { once: true });
  }
};

// hit-test against layout positions, not painted ones: rows mid-FLIP are
// visually offset, and testing their painted rect makes the drop slot flicker
const layoutRect = (el) => {
  const r = el.getBoundingClientRect();
  const t = getComputedStyle(el).transform;
  const dy = t && t !== "none" ? new DOMMatrixReadOnly(t).m42 : 0;
  return { top: r.top - dy, height: r.height };
};

const reorderOnPointer = (clientY) => {
  if (!(rootContainer instanceof HTMLElement)) return;
  if (!(dragNode instanceof HTMLElement)) return;

  let overNode = null;
  for (const child of rootContainer.children) {
    if (child === dragNode || !getKeyForRootChild(child)) continue;
    const r = layoutRect(child);
    if (r.height && clientY >= r.top && clientY < r.top + r.height) {
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

// the pointerup that ends a drag also fires a click on the row, which would
// navigate to that server; swallow exactly that one click
const suppressNextClick = () => {
  const swallow = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  window.addEventListener("click", swallow, { capture: true, once: true });
  setTimeout(() => window.removeEventListener("click", swallow, true), 0);
};

const EDGE = 48; // px from the scroller edge where auto-scroll kicks in
const MAX_SPEED = 14; // px per frame at the very edge

export const setupDragAndContextMenu = (store) => {
  let lastY = 0;
  let origNext = null; // where the row sat before the drag, for Esc
  let scrollFrame = 0;

  // while a drag is held near the top/bottom edge, scroll the list and keep
  // re-targeting the drop slot, so rows outside the viewport are reachable
  const autoScrollTick = () => {
    scrollFrame = 0;
    if (!isDragging || !didDrag) return;
    const scroller = rootContainer?.closest('[class*="scroller"]');
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
    dragStart = { x: event.clientX, y: event.clientY };
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

    if (dragNode instanceof HTMLElement && !dragNode.classList.contains(styles.dragging)) {
      dragNode.classList.add(styles.dragging);
      document.body.classList.add(styles.dragActive);
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
    if (dragNode instanceof HTMLElement) dragNode.classList.remove(styles.dragging);
    document.body.classList.remove(styles.dragActive);
    if (didDrag && cancel) {
      if (dragNode && rootContainer && (!origNext || origNext.parentElement === rootContainer)) {
        animateShift(() => rootContainer.insertBefore(dragNode, origNext));
      }
    } else if (didDrag) {
      saveRootOrder(store);
    }
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
      openRootMenu(event.clientX, event.clientY, [
        {
          label: "Remove separator",
          onClick: () => {
            node.remove();
            saveRootOrder(store);
          },
          danger: true,
        },
      ]);
      return;
    }

    openRootMenu(event.clientX, event.clientY, [
      {
        label: "Insert separator above",
        onClick: () => {
          const id = newSepId();
          const sep = createSeparator(id, { animate: true });
          rootContainer = rootContainer || getRootContainer();
          if (rootContainer) rootContainer.insertBefore(sep, node);
          saveRootOrder(store);
        },
      },
      {
        label: "Insert separator below",
        onClick: () => {
          const id = newSepId();
          const sep = createSeparator(id, { animate: true });
          rootContainer = rootContainer || getRootContainer();
          if (rootContainer) rootContainer.insertBefore(sep, node.nextSibling);
          saveRootOrder(store);
        },
      },
    ]);
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
