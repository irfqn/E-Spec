const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const barangScript = fs.readFileSync(path.resolve(__dirname, "../../barang.js"), "utf8");
const jasaScript = fs.readFileSync(path.resolve(__dirname, "../../jasa.js"), "utf8");

for (const [name, script, key] of [
  ["Barang", barangScript, "eSpecBarangPersistedDocumentNo.v1"],
  ["Jasa", jasaScript, "eSpecJasaPersistedDocumentNo.v1"],
]) {
  test(`${name} retains its document number across save and restore`, () => {
    assert.match(script, new RegExp(`const PERSISTED_DOCUMENT_NO_KEY = "${key}"`));
    assert.match(script, /String\(persistedDocumentNo \|\| formData\.persistedDocumentNo \|\| ""\)\.trim\(\)/);
    assert.match(script, /persistedDocumentNo = documentNo/);
    assert.match(script, /localStorage\.setItem\(PERSISTED_DOCUMENT_NO_KEY, documentNo\)/);
    assert.match(script, /localStorage\.getItem\(PERSISTED_DOCUMENT_NO_KEY\)/);
    assert.match(script, /localStorage\.removeItem\(PERSISTED_DOCUMENT_NO_KEY\)/);
    assert.match(script, /persistedDocumentNo = null/);
  });
}
