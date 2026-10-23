// Pure offline geometry checks. No browser, credentials, network or file writes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

const filename = fileURLToPath(new URL("../components/site-header.tsx", import.meta.url));
const code = ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const module = { exports: {} };
// Component imports are intentionally inert: only the exported pure resolver runs.
new Function("require", "module", "exports", code)(() => ({}), module, module.exports);
const { resolveHeaderSurface } = module.exports;
const region = (surface, left, top, right, bottom) => ({ surface, bounds: { left, top, right, bottom } });

test("a full-width dark hero stays dark without any hit-test targets", () => {
  const regions = [region("dark", 0, 0, 1280, 720)];
  assert.equal(resolveHeaderSurface(regions, 640, 40), "dark");
  // Opening/closing a top-layer dialog does not alter the page regions.
  assert.equal(resolveHeaderSurface(regions, 640, 40), "dark");
});

test("mobile resizing and the hero boundary use current geometry", () => {
  assert.equal(resolveHeaderSurface([region("dark", 0, 0, 320, 600)], 100, 36), "dark");
  assert.equal(resolveHeaderSurface([region("dark", 0, -564, 320, 36)], 100, 36), "light");
  assert.equal(resolveHeaderSurface([region("dark", 0, -563, 320, 37)], 100, 36), "dark");
});

test("a light clients panel overrides its dark parent only inside its bounds", () => {
  const regions = [region("dark", 0, 0, 1280, 700), region("light", 40, 200, 1240, 500)];
  assert.equal(resolveHeaderSurface(regions, 640, 240), "light");
  assert.equal(resolveHeaderSurface(regions, 640, 40), "dark");
  assert.equal(resolveHeaderSurface(regions, 20, 240), "dark");
});

test("the closing dark panel takes precedence over its sticky underlay", () => {
  const regions = [region("light", 0, -500, 1280, 720), region("dark", 0, 20, 1280, 900)];
  assert.equal(resolveHeaderSurface(regions, 640, 40), "dark");
  assert.equal(resolveHeaderSurface(regions, 640, 10), "light");
});

test("unmarked page areas and zero-sized or offscreen markers stay light", () => {
  assert.equal(resolveHeaderSurface([], 640, 40), "light");
  assert.equal(resolveHeaderSurface([region("dark", 0, 0, 0, 0)], 0, 0), "light");
  assert.equal(resolveHeaderSurface([region("dark", 0, -720, 1280, 0)], 640, 40), "light");
});
