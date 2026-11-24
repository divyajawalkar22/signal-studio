import { useEffect, useState } from 'react';
import { Radio, LayoutDashboard, Compass, CalendarRange, CalendarDays, Layers3, BookOpen, ChartNoAxesCombined, Settings2, Plus, Download, Menu, X } from 'lucide-react';
import { addDays, emptyWorkspace, inWeek, migrate, newPost, now, postSchedule, today, weekStart, type Workspace, type Post } from './model';
import { commit, readWorkspace, STORAGE_KEY, unchanged } from './storage';
import { Badge, Button, Chips, Empty, Field, Heading, Stat, statusNames, type Update } from './ui';
import Editor from './Editor';
import BrandView from './Brand';
import { Knowledge } from './Knowledge';
import { Calendar, PlanEditor, Strategy, WeekPicker } from './Planning';
import { downloadFile } from './export';
const nav = [{ id: 'overview', label: 'Overview', icon: LayoutDashboard }, { id: 'brand', label: 'My brand', icon: Compass }, { id: 'strategy', label: 'Weekly strategy', icon: CalendarRange }, { id: 'calendar', label: 'Content calendar', icon: CalendarDays }, { id: 'drafts', label: 'Posts & approvals', icon: Layers3 }, { id: 'library', label: 'Knowledge bank', icon: BookOpen }, { id: 'review', label: 'Weekly review', icon: ChartNoAxesCombined }, { id: 'settings', label: 'Settings & backups', icon: Settings2 }];
type View = typeof nav[number]['id'];
export default function App() {
    const [ws, setWs] = useState<Workspace>(emptyWorkspace);
    const [ready, setReady] = useState(false);
    const [fatal, setFatal] = useState('');
    const [view, setView] = useState<View>('overview');
    const [week, setWeek] = useState(weekStart());
    const [post, setPost] = useState<Post | null>(null);
    const [planning, setPlanning] = useState(false);
    const [menu, setMenu] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    useEffect(() => { try {
        const w = readWorkspace();
        setWs(w);
        setWeek(weekStart(today(w.timezone)));
        setReady(true);
    }
    catch (e) {
        setFatal('Your saved workspace could not be read. Export the recovery data before importing a backup.');
    } const hash = () => { const v = location.hash.slice(1); if (nav.some(n => n.id === v))
        setView(v); }; hash(); const sync = (e: StorageEvent) => { if (e.key === STORAGE_KEY) {
        try {
            setWs(readWorkspace());
            setMessage('Updated from another tab.');
        }
        catch {
            setMessage('Another tab saved data that could not be read. Reload to recover.');
        }
    } }; addEventListener('storage', sync); addEventListener('hashchange', hash); return () => { removeEventListener('storage', sync); removeEventListener('hashchange', hash); }; }, []);
    const update: Update = async (recipe) => { setSaving(true); try {
        const next = await commit(recipe);
        setWs(next);
        setMessage('Saved on this device.');
        return true;
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Could not save';
        setMessage(message);
        alert(message);
        return false;
    }
    finally {
        setSaving(false);
    } };
    const go = (v: View) => { setView(v); location.hash = v; setMenu(false); };
    return <div className="app-shell">{menu && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenu(false)}/>}<aside className={'sidebar ' + (menu ? 'is-open' : '')}><a href="#overview" className="wordmark" onClick={() => go('overview')}><span className="logo-mark"><Radio size={25}/></span>signal<span className="wordmark-period">.</span></a><div className="workspace-switch"><span className="workspace-avatar">{(ws.brand.name || 'Y')[0]}</span><div><strong>{ws.brand.name ? ws.brand.name + '’s studio' : 'Your creator studio'}</strong><small>Personal workspace</small></div></div><span className="nav-eyebrow">MAKE ROOM FOR YOUR IDEAS</span><nav aria-label="Main navigation">{nav.map(({ id, label, icon: Icon }) => <button className={'nav-item ' + (view === id ? 'active' : '')} key={id} onClick={() => go(id)}><Icon size={18}/><span>{label}</span></button>)}</nav><div className="sidebar-bottom"><div className="sidebar-note"><strong>Your words. Your direction.</strong><p>A little structure for what you have to say.</p></div><p className="fine-print local-note">Portfolio demo · saved in this browser</p></div></aside><div className="main-shell"><header className="topbar"><div className="breadcrumbs"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenu(!menu)}><Menu /></button><span>Workspace</span><span>/</span><strong>{nav.find(n => n.id === view)?.label}</strong></div><span className="save-indicator">{saving ? 'Saving…' : 'On this device'}</span></header><main className="workspace-main"><div className="local-banner"><span>Private to this browser. Export a backup to move devices or keep a copy.</span><button className="text-button" onClick={() => go('settings')}>Manage backups</button></div>{message && <div role="status" className="save-message"><span>{message}</span><button aria-label="Dismiss message" className="icon-button" onClick={() => setMessage('')}><X size={15}/></button></div>}{fatal ? <section className="panel"><h1>Recover your workspace</h1><p>{fatal}</p><Button onClick={() => downloadFile(new Blob([localStorage.getItem(STORAGE_KEY) || ''], { type: 'application/json' }), 'signal-recovery.json')}>Export recovery data</Button><Settings ws={ws} update={update} replaced={w => { setWs(w); setReady(true); setFatal(''); }}/></section> : !ready ? <p>Opening your workspace…</p> : <>
 {['overview', 'strategy', 'calendar', 'review'].includes(view) && <WeekPicker week={week} setWeek={setWeek}/>}
 {view === 'overview' && <Overview ws={ws} week={week} go={go} openPost={setPost} plan={() => setPlanning(true)}/>}
 {view === 'brand' && <BrandView ws={ws} update={update}/>}
 {view === 'strategy' && <Strategy ws={ws} week={week} update={update} editPlan={() => setPlanning(true)}/>}
 {view === 'calendar' && <Calendar ws={ws} week={week} openPost={setPost} editPlan={() => setPlanning(true)}/>}
 {view === 'drafts' && <Posts ws={ws} openPost={setPost}/>}
 {view === 'library' && <Knowledge ws={ws} update={update}/>}
 {view === 'review' && <Review key={week} ws={ws} week={week} update={update} openPost={setPost}/>}
 {view === 'settings' && <Settings ws={ws} update={update} replaced={setWs}/>}
 </>}<footer className="workspace-footer"><span><Radio size={14}/>Made for creators and founders finding their voice.</span><span>Signal · v2</span></footer></main></div>{post && <Editor key={post.id} ws={ws} original={post} update={update} close={() => setPost(null)}/>} {planning && <PlanEditor key={week} ws={ws} week={week} update={update} close={() => setPlanning(false)}/>}</div>;
}
function Overview({ ws, week, go, openPost, plan }: {
    ws: Workspace;
    week: string;
    go: (v: View) => void;
    openPost: (p: Post) => void;
    plan: () => void;
}) { const slots = ws.plans.find(p => p.week === week)?.slots || []; const scheduled = ws.posts.filter(p => inWeek(postSchedule(ws, p).date, week)); const published = ws.posts.filter(p => p.status === 'published' && inWeek(p.publishedDate, week)); return <><Heading eyebrow="YOUR WEEK, WITH INTENTION" title={ws.brand.name ? 'Make space for your perspective.' : 'Make yourself known.'} description="Plan what to share. Write it in your words. Keep everything in one place."><Button onClick={() => openPost(newPost())}><Plus size={16}/>Write a post</Button></Heading><div className="stats-grid four"><Stat label="PLANNED SLOTS" value={slots.length} detail={slots.filter(s => !ws.posts.some(p => p.slotId === s.id)).length + ' not written yet'}/><Stat label="DRAFTS THIS WEEK" value={scheduled.filter(p => p.status === 'draft').length} detail={ws.posts.filter(p => !p.slotId && !p.date && p.status !== 'published').length + ' unscheduled posts'}/><Stat label="FOR REVIEW / APPROVED" value={scheduled.filter(p => p.status === 'pending').length + ' / ' + scheduled.filter(p => p.status === 'approved').length}/><Stat label="PUBLISHED THIS WEEK" value={published.length} detail="Based on recorded publication dates"/></div><div className="overview-middle"><section className="brand-overview"><p className="eyebrow">THE THREAD THROUGH YOUR WORK</p><h2>{ws.brand.positioning || 'What do you want to be known for?'}</h2><p>{ws.brand.promise || 'Start with your goal, audience and the things you can speak about.'}</p><Button secondary onClick={() => go('brand')}>{ws.brand.accepted ? 'Edit my brand brief' : 'Create my brand brief'}</Button></section><section className="panel next-steps"><h2>Your next small step.</h2><button className="next-step" onClick={plan}><CalendarRange /><div><h3>{ws.plans.some(p => p.week === week) ? 'Review your weekly plan' : 'Create your weekly plan'}</h3><p>Categories, tags and time slots.</p></div></button><button className="next-step" onClick={() => go('library')}><BookOpen /><div><h3>Capture something worth keeping</h3><p>{ws.sources.length} saved experiences, ideas and references.</p></div></button></section></div><section className="panel week-peek"><div className="section-heading"><h2>Your week at a glance</h2><Button secondary onClick={() => go('calendar')}>Open calendar</Button></div><div className="week-peek-days">{Array.from({ length: 7 }, (_, i) => { const date = addDays(week, i); return <button key={date} onClick={() => go('calendar')}><span>{new Date(date + 'T12:00Z').toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' })}</span><strong>{date.slice(-2)}</strong><small>{slots.filter(s => s.date === date).length} slots</small></button>; })}</div></section></>; }
function Posts({ ws, openPost }: {
    ws: Workspace;
    openPost: (p: Post) => void;
}) { const [filter, setFilter] = useState('all'); const [query, setQuery] = useState(''); const list = ws.posts.filter(p => (filter === 'all' || filter === 'unscheduled' ? !p.slotId && !p.date && p.status !== 'published' : false) || false); const posts = ws.posts.filter(p => (filter === 'all' || filter === 'unscheduled' ? filter === 'all' || !p.slotId && !p.date && p.status !== 'published' : p.status === filter) && [p.title, p.caption, p.category, ...p.tags].join(' ').toLowerCase().includes(query.toLowerCase())); return <><Heading eyebrow="YOUR CONTENT" title="From a first thought to published." description="Only written posts and saved drafts appear here. Empty planned slots live in your calendar."><Button onClick={() => openPost(newPost())}><Plus size={16}/>Write a post</Button></Heading><div className="library-toolbar"><div className="filter-pills">{['all', 'draft', 'pending', 'approved', 'published', 'unscheduled'].map(s => <button className={filter === s ? 'active' : ''} key={s} onClick={() => setFilter(s)}>{s === 'all' ? 'All posts' : s === 'unscheduled' ? 'Unscheduled' : statusNames[s as Post['status']]}</button>)}</div><input type="search" aria-label="Search posts" placeholder="Find a post or tag…" value={query} onChange={e => setQuery(e.target.value)}/></div><div className="draft-grid">{posts.map(p => <article key={p.id} className="draft-card panel"><div className="section-heading"><span>{p.category || 'Uncategorized'}</span><Badge status={p.status}/></div><h2>{p.title || 'Untitled post'}</h2><p className="draft-excerpt preserve">{p.caption || 'An empty draft, ready for your words.'}</p><Chips tags={p.tags}/><div className="draft-card-footer"><small>{postSchedule(ws, p).date || 'Unscheduled'}</small><Button secondary onClick={() => openPost(p)}>Edit post</Button></div></article>)}</div>{!posts.length && <Empty title="No posts in this view">Write your first post or choose a different filter.</Empty>}</>; }
function Review({ ws, week, update, openPost }: {
    ws: Workspace;
    week: string;
    update: Update;
    openPost: (p: Post) => void;
}) { const [base, setBase] = useState(ws.reviews.find(r => r.week === week)); const [worked, setWorked] = useState(base?.worked || ''); const [change, setChange] = useState(base?.change || ''); const plan = ws.plans.find(p => p.week === week); const published = ws.posts.filter(p => p.status === 'published' && inWeek(p.publishedDate, week)); const unfilled = plan?.slots.filter(s => !ws.posts.some(p => p.slotId === s.id)).length || 0; const metrics = published.map(p => p.metrics.conversations).filter((v): v is number => v !== null); return <><Heading eyebrow="NOTICE. REFLECT. ADJUST." title="What did this week teach you?" description="Review recorded results and decide what you want to try next. Your next plan changes only when you edit it."/><div className="stats-grid four"><Stat label="SAVED PLAN" value={plan?.slots.length || 0} detail={unfilled + ' slots not written'}/><Stat label="PUBLISHED" value={published.length} detail={published.filter(p => !p.slotId).length + ' extra posts'}/><Stat label="CONVERSATIONS" value={metrics.length ? metrics.reduce((a, b) => a + b, 0) : 'Not recorded'} detail={metrics.length + ' of ' + published.length + ' posts have results'}/><Stat label="PLANNED POSTS PUBLISHED" value={plan?.slots.filter(s => published.some(p => p.slotId === s.id)).length || 0}/></div><div className="review-layout"><section className="panel"><h2>Your weekly reflection</h2><Field label="What worked, and what did you notice?"><textarea maxLength={10000} value={worked} onChange={e => setWorked(e.target.value)}/></Field><Field label="What would you change next week?"><textarea maxLength={10000} value={change} onChange={e => setChange(e.target.value)}/></Field><div className="button-row"><Button onClick={async () => { const next = { week, worked, change, updatedAt: now() }; if (await update(w => { unchanged(w.reviews.find(r => r.week === week), base); w.reviews = [...w.reviews.filter(r => r.week !== week), next]; }))
    setBase(next); }}>Save reflection</Button>{base && <Button secondary danger onClick={async () => { if (confirm('Delete this reflection? Posts and metrics will be kept.') && await update(w => { unchanged(w.reviews.find(r => r.week === week), base); w.reviews = w.reviews.filter(r => r.week !== week); })) {
    setBase(undefined);
    setWorked('');
    setChange('');
} }}>Delete reflection</Button>}</div></section><section className="panel"><h2>The posts behind the week</h2>{published.map(p => <button className="attention-row" key={p.id} onClick={() => openPost(p)}><div><h3>{p.title || 'Untitled post'}</h3><p>{p.metrics.impressions ?? 'Not recorded'} impressions · {p.metrics.comments ?? 'Not recorded'} comments</p></div></button>)}{!published.length && <Empty title="No published records this week">Record a LinkedIn URL and the actual publication date in your post editor.</Empty>}</section></div></>; }
function Settings({ ws, update, replaced }: {
    ws: Workspace;
    update: Update;
    replaced: (w: Workspace) => void;
}) { const [zone, setZone] = useState(ws.timezone); const [error, setError] = useState(''); return <><Heading eyebrow="YOUR WORKSPACE" title="Keep a copy of your work." description="This free portfolio demo saves to this browser. There is no account, cloud sync or automatic LinkedIn publishing."/><div className="settings-grid"><section className="panel"><h2>Backup & transfer</h2><p className="muted">Export before clearing browser data or changing devices. Import supports this version and the earlier Signal workspace JSON.</p><Button secondary onClick={() => downloadFile(new Blob([JSON.stringify(ws, null, 2)], { type: 'application/json' }), 'signal-backup-' + today(ws.timezone) + '.json')}><Download size={15}/>Export workspace</Button><Field label="Import a workspace backup" hint="This replaces this browser’s workspace after confirmation."><input type="file" accept=".json,application/json" onChange={async (e) => { const file = e.target.files?.[0]; if (!file)
    return; try {
    if (file.size > 10000000)
        throw new Error('Choose a backup smaller than 10 MB');
    const next = migrate(JSON.parse(await file.text()));
    if (!confirm('Replace this browser’s workspace with ' + next.posts.length + ' posts, ' + next.sources.length + ' bank items and ' + next.plans.length + ' plans? Export your current workspace first if you need it.'))
        return;
    if (!navigator.locks)
        throw new Error('Use a current browser with safe storage support');
    await navigator.locks.request(STORAGE_KEY, () => { const old = localStorage.getItem(STORAGE_KEY); if (old)
        localStorage.setItem(STORAGE_KEY + '-before-import', old); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); });
    replaced(next);
    setError('Backup imported successfully.');
}
catch (err) {
    setError((err as Error).message);
}
finally {
    e.target.value = '';
} }}/></Field>{error && <p role="status">{error}</p>}<Button secondary onClick={() => { const previous = localStorage.getItem(STORAGE_KEY + '-before-import'); if (previous)
    downloadFile(new Blob([previous], { type: 'application/json' }), 'signal-before-import.json');
else
    setError('No earlier import backup is stored on this device.'); }}>Download pre-import backup</Button></section><section className="panel"><h2>Planning timezone</h2><Field label="Timezone" hint="New plans use this timezone. Existing plans keep their saved timezone."><select value={zone} onChange={e => setZone(e.target.value)}>{['Asia/Kolkata', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Australia/Sydney'].map(t => <option key={t}>{t}</option>)}</select></Field><Button onClick={() => update(w => { w.timezone = zone; })}>Save timezone</Button></section><section className="note-card"><h3>Publishing stays in your hands</h3><p>Write or paste content, review it and export your caption or carousel PDF. Publish on LinkedIn and record its link here.</p><p>Saving material organizes your knowledge bank. It does not train a model or generate content.</p><a className="button secondary" href="https://www.linkedin.com/feed/" target="_blank" rel="noreferrer">Open LinkedIn</a></section><section className="panel"><h2>Clear this demo workspace</h2><p className="muted">This deletes the current local workspace. LinkedIn and other devices are unaffected.</p><Button secondary danger onClick={async () => { if (confirm('Delete all plans, drafts, saved material and reflections in this browser? Export a backup first.') && await update(w => { Object.assign(w, emptyWorkspace()); }))
    setError('Workspace cleared.'); }}>Delete local workspace</Button></section></div></>; }
