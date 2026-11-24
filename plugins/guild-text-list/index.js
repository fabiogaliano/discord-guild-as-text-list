import { GUILD_SELECTOR, FOLDER_SELECTOR } from "./selectors.js";
import { textifyGuild, textifyFolder, cleanupGuilds, cleanupFolders, syncFolderSelection } from "./textify.js";
import { applyStoredRootOrder, setupDragAndContextMenu } from "./reorder.js";
import { setupResize } from "./resize.js";
import { setupReadState, scheduleReadStateSync } from "./read-state.js";

const { plugin, flux } = shelter;
const { observeDom } = plugin.scoped;
const { GuildStore } = flux.storesFlat;
const { store } = plugin;

try {
  store.rootOrderV1 ??= [];
} catch {
  store.rootOrderV1 = [];
}

const folderCtx = { observeDom, GuildStore };

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

export function onLoad() {
  for (const elem of document.querySelectorAll(`${GUILD_SELECTOR}, ${FOLDER_SELECTOR}`)) {
    processItem(elem);
  }

  // Kept alive for the plugin's lifetime: at app start the sidebar renders
  // after onLoad, and Discord re-renders rows on reconnects and guild changes.
  // A short-lived observer missed those, leaving raw icons until a re-toggle.
  teardowns.push(observeDom(`${GUILD_SELECTOR}, ${FOLDER_SELECTOR}`, processItem));

  teardowns.push(setupDragAndContextMenu(store));
  teardowns.push(setupResize(store, observeDom));
  teardowns.push(setupReadState());

  plugin.scoped.flux.subscribe("CHANNEL_SELECT", () => {
    queueMicrotask(syncFolderSelection);
  });
}

export function onUnload() {
  for (const t of teardowns) t?.();
  teardowns = [];
  cleanupGuilds();
  cleanupFolders();
}


