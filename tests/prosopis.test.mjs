import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/prosopis.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { prosopisPixel, PROSOPIS_VERSIONS } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("classification displays only presence, never arbitrary nonzero values", () => {
  assert.deepEqual(prosopisPixel(1, null, "highConfidence"), [139, 0, 0, 255]);
  for (const value of [0, -1, 0.5, 2, NaN, Infinity]) {
    assert.equal(prosopisPixel(value, null, "highConfidence")[3], 0);
  }
});

test("nodata remains transparent for either layer type", () => {
  for (const kind of ["confidence", "highConfidence"]) {
    for (const value of [1, -9999, NaN, Infinity]) {
      assert.equal(prosopisPixel(value, value, kind)[3], 0);
    }
  }
});

test("probability threshold includes 0.1 and masks lower values", () => {
  assert.equal(prosopisPixel(0.099, null, "confidence")[3], 0);
  assert.equal(prosopisPixel(0.1, null, "confidence")[3], 255);
  assert.equal(prosopisPixel(0, null, "confidence")[3], 0);
});

test("probability uses a graduated palette and clamps cubic overview overshoot", () => {
  assert.deepEqual(prosopisPixel(0.5, null, "confidence"), [253, 141, 60, 255]);
  assert.deepEqual(prosopisPixel(1, null, "confidence"), [177, 0, 38, 255]);
  assert.deepEqual(prosopisPixel(1.05, null, "confidence"), [177, 0, 38, 255]);
  assert.notDeepEqual(prosopisPixel(0.1, null, "confidence"), prosopisPixel(0.5, null, "confidence"));
});

test("catalog has complete pairs for both southern models and whole-region coverage", () => {
  assert.equal(PROSOPIS_VERSIONS.length, 6);
  assert.equal(new Set(PROSOPIS_VERSIONS.map(v => v.id)).size, 6);
  assert.equal(PROSOPIS_VERSIONS[0].label, "v22");
  assert.equal(PROSOPIS_VERSIONS[0].kind, "highConfidence");
  for (const layer of PROSOPIS_VERSIONS) {
    assert.equal(layer.resolution, layer.coverage === "all" ? 100 : 10);
    assert.ok(PROSOPIS_VERSIONS.some(other => other.label === layer.label && other.coverage === layer.coverage && other.kind !== layer.kind));
  }
});
