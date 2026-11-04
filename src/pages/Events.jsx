import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Clock, MapPin, Tag, Pencil, Trash2, Users } from 'lucide-react';
import { Empty, Field, Loading, Modal, PageHero } from '../components/ui.jsx';
import { EventRow, eventTypeLabel, unitColor, unitLabel } from '../components/Shared.jsx';
import { EVENT_TYPES } from '../data/seed.js';
import { MONTHS, WEEKDAYS, formatDate, todayISO, useAuth, useCollection, useRamas, useToast } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const byDate = (a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || ''));

export default function Events() {
  const { isAdmin } = useAuth();
  const { ramas } = useRamas();
  const { items, loading, error } = useCollection('events');
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [filter, setFilter] = useState('todas');
  const [selected, setSelected] = useState(todayISO());
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const toast = useToast();

  const filtered = useMemo(
    () => items.filter((e) => filter === 'todas' || e.rama === filter || e.rama === 'all').sort(byDate),
    [items, filter]
  );
  const byDay = useMemo(() => {
    const map = {};
    filtered.forEach((e) => (map[e.date] = map[e.date] || []).push(e));
    return map;
  }, [filtered]);

  const first = new Date(ym.y, ym.m, 1);
  const offset = (first.getDay() + 6) % 7; // semana comienza el lunes
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const move = (delta) => setYm(({ y, m }) => {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const goToday = () => { setYm({ y: now.getFullYear(), m: now.getMonth() }); setSelected(todayISO()); };

  const today = todayISO();
  const upcoming = filtered.filter((e) => e.date >= today).slice(0, 8);
  const dayEvents = byDay[selected] || [];

  const del = async (ev) => {
    if (!window.confirm(`¿Eliminar el evento "${ev.title}"?`)) return;
    try {
      await db.remove('events', ev.id);
      toast('Evento eliminado');
      setDetail(null);
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <PageHero eyebrow="Calendario" title="Eventos del grupo" subtitle="Campamentos, salidas, reuniones y ceremonias de todas las ramas." />
      <section className="section">
        <div className="container">
          <div className="toolbar">
            <div className="chips" role="group" aria-label="Filtrar por rama">
              <button className={`chip ${filter === 'todas' ? 'active' : ''}`} onClick={() => setFilter('todas')}>Todas</button>
              {ramas.map((r) => (
                <button key={r.id} className={`chip ${filter === r.id ? 'active' : ''}`} style={{ '--rama': r.color }} onClick={() => setFilter(r.id)}>{r.name}</button>
              ))}
            </div>
            {isAdmin && <button className="btn btn-primary" onClick={() => setEditing({ date: selected })}><Plus size={18} /> Nuevo evento</button>}
          </div>

          {loading ? <Loading /> : error ? <Empty title="No se pudieron cargar los eventos" text={error} /> : (
            <div className="calendar-layout">
              <div className="card calendar">
                <div className="cal-head">
                  <button className="icon-btn" onClick={() => move(-1)} aria-label="Mes anterior"><ChevronLeft /></button>
                  <h2>{MONTHS[ym.m]} {ym.y}</h2>
                  <button className="icon-btn" onClick={() => move(1)} aria-label="Mes siguiente"><ChevronRight /></button>
                </div>
                <button className="btn btn-ghost btn-sm today-btn" onClick={goToday}>Hoy</button>
                <div className="cal-grid">
                  {WEEKDAYS.map((w) => <div key={w} className="cal-wd">{w}</div>)}
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} className="cal-cell empty" />;
                    const date = iso(ym.y, ym.m, d);
                    const evs = byDay[date] || [];
                    return (
                      <button
                        key={i}
                        className={`cal-cell ${date === selected ? 'selected' : ''} ${date === today ? 'today' : ''}`}
                        onClick={() => setSelected(date)}
                        aria-label={`${d} de ${MONTHS[ym.m]}${evs.length ? `, ${evs.length} evento(s)` : ''}`}
                      >
                        <span className="cal-num">{d}</span>
                        <span className="cal-dots">
                          {evs.slice(0, 3).map((e) => <span key={e.id} className="cal-ev" style={{ background: unitColor(ramas, e.rama) }} title={e.title} />)}
                        </span>
                        <span className="cal-titles">{evs.slice(0, 2).map((e) => <small key={e.id} style={{ '--rama': unitColor(ramas, e.rama) }}>{e.title}</small>)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <aside className="cal-side">
                <div className="card side-card">
                  <h3>{formatDate(selected, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                  {dayEvents.length ? (
                    <div className="event-list">{dayEvents.map((e) => <EventRow key={e.id} ev={e} ramas={ramas} onClick={setDetail} />)}</div>
                  ) : <p className="muted">No hay eventos este día.</p>}
                  {isAdmin && (
                    <button className="btn btn-outline btn-sm" onClick={() => setEditing({ date: selected })}><Plus size={16} /> Crear evento en esta fecha</button>
                  )}
                </div>
                <div className="card side-card">
                  <h3>Próximos eventos</h3>
                  {upcoming.length ? (
                    <div className="event-list">{upcoming.map((e) => <EventRow key={e.id} ev={e} ramas={ramas} onClick={setDetail} />)}</div>
                  ) : <Empty icon={CalendarDays} title="No hay eventos próximos" />}
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      {detail && (
        <EventDetail
          ev={detail}
          ramas={ramas}
          onClose={() => setDetail(null)}
          onEdit={isAdmin ? () => { setEditing(detail); setDetail(null); } : null}
          onDelete={isAdmin ? () => del(detail) : null}
        />
      )}
      {editing && <EventForm initial={editing} ramas={ramas} onClose={() => setEditing(null)} onSaved={(ev) => { setSelected(ev.date); const [y, m] = ev.date.split('-').map(Number); setYm({ y, m: m - 1 }); }} />}
    </>
  );
}

export function EventDetail({ ev, ramas, onClose, onEdit, onDelete }) {
  return (
    <Modal title={ev.title} onClose={onClose}>
      <div className="event-detail" style={{ '--rama': unitColor(ramas, ev.rama) }}>
        <div className="tags">
          <span className="tag" style={{ background: unitColor(ramas, ev.rama) }}><Users size={12} /> {unitLabel(ramas, ev.rama)}</span>
          <span className="tag tag-soft"><Tag size={12} /> {eventTypeLabel(ev.type)}</span>
        </div>
        <ul className="detail-list">
          <li><CalendarDays size={18} /> {formatDate(ev.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</li>
          {(ev.start || ev.end) && <li><Clock size={18} /> {ev.start || '—'}{ev.end ? ` a ${ev.end}` : ''} hrs.</li>}
          {ev.place && <li><MapPin size={18} /> {ev.place}</li>}
        </ul>
        {ev.description && <p className="pre">{ev.description}</p>}
        {(onEdit || onDelete) && (
          <div className="admin-row">
            {onEdit && <button className="btn btn-sm btn-outline" onClick={onEdit}><Pencil size={15} /> Editar</button>}
            {onDelete && <button className="btn btn-sm btn-danger-ghost" onClick={onDelete}><Trash2 size={15} /> Eliminar</button>}
          </div>
        )}
      </div>
    </Modal>
  );
}

function EventForm({ initial, ramas, onClose, onSaved }) {
  const [f, setF] = useState({ title: '', date: todayISO(), start: '', end: '', place: '', rama: 'all', type: 'reunion', description: '', ...initial });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.date) return toast('Título y fecha son obligatorios', 'error');
    if (f.start && f.end && f.end < f.start) return toast('La hora de término debe ser posterior al inicio', 'error');
    setSaving(true);
    try {
      const saved = await db.save('events', { ...f, title: f.title.trim() });
      toast(initial.id ? 'Evento actualizado' : 'Evento creado');
      onSaved?.(saved);
      onClose();
    } catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal title={initial.id ? 'Editar evento' : 'Nuevo evento'} onClose={onClose} wide>
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Título" required full><input required value={f.title} onChange={set('title')} /></Field>
          <Field label="Fecha" required><input type="date" required value={f.date} onChange={set('date')} /></Field>
          <Field label="Lugar"><input value={f.place} onChange={set('place')} /></Field>
          <Field label="Hora de inicio"><input type="time" value={f.start} onChange={set('start')} /></Field>
          <Field label="Hora de término"><input type="time" value={f.end} onChange={set('end')} /></Field>
          <Field label="Rama">
            <select value={f.rama} onChange={set('rama')}>
              <option value="all">Todo el grupo</option>
              {ramas.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Tipo">
            <select value={f.type} onChange={set('type')}>
              {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Descripción" full><textarea rows={4} value={f.description} onChange={set('description')} /></Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar evento'}</button>
        </div>
      </form>
    </Modal>
  );
}
