import { z } from 'zod';
export const DEFAULT_CATEGORIES = ['Experience', 'Practical knowledge', 'Point of view', 'Building in public', 'Conversation'];
const text = z.string().max(10000);
const id = z.string().min(1).max(100);
const label = z.string().trim().min(1).max(100);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, 'Use a valid date');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const tags = z.array(label).max(30);
const format = z.enum(['Text', 'Carousel']);
const metric = z.number().int().min(0).max(1e10).nullable();
const url = z.string().max(2000).refine(v => !v || /^https?:\/\//i.test(v) && (() => { try {
    new URL(v);
    return true;
}
catch {
    return false;
} })(), 'Use a full http or https link');
export const brandSchema = z.object({ name: text, role: z.enum(['Creator', 'Founder', 'Creator & founder']), path: z.enum(['known', 'discover']), goal: text, audience: text, niche: text, topics: text, voice: text, boundaries: text, positioning: text, promise: text, headline: text, about: text, featured: text, banner: text, skills: text, accepted: z.boolean() });
export const rhythmSchema = z.object({ target: z.number().int().min(1).max(35), dailyLimit: z.number().int().min(1).max(5), days: z.array(z.number().int().min(0).max(6)).min(1).max(7), times: z.array(time).min(1).max(5), mix: z.record(z.number().int().min(0).max(35)) });
export const slotSchema = z.object({ id, date: dateSchema, time, category: z.string().max(100), tags, format });
export const planSchema = z.object({ week: dateSchema, timezone: z.string().min(1), rhythm: rhythmSchema, slots: z.array(slotSchema).max(70), updatedAt: text });
export const sourceSchema = z.object({ id, title: z.string().trim().min(1).max(160), type: z.enum(['Experience', 'Idea', 'Reference', 'Writing sample']), content: z.string().trim().min(1).max(10000), category: z.string().max(100), tags, url, attribution: text, createdAt: text, updatedAt: text });
export const postSchema = z.object({ id, title: z.string().max(200), caption: z.string().max(3000), category: z.string().max(100), tags, format, slotId: z.string().max(100), date: z.union([dateSchema, z.literal('')]), time, sourceId: z.string().max(100), bankId: z.string().max(100), status: z.enum(['draft', 'pending', 'approved', 'published']), slides: z.array(z.object({ title: z.string().max(160), body: z.string().max(400) })).max(10), approvedAt: text, publishedUrl: url, publishedDate: z.union([dateSchema, z.literal('')]), createdAt: text, updatedAt: text, metrics: z.object({ impressions: metric, reactions: metric, comments: metric, conversations: metric }) });
export const workspaceSchema = z.object({ version: z.literal(2), revision: z.number().int().min(0), brand: brandSchema, timezone: z.string().min(1), categories: z.array(label).min(1).max(30), tags: z.array(label).max(200), rhythm: rhythmSchema, plans: z.array(planSchema).max(104), posts: z.array(postSchema).max(1500), sources: z.array(sourceSchema).max(500), reviews: z.array(z.object({ week: dateSchema, worked: text, change: text, updatedAt: text })).max(104) });
export type Workspace = z.infer<typeof workspaceSchema>;
export type Brand = Workspace['brand'];
export type Post = z.infer<typeof postSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Slot = z.infer<typeof slotSchema>;
export type Plan = z.infer<typeof planSchema>;
export type Rhythm = z.infer<typeof rhythmSchema>;
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export function blankBrand(): Brand { return { name: '', role: 'Creator', path: 'known', goal: 'Build an audience around my work', audience: '', niche: '', topics: '', voice: 'Warm & conversational', boundaries: '', positioning: '', promise: '', headline: '', about: '', featured: '', banner: '', skills: '', accepted: false }; }
export function emptyWorkspace(): Workspace { return { version: 2, revision: 0, brand: blankBrand(), timezone: 'Asia/Kolkata', categories: [...DEFAULT_CATEGORIES], tags: [], rhythm: { target: 20, dailyLimit: 4, days: [0, 1, 2, 3, 4], times: ['09:00', '12:00', '15:00', '18:00'], mix: Object.fromEntries(DEFAULT_CATEGORIES.map((c, i) => [c, [5, 5, 4, 3, 3][i]])) }, plans: [], posts: [], sources: [], reviews: [] }; }
export function today(timezone = 'Asia/Kolkata', instant = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant); }
export function addDays(key: string, n: number) { const d = new Date(key + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function weekStart(key = today()) { const day = new Date(key + 'T12:00:00Z').getUTCDay(); return addDays(key, -((day + 6) % 7)); }
export const inWeek = (date: string, week: string) => Boolean(date && date >= week && date <= addDays(week, 6));
export function allSlots(ws: Workspace) { return ws.plans.flatMap(p => p.slots); }
export function postSchedule(ws: Workspace, p: Post) { return allSlots(ws).find(s => s.id === p.slotId) || { date: p.date, time: p.time }; }
export function newPost(slot?: Slot): Post { return { id: uid(), title: '', caption: '', category: slot?.category || '', tags: slot?.tags || [], format: slot?.format || 'Text', slotId: slot?.id || '', date: '', time: '09:00', sourceId: '', bankId: '', status: 'draft', slides: [], approvedAt: '', publishedUrl: '', publishedDate: '', createdAt: now(), updatedAt: now(), metrics: { impressions: null, reactions: null, comments: null, conversations: null } }; }
export function newSource(): Source { return { id: uid(), title: '', type: 'Idea', content: '', category: '', tags: [], url: '', attribution: '', createdAt: now(), updatedAt: now() }; }
function unique(values: string[], message: string) { if (new Set(values).size !== values.length)
    throw new Error(message); }
export function validate(raw: unknown): Workspace {
    const w = workspaceSchema.parse(raw);
    new Intl.DateTimeFormat('en', { timeZone: w.timezone });
    unique(w.categories.map(c => c.toLowerCase()), 'Category names must be unique');
    unique(w.tags.map(c => c.toLowerCase()), 'Tags must be unique');
    unique(w.posts.map(p => p.id), 'Duplicate post');
    unique(w.sources.map(s => s.id), 'Duplicate saved material');
    unique(w.plans.map(p => p.week), 'A plan already exists for this week');
    unique(w.reviews.map(r => r.week), 'Duplicate weekly reflection');
    const slots = allSlots(w);
    unique(slots.map(s => s.id), 'Duplicate slot');
    unique(w.posts.filter(p => p.slotId).map(p => p.slotId), 'A slot already has a post');
    const checkLabel = (x: {
        category: string;
        tags: string[];
    }) => { if (x.category && !w.categories.includes(x.category))
        throw new Error('Choose an existing category'); if (x.tags.some(t => !w.tags.includes(t)))
        throw new Error('Choose existing tags'); unique(x.tags, 'Duplicate tags'); };
    for (const plan of w.plans) {
        if (weekStart(plan.week) !== plan.week)
            throw new Error('Plans must start on Monday');
        new Intl.DateTimeFormat('en', { timeZone: plan.timezone });
        unique(plan.slots.map(s => s.date + ' ' + s.time), 'Two planned slots use the same time');
        for (const slot of plan.slots) {
            if (!inWeek(slot.date, plan.week))
                throw new Error('Move this slot to a date within its week');
            checkLabel(slot);
        }
    }
    for (const s of w.sources)
        checkLabel(s);
    for (const p of w.posts) {
        checkLabel(p);
        if (p.slotId && !slots.some(s => s.id === p.slotId))
            throw new Error('This planned slot no longer exists');
        if (p.sourceId && !w.sources.some(s => s.id === p.sourceId))
            throw new Error('Source no longer exists');
        if (p.bankId && !w.sources.some(s => s.id === p.bankId))
            throw new Error('Linked bank item no longer exists');
        if (['approved', 'pending'].includes(p.status) && !p.caption.trim())
            throw new Error('Write content before reviewing or approving it');
        if (p.status === 'approved' && (!p.approvedAt || p.format === 'Carousel' && (!p.slides.length || p.slides.some(s => !s.title.trim() || !s.body.trim()))))
            throw new Error('Complete the content and approve it first');
        if (p.status === 'published') {
            let u: URL;
            try {
                u = new URL(p.publishedUrl);
            }
            catch {
                throw new Error('Add your published LinkedIn link');
            }
            if (u.protocol !== 'https:' || !(u.hostname === 'linkedin.com' || u.hostname.endsWith('.linkedin.com')) || !p.publishedDate)
                throw new Error('Add a valid HTTPS LinkedIn link and publication date');
        }
    }
    return w;
}
export function proposePlan(ws: Workspace, week: string, rhythm: Rhythm): Plan {
    const r = rhythmSchema.parse(rhythm);
    unique(r.times, 'Use different posting times');
    unique(r.days.map(String), 'Use different posting days');
    if (Object.values(r.mix).reduce((a, b) => a + b, 0) !== r.target)
        throw new Error('Category counts must add up to your weekly target');
    if (Object.keys(r.mix).some(c => !ws.categories.includes(c)))
        throw new Error('Choose existing categories');
    const limit = Math.min(r.dailyLimit, r.times.length);
    if (r.target > r.days.length * limit)
        throw new Error('Add posting days or time windows to fit this target');
    const prior = ws.plans.find(p => p.week === week);
    const old = prior?.slots || [];
    // Preserve existing authored work. Empty slots are candidates for a reviewed revision.
    const linked = old.filter(s => ws.posts.some(p => p.slotId === s.id));
    if (linked.length > r.target)
        throw new Error('Your target is lower than the number of slots with written posts. Detach or move those posts first');
    if (linked.some(s => !r.days.includes((new Date(s.date + 'T12:00Z').getUTCDay() + 6) % 7) || !r.times.slice(0, limit).includes(s.time)))
        throw new Error('These settings would move a written post. Move or detach it before changing the rhythm');
    const counts = Object.fromEntries(ws.categories.map(c => [c, linked.filter(s => s.category === c).length]));
    if (ws.categories.some(c => counts[c] > (r.mix[c] || 0)))
        throw new Error('This category already has more written posts than the requested count');
    const slots = [...linked];
    let turn = 0;
    for (const time of r.times.slice(0, limit)) {
        for (const day of [...r.days].sort((a, b) => a - b)) {
            if (slots.length >= r.target)
                break;
            const date = addDays(week, day);
            if (slots.some(s => s.date === date && s.time === time))
                continue;
            const available = ws.categories.filter(c => counts[c] < (r.mix[c] || 0));
            const category = available[turn++ % available.length];
            counts[category]++;
            const reused = old.find(s => s.date === date && s.time === time);
            slots.push({ id: reused?.id || uid(), date, time, category, tags: reused?.tags || [], format: reused?.format || 'Text' });
        }
    }
    return { week, timezone: prior?.timezone || ws.timezone, rhythm: r, slots: slots.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), updatedAt: now() };
}
export function savePlan(ws: Workspace, plan: Plan) {
    const previous = ws.plans.find(p => p.week === plan.week);
    const removed = previous?.slots.filter(s => !plan.slots.some(n => n.id === s.id)).map(s => s.id) || [];
    ws.posts = ws.posts.map(p => removed.includes(p.slotId) ? { ...p, slotId: '', date: '', updatedAt: now() } : p);
    ws.posts = ws.posts.map(p => { const slot = plan.slots.find(s => s.id === p.slotId); if (!slot)
        return p; const before = previous?.slots.find(s => s.id === slot.id); return { ...p, category: slot.category, tags: [...slot.tags], format: slot.format, updatedAt: JSON.stringify(before) !== JSON.stringify(slot) ? now() : p.updatedAt, ...(p.status === 'approved' && p.format !== slot.format ? { status: 'draft' as const, approvedAt: '' } : {}) }; });
    ws.plans = [...ws.plans.filter(p => p.week !== plan.week), plan];
    ws.rhythm = plan.rhythm;
}
export function removePlan(ws: Workspace, week: string) { const ids = ws.plans.find(p => p.week === week)?.slots.map(s => s.id) || []; ws.posts = ws.posts.map(p => ids.includes(p.slotId) ? { ...p, slotId: '', date: '', updatedAt: now() } : p); ws.plans = ws.plans.filter(p => p.week !== week); }
export function removeSource(ws: Workspace, id: string) { ws.sources = ws.sources.filter(s => s.id !== id); ws.posts = ws.posts.map(p => ({ ...p, sourceId: p.sourceId === id ? '' : p.sourceId, bankId: p.bankId === id ? '' : p.bankId })); }
export function savePost(ws: Workspace, post: Post, explicitApproval = false) { const old = ws.posts.find(p => p.id === post.id); const p = structuredClone(post); const content = (x: Post) => JSON.stringify([x.caption, x.slides, x.format, x.title]); if (old?.status === 'approved' && content(old) !== content(p) && !explicitApproval) {
    p.status = 'draft';
    p.approvedAt = '';
} if (p.slotId) {
    p.date = '';
    const slot = allSlots(ws).find(s => s.id === p.slotId);
    if (!slot)
        throw new Error('Slot no longer exists');
    slot.category = p.category;
    slot.tags = [...p.tags];
    slot.format = p.format;
} p.updatedAt = now(); ws.posts = ws.posts.some(x => x.id === p.id) ? ws.posts.map(x => x.id === p.id ? p : x) : [...ws.posts, p]; }
export function bankFromPost(ws: Workspace, p: Post, type: Source['type']) { if (!p.caption.trim())
    throw new Error('Write your content before saving it to the bank'); const old = ws.sources.find(s => s.id === p.bankId); const s: Source = { id: old?.id || uid(), title: p.title.trim() || 'Untitled post', type, content: p.caption, category: p.category, tags: [...p.tags], url: old?.url || '', attribution: old?.attribution || '', createdAt: old?.createdAt || now(), updatedAt: now() }; ws.sources = old ? ws.sources.map(x => x.id === s.id ? s : x) : [...ws.sources, s]; p.bankId = s.id; return s; }
export function changeLabel(ws: Workspace, kind: 'category' | 'tag', old: string, next: string) { next = next.trim(); const list = kind === 'category' ? ws.categories : ws.tags; if (next && list.some(x => x !== old && x.toLowerCase() === next.toLowerCase()))
    throw new Error('That label already exists'); const replace = (x: {
    category: string;
    tags: string[];
}) => { if (kind === 'category' && x.category === old)
    x.category = next; if (kind === 'tag')
    x.tags = [...new Set(x.tags.flatMap(t => t === old ? (next ? [next] : []) : [t]))]; }; if (kind === 'category') {
    if (!next && list.length === 1)
        throw new Error('Keep at least one category');
    ws.categories = list.flatMap(x => x === old ? (next ? [next] : []) : [x]);
    const rhythms = [ws.rhythm, ...ws.plans.map(p => p.rhythm)];
    for (const r of rhythms) {
        const count = r.mix[old] || 0;
        delete r.mix[old];
        if (next)
            r.mix[next] = count;
    }
}
else
    ws.tags = list.flatMap(x => x === old ? (next ? [next] : []) : [x]); ws.posts.forEach(replace); ws.sources.forEach(replace); allSlots(ws).forEach(replace); }
export function migrate(raw: any): Workspace {
    if (raw?.version === 2)
        return validate(raw);
    if (!raw?.brand || !Array.isArray(raw.posts) || !Array.isArray(raw.sources))
        throw new Error('This is not a Signal workspace backup');
    const w = emptyWorkspace();
    w.brand = { ...blankBrand(), ...Object.fromEntries(Object.keys(blankBrand()).filter(k => k in raw.brand).map(k => [k, raw.brand[k]])) };
    w.timezone = raw.settings?.timezone || w.timezone;
    w.sources = raw.sources.map((s: any) => ({ ...newSource(), ...s, category: '', tags: [], attribution: '', updatedAt: s.createdAt || now() }));
    for (const old of raw.posts) {
        let slot: Slot | undefined;
        if (old.date && old.status !== 'skipped') {
            const week = weekStart(old.date);
            let plan = w.plans.find(p => p.week === week);
            if (!plan) {
                plan = { week, timezone: w.timezone, rhythm: structuredClone(w.rhythm), slots: [], updatedAt: now() };
                w.plans.push(plan);
            }
            slot = { id: uid(), date: old.date, time: old.time, category: old.pillar || '', tags: [], format: old.format || 'Text' };
            if (!plan.slots.some(s => s.date === slot!.date && s.time === slot!.time))
                plan.slots.push(slot);
            else
                slot = undefined;
        }
        if (!old.caption?.trim() && !old.slides?.length && old.status !== 'published')
            continue;
        const p: Post = { ...newPost(slot), ...Object.fromEntries(['id', 'title', 'caption', 'format', 'slides', 'approvedAt', 'publishedUrl', 'createdAt'].filter(k => old[k] !== undefined).map(k => [k, old[k]])), category: old.pillar || '', status: ['pending', 'approved', 'published'].includes(old.status) ? old.status : 'draft', sourceId: w.sources.some(s => s.id === old.sourceId) ? old.sourceId : '', publishedDate: old.status === 'published' ? (old.publishedAt?.slice(0, 10) || old.date) : '', metrics: old.metrics || newPost().metrics };
        w.posts.push(p);
    }
    w.reviews = (raw.reviews || []).map((r: any) => ({ ...r, updatedAt: now() }));
    return validate(w);
}
