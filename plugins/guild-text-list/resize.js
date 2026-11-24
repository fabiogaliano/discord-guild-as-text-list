import styles from "./styles.module.css";
import { NAV } from "./selectors.js";

// The nav may not exist yet when the plugin loads at app start, and Discord
// can remount it (reconnects, layout changes), so attachment is per-element
// and re-run whenever a nav shows up.
export const setupResize = (store, observeDom) => {
  let attached = null; // { nav, detach }
  let isDragging = false;
  let startX = 0;
  let startW = 0;

  const onPointerMove = (e) => {
    if (!isDragging || !attached) return;
    const newW = Math.max(120, Math.min(360, startW + e.clientX - startX));
    attached.nav.style.setProperty("--guild-text-w", `${newW}px`);
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    if (attached) store.sidebarWidth = Math.round(attached.nav.getBoundingClientRect().width);
  };

  const attach = (nav) => {
    if (attached?.nav === nav) return;
    attached?.detach();

    const saved = store.sidebarWidth;
    if (typeof saved === "number") nav.style.setProperty("--guild-text-w", `${saved}px`);
    nav.classList.add(styles.sidebar);

    const handle = document.createElement("div");
    handle.className = styles.resizeHandle;
    nav.append(handle);

    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
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
        nav.classList.remove(styles.sidebar);
        nav.style.removeProperty("--guild-text-w");
        attached = null;
      },
    };
  };

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  const current = document.querySelector(NAV);
  if (current) attach(current);
  const unobserve = observeDom(NAV, (nav) => {
    if (!nav.isConnected) return;
    // a stale nav that was unmounted would otherwise keep our handle state
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
