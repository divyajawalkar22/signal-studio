import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { commit, readWorkspace, STORAGE_KEY, unchanged } from '../src/storage.ts';
let values = new Map<string, string>();
let queue: Promise<unknown> = Promise.resolve();
let failWrites = false;
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { if (failWrites)
            throw new Error('Quota exceeded'); values.set(k, v); } }, configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: { locks: { request: (_name: string, fn: () => unknown) => { const next = queue.then(fn); queue = next.catch(() => { }); return next; } } }, configurable: true });
beforeEach(() => { values = new Map(); queue = Promise.resolve(); failWrites = false; });
test('Concurrent saved changes apply to the latest revision without losing unrelated data', async () => { await Promise.all([commit(w => { w.tags.push('Design'); }), commit(w => { w.tags.push('Development'); })]); assert.deepEqual(readWorkspace().tags, ['Design', 'Development']); assert.equal(readWorkspace().revision, 2); });
test('Validation failure and storage quota errors do not overwrite the last saved data', async () => { await commit(w => { w.brand.name = 'Saved'; }); await assert.rejects(() => commit(w => { w.categories = []; })); failWrites = true; await assert.rejects(() => commit(w => { w.brand.name = 'Unsaved'; }), /Quota/); assert.equal(readWorkspace().brand.name, 'Saved'); assert.equal(readWorkspace().revision, 1); });
test('Corrupt storage is surfaced instead of silently replacing user data', async () => { values.set(STORAGE_KEY, 'broken JSON'); assert.throws(() => readWorkspace()); await assert.rejects(() => commit(w => { w.brand.name = 'No'; })); assert.equal(values.get(STORAGE_KEY), 'broken JSON'); });
test('An item changed by another tab cannot be overwritten by a stale editor', () => { assert.throws(() => unchanged({ caption: 'New' }, { caption: 'Old' }), /another tab/); assert.doesNotThrow(() => unchanged({ caption: 'Same' }, { caption: 'Same' })); });
