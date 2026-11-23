// Offline checks for the floating calculator total in ordinary page flow.
// Usage: node scripts/check-mobile-calculation-bar.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("../components/mobile-calculation-bar.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function eventTarget(extra = {}) {
  const listeners = new Map();
  return {
    ...extra,
    listeners,
    addEventListener(name, listener) { listeners.set(name, listener); },
    removeEventListener(name, listener) { if (listeners.get(name) === listener) listeners.delete(name); },
    emit(name) { listeners.get(name)?.(); },
  };
}

function harness({ mobile = true } = {}) {
  const observers = [];
  const viewport = eventTarget();
  const mobileMedia = eventTarget({ matches: mobile });
  let cleanup;
  let visible = false;
  const configuration = {};
  const summary = {};
  viewport.matchMedia = () => mobileMedia;
  class IntersectionObserver {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = []; this.disconnected = false; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
  }
  const module = { exports: {} };
  const dependencies = {
    react: {
      useEffect: (callback) => { cleanup = callback(); },
      useState: (initial) => [initial, (value) => { visible = value; }],
    },
    "react-dom": {},
    "react/jsx-runtime": {},
    "./mobile-calculation-bar.module.css": {},
  };
  new Function("require", "module", "exports", "window", "IntersectionObserver", code)(
    (name) => dependencies[name], module, module.exports, viewport, IntersectionObserver,
  );
  module.exports.MobileCalculationBar({ configurationRef: { current: configuration }, summaryRef: { current: summary } });
  return {
    viewport, mobileMedia, observers, cleanup,
    get visible() { return visible; },
    intersect(configurationVisible, summaryVisible = false) {
      observers.at(-1).callback([
        { target: configuration, isIntersecting: configurationVisible },
        { target: summary, isIntersecting: summaryVisible },
      ]);
    },
  };
}

test("the mobile total is visible only while its configuration is in view", () => {
  const h = harness();
  assert.equal(h.visible, false);
  h.intersect(true);
  assert.equal(h.visible, true);
  h.intersect(false);
  assert.equal(h.visible, false);
});

test("the regular summary takes over as soon as it enters the reading area", () => {
  const h = harness();
  h.intersect(true);
  assert.equal(h.visible, true);
  h.intersect(true, true);
  assert.equal(h.visible, false);
  h.intersect(true, false);
  assert.equal(h.visible, true);
  h.intersect(false);
  assert.equal(h.visible, false);
});

test("observation excludes the fixed header and floating bar without scroll listeners", () => {
  const h = harness();
  assert.equal(h.observers[0].targets.length, 2);
  assert.deepEqual(h.observers[0].options, { rootMargin: "-96px 0px -88px 0px", threshold: 0 });
  h.intersect(true);
  assert.equal(h.visible, true);
  assert.equal(h.viewport.listeners.size, 0);
});

test("desktop starts without observation and responds to the mobile breakpoint", () => {
  const h = harness({ mobile: false });
  assert.equal(h.visible, false);
  assert.equal(h.observers.length, 0);
  h.mobileMedia.matches = true;
  h.mobileMedia.emit("change");
  assert.equal(h.observers.length, 1);
  h.intersect(true);
  assert.equal(h.visible, true);
});

test("breakpoint changes and unmount clean up observers and media listeners", () => {
  const h = harness();
  h.intersect(true);
  h.mobileMedia.matches = false;
  h.mobileMedia.emit("change");
  assert.equal(h.visible, false);
  assert.equal(h.observers[0].disconnected, true);
  h.mobileMedia.matches = true;
  h.mobileMedia.emit("change");
  h.intersect(true);
  assert.equal(h.visible, true);
  h.cleanup();
  assert.equal(h.viewport.listeners.size, 0);
  assert.equal(h.mobileMedia.listeners.size, 0);
  assert.equal(h.observers.at(-1).disconnected, true);
});
