import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Target, Activity, Quote, Megaphone, Shirt, Flag, Sparkles, BookOpen, Music, FileText, Link2, Plus, Trash2, Lock, CalendarDays, Images, Users, Info, Upload, Award,
} from 'lucide-react';
import { Empty, Field, ImageInput, Loading, Modal, RamaImage } from '../components/ui.jsx';
import { AlbumCard, EventRow, MemberCard } from '../components/Shared.jsx';
import ImageSteps from '../components/ImageSteps.jsx';
import { ETAPAS_BASE, PANOLINES_BASE } from '../data/seed.js';
import { EventDetail } from './Events.jsx';
import { todayISO, useAuth, useCollection, useRama, useRamas, useToast } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

const GENERAL = [
  ['objetivo', 'Objetivo formativo', Target],
  ['actividades', 'Tipo de actividades', Activity],
  ['lema', 'Lema', Quote],
  ['grito', 'Grito', Megaphone],
  ['uniforme', 'Uniforme', Shirt],
  ['simbolos', 'Símbolos', Flag],
  ['tradiciones', 'Tradiciones', Sparkles],
];
const CEREMONIAL = [
  ['promesa', 'Texto de la promesa'],
  ['oracion', 'Oración'],
  ['oracionComida', 'Oración de la comida'],
  ['himno', 'Himno'],
];
const OTROS = [
  ['canciones', 'Canciones'],
  ['textos', 'Textos importantes'],
];
const CONTENT_KEYS = [...GENERAL, ...CEREMONIAL, ...OTROS].map(([k]) => k);
const has = (v) => typeof v === 'string' && v.trim() !== '';

export default function RamaDetail() {
  const { id } = useParams();
  const { rama, loading } = useRama(id);
  const { ramas } = useRamas();
  const { user, isMember, isAdmin } = useAuth();
  const members = useCollection('members');
  const events = useCollection('events', { enabled: isMember });
  const albums = useCollection('albums', { enabled: isMember });
  const [editing, setEditing] = useState(false);
  const [eventOpen, setEventOpen] = useState(null);

  if (loading) return <div className="container section"><Loading /></div>;
  if (!rama)
    return (
      <div className="container section">
        <Empty title="Rama no encontrada"><Link className="btn btn-primary" to="/ramas">Ver todas las ramas</Link></Empty>
      </div>
    );

  const responsables = members.items.filter((m) => m.unidad === rama.id).sort((a, b) => a.name.localeCompare(b.name));
  const today = todayISO();
  const upcoming = events.items
    .filter((e) => (e.rama === rama.id || e.rama === 'all') && e.date >= today)
    .sort((a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')))
    .slice(0, 6);
  const ramaAlbums = albums.items.filter((a) => a.rama === rama.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const filled = (list) => (list || []).some((i) => i.imagen || i.texto);
  const hasContent = CONTENT_KEYS.some((k) => has(rama[k])) || (rama.documentos || []).length > 0 || filled(rama.etapas) || filled(rama.panolines);
  const ceremonial = CEREMONIAL.filter(([k]) => has(rama[k]));
  const otros = OTROS.filter(([k]) => has(rama[k]));
  const docs = (rama.documentos || []).filter((d) => d.url);
  const toItems = (names, prefix) => names.map((nombre, i) => ({ id: `${prefix}${i}`, nombre, imagen: '', texto: '' }));
  const etapas = rama.etapas ?? toItems(ETAPAS_BASE[rama.id] || [], 'e');
  const panolines = rama.panolines ?? toItems(PANOLINES_BASE, 'p');

  return (
    <div style={{ '--rama': rama.color }}>
      <section className="rama-hero">
        <RamaImage rama={rama} src={rama.banner || rama.image} className="rama-hero-img" />
        <div className="rama-hero-overlay">
          <div className="container">
            <Link to="/ramas" className="back-link"><ArrowLeft size={18} /> Todas las ramas</Link>
            <span className="age-badge static">{rama.ages}</span>
            <h1>{rama.name}</h1>
            <p>{rama.description}</p>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => setEditing(true)}><Pencil size={18} /> Editar contenido</button>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!hasContent && (
            <div className="notice reveal">
              <Info size={22} />
              <div>
                <strong>Esta rama todavía no tiene información específica.</strong>
                <p>Pronto compartiremos su objetivo formativo, actividades, tradiciones y más.</p>
              </div>
              {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}><Plus size={16} /> Agregar contenido</button>}
            </div>
          )}

          {GENERAL.some(([k]) => has(rama[k])) && (
            <div className="info-grid">
              {GENERAL.filter(([k]) => has(rama[k])).map(([k, label, Icon]) => (
                <div className={`card info-card reveal ${k === 'objetivo' || k === 'actividades' ? 'wide' : ''}`} key={k}>
                  <h3><span className="icon-circle rama"><Icon size={20} /></span>{label}</h3>
                  <p className="pre">{rama[k]}</p>
                </div>
              ))}
            </div>
          )}

          <ImageSteps
            title="Etapas de progresión"
            icon={Award}
            itemName="Etapa"
            arrows
            color={rama.color}
            intro="El camino que recorre cada integrante de la rama, de la primera a la última etapa."
            items={etapas}
            isAdmin={isAdmin}
            folder={`ramas/${rama.id}/etapas`}
            onSave={(list) => db.patch('ramas', rama.id, { etapas: list })}
          />

          <ImageSteps
            title="Pañolines"
            icon={Flag}
            itemName="Pañolín"
            color={rama.color}
            items={panolines}
            isAdmin={isAdmin}
            folder={`ramas/${rama.id}/panolines`}
            onSave={(list) => db.patch('ramas', rama.id, { panolines: list })}
          />

          {ceremonial.length > 0 && (
            <div className="block reveal">
              <h2 className="block-title"><BookOpen size={24} /> Ceremonial</h2>
              <div className="grid-2">
                {ceremonial.map(([k, label]) => (
                  <div className="card info-card ceremonial" key={k}>
                    <h3>{label}</h3>
                    <p className="pre">{rama[k]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(otros.length > 0 || docs.length > 0) && (
            <div className="block reveal">
              <h2 className="block-title"><Music size={24} /> Canciones, textos y documentos</h2>
              <div className="grid-2">
                {otros.map(([k, label]) => (
                  <div className="card info-card" key={k}><h3>{label}</h3><p className="pre">{rama[k]}</p></div>
                ))}
                {docs.length > 0 && (
                  <div className="card info-card">
                    <h3>Documentos</h3>
                    <ul className="doc-list">
                      {docs.map((d, i) => (
                        <li key={i}><a href={d.url} target="_blank" rel="noreferrer" download={d.url.startsWith('data:') ? d.label || 'documento' : undefined}><FileText size={16} /> {d.label || 'Documento'}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="block reveal">
            <h2 className="block-title"><Users size={24} /> Responsables de la rama</h2>
            {members.loading ? <Loading /> : responsables.length ? (
              <div className="member-grid">
                {responsables.map((m) => <MemberCard key={m.id} m={m} ramas={ramas} showContact={!!user} />)}
              </div>
            ) : (
              <Empty icon={Users} title="Aún no hay responsables registrados" text={isAdmin ? 'Agrégalos desde la página Equipo.' : undefined}>
                {isAdmin && <Link className="btn btn-outline btn-sm" to="/equipo">Ir a Equipo</Link>}
              </Empty>
            )}
          </div>

          <div className="grid-2 block">
            <div className="reveal">
              <h2 className="block-title"><CalendarDays size={24} /> Próximos eventos</h2>
              {!isMember ? <PrivateHint /> : events.loading ? <Loading /> : upcoming.length ? (
                <div className="event-list">{upcoming.map((e) => <EventRow key={e.id} ev={e} ramas={ramas} onClick={setEventOpen} />)}</div>
              ) : <Empty icon={CalendarDays} title="No hay eventos próximos" />}
            </div>
            <div className="reveal">
              <h2 className="block-title"><Images size={24} /> Álbumes de fotos</h2>
              {!isMember ? <PrivateHint /> : albums.loading ? <Loading /> : ramaAlbums.length ? (
                <div className="grid-2 tight">{ramaAlbums.slice(0, 4).map((a) => <AlbumCard key={a.id} album={a} ramas={ramas} />)}</div>
              ) : <Empty icon={Images} title="Todavía no hay álbumes de esta rama" />}
            </div>
          </div>
        </div>
      </section>

      {editing && <RamaEditor rama={rama} onClose={() => setEditing(false)} />}
      {eventOpen && <EventDetail ev={eventOpen} ramas={ramas} onClose={() => setEventOpen(null)} />}
    </div>
  );
}

function PrivateHint() {
  return (
    <Empty icon={Lock} title="Contenido para miembros" text="Inicia sesión para ver eventos y fotos.">
      <Link className="btn btn-outline btn-sm" to="/ingresar">Iniciar sesión</Link>
    </Empty>
  );
}

function RamaEditor({ rama, onClose }) {
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState(() => {
    const f = { name: rama.name, ages: rama.ages, description: rama.description, color: rama.color, image: rama.image || '', banner: rama.banner || '', documentos: (rama.documentos || []).map((d) => ({ ...d })) };
    CONTENT_KEYS.forEach((k) => (f[k] = rama[k] || ''));
    return f;
  });
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(-1);
  const toast = useToast();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));
  const setDoc = (i, k, v) => setForm((f) => ({ ...f, documentos: f.documentos.map((d, j) => (j === i ? { ...d, [k]: v } : d)) }));

  const uploadDoc = async (i, file) => {
    if (!file) return;
    setUploadingDoc(i);
    try {
      const url = await db.upload(file, { folder: `ramas/${rama.id}/docs` });
      setForm((f) => ({ ...f, documentos: f.documentos.map((d, j) => (j === i ? { ...d, url, label: d.label || file.name } : d)) }));
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUploadingDoc(-1);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Solo se guardan los campos editables de ESTA rama.
      if (!form.name.trim()) throw new Error('El nombre de la rama es obligatorio');
      if (!/^#[0-9a-fA-F]{6}$/.test(form.color)) throw new Error('El color debe tener el formato #RRGGBB');
      await db.patch('ramas', rama.id, { ...form, name: form.name.trim(), documentos: form.documentos.filter((d) => d.url || d.label) });
      toast(`Contenido de ${rama.name} guardado`);
      onClose();
    } catch (err) {
      toast(err.message || 'No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const area = (k, label, rows = 4) => (
    <Field key={k} label={label} full>
      <textarea rows={rows} value={form[k]} onChange={set(k)} />
    </Field>
  );

  return (
    <Modal title={`Editar contenido · ${rama.name}`} onClose={onClose} wide>
      <div className="tabs" role="tablist">
        {[['general', 'General'], ['ceremonial', 'Ceremonial'], ['otros', 'Otros']].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      <form onSubmit={submit} className="form">
        <div hidden={tab !== 'general'} className="form-grid">
          <Field label="Nombre de la rama" required><input required value={form.name} onChange={set('name')} /></Field>
          <Field label="Edades" hint="Ej: 7 a 11 años"><input value={form.ages} onChange={set('ages')} /></Field>
          <Field label="Descripción corta (se ve en las tarjetas)" full><textarea rows={3} value={form.description} onChange={set('description')} /></Field>
          <Field label="Color de la rama" hint="Se usa en tarjetas, etiquetas y el calendario.">
            <div className="color-field">
              <input type="color" value={form.color} onChange={set('color')} aria-label="Elegir color" />
              <input value={form.color} onChange={set('color')} maxLength={7} />
            </div>
          </Field>
          <div />
          <ImageInput label="Imagen de tarjeta" value={form.image} onChange={set('image')} folder={`ramas/${rama.id}`} />
          <ImageInput label="Banner de la página" value={form.banner} onChange={set('banner')} folder={`ramas/${rama.id}`} maxDim={2000} />
          {GENERAL.map(([k, label]) => area(k, label, k === 'objetivo' || k === 'actividades' ? 4 : 2))}
        </div>
        <div hidden={tab !== 'ceremonial'} className="form-grid">
          {CEREMONIAL.map(([k, label]) => area(k, label, 5))}
        </div>
        <div hidden={tab !== 'otros'} className="form-grid">
          {area('canciones', 'Canciones', 6)}
          {area('textos', 'Textos importantes', 5)}
          <div className="full">
            <span className="field-label">Enlaces a documentos</span>
            {form.documentos.map((d, i) => (
              <div className="doc-edit" key={i}>
                <input placeholder="Nombre del documento" value={d.label || ''} onChange={(e) => setDoc(i, 'label', e.target.value)} />
                <input placeholder="https://…" value={d.url?.startsWith('data:') ? '(archivo subido)' : d.url || ''} onChange={(e) => setDoc(i, 'url', e.target.value)} disabled={d.url?.startsWith('data:')} />
                <label className="btn btn-sm btn-outline" title="Subir archivo">
                  <Upload size={15} /> {uploadingDoc === i ? '…' : 'Archivo'}
                  <input type="file" hidden onChange={(e) => uploadDoc(i, e.target.files[0])} />
                </label>
                <button type="button" className="icon-btn danger" aria-label="Quitar documento" onClick={() => setForm((f) => ({ ...f, documentos: f.documentos.filter((_, j) => j !== i) }))}><Trash2 size={16} /></button>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setForm((f) => ({ ...f, documentos: [...f.documentos, { label: '', url: '' }] }))}>
              <Link2 size={15} /> Agregar documento
            </button>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={saving || uploadingDoc >= 0}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </Modal>
  );
}
