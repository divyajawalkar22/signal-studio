import { useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import { changeLabel, newSource, now, removeSource, type Source, type Workspace } from './model';
import { unchanged } from './storage';
import { Button, Category, Chips, Empty, Field, Heading, Modal, Tags, type Update } from './ui';
export function Knowledge({ ws, update }: {
    ws: Workspace;
    update: Update;
}) {
    const [query, setQuery] = useState('');
    const [type, setType] = useState('All');
    const [category, setCategory] = useState('');
    const [tag, setTag] = useState('');
    const [item, setItem] = useState<Source | null>(null);
    const [labels, setLabels] = useState(false);
    const items = ws.sources.filter(s => (type === 'All' || s.type === type) && (!category || s.category === category) && (!tag || s.tags.includes(tag)) && [s.title, s.content, s.attribution, ...s.tags].join(' ').toLowerCase().includes(query.toLowerCase()));
    return <><Heading eyebrow="YOUR MATERIAL, YOUR VOICE" title="Keep something worth sharing." description="Save experiences, ideas, references and writing samples. Organize them with categories and topic tags."><Button secondary onClick={() => setLabels(true)}>Categories & tags</Button><Button onClick={() => setItem(newSource())}><Plus size={16}/>Save material</Button></Heading><div className="library-toolbar"><input type="search" aria-label="Search saved material" placeholder="Search content or tags…" value={query} onChange={e => setQuery(e.target.value)}/><select aria-label="Filter material type" value={type} onChange={e => setType(e.target.value)}>{['All', 'Experience', 'Idea', 'Reference', 'Writing sample'].map(t => <option key={t}>{t}</option>)}</select><select aria-label="Filter category" value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{ws.categories.map(c => <option key={c}>{c}</option>)}</select><select aria-label="Filter tag" value={tag} onChange={e => setTag(e.target.value)}><option value="">All tags</option>{ws.tags.map(t => <option key={t}>{t}</option>)}</select></div><div className="library-grid">{items.map(s => <article className="source-card panel" key={s.id}><div className="section-heading"><span className="source-type"><BookOpen size={15}/>{s.type}</span><button className="icon-button" aria-label={'Edit ' + s.title} onClick={() => setItem(s)}><Pencil size={16}/></button></div><h2>{s.title}</h2><p className="source-excerpt preserve">{s.content}</p><Chips tags={s.tags}/><p className="fine-print">{s.category || 'Uncategorized'} · {ws.posts.filter(p => p.sourceId === s.id || p.bankId === s.id).length} linked posts</p></article>)}</div>{!items.length && <Empty title="A place for your own material">Save a thought or adjust your filters.</Empty>}{item && <SourceEditor key={item.id} original={item} ws={ws} update={update} close={() => setItem(null)}/>} {labels && <Labels ws={ws} update={update} close={() => setLabels(false)}/>}</>;
}
function SourceEditor({ original, ws, update, close }: {
    original: Source;
    ws: Workspace;
    update: Update;
    close: () => void;
}) { const [s, setS] = useState(structuredClone(original)); const [baseline] = useState(ws.sources.find(x => x.id === s.id)); const [busy, setBusy] = useState(false); const set = <K extends keyof Source>(k: K, v: Source[K]) => setS(old => ({ ...old, [k]: v })); const dismiss = () => { if (JSON.stringify(s) !== JSON.stringify(original) && !confirm('Discard your unsaved material edits?'))
    return; close(); }; return <Modal title={baseline ? 'Edit saved material' : 'Something worth keeping'} close={dismiss}><Field label="Title"><input maxLength={160} value={s.title} onChange={e => set('title', e.target.value)}/></Field><div className="form-grid two"><Field label="Material type"><select value={s.type} onChange={e => set('type', e.target.value as Source['type'])}>{['Experience', 'Idea', 'Reference', 'Writing sample'].map(t => <option key={t}>{t}</option>)}</select></Field><Field label="Content category"><Category ws={ws} value={s.category} onChange={v => set('category', v)}/></Field></div><p className="field-label">Topic tags</p><Tags values={ws.tags} selected={s.tags} onChange={v => set('tags', v)}/><Field label="Your material"><textarea className="large-textarea" maxLength={10000} value={s.content} onChange={e => set('content', e.target.value)}/></Field><Field label="Original source URL (optional)"><input type="url" value={s.url} onChange={e => set('url', e.target.value)}/></Field><Field label="Attribution or context (optional)"><textarea value={s.attribution} onChange={e => set('attribution', e.target.value)}/></Field><p className="fine-print">Created {s.createdAt.slice(0, 10)} · Updated {s.updatedAt.slice(0, 10)}. Editing this material does not rewrite linked posts.</p><div className="modal-actions">{baseline && <Button secondary danger onClick={async () => { if (confirm('Delete this saved material? Linked posts will keep their written content.') && await update(w => { unchanged(w.sources.find(x => x.id === s.id), baseline); removeSource(w, s.id); }))
    close(); }}><Trash2 size={15}/>Delete</Button>}<Button disabled={busy} onClick={async () => { setBusy(true); const ok = await update(w => { unchanged(w.sources.find(x => x.id === s.id), baseline); const next = { ...s, updatedAt: now() }; w.sources = baseline ? w.sources.map(x => x.id === s.id ? next : x) : [...w.sources, next]; }); setBusy(false); if (ok)
    close(); }}>Save material</Button></div></Modal>; }
function Labels({ ws, update, close }: {
    ws: Workspace;
    update: Update;
    close: () => void;
}) { const [kind, setKind] = useState<'category' | 'tag'>('tag'); const [value, setValue] = useState(''); const [editing, setEditing] = useState(''); const list = kind === 'tag' ? ws.tags : ws.categories; return <Modal title="Categories & topic tags" close={close}><p className="muted">Categories describe the kind of post. Tags describe its subject. Renaming a label updates every connected item.</p><Field label="Manage"><select value={kind} onChange={e => { setKind(e.target.value as typeof kind); setEditing(''); setValue(''); }}><option value="tag">Topic tags</option><option value="category">Content categories</option></select></Field><div className="label-list">{list.map(l => <div className="section-heading" key={l}><span>{l}</span><div className="button-row"><button aria-label={'Rename ' + l} className="icon-button" onClick={() => { setEditing(l); setValue(l); }}><Pencil size={16}/></button><button aria-label={'Delete ' + l} className="icon-button danger" onClick={async () => { if (confirm('Remove “' + l + '” from all plans, posts and saved material? Content will be kept.')) {
    await update(w => changeLabel(w, kind, l, ''));
    if (editing === l) {
        setEditing('');
        setValue('');
    }
} }}><Trash2 size={16}/></button></div></div>)}</div><Field label={editing ? 'Rename “' + editing + '”' : 'Create ' + kind}><input maxLength={100} value={value} onChange={e => setValue(e.target.value)}/></Field><div className="button-row">{editing && <Button secondary onClick={() => { setEditing(''); setValue(''); }}>Cancel rename</Button>}<Button disabled={!value.trim()} onClick={async () => { if (await update(w => { if (editing)
    changeLabel(w, kind, editing, value);
else {
    const list = kind === 'tag' ? w.tags : w.categories;
    list.push(value.trim());
} })) {
    setValue('');
    setEditing('');
} }}>{editing ? 'Save name' : 'Create ' + kind}</Button></div></Modal>; }
