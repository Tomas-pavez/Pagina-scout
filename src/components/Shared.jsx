import { Link } from 'react-router-dom';
import { Mail, Phone, Music, UtensilsCrossed, Lightbulb, Pencil, Trash2, Clock, MapPin, Images, ShieldCheck, User } from 'lucide-react';
import { EVENT_TYPES } from '../data/seed.js';
import { formatDate } from '../lib/hooks.jsx';
import { SmartImg } from './ui.jsx';

export const eventTypeLabel = (t) => EVENT_TYPES.find((x) => x.id === t)?.label || 'Otro';
export const ramaById = (ramas, id) => ramas.find((r) => r.id === id);
export const unitLabel = (ramas, id) => (id === 'admin' ? 'Administración' : id === 'all' || !id ? 'Todo el grupo' : ramaById(ramas, id)?.name || id);
export const unitColor = (ramas, id) => ramaById(ramas, id)?.color || '#19345F';

export function MemberCard({ m, ramas, showContact, onEdit, onDelete }) {
  const color = m.unidad === 'admin' ? '#19345F' : unitColor(ramas, m.unidad);
  return (
    <article className="card member-card reveal" style={{ '--rama': color }}>
      <div className="member-photo">
        {m.photo ? <img src={m.photo} alt={`Foto de ${m.name}`} loading="lazy" /> : <span className="member-photo-ph"><User size={64} strokeWidth={1.5} /></span>}
      </div>
      <div className="member-body">
      <div className="member-top">
        <div>
          <h3>{m.name}</h3>
          {m.cargo && <p className="member-role">{m.cargo}</p>}
          <div className="tags">
            <span className="tag" style={{ background: color }}>{unitLabel(ramas, m.unidad)}</span>
            {m.alsoAdmin && m.unidad !== 'admin' && <span className="tag tag-navy"><ShieldCheck size={12} /> Administración</span>}
            {m.edad && <span className="tag tag-soft">{m.edad} años</span>}
          </div>
        </div>
      </div>
      {m.descripcion && <p className="member-desc">{m.descripcion}</p>}
      {(m.danza || m.comida || m.dato) && (
        <ul className="fun-facts">
          {m.danza && <li><Music size={15} /> <span><b>Danza favorita:</b> {m.danza}</span></li>}
          {m.comida && <li><UtensilsCrossed size={15} /> <span><b>Comida de campamento:</b> {m.comida}</span></li>}
          {m.dato && <li><Lightbulb size={15} /> <span><b>Dato curioso:</b> {m.dato}</span></li>}
        </ul>
      )}
      {showContact && (m.email || m.telefono) && (
        <div className="member-contact">
          {m.email && <a href={`mailto:${m.email}`}><Mail size={15} /> {m.email}</a>}
          {m.telefono && <a href={`tel:${m.telefono}`}><Phone size={15} /> {m.telefono}</a>}
        </div>
      )}
      {(onEdit || onDelete) && (
        <div className="admin-row">
          {onEdit && <button className="btn btn-sm btn-outline" onClick={() => onEdit(m)}><Pencil size={15} /> Editar</button>}
          {onDelete && <button className="btn btn-sm btn-danger-ghost" onClick={() => onDelete(m)}><Trash2 size={15} /> Eliminar</button>}
        </div>
      )}
      </div>
    </article>
  );
}

export function EventRow({ ev, ramas, onClick }) {
  const [, m, d] = ev.date.split('-');
  const color = unitColor(ramas, ev.rama);
  return (
    <button type="button" className="event-row" onClick={() => onClick?.(ev)} style={{ '--rama': color }}>
      <span className="event-date"><b>{Number(d)}</b><small>{formatDate(ev.date, { month: 'short' }).replace('.', '')}</small></span>
      <span className="event-info">
        <strong>{ev.title}</strong>
        <small>
          {eventTypeLabel(ev.type)} · {unitLabel(ramas, ev.rama)}
          {ev.start && <> · <Clock size={12} /> {ev.start}{ev.end && `–${ev.end}`}</>}
          {ev.place && <> · <MapPin size={12} /> {ev.place}</>}
        </small>
      </span>
      <span className="sr-only">{m}</span>
    </button>
  );
}

export function AlbumCard({ album, ramas, count }) {
  const color = unitColor(ramas, album.rama);
  return (
    <Link to={`/fotos/${album.id}`} className="card album-card reveal" style={{ '--rama': color }}>
      <div className="album-cover">
        {album.cover ? <SmartImg src={album.cover} alt={album.title} loading="lazy" /> : <div className="album-ph"><Images size={40} /></div>}
        {typeof count === 'number' && <span className="age-badge">{count} {count === 1 ? 'foto' : 'fotos'}</span>}
      </div>
      <div className="card-body">
        <h3>{album.title}</h3>
        <small className="muted">{formatDate(album.date)} · {unitLabel(ramas, album.rama)}</small>
      </div>
    </Link>
  );
}
