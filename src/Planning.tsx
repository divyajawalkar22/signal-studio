import { useState } from 'react';
import { Plus, Trash2, Pencil, CalendarDays } from 'lucide-react';
import { addDays, allSlots, inWeek, newPost, now, postSchedule, proposePlan, removePlan, savePlan, uid, weekStart, type Workspace, type Plan, type Post, type Slot } from './model';
import { unchanged } from './storage';
import { Badge, Button, Category, Chips, dayNames, Empty, Field, Heading, Modal, Tags, type Update } from './ui';
export function WeekPicker({ week, setWeek }: {
    week: string;
    setWeek: (v: string) => void;
}) { return <div className="week-controls"><Button secondary onClick={() => setWeek(addDays(week, -7))}>Previous</Button><Field label="Week starting Monday"><input type="date" value={week} onChange={e => { if (e.target.value)
    setWeek(weekStart(e.target.value)); }}/></Field><Button secondary onClick={() => setWeek(addDays(week, 7))}>Next</Button></div>; }
export function PlanEditor({ ws, week, update, close }: {
    ws: Workspace;
    week: string;
    update: Update;
    close: () => void;
}) {
    const baseline = ws.plans.find(p => p.week === week);
    const [rhythm, setRhythm] = useState(structuredClone(baseline?.rhythm || ws.rhythm));
    const [preview, setPreview] = useState<Plan | undefined>(baseline ? structuredClone(baseline) : undefined);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [settingsChanged, setSettingsChanged] = useState(false);
    const dismiss = () => { if (dirty && !confirm('Discard the changes to this plan?'))
        return; close(); };
    const changeRhythm = (r: typeof rhythm) => { setRhythm(r); setDirty(true); setSettingsChanged(true); };
    const build = () => { try {
        setPreview(proposePlan(ws, week, rhythm));
        setDirty(true);
        setSettingsChanged(false);
        setError('');
    }
    catch (e) {
        setError((e as Error).message);
    } };
    const edit = (id: string, patch: Partial<Slot>) => { setPreview(p => p ? { ...p, slots: p.slots.map(s => s.id === id ? { ...s, ...patch } : s) } : p); setDirty(true); };
    return <Modal title={baseline ? 'Edit your saved weekly plan' : 'Plan a week of your own words'} close={dismiss} wide><div className="planning-editor"><section><p className="muted">Week of {week}. This creates category slots only. Written content is added by you.</p><div className="form-grid two"><Field label="Weekly target"><input type="number" min={1} max={35} value={rhythm.target} onChange={e => changeRhythm({ ...rhythm, target: Number(e.target.value) })}/></Field><Field label="Daily maximum"><input type="number" min={1} max={5} value={rhythm.dailyLimit} onChange={e => changeRhythm({ ...rhythm, dailyLimit: Number(e.target.value) })}/></Field></div><Field label="Posting days"><div className="day-picker">{dayNames.map((d, i) => <button key={d} aria-pressed={rhythm.days.includes(i)} className={rhythm.days.includes(i) ? 'selected' : ''} onClick={() => changeRhythm({ ...rhythm, days: rhythm.days.includes(i) ? rhythm.days.filter(x => x !== i) : [...rhythm.days, i] })}>{d}</button>)}</div></Field><p className="field-label">Time windows · {baseline?.timezone || ws.timezone}</p><div className="time-inputs">{rhythm.times.map((t, i) => <div className="time-item" key={i}><input aria-label={'Time window ' + (i + 1)} type="time" value={t} onChange={e => changeRhythm({ ...rhythm, times: rhythm.times.map((x, j) => i === j ? e.target.value : x) })}/><button className="icon-button" aria-label={'Remove time window ' + (i + 1)} disabled={rhythm.times.length === 1} onClick={() => changeRhythm({ ...rhythm, times: rhythm.times.filter((_, j) => i !== j) })}><Trash2 size={15}/></button></div>)}</div><Button secondary disabled={rhythm.times.length >= 5} onClick={() => changeRhythm({ ...rhythm, times: [...rhythm.times, ['08:00', '11:00', '14:00', '17:00', '20:00'].find(t => !rhythm.times.includes(t))!] })}><Plus size={15}/>Add time</Button><h3 className="section-spacer">Category mix</h3>{ws.categories.map(c => <Field key={c} label={c}><input type="number" min={0} max={35} value={rhythm.mix[c] || 0} onChange={e => changeRhythm({ ...rhythm, mix: { ...rhythm.mix, [c]: Number(e.target.value) } })}/></Field>)}<p className="fine-print">{Object.values(rhythm.mix).reduce((a, b) => a + b, 0)} category slots / {rhythm.target} target</p><Button onClick={build}>{baseline ? 'Preview revised distribution' : 'Build plan preview'}</Button></section><section><div className="section-heading"><h3>{preview ? preview.slots.length + ' planned slots' : 'Your plan preview'}</h3>{preview && <Button secondary onClick={() => { const occupied = new Set(preview.slots.map(s => s.date + s.time)); let slot: Slot | undefined; for (let d = 0; d < 7 && !slot; d++)
        for (let h = 9; h < 22 && !slot; h++) {
            const date = addDays(week, d), time = String(h).padStart(2, '0') + ':00';
            if (!occupied.has(date + time))
                slot = { id: uid(), date, time, category: ws.categories[0], tags: [], format: 'Text' };
        } if (slot) {
        setPreview({ ...preview, slots: [...preview.slots, slot] });
        setDirty(true);
    } }}><Plus size={15}/>Add slot</Button>}</div>{!preview && <Empty title="Choose your rhythm first">Build a preview, review the slots, then save to your calendar.</Empty>}{preview?.slots.map(s => <article className="slot-edit" key={s.id}><div className="form-grid two"><Field label="Date"><input type="date" min={week} max={addDays(week, 6)} value={s.date} onChange={e => edit(s.id, { date: e.target.value })}/></Field><Field label="Time"><input type="time" value={s.time} onChange={e => edit(s.id, { time: e.target.value })}/></Field><Field label="Category"><Category ws={ws} value={s.category} onChange={v => edit(s.id, { category: v })}/></Field><Field label="Format"><select value={s.format} onChange={e => edit(s.id, { format: e.target.value as Slot['format'] })}><option>Text</option><option>Carousel</option></select></Field></div><Tags values={ws.tags} selected={s.tags} onChange={v => edit(s.id, { tags: v })}/><div className="section-heading"><small>{ws.posts.some(p => p.slotId === s.id) ? 'Written post attached' : 'Not written yet'}</small><button className="text-button danger" onClick={() => { if (ws.posts.some(p => p.slotId === s.id) && !confirm('Remove this slot and keep its written post as an unscheduled draft?'))
        return; setPreview({ ...preview, slots: preview.slots.filter(x => x.id !== s.id) }); setDirty(true); }}><Trash2 size={15}/>Delete slot</button></div></article>)}</section></div>{error && <p className="inline-error" role="alert">{error}</p>}{settingsChanged && preview && <p className="notice">Settings changed. Preview the revised distribution before saving.</p>}<div className="modal-actions"><Button secondary onClick={dismiss}>Cancel</Button><Button disabled={!preview || busy || settingsChanged} onClick={async () => { setBusy(true); const ok = await update(w => { unchanged(w.plans.find(p => p.week === week), baseline); savePlan(w, { ...preview!, updatedAt: now() }); }); setBusy(false); if (ok)
        close(); }}>Save weekly plan</Button></div></Modal>;
}
export function Strategy({ ws, week, editPlan, update }: {
    ws: Workspace;
    week: string;
    editPlan: () => void;
    update: Update;
}) { const plan = ws.plans.find(p => p.week === week); return <><Heading eyebrow="A LITTLE STRUCTURE" title="Give your week a direction." description="Choose the categories and topics. Bring your own words."><Button onClick={editPlan}><Pencil size={16}/>{plan ? 'Edit this week’s plan' : 'Create weekly plan'}</Button></Heading><div className="strategy-layout"><section className="panel"><h2>{plan ? 'Your saved plan' : 'Start with your intentions'}</h2><p className="muted">{plan ? `${plan.slots.length} slots saved · ${plan.rhythm.target} target · ${plan.timezone}` : 'Choose a weekly target, days, times and category mix. Nothing enters your calendar until you save the preview.'}</p>{ws.categories.map(c => <div className="mix-row" key={c}><span>{c}</span><strong>{plan?.slots.filter(s => s.category === c).length || 0}</strong></div>)}{plan && <><p className="fine-print">Reopening the plan edits the same week. Your written posts stay attached.</p><Button secondary danger onClick={async () => { if (confirm('Delete this weekly plan? All written posts will be kept as unscheduled posts.'))
    await update(w => { unchanged(w.plans.find(p => p.week === week), plan); removePlan(w, week); }); }}><Trash2 size={15}/>Delete weekly plan</Button></>}</section><section className="note-card"><h3>{ws.brand.niche || 'Your direction'}</h3><p>{ws.brand.goal || 'Add your goal in My brand.'}</p><p>{ws.brand.audience && 'For ' + ws.brand.audience}</p><p>Keep the category mix intentional. A saved slot is a reminder of what kind of post to write.</p></section></div></>; }
export function Calendar({ ws, week, openPost, editPlan }: {
    ws: Workspace;
    week: string;
    openPost: (p: Post) => void;
    editPlan: () => void;
}) { const plan = ws.plans.find(p => p.week === week); return <><Heading eyebrow="ONE WEEK AT A TIME" title="Your content calendar." description={'Planned times in ' + (plan?.timezone || ws.timezone) + '. Empty slots stay separate from drafts.'}><Button secondary onClick={editPlan}>{plan ? 'Edit plan' : 'Plan this week'}</Button><Button onClick={() => openPost(newPost())}><Plus size={16}/>Write a post</Button></Heading><div className="calendar-grid">{dayNames.map((name, i) => { const date = addDays(week, i); const slots = plan?.slots.filter(s => s.date === date).sort((a, b) => a.time.localeCompare(b.time)) || []; const extras = ws.posts.filter(p => !p.slotId && p.date === date); return <section className="calendar-day" key={date}><div className="calendar-day-heading"><span>{name}</span><strong>{date.slice(-2)}</strong></div><div className="day-posts">{slots.map(s => { const post = ws.posts.find(p => p.slotId === s.id); return <button className={'post-card ' + (!post ? 'empty-slot' : '')} key={s.id} onClick={() => openPost(post || newPost(s))}><div className="post-card-top">{s.category || 'Uncategorized'}</div><h3>{post?.title || s.format + ' slot'}</h3><Chips tags={s.tags}/><div className="post-card-bottom">{post ? <Badge status={post.status}/> : <span className="badge">Not written yet</span>}<small>{s.time}</small></div></button>; })}{extras.map(p => <button className="post-card" key={p.id} onClick={() => openPost(p)}><div className="post-card-top">Extra · {p.category || 'Uncategorized'}</div><h3>{p.title || 'Untitled post'}</h3><Badge status={p.status}/><small>{p.time}</small></button>)}{!slots.length && !extras.length && <p className="open-space">No slots</p>}<button className="text-button" onClick={() => openPost({ ...newPost(), date })}><Plus size={14}/>Extra post</button></div></section>; })}</div></>; }
