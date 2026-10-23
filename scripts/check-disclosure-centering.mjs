// Offline regression checks; no browser, network or live submissions.
// Usage: node scripts/check-disclosure-centering.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function load(file, dependencies = {}, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const require = (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  };
  new Function("require", "module", "exports", ...Object.keys(globals), code)(
    require, module, module.exports, ...Object.values(globals),
  );
  return module.exports;
}

const { centeredPanelScrollTop } = load("lib/scroll-to-panel.ts");
const desktop = { panelTop: 2000, panelHeight: 240, viewportHeight: 900, headerBottom: 80, maxScroll: 8000 };

test("short disclosures center within the viewport below the fixed header", () => {
  assert.equal(centeredPanelScrollTop(desktop), 1630);
});
test("tall disclosures start below the menu instead of hiding their summary", () => {
  assert.equal(centeredPanelScrollTop({ ...desktop, panelHeight: 1200 }), 1904);
});
test("uses the visible mobile viewport and its offset", () => {
  assert.equal(centeredPanelScrollTop({ ...desktop, viewportTop: 20, viewportHeight: 500, headerBottom: 72 }), 1824);
});
test("destinations cannot overshoot document edges", () => {
  assert.equal(centeredPanelScrollTop({ ...desktop, panelTop: 10 }), 0);
  assert.equal(centeredPanelScrollTop({ ...desktop, maxScroll: 1300 }), 1300);
});
test("floating calculation bar reduces the useful area without hiding tall-card headings", () => {
  assert.equal(centeredPanelScrollTop({ ...desktop, bottomInset: 120 }), 1682);
  assert.equal(centeredPanelScrollTop({ ...desktop, bottomInset: 120, panelHeight: 800 }), 1904);
});

function disclosureHarness() {
  const frames = new Map();
  const centered = [];
  let nextFrame = 0;
  let cleanup;
  class Element {
    constructor(summary = null) { this.summary = summary; }
    closest(selector) { return selector === "summary" ? this.summary : null; }
  }
  const { useDisclosureCentering } = load("components/use-disclosure-centering.ts", {
    react: {
      useRef: (current) => ({ current }),
      useCallback: (callback) => callback,
      useEffect: (callback) => { cleanup = callback(); },
    },
    "@/lib/scroll-to-panel": {
      centerPanelInViewport: (element) => { centered.push(element); return () => {}; },
    },
  }, {
    Element,
    requestAnimationFrame: (callback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (frame) => frames.delete(frame),
  });
  const props = useDisclosureCentering();
  const details = { open: false, closest: () => null };
  const summary = new Element();
  summary.summary = summary;
  summary.parentElement = details;
  const event = { currentTarget: details, target: summary, button: 0, defaultPrevented: false };
  const flush = () => {
    while (frames.size) {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback());
    }
  };
  return { props, details, event, centered, flush, cleanup, Element };
}

test("only user opening scrolls, after native layout has settled", () => {
  const h = disclosureHarness();
  assert.equal(h.centered.length, 0);
  h.props.onClick(h.event);
  assert.equal(h.centered.length, 0);
  h.details.open = true;
  h.flush();
  assert.deepEqual(h.centered, [h.details]);
});
test("closing and clicking disclosure content never recenter the page", () => {
  const h = disclosureHarness();
  h.details.open = true;
  h.props.onClick(h.event);
  h.props.onClick({ ...h.event, target: new h.Element() });
  h.flush();
  assert.equal(h.centered.length, 0);
});
test("marked disclosure cards retain their title and context when centered", () => {
  const h = disclosureHarness();
  const card = {};
  h.details.closest = (selector) => selector === "[data-disclosure-panel]" ? card : null;
  h.props.onClick(h.event);
  h.details.open = true;
  h.flush();
  assert.deepEqual(h.centered, [card]);
});
test("cancelled openings and unmounted disclosures cannot trigger a delayed scroll", () => {
  const h = disclosureHarness();
  h.props.onClick({ ...h.event, defaultPrevented: true });
  h.flush();
  assert.equal(h.centered.length, 0);
  h.props.onClick(h.event);
  h.flush();
  assert.equal(h.centered.length, 0);
  h.props.onClick(h.event);
  h.details.open = true;
  h.cleanup();
  h.flush();
  assert.equal(h.centered.length, 0);
});
