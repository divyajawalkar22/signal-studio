import { useEffect, useRef, type ReactNode } from 'react';
import { X, Plus } from 'lucide-react';
import type { Workspace, Post } from './model';
export type Update = (recipe: (w: Workspace) => void) => Promise<boolean>;
export const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const statusNames = { draft: 'Draft', pending: 'For review', approved: 'Approved', published: 'Published' };
export function Button({ children, onClick, secondary = false, disabled = false, danger = false }: {
    children: ReactNode;
    onClick?: () => void;
    secondary?: boolean;
    disabled?: boolean;
    danger?: boolean;
}) { return <button type="button" className={'button ' + (secondary ? 'secondary ' : '') + (danger ? 'danger' : '')} disabled={disabled} onClick={onClick}>{children}</button>; }
export function Field({ label, children, hint }: {
    label: string;
    children: ReactNode;
    hint?: string;
}) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Heading({ eyebrow, title, description, children }: {
    eyebrow: string;
    title: string;
    description: string;
    children?: ReactNode;
}) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div><div className="heading-actions">{children}</div></div>; }
export function Badge({ status }: {
    status: Post['status'];
}) { return <span className={'badge status-' + status}>{statusNames[status]}</span>; }
export function Empty({ title, children }: {
    title: string;
    children?: ReactNode;
}) { return <div className="empty-state"><h3>{title}</h3><p>{children}</p></div>; }
export function Modal({ title, children, close, wide = false }: {
    title: string;
    children: ReactNode;
    close: () => void;
    wide?: boolean;
}) { const ref = useRef<HTMLDialogElement>(null); useEffect(() => { const el = ref.current!; const old = document.activeElement as HTMLElement; el.showModal(); return () => { el.close(); old?.focus(); }; }, []); return <dialog ref={ref} className={'modal native-dialog ' + (wide ? 'wide' : '')} onCancel={e => { e.preventDefault(); close(); }}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={close}><X /></button></div>{children}</dialog>; }
export function Tags({ values, selected, onChange }: {
    values: string[];
    selected: string[];
    onChange: (v: string[]) => void;
}) { return <div className="tag-picker" role="group" aria-label="Topic tags">{values.length ? values.map(t => <button type="button" key={t} className={'tag ' + (selected.includes(t) ? 'selected' : '')} aria-pressed={selected.includes(t)} onClick={() => onChange(selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t])}>{t}</button>) : <p className="muted">Create topic tags in Knowledge bank → Categories & tags.</p>}</div>; }
export function Category({ ws, value, onChange }: {
    ws: Workspace;
    value: string;
    onChange: (v: string) => void;
}) { return <select value={value} onChange={e => onChange(e.target.value)}><option value="">Uncategorized</option>{ws.categories.map(c => <option key={c}>{c}</option>)}</select>; }
export function Chips({ tags }: {
    tags: string[];
}) { return <div className="chips">{tags.map(t => <span key={t}>#{t}</span>)}</div>; }
export function Stat({ label, value, detail }: {
    label: string;
    value: number | string;
    detail?: string;
}) { return <section className="stat-card"><p className="stat-label">{label}</p><div className="stat-value">{value}</div>{detail && <p>{detail}</p>}</section>; }
