import { emptyWorkspace, migrate, validate, type Workspace } from './model.ts';
export const STORAGE_KEY = 'signal-workspace-v2';
export function readWorkspace(): Workspace { const raw = localStorage.getItem(STORAGE_KEY); return raw ? migrate(JSON.parse(raw)) : emptyWorkspace(); }
export async function commit(change: (ws: Workspace) => void): Promise<Workspace> {
    const write = () => { const current = readWorkspace(); const next = structuredClone(current); change(next); next.revision = current.revision + 1; const checked = validate(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(checked)); return checked; };
    // All cooperating tabs use one lock and apply edits to the latest saved workspace.
    if (navigator.locks)
        return navigator.locks.request(STORAGE_KEY, write);
    throw new Error('This browser does not support safe workspace saving. Use a current Chrome, Edge, Firefox or Safari browser.');
}
export function unchanged(current: unknown, expected: unknown) { if (JSON.stringify(current) !== JSON.stringify(expected))
    throw new Error('This item changed in another tab. Close and reopen it before saving your edits.'); }
