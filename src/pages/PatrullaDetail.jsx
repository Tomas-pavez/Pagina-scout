import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Flag, Lock, Megaphone, Music, Pencil, Plus, Shield, Trash2, Users, ImageIcon } from 'lucide-react';
import { Empty, Field, ImageInput, Loading, Modal, SmartImg } from '../components/ui.jsx';
import { patrullaId, useAuth, usePatrullas, useRama, useToast } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

const emptyPatrulla = { nombre: '', animal: '', grito: '', himno: '', descripcion: '', panolin: '', foto: '' };

/** Sección "Patrullas" dentro de la página de una rama: tarjetas que llevan a cada patrulla. */
export function PatrullasSection({ rama }) {
  const { patrullas, loading, hasBase } = usePatrullas(rama.id);
  const { isAdmin } = useAuth();
  const [creating, setCreating] = useState(false);
  if (!hasBase && !patrullas.length) return null;
  return (
    <div className="block reveal">
      <div className="steps-head">
        <h2 className="block-title"><Shield size={24} /> Patrullas</h2>
        {isAdmin && <button className="btn btn-sm btn-outline" onClick={() => setCreating(true)}><Plus size={16} /> Agregar patrulla</button>}
      </div>
      <p className="muted">Cada patrulla tiene su nombre, animal, grito, pañolín e himno. Pulsa una para conocerla.</p>
      {loading ? <Loading /> : patrullas.length === 0 ? (
        <Empty icon={Shield} title="Aún no hay patrullas" />
      ) : (
        <div className="patrol-grid">
          {patrullas.map((p) => (
            <Link key={p.id} to={`/ramas/${rama.id}/patrullas/${encodeURIComponent(p.key || p.id)}`} className="card patrol-card" style={{ '--rama': rama.color }}>
              <div className="patrol-card-img">
                {p.panolin ? <img src={p.panolin} alt={`Pañolín de la patrulla ${p.nombre}`} loading="lazy" /> : <Shield size={56} strokeWidth={1.3} />}
              </div>
              <div className="patrol-card-body">
                <h3>{p.nombre}</h3>
                {p.animal && <small>{p.animal}</small>}
                <span className="patrol-more">Ver patrulla <ArrowRight size={15} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {creating && <PatrullaForm rama={rama} initial={emptyPatrulla} isNew order={patrullas.length + 1} onClose={() => setCreating(false)} />}
    </div>
  );
}

/** Página propia de una patrulla. */
export default function PatrullaDetail() {
  const { id, pid } = useParams();
  const { rama, loading: lr } = useRama(id);
  const { patrullas, loading } = usePatrullas(id);
  const { isAdmin, isMember } = useAuth();
  const [editing, setEditing] = useState(false);
  const toast = useToast();
  const nav = useNavigate();
  const key = decodeURIComponent(pid);
  const p = patrullas.find((x) => (x.key || x.id) === key);

  if (lr || loading) return <div className="container section"><Loading /></div>;
  if (!rama || !p)
    return (
      <div className="container section">
        <Empty icon={Shield} title="Patrulla no encontrada"><Link className="btn btn-primary" to={rama ? `/ramas/${rama.id}` : '/ramas'}>Volver</Link></Empty>
      </div>
    );

  const remove = async () => {
    if (!window.confirm(`¿Quitar la patrulla ${p.nombre}? Se borran sus datos e imágenes.`)) return;
    try {
      await db.deleteFile(p.foto);
      await db.deleteFile(p.panolin);
      // Se guarda una marca para que las patrullas iniciales no vuelvan a aparecer.
      await db.save('ramas', { id: p.id, kind: 'patrulla', rama: rama.id, key: p.key, nombre: p.nombre, deleted: true });
      toast(`Patrulla ${p.nombre} quitada`);
      nav(`/ramas/${rama.id}`);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const fotoPrivada = db.isPrivateRef(p.foto);
  const info = [
    ['animal', 'Animal', Users],
    ['grito', 'Grito', Megaphone],
    ['himno', 'Himno', Music],
    ['descripcion', 'Sobre la patrulla', Flag],
  ].filter(([k]) => p[k]);

  return (
    <div style={{ '--rama': rama.color }}>
      <section className="page-hero" style={{ '--accent': rama.color }}>
        <div className="container">
          <Link to={`/ramas/${rama.id}`} className="back-link"><ArrowLeft size={18} /> {rama.name}</Link>
          <span className="eyebrow">Patrulla · {rama.name}</span>
          <h1>{p.nombre}</h1>
          {p.animal && <p>{p.animal}</p>}
          {isAdmin && (
            <div className="row-gap" style={{ marginTop: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}><Pencil size={15} /> Editar patrulla</button>
              <button className="btn btn-outline-light btn-sm" onClick={remove}><Trash2 size={15} /> Quitar patrulla</button>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="patrol-photos">
            <figure className="card patrol-photo">
              <div className="patrol-photo-img contain">
                {p.panolin ? <img src={p.panolin} alt={`Pañolín de la patrulla ${p.nombre}`} /> : <Placeholder text={isAdmin ? 'Sube la foto del pañolín con "Editar patrulla"' : 'Foto del pañolín pendiente'} />}
              </div>
              <figcaption>Pañolín</figcaption>
            </figure>
            <figure className="card patrol-photo">
              <div className="patrol-photo-img">
                {!p.foto ? (
                  <Placeholder text={isAdmin ? 'Sube una foto de la patrulla con "Editar patrulla"' : 'Foto de la patrulla pendiente'} />
                ) : fotoPrivada && !isMember ? (
                  <div className="patrol-ph"><Lock size={40} strokeWidth={1.5} /><span>La foto de la patrulla es visible solo para miembros.</span><Link className="btn btn-sm btn-outline" to="/ingresar">Iniciar sesión</Link></div>
                ) : (
                  <SmartImg src={p.foto} alt={`Foto de la patrulla ${p.nombre}`} />
                )}
              </div>
              <figcaption>Foto de la patrulla</figcaption>
            </figure>
          </div>

          {info.length ? (
            <div className="patrol-info">
              {info.map(([k, label, Icon]) => (
                <div key={k} className={`card info-card ${k === 'himno' || k === 'descripcion' ? 'wide' : ''}`}>
                  <h3><span className="icon-circle rama"><Icon size={20} /></span>{label}</h3>
                  <p className="pre">{p[k]}</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon={Shield} title="Esta patrulla todavía no tiene información" text={isAdmin ? 'Pulsa "Editar patrulla" para agregar el animal, el grito, el himno y las fotos.' : undefined} />
          )}
        </div>
      </section>
      {editing && <PatrullaForm rama={rama} initial={p} onClose={() => setEditing(false)} />}
    </div>
  );
}

function Placeholder({ text }) {
  return <div className="patrol-ph"><ImageIcon size={40} strokeWidth={1.5} /><span>{text}</span></div>;
}

function PatrullaForm({ rama, initial, isNew, order, onClose }) {
  const [f, setF] = useState({ ...emptyPatrulla, ...initial });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  const submit = async (e) => {
    e.preventDefault();
    if (!f.nombre.trim()) return toast('El nombre es obligatorio', 'error');
    setSaving(true);
    try {
      const key = isNew ? db.uid().slice(0, 8) : initial.key;
      await db.save('ramas', {
        ...f,
        id: isNew ? patrullaId(rama.id, key) : initial.id,
        key, kind: 'patrulla', rama: rama.id, nombre: f.nombre.trim(),
        order: isNew ? order : initial.order,
      });
      toast(isNew ? 'Patrulla agregada' : 'Patrulla guardada');
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title={isNew ? `Nueva patrulla · ${rama.name}` : `Editar patrulla ${initial.nombre}`} onClose={onClose} wide>
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Nombre" required><input required value={f.nombre} onChange={set('nombre')} /></Field>
          <Field label="Animal"><input value={f.animal} onChange={set('animal')} placeholder="Ej: Grifo" /></Field>
          <ImageInput label="Foto del pañolín" value={f.panolin} onChange={set('panolin')} folder={`patrullas/${rama.id}`} maxDim={1000} keepPng />
          <ImageInput label="Foto de la patrulla (solo la ven los miembros)" value={f.foto} onChange={set('foto')} folder={`patrullas/${rama.id}`} maxDim={1800} private />
          <Field label="Grito" full><textarea rows={3} value={f.grito} onChange={set('grito')} /></Field>
          <Field label="Himno" full><textarea rows={8} value={f.himno} onChange={set('himno')} /></Field>
          <Field label="Sobre la patrulla (opcional)" full><textarea rows={3} value={f.descripcion} onChange={set('descripcion')} /></Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar patrulla'}</button>
        </div>
      </form>
    </Modal>
  );
}
