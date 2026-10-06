'use strict';

/* =========================================================
   Habit Tracker — app personale, dati salvati sul dispositivo
   ========================================================= */

const STORE_KEY = 'habit-tracker-v1';
const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const MONTHS_LONG = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const DOW2 = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'];
const DOW3 = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
const DOW_LONG = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
const ACCENT = '#a970e6';
const CARD = '#18181b';

const COLORS = [
  '#5ecfeb', '#6ca0f4', '#8b80f9', '#a970e6', '#da70d6', '#ea7887', '#e8796f', '#ef5b5b',
  '#ef9a4c', '#f2ce48', '#a3d65c', '#6dd5a0', '#66d5c4', '#9ba6bd', '#a3a6ae', '#c79a6b',
];
const HABIT_ICONS = [
  'run', 'walk', 'bike', 'swimming', 'barbell', 'stretching', 'yoga', 'activity-heartbeat',
  'heart', 'brain', 'eye', 'book', 'book-2', 'notebook', 'friends', 'moon', 'sun', 'bed',
  'coffee', 'apple', 'leaf', 'droplet', 'glass-full', 'pill', 'smoking-no', 'device-mobile-off',
  'language', 'code', 'briefcase', 'school', 'music', 'palette', 'camera', 'pencil',
];
const QUICK_EMOJI = ['🤸', '🏋️', '🥦', '🥊', '👁️', '🧘', '💧', '📚', '🛏️', '🍎', '🚭', '✍️', '🧠', '🎸', '☀️', '💊'];

/* ---------- Date ---------- */
const pad = n => String(n).padStart(2, '0');
const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const dow = d => (d.getDay() + 6) % 7; // lunedì = 0
const startOfWeek = d => addDays(d, -dow(d));
const sameDay = (a, b) => a.getTime() === b.getTime();

/* ---------- Colori ---------- */
function rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return '#' + A.map((v, i) => Math.round(v * t + B[i] * (1 - t)).toString(16).padStart(2, '0')).join('');
}
function cvars(c) {
  return `--c:${c};--c-off:${mix(c, CARD, .13)};--c-soft:${mix(c, CARD, .2)};--c-bg:${mix(c, '#141416', .07)};` +
    `--c-line:${mix(c, CARD, .22)};--l1:${mix(c, CARD, .35)};--l2:${mix(c, CARD, .55)};--l3:${mix(c, CARD, .78)};--l4:${c}`;
}

/* ---------- Utility ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;
function habitGlyph(h) {
  const v = h.icon || 'e:✅';
  return v.startsWith('i:') ? icon(v.slice(2)) : esc(v.slice(2));
}

/* ---------- Stato ---------- */
function defaultState() {
  const t = key(today());
  const seed = [
    ['Stretching', 'e:🤸', '#5ecfeb'],
    ['Digital detox', 'e:👁️', '#a3a6ae'],
    ['Cibo sano', 'e:🥦', '#6dd5a0'],
    ['Step up', 'e:🥊', '#e8796f'],
    ['Sveglia puntuale', 'i:activity-heartbeat', '#ef9a4c'],
    ['Pump', 'e:🏋️', '#e8796f'],
    ['Amici', 'i:friends', '#66d5c4'],
    ['Lettura', 'i:book', '#ea7887'],
    ['Camminata', 'i:walk', '#9ba6bd'],
    ['Corsa', 'i:run', '#f2ce48'],
    ['Vision', 'i:eye', '#6ca0f4'],
  ];
  return {
    version: 1,
    habits: seed.map(([name, ic, color]) => ({
      id: uid(), name, desc: '', icon: ic, color, goal: { type: 'none', count: 1 }, createdAt: t, archived: false,
    })),
    done: {},
    notes: {},
    settings: { view: 'week', days: 5 },
  };
}
/* ---------- Import da HabitKit ---------- */
const HK_COLORS = {
  blue: '#6ca0f4', yellow: '#f2ce48', slate: '#9ba6bd', rose: '#ea7887', pink: '#ea7887', teal: '#66d5c4',
  red: '#e8796f', orange: '#ef9a4c', emerald: '#6dd5a0', green: '#6dd5a0', gray: '#a3a6ae', grey: '#a3a6ae',
  cyan: '#5ecfeb', purple: '#a970e6', violet: '#a970e6', indigo: '#8b80f9', fuchsia: '#da70d6', lime: '#a3d65c',
  amber: '#ef9a4c', brown: '#c79a6b', sky: '#5ecfeb',
};
const HK_ICONS = {
  eye: 'eye', running: 'run', walking: 'walk', bookOpen: 'book', book: 'book', socialize: 'friends', activity: 'activity-heartbeat',
  bike: 'bike', swimming: 'swimming', dumbbell: 'barbell', heart: 'heart', brain: 'brain', moon: 'moon', sun: 'sun', bed: 'bed',
  coffee: 'coffee', apple: 'apple', leaf: 'leaf', droplet: 'droplet', water: 'glass-full', pill: 'pill', code: 'code',
  briefcase: 'briefcase', music: 'music', palette: 'palette', camera: 'camera', pencil: 'pencil', yoga: 'yoga',
};
// Riconosce un'esportazione di HabitKit (anche se già salvata per errore senza conversione)
function isHabitKit(d) {
  if (!d || !Array.isArray(d.habits)) return false;
  if (Array.isArray(d.completions) || Array.isArray(d.intervals)) return true;
  return d.habits.some(h => h && typeof h === 'object' &&
    ('orderIndex' in h || 'isInverse' in h || (typeof h.icon === 'string' && !/^[ei]:/.test(h.icon))));
}
// Data locale di una registrazione HabitKit (data UTC + fuso orario di quando è stata salvata)
function hkLocalKey(iso, offsetMin) {
  const t = new Date(new Date(iso).getTime() + (offsetMin || 0) * 60000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
function fromHabitKit(d, settings) {
  // HabitKit mostra per prime le abitudini create per ultime
  const src = d.habits.map((h, i) => ({ h, i }))
    .sort((a, b) => (a.h.orderIndex - b.h.orderIndex) || (b.i - a.i)).map(x => x.h);
  const goals = {};
  for (const iv of d.intervals || []) {
    if (iv.endDate) continue;
    const type = { day: 'day', daily: 'day', week: 'week', weekly: 'week', month: 'month', monthly: 'month' }[iv.type];
    if (type) goals[iv.habitId] = { type, count: type === 'day' ? 1 : Math.max(1, iv.requiredNumberOfCompletions || 1) };
  }
  const habits = src.map(h => ({
    id: h.id,
    name: h.name || 'Abitudine',
    desc: h.description || h.desc || '',
    icon: typeof h.icon === 'string' && /^[ei]:/.test(h.icon) ? h.icon : h.emoji ? 'e:' + (/\uFE0F/.test(h.emoji) ? h.emoji : h.emoji + '\uFE0F') : HK_ICONS[h.icon] ? 'i:' + HK_ICONS[h.icon] : 'e:✅',
    color: /^#[0-9a-f]{6}$/i.test(h.color) ? h.color : HK_COLORS[h.color] || COLORS[0],
    goal: goals[h.id] || { type: 'none', count: 1 },
    createdAt: /^\d{4}-\d{2}-\d{2}$/.test(h.createdAt) ? h.createdAt : h.createdAt ? hkLocalKey(h.createdAt, 0) : key(today()),
    archived: !!h.archived,
  }));
  const ids = new Set(habits.map(h => h.id));
  // Se l'esportazione era già stata salvata per errore, si tengono anche i giorni segnati dopo
  const done = d.done && typeof d.done === 'object' ? JSON.parse(JSON.stringify(d.done)) : {};
  const notes = d.notes && typeof d.notes === 'object' ? JSON.parse(JSON.stringify(d.notes)) : {};
  for (const c of d.completions || []) {
    if (!c || !ids.has(c.habitId) || !c.date) continue;
    const k = hkLocalKey(c.date, c.timezoneOffsetInMinutes);
    if (c.amountOfCompletions > 0) (done[c.habitId] || (done[c.habitId] = {}))[k] = 1;
    if (c.note) (notes[c.habitId] || (notes[c.habitId] = {}))[k] = c.note;
  }
  return normalize({ version: 1, habits, done, notes, settings: { ...(settings || {}), ...(d.settings || {}) } });
}

function normalize(s) {
  s.habits = (s.habits || []).map(h => ({ goal: { type: 'none', count: 1 }, desc: '', archived: false, createdAt: key(today()), ...h }));
  s.done = s.done || {};
  s.notes = s.notes || {};
  s.settings = { view: 'week', days: 5, ...(s.settings || {}) };
  return s;
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (isHabitKit(s)) return fromHabitKit(s); // ripara un'importazione non convertita
      if (s && Array.isArray(s.habits)) return normalize(s);
    }
  } catch (e) { /* stato corrotto: si riparte */ }
  return defaultState();
}
let S = load();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
  catch (e) { toast('Errore nel salvataggio'); }
}
save();

const active = () => S.habits.filter(h => !h.archived);
const habit = id => S.habits.find(h => h.id === id);
const isDone = (h, k) => !!(S.done[h.id] && S.done[h.id][k]);
function toggle(h, k) {
  const m = S.done[h.id] || (S.done[h.id] = {});
  if (m[k]) delete m[k]; else m[k] = 1;
  save();
}

/* ---------- Statistiche e serie ---------- */
function doneKeys(h) { return Object.keys(S.done[h.id] || {}).sort(); }
function habitStart(h) {
  const ks = doneKeys(h);
  const c = parseKey(h.createdAt);
  return ks.length && parseKey(ks[0]) < c ? parseKey(ks[0]) : c;
}
// Periodo (giorno / settimana / mese) che contiene la data d
function periodOf(type, d) {
  if (type === 'day') return { start: d, end: d };
  if (type === 'week') { const s = startOfWeek(d); return { start: s, end: addDays(s, 6) }; }
  return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) };
}
function nextPeriodStart(type, p) {
  return type === 'month' ? new Date(p.start.getFullYear(), p.start.getMonth() + 1, 1) : addDays(p.end, 1);
}
function countIn(h, a, b) {
  let n = 0;
  for (let d = a; d <= b; d = addDays(d, 1)) if (isDone(h, key(d))) n++;
  return n;
}
function goalNeed(h) { return h.goal.type === 'day' ? 1 : Math.max(1, h.goal.count | 0); }
// Elenco dei periodi tra from e to con esito (raggiunto o no)
function periods(h, from, to) {
  const type = h.goal.type, need = goalNeed(h), out = [];
  const t = today();
  for (let p = periodOf(type, from); p.start <= to; p = periodOf(type, nextPeriodStart(type, p))) {
    const met = countIn(h, p.start, p.end) >= need;
    const current = p.start <= t && t <= p.end;
    out.push({ met, current });
  }
  return out;
}
function streaks(h) {
  if (!h.goal || h.goal.type === 'none') return null;
  const ps = periods(h, habitStart(h), today());
  // Il periodo in corso conta solo se già raggiunto
  if (ps.length && ps[ps.length - 1].current && !ps[ps.length - 1].met) ps.pop();
  let best = 0, run = 0;
  for (const p of ps) { run = p.met ? run + 1 : 0; best = Math.max(best, run); }
  return { current: run, best };
}
function rate(h, year) {
  if (!h.goal || h.goal.type === 'none') return null;
  const t = today();
  const from = new Date(Math.max(habitStart(h), new Date(year, 0, 1)));
  const to = new Date(Math.min(t, new Date(year, 11, 31)));
  if (from > to) return null;
  const ps = periods(h, from, to);
  if (ps.length && ps[ps.length - 1].current && !ps[ps.length - 1].met) ps.pop();
  if (!ps.length) return null;
  return ps.filter(p => p.met).length / ps.length;
}
function goalLabel(h) {
  const g = h.goal || { type: 'none' };
  if (g.type === 'none') return 'Nessun obiettivo di serie';
  if (g.type === 'day') return 'Ogni giorno';
  return `${goalNeed(h)} / ${g.type === 'week' ? 'settimana' : 'mese'}`;
}

/* ---------- Stato UI ---------- */
const UI = {
  route: 'home', hid: null,
  calMonth: null,
  sheet: null,      // { type: 'stats' | 'edit' | 'settings' | 'menu' | 'note', ... }
  sheetFresh: false,
  pop: null,
};

/* ---------- Heatmap ---------- */
function heatmap({ from, to, cell, gap, radius = 3, months = true, days = false, valueFn, hideBefore, hideAfter }) {
  const t = today();
  const s = startOfWeek(from), e = addDays(startOfWeek(to), 6);
  let cells = '', labels = '', col = 0;
  for (let w = s; w <= e; w = addDays(w, 7), col++) {
    for (let i = 0; i < 7; i++) {
      const d = addDays(w, i);
      if ((hideBefore && d < hideBefore) || (hideAfter && d > hideAfter)) { cells += '<i class="x"></i>'; continue; }
      const cls = d > t ? 'fut' : valueFn(d);
      cells += `<i class="${cls}"></i>`;
      if (months && d.getDate() === 1) labels += `<span style="left:${col * (cell + gap)}px">${MONTHS[d.getMonth()]}</span>`;
    }
  }
  const style = `--hc:${cell}px;--hg:${gap}px;--hr:${radius}px`;
  const dayCol = days ? `<div class="hm-days" style="${style}">${['', 'Mar', '', 'Gio', '', 'Sab', ''].map(x => `<span>${x}</span>`).join('')}</div>` : '';
  return `${dayCol}<div class="hm-wrap" data-scroll-end><div class="hm ${months ? '' : 'nolabels'}" style="${style}">` +
    (months ? `<div class="hm-months">${labels}</div>` : '') +
    `<div class="hm-grid">${cells}</div></div></div>`;
}

/* ---------- Home ---------- */
function renderHome() {
  const view = S.settings.view;
  const list = active();
  let body;
  if (!list.length) {
    body = `<div class="card empty"><b>Nessuna abitudine</b>Tocca + per crearne una.</div>`;
  } else if (view === 'grid') body = homeGrid(list);
  else if (view === 'list') body = homeList(list);
  else body = homeWeek(list);

  return `
  <div class="topbar">
    <button class="round lg" data-a="settings" aria-label="Impostazioni">${icon('settings')}</button>
    <div class="right">
      <button class="round lg" data-a="stats" aria-label="Statistiche">${icon('chart-histogram')}</button>
      <button class="round lg accent" data-a="new" aria-label="Nuova abitudine">${icon('plus')}</button>
    </div>
  </div>
  ${view === 'week' ? rangeRow() : ''}
  ${body}
  <nav class="tabbar">
    <button data-a="view" data-v="grid" class="${view === 'grid' ? 'sel' : ''}" aria-label="Schede">${gridIcon()}</button>
    <button data-a="view" data-v="week" class="${view === 'week' ? 'sel' : ''}" aria-label="Settimana">${icon('list-check')}</button>
    <button data-a="view" data-v="list" class="${view === 'list' ? 'sel' : ''}" aria-label="Lista">${icon('list')}</button>
  </nav>`;
}
function gridIcon() {
  let r = '';
  for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++) r += `<rect x="${3 + x * 6.5}" y="${6 + y * 7}" width="4.5" height="4" rx="1"/>`;
  return `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${r}</svg>`;
}
function rangeRow() {
  const n = S.settings.days, t = today(), a = addDays(t, -(n - 1));
  const f = d => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return `<div class="range-row">
    <button class="pill" data-a="days">Ultimi ${n} giorni</button>
    <div class="range">${f(a)} — ${f(t)}</div>
  </div>`;
}
function homeWeek(list) {
  const n = S.settings.days, t = today();
  const days = Array.from({ length: n }, (_, i) => addDays(t, i - n + 1));
  const cell = n >= 7 ? 26 : n === 5 ? 31 : 36;
  const head = days.map(d => `<div class="d ${sameDay(d, t) ? 'today' : ''}">${DOW2[dow(d)]}<b>${d.getDate()}</b></div>`).join('');
  const rows = list.map(h => `
    <div class="week-row" style="${cvars(h.color)}">
      <button class="hname" data-a="open" data-h="${h.id}"><div class="hicon">${habitGlyph(h)}</div><span>${esc(h.name)}</span></button>
      ${days.map(d => { const k = key(d); return `<button class="cell ${isDone(h, k) ? 'on' : ''}" data-a="toggle" data-h="${h.id}" data-k="${k}" aria-label="${esc(h.name)} ${k}"></button>`; }).join('')}
    </div>`).join('');
  return `<div class="card week" style="--n:${n};--cell:${cell}px">
    <div class="week-head"><div class="count">${list.length} abitudin${list.length === 1 ? 'e' : 'i'}</div>${head}</div>
    ${rows}
  </div>`;
}
function homeGrid(list) {
  const t = today(), k = key(t);
  const inner = Math.min(window.innerWidth, 520) - 24 - 30;
  const cell = 11, gap = 3;
  const weeks = Math.max(8, Math.floor((inner + gap) / (cell + gap)));
  const from = addDays(startOfWeek(t), -7 * (weeks - 1));
  return `<div class="cards">${list.map(h => `
    <div class="card hcard" style="${cvars(h.color)}">
      <div class="hcard-top">
        <button class="hicon lg" data-a="open" data-h="${h.id}">${habitGlyph(h)}</button>
        <button class="t" data-a="open" data-h="${h.id}"><b>${esc(h.name)}</b><small>${esc(h.desc || goalLabel(h))}</small></button>
        <button class="check ${isDone(h, k) ? 'on' : ''}" data-a="toggle" data-h="${h.id}" data-k="${k}" aria-label="Fatto oggi">${icon('check')}</button>
      </div>
      ${heatmap({ from, to: t, cell, gap, months: false, valueFn: d => isDone(h, key(d)) ? 'on' : '' })}
    </div>`).join('')}</div>`;
}
function homeList(list) {
  const k = key(today());
  return `<div class="card list">${list.map(h => {
    const st = streaks(h);
    const sub = st ? `${icon('flame')}${st.current} · ${goalLabel(h)}` : `${countIn(h, addDays(today(), -6), today())}/7 negli ultimi 7 giorni`;
    return `<div class="lrow" style="${cvars(h.color)}">
      <button class="hicon" data-a="open" data-h="${h.id}">${habitGlyph(h)}</button>
      <button class="t" data-a="open" data-h="${h.id}"><b>${esc(h.name)}</b><small>${sub}</small></button>
      <button class="check ${isDone(h, k) ? 'on' : ''}" data-a="toggle" data-h="${h.id}" data-k="${k}" aria-label="Fatto oggi">${icon('check')}</button>
    </div>`;
  }).join('')}</div>`;
}

/* ---------- Dettaglio abitudine ---------- */
function renderHabit() {
  const h = habit(UI.hid);
  if (!h) { UI.route = 'home'; return renderHome(); }
  const t = today();
  if (!UI.calMonth) UI.calMonth = new Date(t.getFullYear(), t.getMonth(), 1);
  const st = streaks(h);
  const notes = Object.entries(S.notes[h.id] || {}).sort((a, b) => b[0].localeCompare(a[0]));

  return `<div style="${cvars(h.color)}">
  <div class="topbar">
    <button class="round" data-a="back" aria-label="Indietro">${icon('chevron-left')}</button>
    <div class="right">
      <button class="round" data-a="edit" aria-label="Modifica">${icon('edit')}</button>
      <button class="round" data-a="menu" aria-label="Opzioni">${icon('settings')}</button>
    </div>
  </div>
  <div class="detail-head">
    <div class="hicon xl">${habitGlyph(h)}</div>
    <div><h1>${esc(h.name)}</h1><p>${esc(h.desc || 'Nessuna descrizione')}</p></div>
  </div>
  <div class="hm-card">
    ${heatmap({ from: addDays(t, -7 * 52), to: t, cell: 10, gap: 2.5, days: true, valueFn: d => isDone(h, key(d)) ? 'on' : '' })}
  </div>
  <div class="chips">
    <span class="chip">${icon('flame')}${st ? st.current : 0}</span>
    <button class="chip" data-a="edit">${icon('target')}${goalLabel(h)}</button>
  </div>
  ${calendar(h)}
  <div class="card notes">
    ${notes.length ? `
      <div class="notes-head"><b>Note</b><button class="plus" data-a="note" data-k="${key(t)}" aria-label="Aggiungi nota">${icon('plus')}</button></div>
      ${notes.map(([k, txt]) => { const d = parseKey(k); return `<button class="note-item" data-a="note" data-k="${k}"><div class="d">${DOW3[dow(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</div><p>${esc(txt)}</p></button>`; }).join('')}
    ` : `
      <div class="notes-empty">
        <div class="sq">${icon('edit')}</div>
        <div class="t"><b>Ancora nessuna nota</b><small>Cosa è andato bene? Cosa ti ha ostacolato?</small></div>
        <button class="plus" data-a="note" data-k="${key(t)}" aria-label="Aggiungi nota">${icon('plus')}</button>
      </div>`}
  </div>
  </div>`;
}
function calendar(h) {
  const t = today(), m = UI.calMonth;
  const start = startOfWeek(m);
  const notes = S.notes[h.id] || {};
  let cells = DOW3.map(d => `<div class="wd">${d}</div>`).join('');
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i), k = key(d);
    const fut = d > t;
    const cls = ['day', fut ? 'fut' : '', !fut && isDone(h, k) ? 'done' : '', sameDay(d, t) ? 'today' : '', notes[k] ? 'note' : ''].join(' ');
    cells += fut ? `<div class="${cls}">${d.getDate()}</div>` : `<button class="${cls}" data-day="${k}">${d.getDate()}</button>`;
  }
  return `<div class="card cal">
    <div class="cal-grid">${cells}</div>
    <div class="cal-foot">
      <button class="pill" data-a="cal-today">${icon('calendar')}${MONTHS[m.getMonth()].toLowerCase()} ${m.getFullYear()}</button>
      <div class="nav">
        <button class="round" data-a="cal" data-d="-1" aria-label="Mese precedente">${icon('chevron-left')}</button>
        <button class="round" data-a="cal" data-d="1" aria-label="Mese successivo">${icon('chevron-right')}</button>
      </div>
    </div>
    <div class="hint">Tieni premuto un giorno per aggiungere una nota</div>
  </div>`;
}

/* ---------- Sheet: statistiche ---------- */
function statsSheet() {
  const sh = UI.sheet, t = today();
  const list = active();
  const h = sh.sel ? habit(sh.sel) : null;
  const color = h ? h.color : ACCENT;
  const habits = h ? [h] : list;
  const Y = sh.year;
  const from = new Date(Y, 0, 1), to = new Date(Y, 11, 31);

  // Heatmap
  const valueFn = d => {
    const k = key(d);
    if (h) return isDone(h, k) ? 'on' : '';
    const n = list.filter(x => isDone(x, k)).length;
    if (!n || !list.length) return '';
    const f = n / list.length;
    return f <= .25 ? 'l1' : f <= .5 ? 'l2' : f <= .75 ? 'l3' : 'l4';
  };
  // Conteggi
  const yk = String(Y);
  let total = 0;
  const perMonth = Array(12).fill(0);
  for (const x of habits) for (const k of doneKeys(x)) if (k.startsWith(yk)) { total++; perMonth[+k.slice(5, 7) - 1]++; }
  // Obiettivi
  const withGoal = habits.filter(x => x.goal && x.goal.type !== 'none');
  const rates = withGoal.map(x => rate(x, Y)).filter(r => r !== null);
  const rateTxt = rates.length ? Math.round(100 * rates.reduce((a, b) => a + b, 0) / rates.length) + '%' : '—';
  const sts = withGoal.map(streaks);
  const cur = sts.length ? Math.max(...sts.map(s => s.current)) : 0;
  const best = sts.length ? Math.max(...sts.map(s => s.best)) : 0;

  const chips = list.map(x => `<button class="schip ${sh.sel === x.id ? 'sel' : ''}" style="${cvars(x.color)}" data-a="stats-sel" data-h="${x.id}" aria-label="${esc(x.name)}">${habitGlyph(x)}</button>`).join('');

  const rank = !h && list.length ? (() => {
    const rows = list.map(x => ({ x, n: doneKeys(x).filter(k => k.startsWith(yk)).length })).sort((a, b) => b.n - a.n);
    const max = Math.max(1, ...rows.map(r => r.n));
    return `<div class="card rank"><h3>Per abitudine</h3>${rows.map(({ x, n }) => `
      <div class="r" style="${cvars(x.color)}"><div class="hicon">${habitGlyph(x)}</div><div class="bar"><i style="width:${(100 * n / max).toFixed(1)}%"></i></div><div class="n">${n}</div></div>`).join('')}</div>`;
  })() : '';

  return `
  <div class="stats-chips">
    <div class="scroll">${chips}</div>
    <button class="btn accent fatto" data-a="close">Fatto</button>
  </div>
  <div class="sheet-body" style="${cvars(color)}">
    ${h ? `<div class="card sel-card"><div class="hicon lg neutral">${habitGlyph(h)}</div><b>${esc(h.name)}</b></div>` : ''}
    <div class="card year-nav">
      <button data-a="year" data-d="-1" aria-label="Anno precedente">${icon('chevron-left')}</button>
      <b>${Y}</b>
      <button data-a="year" data-d="1" aria-label="Anno successivo">${icon('chevron-right')}</button>
    </div>
    <div class="card sbox">${heatmap({ from, to, cell: 11, gap: 3, valueFn, hideBefore: from, hideAfter: to })}</div>
    <div class="grid2">
      <div class="card stat"><div class="ico">${icon('hash')}</div><div class="v">${total}</div><div class="k">Completamenti</div></div>
      <div class="card stat"><div class="ico">${icon('percentage')}</div><div class="v">${rateTxt}</div><div class="k">Tasso di completamento</div></div>
    </div>
    <div class="card chart-card">
      <div class="h"><h3>Completamenti / Mese</h3><div class="ico">${icon('chart-line')}</div></div>
      ${monthChart(perMonth, color, Y === t.getFullYear() ? t.getMonth() : 11)}
    </div>
    ${withGoal.length ? '' : `<div class="notice"><div class="bang">!</div><div>${h
      ? 'È necessario impostare un obiettivo di serie per queste abitudini per vedere i dati della serie. Puoi farlo modificando l\'abitudine.'
      : 'È necessario impostare un obiettivo di serie su una delle tue abitudini per vedere i dati della serie. Puoi farlo modificando l\'abitudine.'}</div></div>`}
    <div class="grid2">
      <div class="card stat"><div class="ico">${icon('flame')}</div><div class="v">${cur}</div><div class="k">Serie attuale</div></div>
      <div class="card stat"><div class="ico">${icon('flame')}</div><div class="v">${best}</div><div class="k">Miglior serie</div></div>
    </div>
    ${rank}
  </div>`;
}
function smoothPath(p) {
  const n = p.length, dx = [], m = [], tg = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = p[i + 1][0] - p[i][0]; m[i] = (p[i + 1][1] - p[i][1]) / dx[i]; }
  tg[0] = m[0]; tg[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) tg[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { tg[i] = tg[i + 1] = 0; continue; }
    const a = tg[i] / m[i], b = tg[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); tg[i] = k * a * m[i]; tg[i + 1] = k * b * m[i]; }
  }
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${(p[i][0] + h).toFixed(1)},${(p[i][1] + tg[i] * h).toFixed(1)} ${(p[i + 1][0] - h).toFixed(1)},${(p[i + 1][1] - tg[i + 1] * h).toFixed(1)} ${p[i + 1][0].toFixed(1)},${p[i + 1][1].toFixed(1)}`;
  }
  return d;
}
function monthChart(vals, color, lastMonth) {
  const W = 340, H = 110, top = 8;
  const max = Math.max(1, ...vals) * 1.12;
  const x = i => (i / 11) * W;
  const y = v => top + (H - top) * (1 - v / max);
  const pts = vals.map((v, i) => [x(i), y(v)]);
  const line = smoothPath(pts);
  let dots = '';
  for (let gx = 12; gx < W; gx += 17) for (let gy = 6; gy < H; gy += 16) dots += `<circle cx="${gx}" cy="${gy}" r=".9"/>`;
  const gid = 'g' + color.slice(1);
  const marks = vals.map((v, i) => i > 0 && i < 11 ? `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2.6" fill="${color}"/>` : '').join('');
  const labels = MONTHS.map((m, i) => i > 0 && i < 11 ? `<span style="left:${(100 * i / 11).toFixed(2)}%">${m}</span>` : '').join('');
  return `<div class="chart">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Completamenti per mese">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${color}" stop-opacity=".55"/><stop offset="1" stop-color="${color}" stop-opacity=".12"/>
      </linearGradient></defs>
      <g fill="#2b2b31">${dots}</g>
      <path d="${line}L${W},${H}L0,${H}Z" fill="url(#${gid})"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/>
      ${marks}
    </svg>
    <div class="xl">${labels}</div>
  </div>`;
}

/* ---------- Sheet: crea / modifica ---------- */
function editSheet() {
  const d = UI.sheet.draft;
  const isNew = !UI.sheet.id;
  const isEmoji = d.icon.startsWith('e:');
  const g = d.goal;
  const preview = { ...d };
  return `<div class="sheet-body" style="${cvars(d.color)}">
    <div class="sheet-title"><h2>${isNew ? 'Nuova abitudine' : 'Modifica abitudine'}</h2>
      <button class="round" data-a="close" aria-label="Chiudi">${icon('x')}</button></div>
    <div class="preview"><div class="hicon xl">${habitGlyph(preview)}</div><b data-preview-name>${esc(d.name || 'Nome abitudine')}</b></div>
    <div class="field"><label>Nome</label><input class="input" data-f="name" value="${esc(d.name)}" placeholder="Es. Lettura" maxlength="40" autocomplete="off"></div>
    <div class="field"><label>Descrizione</label><input class="input" data-f="desc" value="${esc(d.desc)}" placeholder="Facoltativa" maxlength="80" autocomplete="off"></div>
    <div class="field"><label>Icona</label>
      <div class="emoji-row"><input class="input" data-f="emoji" value="${isEmoji ? esc(d.icon.slice(2)) : ''}" placeholder="Scrivi un'emoji…" maxlength="8" autocomplete="off"></div>
      <div class="icon-grid">
        ${QUICK_EMOJI.map(e => `<button class="${d.icon === 'e:' + e ? 'sel' : ''}" data-a="pick-icon" data-v="e:${e}">${e}</button>`).join('')}
        ${HABIT_ICONS.map(n => `<button class="${d.icon === 'i:' + n ? 'sel' : ''}" data-a="pick-icon" data-v="i:${n}">${icon(n)}</button>`).join('')}
      </div>
    </div>
    <div class="field"><label>Colore</label>
      <div class="colors">${COLORS.map(c => `<button class="${d.color === c ? 'sel' : ''}" style="background:${c}" data-a="pick-color" data-v="${c}" aria-label="Colore ${c}"></button>`).join('')}</div>
    </div>
    <div class="field"><label>Obiettivo di serie</label>
      <div class="seg">${[['none', 'Nessuno'], ['day', 'Giorno'], ['week', 'Settimana'], ['month', 'Mese']].map(([v, l]) => `<button class="${g.type === v ? 'sel' : ''}" data-a="pick-goal" data-v="${v}">${l}</button>`).join('')}</div>
      ${g.type === 'week' || g.type === 'month' ? `<div class="stepper"><span>Volte ${g.type === 'week' ? 'a settimana' : 'al mese'}</span>
        <div><button data-a="goal-n" data-d="-1">−</button><b>${g.count}</b><button data-a="goal-n" data-d="1">+</button></div></div>` : ''}
    </div>
    <div class="row-btns">
      <button class="btn ghost" data-a="close">Annulla</button>
      <button class="btn accent" data-a="save-habit">Salva</button>
    </div>
  </div>`;
}

/* ---------- Sheet: opzioni abitudine ---------- */
function menuSheet() {
  const h = habit(UI.sheet.id);
  return `<div class="sheet-body" style="${cvars(h.color)}">
    <div class="sheet-title"><h2>${esc(h.name)}</h2><button class="round" data-a="close" aria-label="Chiudi">${icon('x')}</button></div>
    <div class="card menu">
      <button class="mi" data-a="edit">${icon('edit')}<div class="t">Modifica</div></button>
      <button class="mi" data-a="stats-habit">${icon('chart-line')}<div class="t">Statistiche</div></button>
      <button class="mi" data-a="archive">${icon('archive')}<div class="t">Archivia<small>La nascondi dalla home, i dati restano</small></div></button>
      <button class="mi danger" data-a="delete">${icon('trash')}<div class="t">Elimina abitudine<small>Cancella anche tutto lo storico</small></div></button>
    </div>
  </div>`;
}

/* ---------- Sheet: nota ---------- */
function noteSheet() {
  const { hid, k } = UI.sheet;
  const h = habit(hid), d = parseKey(k);
  const txt = (S.notes[hid] || {})[k] || '';
  return `<div class="sheet-body" style="${cvars(h.color)}">
    <div class="sheet-title"><h2>Nota</h2><button class="round" data-a="close" aria-label="Chiudi">${icon('x')}</button></div>
    <div class="field"><label>${DOW_LONG[dow(d)]} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}</label>
      <textarea class="input" data-f="note" placeholder="Cosa è andato bene? Cosa ti ha ostacolato?">${esc(txt)}</textarea></div>
    <div class="row-btns">
      ${txt ? `<button class="btn danger" data-a="note-del">Elimina</button>` : `<button class="btn ghost" data-a="close">Annulla</button>`}
      <button class="btn accent" data-a="note-save">Salva</button>
    </div>
  </div>`;
}

/* ---------- Sheet: conferma ---------- */
function askConfirm(title, text, ok, fn) { openSheet({ type: 'confirm', title, text, ok, fn }); }
function confirmSheet() {
  const c = UI.sheet;
  return `<div class="sheet-body">
    <div class="sheet-title"><h2>${esc(c.title)}</h2></div>
    <p class="confirm-text">${esc(c.text)}</p>
    <div class="row-btns">
      <button class="btn ghost" data-a="close">Annulla</button>
      <button class="btn danger" data-a="confirm-ok">${esc(c.ok)}</button>
    </div>
  </div>`;
}

/* ---------- Sheet: impostazioni ---------- */
function settingsSheet() {
  const list = active(), arch = S.habits.filter(h => h.archived);
  return `<div class="sheet-body">
    <div class="sheet-title"><h2>Impostazioni</h2><button class="round" data-a="close" aria-label="Chiudi">${icon('x')}</button></div>
    <div class="sect">Ordine abitudini</div>
    <div class="card menu">${list.map((h, i) => `
      <div class="mi" style="${cvars(h.color)}"><div class="hicon">${habitGlyph(h)}</div><div class="t">${esc(h.name)}</div>
        <button class="mini" data-a="move" data-h="${h.id}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Su">${icon('arrow-up')}</button>
        <button class="mini" data-a="move" data-h="${h.id}" data-d="1" ${i === list.length - 1 ? 'disabled' : ''} aria-label="Giù">${icon('arrow-down')}</button>
      </div>`).join('') || '<div class="mi"><div class="t">Nessuna abitudine</div></div>'}</div>
    ${arch.length ? `<div class="sect">Archiviate</div><div class="card menu">${arch.map(h => `
      <div class="mi" style="${cvars(h.color)}"><div class="hicon">${habitGlyph(h)}</div><div class="t">${esc(h.name)}</div>
        <button class="mini" data-a="unarchive" data-h="${h.id}" aria-label="Ripristina">${icon('archive-off')}</button>
      </div>`).join('')}</div>` : ''}
    <div class="sect">Backup su Google Drive</div>
    <div class="card menu">
      <div class="mi field-row"><div class="t">Indirizzo dello script<small>Incolla l'indirizzo dell'app web che finisce con /exec</small>
        <input class="input" id="drive-url" data-s="driveUrl" value="${esc(S.settings.driveUrl || '')}" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off" autocapitalize="off" spellcheck="false"></div></div>
      <button class="mi" data-a="drive-now" ${S.settings.driveUrl ? '' : 'disabled'}>${icon('cloud-upload')}<div class="t">${UI.driveBusy ? 'Salvataggio in corso…' : 'Esporta ora su Drive'}<small>${lastBackupLabel()}</small></div></button>
    </div>
    <div class="sect">Backup su file</div>
    <div class="card menu">
      <button class="mi" data-a="export">${icon('download')}<div class="t">Esporta su file<small>Salva un file con tutte le abitudini e lo storico</small></div></button>
      <button class="mi" data-a="import">${icon('upload')}<div class="t">Importa backup<small>Anche da HabitKit. Sostituisce i dati attuali</small></div></button>
    </div>
    <p class="foot-note">I dati sono salvati solo su questo dispositivo. Con Drive collegato, la prima volta che apri l'app ogni mese parte da solo un backup in Personale/habit-tracker.</p>
  </div>`;
}

/* ---------- Backup su Google Drive ---------- */
const DRIVE_URL_RE = /^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[\w-]+\/exec$/;
function backupData(auto) { return { app: 'habit-tracker', auto, exportedAt: new Date().toISOString(), ...S }; }
function lastBackupLabel() {
  const t = S.settings.lastBackupAt;
  if (!t) return S.settings.driveUrl ? 'Nessun backup ancora' : 'Prima incolla l\'indirizzo dello script';
  const d = new Date(t);
  return `Ultimo backup: ${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
async function driveUpload(auto) {
  const url = S.settings.driveUrl;
  if (!url) throw new Error('Collega prima Google Drive nelle impostazioni');
  let res;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(backupData(auto)) });
  } catch (e) { throw new Error('Drive non raggiungibile: controlla la connessione'); }
  let j = null;
  try { j = await res.json(); } catch (e) { /* risposta non JSON */ }
  if (!j || !j.ok) throw new Error(j && j.error ? 'Drive: ' + j.error : 'Lo script non ha risposto: controlla l\'indirizzo e che l\'accesso sia "Chiunque"');
  S.settings.lastBackupAt = new Date().toISOString(); save();
  return j;
}
// Backup automatico: una volta per mese di calendario, all'apertura dell'app
let autoRunning = false;
async function autoBackup() {
  if (autoRunning || !S.settings.driveUrl || !navigator.onLine) return;
  const last = S.settings.lastBackupAt ? new Date(S.settings.lastBackupAt) : null;
  const now = new Date();
  if (last && last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth()) return;
  autoRunning = true;
  try { await driveUpload(true); toast('Backup mensile salvato su Drive'); if (UI.sheet && UI.sheet.type === 'settings') renderSheet(); }
  catch (e) { /* si riprova alla prossima apertura */ }
  autoRunning = false;
}

/* ---------- Render ---------- */
const $app = document.getElementById('app');
const $sheet = document.getElementById('sheet-root');

function render() {
  const keep = {};
  document.querySelectorAll('#app [data-scroll-end]').forEach((el, i) => { keep[i] = el.scrollWidth - el.scrollLeft; });
  $app.innerHTML = UI.route === 'habit' ? renderHabit() : renderHome();
  document.querySelectorAll('#app [data-scroll-end]').forEach((el, i) => {
    el.scrollLeft = keep[i] !== undefined ? el.scrollWidth - keep[i] : el.scrollWidth;
  });
  if (UI.pop) {
    const el = $app.querySelector(`[data-h="${UI.pop.h}"][data-k="${UI.pop.k}"], [data-day="${UI.pop.k}"]`);
    if (el) el.classList.add('pop');
    UI.pop = null;
  }
  renderSheet();
}
function renderSheet() {
  const sh = UI.sheet;
  if (!sh) { $sheet.innerHTML = ''; return; }
  const bodyScroll = $sheet.querySelector('.sheet-body');
  const prevTop = bodyScroll ? bodyScroll.scrollTop : 0;
  const fresh = UI.sheetFresh ? 'enter' : '';
  const content = sh.type === 'stats' ? statsSheet() : sh.type === 'edit' ? editSheet() : sh.type === 'menu' ? menuSheet()
    : sh.type === 'note' ? noteSheet() : sh.type === 'confirm' ? confirmSheet() : settingsSheet();
  $sheet.innerHTML = `<div class="scrim ${fresh}" data-a="close"></div>
    <div class="sheet ${fresh} ${sh.type === 'stats' ? 'full' : ''}" role="dialog"><div class="grabber"></div>${content}</div>`;
  const nb = $sheet.querySelector('.sheet-body');
  if (nb && !UI.sheetFresh) nb.scrollTop = prevTop;
  $sheet.querySelectorAll('[data-scroll-end]').forEach(el => {
    if (sh.type === 'stats') {
      // Porta in vista la settimana corrente (o la fine dell'anno)
      const t = today();
      if (sh.year === t.getFullYear()) {
        const col = Math.floor((t - startOfWeek(new Date(sh.year, 0, 1))) / 864e5 / 7);
        el.scrollLeft = Math.max(0, (col + 2) * 14 - el.clientWidth);
      } else el.scrollLeft = sh.year < t.getFullYear() ? el.scrollWidth : 0;
    } else el.scrollLeft = el.scrollWidth;
  });
  UI.sheetFresh = false;
}
function openSheet(s) { UI.sheet = s; UI.sheetFresh = true; renderSheet(); document.body.style.overflow = 'hidden'; }
function closeSheet() { UI.sheet = null; renderSheet(); document.body.style.overflow = ''; }

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

/* ---------- Navigazione ---------- */
function route() {
  const m = location.hash.match(/^#\/h\/(.+)$/);
  if (m && habit(m[1])) {
    if (UI.hid !== m[1]) { const t = today(); UI.calMonth = new Date(t.getFullYear(), t.getMonth(), 1); }
    UI.route = 'habit'; UI.hid = m[1];
  } else { UI.route = 'home'; UI.hid = null; }
  UI.sheet = null; document.body.style.overflow = '';
  render();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

/* ---------- Azioni ---------- */
const actions = {
  toggle(el) { const h = habit(el.dataset.h); toggle(h, el.dataset.k); UI.pop = { h: h.id, k: el.dataset.k }; render(); },
  open(el) { UI.cameFromHome = true; location.hash = '#/h/' + el.dataset.h; },
  back() { if (UI.cameFromHome) { UI.cameFromHome = false; history.back(); } else location.hash = ''; },
  view(el) { S.settings.view = el.dataset.v; save(); render(); },
  days() { const o = [3, 5, 7]; S.settings.days = o[(o.indexOf(S.settings.days) + 1) % o.length]; save(); render(); },
  stats() { openSheet({ type: 'stats', sel: null, year: today().getFullYear() }); },
  'stats-habit'() { openSheet({ type: 'stats', sel: UI.hid, year: today().getFullYear() }); },
  'stats-sel'(el) { UI.sheet.sel = UI.sheet.sel === el.dataset.h ? null : el.dataset.h; renderSheet(); },
  year(el) { UI.sheet.year += +el.dataset.d; renderSheet(); },
  close() { closeSheet(); },
  settings() { openSheet({ type: 'settings' }); },
  new() {
    const used = new Set(active().map(h => h.color));
    const color = COLORS.find(c => !used.has(c)) || COLORS[0];
    openSheet({ type: 'edit', id: null, draft: { name: '', desc: '', icon: 'e:✅', color, goal: { type: 'none', count: 3 } } });
  },
  edit() {
    const h = habit(UI.hid);
    openSheet({ type: 'edit', id: h.id, draft: { name: h.name, desc: h.desc, icon: h.icon, color: h.color, goal: { count: 3, ...h.goal, ...(h.goal.type === 'none' ? { count: 3 } : {}) } } });
  },
  menu() { openSheet({ type: 'menu', id: UI.hid }); },
  'pick-icon'(el) { UI.sheet.draft.icon = el.dataset.v; renderSheet(); },
  'pick-color'(el) { UI.sheet.draft.color = el.dataset.v; renderSheet(); },
  'pick-goal'(el) { UI.sheet.draft.goal.type = el.dataset.v; renderSheet(); },
  'goal-n'(el) {
    const g = UI.sheet.draft.goal, max = g.type === 'week' ? 7 : 31;
    g.count = Math.min(max, Math.max(1, g.count + +el.dataset.d)); renderSheet();
  },
  'save-habit'() {
    const d = UI.sheet.draft;
    const name = d.name.trim();
    if (!name) { toast('Dai un nome all\'abitudine'); return; }
    const goal = d.goal.type === 'none' ? { type: 'none', count: 1 }
      : { type: d.goal.type, count: d.goal.type === 'day' ? 1 : Math.min(d.goal.type === 'week' ? 7 : 31, d.goal.count) };
    if (UI.sheet.id) {
      Object.assign(habit(UI.sheet.id), { name, desc: d.desc.trim(), icon: d.icon, color: d.color, goal });
    } else {
      S.habits.push({ id: uid(), name, desc: d.desc.trim(), icon: d.icon, color: d.color, goal, createdAt: key(today()), archived: false });
    }
    save(); closeSheet(); render(); toast('Salvato');
  },
  archive() {
    habit(UI.sheet.id).archived = true; save(); UI.sheet = null; document.body.style.overflow = '';
    location.hash = ''; toast('Abitudine archiviata');
  },
  unarchive(el) { habit(el.dataset.h).archived = false; save(); render(); },
  delete() {
    const h = habit(UI.sheet.id);
    askConfirm(`Eliminare "${h.name}"?`, 'Cancelli anche tutto lo storico e le note. L\'operazione non si può annullare.', 'Elimina', () => {
      S.habits = S.habits.filter(x => x.id !== h.id); delete S.done[h.id]; delete S.notes[h.id];
      save(); UI.sheet = null; document.body.style.overflow = ''; location.hash = ''; render(); toast('Abitudine eliminata');
    });
  },
  move(el) {
    const list = active(), i = list.findIndex(h => h.id === el.dataset.h), j = i + +el.dataset.d;
    if (j < 0 || j >= list.length) return;
    const a = S.habits.indexOf(list[i]), b = S.habits.indexOf(list[j]);
    [S.habits[a], S.habits[b]] = [S.habits[b], S.habits[a]];
    save(); render();
  },
  cal(el) { const m = UI.calMonth; UI.calMonth = new Date(m.getFullYear(), m.getMonth() + +el.dataset.d, 1); render(); },
  'cal-today'() { const t = today(); UI.calMonth = new Date(t.getFullYear(), t.getMonth(), 1); render(); },
  note(el) { openSheet({ type: 'note', hid: UI.hid, k: el.dataset.k }); setTimeout(() => { const ta = $sheet.querySelector('textarea'); if (ta) ta.focus(); }, 350); },
  'note-save'() {
    const { hid, k } = UI.sheet, txt = $sheet.querySelector('textarea').value.trim();
    const m = S.notes[hid] || (S.notes[hid] = {});
    if (txt) m[k] = txt; else delete m[k];
    save(); closeSheet(); render();
  },
  'note-del'() { const { hid, k } = UI.sheet; delete (S.notes[hid] || {})[k]; save(); closeSheet(); render(); },
  async 'drive-now'() {
    if (UI.driveBusy) return;
    UI.driveBusy = true; renderSheet();
    try { await driveUpload(false); toast('Backup salvato su Google Drive'); }
    catch (e) { toast(e.message || 'Backup su Drive non riuscito'); }
    UI.driveBusy = false; renderSheet();
  },
  async export() {
    const data = JSON.stringify(backupData(false), null, 1);
    const name = `habit-tracker-backup-${key(today())}.json`;
    const file = new File([data], name, { type: 'application/json' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  },
  import() { document.getElementById('import-file').click(); },
  'confirm-ok'() { const fn = UI.sheet.fn; closeSheet(); fn(); },
};

document.addEventListener('click', e => {
  if (suppressClick) { suppressClick = false; e.preventDefault(); return; }
  const day = e.target.closest('[data-day]');
  if (day) {
    const h = habit(UI.hid); toggle(h, day.dataset.day); UI.pop = { h: h.id, k: day.dataset.day }; render(); return;
  }
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.a];
  if (fn) fn(el);
});

// Campi dei form
document.addEventListener('input', e => {
  const f = e.target.dataset && e.target.dataset.f;
  if (!f || !UI.sheet || UI.sheet.type !== 'edit') return;
  const d = UI.sheet.draft;
  if (f === 'name') { d.name = e.target.value; const p = $sheet.querySelector('[data-preview-name]'); if (p) p.textContent = d.name || 'Nome abitudine'; }
  if (f === 'desc') d.desc = e.target.value;
  if (f === 'emoji') {
    const v = e.target.value.trim();
    if (v) { d.icon = 'e:' + [...new Intl.Segmenter('it', { granularity: 'grapheme' }).segment(v)].map(s => s.segment)[0]; }
    const prev = $sheet.querySelector('.preview .hicon'); if (prev) prev.innerHTML = habitGlyph(d);
    $sheet.querySelectorAll('.icon-grid .sel').forEach(b => b.classList.remove('sel'));
  }
});

// Indirizzo dello script Drive (impostazioni)
document.addEventListener('change', e => {
  if (!e.target.dataset || e.target.dataset.s !== 'driveUrl') return;
  const v = e.target.value.trim();
  if (v && !DRIVE_URL_RE.test(v)) { toast('Indirizzo non valido: deve finire con /exec'); return; }
  S.settings.driveUrl = v; save(); renderSheet();
  if (v) toast('Google Drive collegato');
});

// Import backup
document.getElementById('import-file').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    let s = JSON.parse(await f.text());
    if (isHabitKit(s)) s = fromHabitKit(s, S.settings);
    if (!s || !Array.isArray(s.habits)) throw new Error('formato');
    askConfirm(`Importare ${s.habits.length} abitudini?`, 'I dati attuali su questo telefono verranno sostituiti da quelli del backup.', 'Importa', () => {
      delete s.app; delete s.exportedAt;
      S = normalize(s); save(); closeSheet(); location.hash = ''; render(); toast('Backup importato');
    });
  } catch (err) { toast('File non valido'); }
});

// Pressione prolungata sui giorni del calendario → nota
let pressTimer = null, pressStart = null, suppressClick = false;
document.addEventListener('pointerdown', e => {
  const day = e.target.closest('[data-day]');
  if (!day) return;
  pressStart = { x: e.clientX, y: e.clientY, el: day };
  day.classList.add('pressing');
  pressTimer = setTimeout(() => {
    pressTimer = null; suppressClick = true; day.classList.remove('pressing');
    if (navigator.vibrate) navigator.vibrate(10);
    actions.note({ dataset: { k: day.dataset.day } });
  }, 480);
});
function cancelPress() {
  if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  if (pressStart) { pressStart.el.classList.remove('pressing'); pressStart = null; }
}
document.addEventListener('pointermove', e => {
  if (pressStart && Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > 10) cancelPress();
});
document.addEventListener('pointerup', () => { if (pressTimer) cancelPress(); else if (pressStart) { pressStart.el.classList.remove('pressing'); pressStart = null; } });
document.addEventListener('pointercancel', cancelPress);
document.addEventListener('contextmenu', e => { if (e.target.closest('[data-day]')) e.preventDefault(); });

// Cambio giorno mentre l'app è aperta
let lastDay = key(today());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (key(today()) !== lastDay) { lastDay = key(today()); render(); }
  autoBackup();
});
window.addEventListener('resize', () => { if (S.settings.view === 'grid' && UI.route === 'home') render(); });

/* ---------- Avvio ---------- */
route();
setTimeout(autoBackup, 1500);
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
