// Usage: node scripts/check-disclosure-centering.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("../lib/scroll-to-panel.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function fixture({ summaryTop = 800, firstLineTop = 868, bodyBottom = 1600, reduced = false,
  barTop, viewportTop = 0, viewportHeight = 900, remaining = 3000,
} = {}) {
  const bounds = (top, bottom) => ({ getBoundingClientRect: () => ({ top, bottom, height: bottom - top }) });
  const preference = Object.assign(new EventTarget(), { matches: reduced });
  const written = [];
  const window = Object.assign(new EventTarget(), {
    innerHeight: 900, scrollY: 1000, visualViewport: { offsetTop: viewportTop, height: viewportHeight },
    matchMedia: () => preference,
    scrollTo({ top }) { this.scrollY = top; written.push(top); this.dispatchEvent(new Event("scroll")); },
  });
  const document = {
    documentElement: { scrollHeight: 1900 + remaining },
    querySelector: selector => selector === ".site-header" ? bounds(0, 80) : barTop == null ? null : bounds(barTop, 890),
  };
  const details = { open: true, isConnected: true, closest: selector => selector.startsWith("#pricing") && barTop != null,
    querySelector: () => bounds(summaryTop, firstLineTop) };
  const body = { ...bounds(firstLineTop, bodyBottom), querySelector: () => bounds(firstLineTop, firstLineTop + 24) };
  const frames = new Map();
  let id = 0;
  const globals = { window, document, performance: { now: () => 0 }, getComputedStyle: () => ({ lineHeight: "24px" }),
    requestAnimationFrame: cb => { frames.set(++id, cb); return id; }, cancelAnimationFrame: id => frames.delete(id) };
  const module = { exports: {} };
  new Function("module", "exports", ...Object.keys(globals), source)(module, module.exports, ...Object.values(globals));
  const assist = module.exports.prepareDisclosureScroll(details, body);
  const tick = now => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach(cb => cb(now));
  };
  const finish = () => { assist?.afterOpen(); tick(150); tick(300); };
  return { assist, window, preference, details, written, tick, finish };
}

test("a fully readable opening never moves the viewport even for a long answer", () => {
  const h = fixture({ summaryTop: 260, firstLineTop: 344, bodyBottom: 2000 });
  h.finish();
  assert.deepEqual(h.written, []);
});

test("only the clipped opening lines are revealed, with intermediate scroll positions", () => {
  const h = fixture();
  h.finish();
  assert.deepEqual(h.written.map(Math.round), [1014, 1028]);
});

test("cap the move for large summaries; respect short answers and document limits", () => {
  for (const [overrides, distance] of [
    [{ firstLineTop: 1000 }, 96], [{ bodyBottom: 884 }, 0], [{ remaining: 9 }, 9],
  ]) {
    const h = fixture(overrides); h.finish();
    assert.equal(h.window.scrollY, 1000 + distance);
  }
});

test("both fixed header and floating estimate bar protect the readable viewport", () => {
  const above = fixture({ summaryTop: 60 }); above.finish(); assert.deepEqual(above.written, []);
  const below = fixture({ summaryTop: 905 }); below.finish(); assert.deepEqual(below.written, []);
  const covered = fixture({ barTop: 680, summaryTop: 685 }); covered.finish(); assert.deepEqual(covered.written, []);
  const bar = fixture({ barTop: 790, summaryTop: 690, firstLineTop: 760 }); bar.finish();
  assert.equal(bar.window.scrollY, 1030);
  const tight = fixture({ barTop: 150, summaryTop: 96, firstLineTop: 160 }); tight.finish();
  assert.equal(tight.window.scrollY, 1008);
});

test("use the visual viewport's offset and height on a phone", () => {
  const h = fixture({ viewportTop: 40, viewportHeight: 600, summaryTop: 520, firstLineTop: 602 });
  h.finish(); assert.equal(h.window.scrollY, 1022);
});

test("wheel, touch, focus and scrolling during expansion prevent a delayed move", () => {
  for (const type of ["wheel", "touchstart", "pointerdown", "keydown", "focusin", "scroll", "resize"]) {
    const h = fixture();
    if (type === "scroll") h.window.scrollY += 20;
    h.window.dispatchEvent(new Event(type));
    h.finish(); assert.deepEqual(h.written, [], type);
  }
});

test("new input, a system preference change, or teardown stops an in-flight move", () => {
  for (const trigger of ["wheel", "touchstart", "reduce", "cleanup"]) {
    const h = fixture();
    h.assist.afterOpen(); h.tick(80);
    assert.equal(h.written.length, 1);
    if (trigger === "reduce") { h.preference.matches = true; h.preference.dispatchEvent(new Event("change")); }
    else if (trigger === "cleanup") h.assist.cancel();
    else h.window.dispatchEvent(new Event(trigger));
    h.tick(300); assert.equal(h.written.length, 1, trigger);
  }
});

test("reduced motion, closing and unmounting never initiate a scroll", () => {
  const h = fixture({ reduced: true }); h.finish(); assert.deepEqual(h.written, []);
  for (const key of ["open", "isConnected"]) {
    const h = fixture(); h.details[key] = false; h.finish(); assert.deepEqual(h.written, []);
  }
});
