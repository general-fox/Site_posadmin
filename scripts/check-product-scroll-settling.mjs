// Offline regressions for native scrolling with a small assist near a product card.
// Usage: node --test scripts/check-product-scroll-settling.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("../components/product-scroll-settling.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

const stops = [2000, 2700, 3400];

function stackPage(t, { initial = stops[0], reduced = false, firstHeight = 560, dialog = false } = {}) {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"] });
  const media = Object.assign(new EventTarget(), { matches: reduced });
  const page = Object.assign(new EventTarget(), {
    innerHeight: 900, innerWidth: 1440, scrollY: initial,
    visualViewport: { scale: 1 }, matchMedia: () => media, setTimeout, clearTimeout,
  });
  const document = { hidden: false, querySelector: selector => dialog && selector === "dialog[open]" ? {} : null };
  const requests = [];
  let finish;
  function scroll(top) {
    page.scrollY = top;
    page.dispatchEvent(new Event("scroll"));
  }
  page.scrollTo = ({ top, behavior }) => {
    clearTimeout(finish);
    if (behavior === "smooth") {
      requests.push(top);
      finish = setTimeout(() => scroll(top), 300);
    } else scroll(top);
  };

  class Element extends EventTarget {
    closest() { return null; }
  }
  const positions = stops.map((stop, index) => index === 0 ? stop : stop + firstHeight - 560);
  const anchors = positions.map((stop, index) => {
    const inset = 200 + index * 12;
    const height = index === 0 ? firstHeight : 560;
    const card = Object.assign(new Element(), {
      clientHeight: height, style: { position: index === 2 ? "relative" : "sticky", top: index === 2 ? "auto" : inset + "px" },
      getBoundingClientRect() {
        const normalTop = inset + stop - page.scrollY;
        const pin = Math.min(inset, page.innerHeight - height - 16);
        const top = index === 2 ? normalTop : Math.max(pin, normalTop);
        return { top, height, bottom: top + height };
      },
    });
    return Object.assign(new Element(), {
      style: { scrollMarginTop: inset + "px" }, nextElementSibling: card,
      getBoundingClientRect: () => ({ top: stop + inset - page.scrollY }),
    });
  });
  const stack = Object.assign(new Element(), {
    contains: node => node === stack || anchors.some(a => a === node || a.nextElementSibling === node),
    querySelectorAll: () => anchors,
    getBoundingClientRect: () => ({ top: positions[0] - page.scrollY, bottom: positions[2] + 224 + 560 - page.scrollY }),
  });
  const exports = {};
  new Function("exports", "window", "document", "performance", "getComputedStyle", "Element", "HTMLElement", source)(
    exports, page, document, { now: () => Date.now() }, node => node.style, Element, Element,
  );
  t.after(exports.enableProductScrollSettling(stack));
  function emit(type, properties) {
    const event = Object.assign(new Event(type, { cancelable: true }), properties);
    Object.defineProperty(event, "target", { value: stack });
    stack.dispatchEvent(event);
    page.dispatchEvent(event);
    return event;
  }
  function wheel(pixels) {
    const event = emit("wheel", { deltaX: 0, deltaY: pixels, deltaMode: 0, ctrlKey: false });
    if (!event.defaultPrevented) scroll(page.scrollY + pixels);
    return event;
  }
  const tick = ms => t.mock.timers.tick(ms);
  // Step the clock so a smooth scroll scheduled by a debounce can finish too.
  const rest = () => { for (let i = 0; i < 20; i++) tick(50); };
  return { page, scroll, requests, emit, wheel, tick, rest, positions };
}

test("a short wheel movement from a pinned card leaves the reader between cards", t => {
  const h = stackPage(t);
  assert.equal(h.wheel(64).defaultPrevented, false);
  h.rest();
  assert.deepEqual(h.requests, []);
  assert.equal(h.page.scrollY, stops[0] + 64);
});

for (const step of [-1, 1]) {
  test(`a short correction in direction ${step} waits for the wheel to stop`, t => {
    const h = stackPage(t, { initial: stops[1] - step * 95 });
    assert.equal(h.wheel(step * 47).defaultPrevented, false);
    h.tick(50);
    assert.deepEqual(h.requests, []);
    assert.equal(h.wheel(step * 16).defaultPrevented, false);
    h.tick(50);
    assert.deepEqual(h.requests, []);
    h.rest();
    assert.deepEqual(h.requests, [stops[1]]);
    assert.equal(h.page.scrollY, stops[1]);
  });
}

test("passing a target or reversing direction does not pull the reader back to it", t => {
  const h = stackPage(t, { initial: stops[1] - 60 });
  h.wheel(30);
  h.tick(40);
  h.wheel(-6);
  h.rest();
  assert.equal(h.page.scrollY, stops[1] - 36);
  h.wheel(50);
  h.rest();
  assert.deepEqual(h.requests, []);
  assert.equal(h.page.scrollY, stops[1] + 14);
});

test("a visible card more than a short correction away stays in place", t => {
  const h = stackPage(t, { initial: stops[1] - 150 });
  h.wheel(64);
  h.rest();
  assert.equal(h.page.scrollY, stops[1] - 86);
  assert.deepEqual(h.requests, []);
});

test("a tiny wheel adjustment is not amplified near an anchor", t => {
  const h = stackPage(t, { initial: stops[1] - 40 });
  h.wheel(5);
  h.rest();
  assert.deepEqual(h.requests, []);
  assert.equal(h.page.scrollY, stops[1] - 35);
});

test("wheel input can arrive after compositor movement but before the scroll event", t => {
  const h = stackPage(t, { initial: stops[1] - 96 });
  h.page.scrollY = stops[1] - 32;
  h.emit("wheel", { deltaX: 0, deltaY: 64, ctrlKey: false });
  h.page.dispatchEvent(new Event("scroll"));
  h.rest();
  assert.deepEqual(h.requests, [stops[1]]);
  assert.equal(h.page.scrollY, stops[1]);
});

test("a tall card stays readable while scrolling through its content", t => {
  const h = stackPage(t, { firstHeight: 1050 });
  assert.equal(h.wheel(250).defaultPrevented, false);
  h.rest();
  assert.deepEqual(h.requests, []);
  assert.equal(h.page.scrollY, stops[0] + 250);
});

test("touch scrolling waits for lift and inertia to finish before aligning", t => {
  const h = stackPage(t, { initial: stops[1] - 130 });
  const point = clientY => ({ clientX: 160, clientY });
  h.emit("touchstart", { touches: [point(350)], changedTouches: [point(350)] });
  assert.equal(h.emit("touchmove", { touches: [point(280)], changedTouches: [point(280)] }).defaultPrevented, false);
  h.scroll(stops[1] - 60);
  h.rest();
  assert.deepEqual(h.requests, []);
  h.emit("touchend", { touches: [], changedTouches: [point(280)] });
  for (const remaining of [48, 42, 36]) {
    h.tick(50);
    h.scroll(stops[1] - remaining);
    assert.deepEqual(h.requests, []);
  }
  h.rest();
  assert.deepEqual(h.requests, [stops[1]]);
  assert.equal(h.page.scrollY, stops[1]);
});

test("a new wheel gesture interrupts an in-flight correction immediately", t => {
  const h = stackPage(t, { initial: stops[1] - 100 });
  h.wheel(65);
  for (let i = 0; i < 40 && !h.requests.length; i++) h.tick(10);
  assert.deepEqual(h.requests, [stops[1]]);
  h.scroll(stops[1] - 18);
  assert.equal(h.wheel(-50).defaultPrevented, false);
  h.rest();
  assert.equal(h.page.scrollY, stops[1] - 68);
  assert.deepEqual(h.requests, [stops[1]]);
});

for (const [initial, delta] of [[stops[0], -64], [stops[2], 64]]) {
  test(`scrolling outward at the ${delta < 0 ? "first" : "last"} card exits normally`, t => {
    const h = stackPage(t, { initial });
    assert.equal(h.wheel(delta).defaultPrevented, false);
    h.rest();
    assert.deepEqual(h.requests, []);
    assert.equal(h.page.scrollY, initial + delta);
  });
}

for (const config of [{ reduced: true }, { dialog: true }]) {
  test(`native scrolling takes precedence with ${Object.keys(config)[0]}`, t => {
    const h = stackPage(t, { ...config, initial: stops[1] - 70 });
    assert.equal(h.wheel(35).defaultPrevented, false);
    h.rest();
    assert.deepEqual(h.requests, []);
  });
}

test("keyboard or anchor navigation never starts a correction", t => {
  const h = stackPage(t, { initial: stops[1] - 100 });
  h.wheel(60);
  h.emit("keydown", { key: "ArrowDown" });
  h.scroll(stops[1] - 30);
  h.rest();
  h.emit("hashchange");
  h.scroll(stops[2] - 20);
  h.rest();
  assert.deepEqual(h.requests, []);
});
