import { useState } from 'react';
import { Plus, Trash2, Download, Check, BookOpen } from 'lucide-react';
import { allSlots, bankFromPost, now, savePost, today, type Post, type Workspace, type Source } from './model';
import { unchanged } from './storage';
import { Badge, Button, Category, Field, Modal, Tags, type Update } from './ui';
import { exportCaption, exportCarousel } from './export';
export default function Editor({ ws, original, update, close }: {
    ws: Workspace;
    original: Post;
    update: Update;
    close: () => void;
}) {
    const [p, setP] = useState(structuredClone(original));
    const [baseline, setBaseline] = useState(ws.posts.find(x => x.id === original.id));
    const [saved, setSaved] = useState(JSON.stringify(original));
    const [reviewed, setReviewed] = useState(false);
    const [bank, setBank] = useState(false);
    const [bankType, setBankType] = useState<Source['type']>('Writing sample');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const edit = <K extends keyof Post>(key: K, value: Post[K]) => { setP(old => ({ ...old, [key]: value, ...(['title', 'caption', 'format', 'slides'].includes(key) && old.status === 'approved' ? { status: 'draft' as const, approvedAt: '' } : {}) })); setReviewed(false); setMessage(''); };
    const dismiss = () => { if (JSON.stringify(p) !== saved && !confirm('Discard the edits you have not saved?'))
        return; close(); };
    const persist = async (status = p.status) => { setBusy(true); let stored: Post | undefined; const ok = await update(w => { unchanged(w.posts.find(x => x.id === p.id), baseline); const next = { ...p, status }; if (status === 'approved') {
        if (!reviewed)
            throw new Error('Review the content and tick the confirmation first');
        next.approvedAt = now();
    } if (bank)
        bankFromPost(w, next, bankType); savePost(w, next, status === 'approved'); stored = w.posts.find(x => x.id === p.id); }); setBusy(false); if (ok && stored) {
        setP(stored);
        setBaseline(stored);
        setSaved(JSON.stringify(stored));
        setReviewed(false);
        setBank(false);
        setMessage('Saved on this device.');
    } };
    const slots = allSlots(ws).filter(s => !ws.posts.some(x => x.slotId === s.id && x.id !== p.id));
    return <Modal title={p.status === 'published' ? 'Published post record' : 'Your words, your way.'} close={dismiss} wide>
 <fieldset disabled={busy} className="editor-fieldset"><div className="editor-grid"><div className="editor-main"><Badge status={p.status}/>
 <Field label="Title"><input value={p.title} maxLength={200} placeholder="A name for this post" onChange={e => edit('title', e.target.value)}/></Field>
 <div className="form-grid two"><Field label="Category"><Category ws={ws} value={p.category} onChange={v => edit('category', v)}/></Field><Field label="Format"><select value={p.format} onChange={e => edit('format', e.target.value as Post['format'])}><option>Text</option><option>Carousel</option></select></Field></div>
 <p className="field-label">Topic tags</p><Tags values={ws.tags} selected={p.tags} onChange={v => edit('tags', v)}/>
 <Field label="Planned slot"><select value={p.slotId} onChange={e => { const s = slots.find(s => s.id === e.target.value); setP(old => ({ ...old, slotId: s?.id || '', date: '', category: s?.category || old.category, tags: s?.tags || old.tags, format: s?.format || old.format })); }}><option value="">Unscheduled or extra post</option>{slots.map(s => <option value={s.id} key={s.id}>{s.date} · {s.time} · {s.category || 'Uncategorized'}</option>)}</select></Field>
 {!p.slotId && <div className="form-grid two"><Field label={'Optional planned date · ' + ws.timezone}><input type="date" value={p.date} onChange={e => edit('date', e.target.value)}/></Field><Field label="Time"><input type="time" value={p.time} onChange={e => edit('time', e.target.value)}/></Field></div>}
 <details className="source-details"><summary><BookOpen size={16}/>Reference material</summary><Field label="Link material from your bank"><select value={p.sourceId} onChange={e => edit('sourceId', e.target.value)}><option value="">No source linked</option>{ws.sources.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></Field>{ws.sources.find(s => s.id === p.sourceId) && <><p className="preserve reference-text">{ws.sources.find(s => s.id === p.sourceId)!.content}</p><Button secondary onClick={() => { const s = ws.sources.find(s => s.id === p.sourceId)!; if (p.caption && !confirm('Replace your caption with the selected material?'))
        return; edit('caption', s.content.slice(0, 3000)); }}>Paste into caption</Button><p className="fine-print">Pastes up to 3,000 characters. Your saved source stays unchanged.</p></>}</details>
 <Field label="Your LinkedIn content"><textarea className="caption-input" maxLength={3000} value={p.caption} placeholder="Write or paste your own content…" onChange={e => edit('caption', e.target.value)}/><small>{p.caption.length} / 3,000 characters</small></Field>
 {p.format === 'Carousel' && <section className="panel"><div className="section-heading"><h3>Carousel slides</h3><Button secondary disabled={p.slides.length >= 10} onClick={() => edit('slides', [...p.slides, { title: '', body: '' }])}><Plus size={16}/>Add slide</Button></div>{p.slides.map((s, i) => <div className="slide-fields" key={i}><Field label={'Slide ' + (i + 1) + ' heading'}><input maxLength={160} value={s.title} onChange={e => edit('slides', p.slides.map((x, j) => i === j ? { ...x, title: e.target.value } : x))}/></Field><Field label="Body"><textarea maxLength={400} value={s.body} onChange={e => edit('slides', p.slides.map((x, j) => i === j ? { ...x, body: e.target.value } : x))}/></Field><button className="text-button danger" onClick={() => edit('slides', p.slides.filter((_, j) => i !== j))}><Trash2 size={14}/>Delete slide</button></div>)}</section>}
 <label className="checkbox-label"><input type="checkbox" checked={bank} onChange={e => setBank(e.target.checked)}/>{p.bankId ? 'Update the linked knowledge-bank item when saving' : 'Also save this content to my knowledge bank'}</label>
 {bank && <Field label="Save material as"><select value={bankType} onChange={e => setBankType(e.target.value as Source['type'])}>{['Experience', 'Idea', 'Reference', 'Writing sample'].map(t => <option key={t}>{t}</option>)}</select></Field>}
 <details open={p.status === 'published'} className="source-details"><summary>Record publication & results</summary><p className="muted">Publish on LinkedIn yourself, then record it here. Editing this record does not edit LinkedIn.</p><Field label="Published LinkedIn URL"><input type="url" value={p.publishedUrl} onChange={e => edit('publishedUrl', e.target.value)}/></Field><Field label="Actual publication date"><input type="date" max={today(ws.timezone)} value={p.publishedDate} onChange={e => edit('publishedDate', e.target.value)}/></Field><div className="form-grid two">{(['impressions', 'reactions', 'comments', 'conversations'] as const).map(k => <Field key={k} label={k} hint="Leave blank if not recorded"><input type="number" min={0} value={p.metrics[k] ?? ''} onChange={e => edit('metrics', { ...p.metrics, [k]: e.target.value === '' ? null : Number(e.target.value) })}/></Field>)}</div><Button secondary onClick={() => persist('published')}>Save as published</Button>{p.status === 'published' && <Button secondary onClick={() => { if (confirm('Undo the published record? The LinkedIn post itself will stay online.')) {
        setP({ ...p, status: 'draft', publishedDate: '', publishedUrl: '', approvedAt: '' });
    } }}>Return record to draft</Button>}</details>
 </div><aside className="editor-preview"><p className="eyebrow">CONTENT PREVIEW</p><div className="linkedin-preview"><div className="preview-person"><div className="avatar">{(ws.brand.name || 'Y')[0]}</div><div><strong>{ws.brand.name || 'Your name'}</strong><small>{ws.brand.niche || ws.brand.role}</small></div><span className="linkedin-mark">in</span></div><p className="preserve preview-caption">{p.caption || 'Your words will appear here as you write.'}</p>{p.format === 'Carousel' && p.slides.map((s, i) => <div className="slide-preview" key={i}><h3>{s.title || 'Slide heading'}</h3><p>{s.body || 'Your slide content'}</p><small>{i + 1} / {p.slides.length}</small></div>)}</div><div className="button-row"><Button secondary disabled={!p.caption} onClick={() => exportCaption({ ...p, pillar: p.category })}><Download size={15}/>Caption</Button>{p.format === 'Carousel' && <Button secondary disabled={!p.slides.length} onClick={async () => { try {
        await exportCarousel({ ...p, pillar: p.category }, ws.brand.name || 'Creator');
    }
    catch (e) {
        setMessage((e as Error).message);
    } }}><Download size={15}/>PDF</Button>}</div></aside></div>
 {message && <p role="status" className="inline-success">{message}</p>}
 {p.status !== 'published' && <label className="checkbox-label approval-checkbox"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)}/>I reviewed the wording, facts, attribution and slides.</label>}
 <div className="editor-footer"><Button secondary danger onClick={async () => { if (!baseline) {
        dismiss();
        return;
    } if (!confirm('Delete this post record? Its planned slot will remain empty. Saved bank material and LinkedIn posts will stay unchanged.'))
        return; if (await update(w => { unchanged(w.posts.find(x => x.id === p.id), baseline); w.posts = w.posts.filter(x => x.id !== p.id); }))
        close(); }}><Trash2 size={15}/>{baseline ? 'Delete post' : 'Discard'}</Button><div className="button-row"><Button secondary onClick={() => persist()}>Save {p.status === 'published' ? 'record' : 'draft'}</Button>{p.status !== 'published' && <><Button secondary disabled={!p.caption.trim()} onClick={() => persist('pending')}>Send to review</Button><Button disabled={!reviewed || !p.caption.trim()} onClick={() => persist('approved')}><Check size={15}/>Approve</Button></>}</div></div></fieldset></Modal>;
}
