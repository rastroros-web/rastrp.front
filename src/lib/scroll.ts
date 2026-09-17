/** Chrome mobile (y iOS) ignoran window.scrollTo si el scroller real es body. */

export function disableScrollRestoration() {
  if (typeof window === "undefined") return;
  try {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  } catch {
    /* ignore */
  }
}

export function pinWindowTo(top = 0) {
  if (typeof window === "undefined") return;
  const html = document.documentElement;
  const body = document.body;
  const prevHtml = html.style.scrollBehavior;
  const prevBody = body.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  body.style.scrollBehavior = "auto";
  window.scrollTo(0, top);
  html.scrollTop = top;
  body.scrollTop = top;
  html.style.scrollBehavior = prevHtml;
  body.style.scrollBehavior = prevBody;
}

export function pinWindowToTop() {
  pinWindowTo(0);
}
