import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Empty, Field, ImageInput, Loading, Modal, PageHero } from '../components/ui.jsx';
import { MemberCard } from '../components/Shared.jsx';
import { useAuth, useCollection, useRamas, useToast } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

const EMPTY = { photo: '', name: '', cargo: '', unidad: 'admin', edad: '', descripcion: '', email: '', telefono: '', danza: '', comida: '', dato: '', alsoAdmin: false };

export default function Team() {
  const { isAdmin } = useAuth();
  const { ramas } = useRamas();
  const { items, loading, error } = useCollection('members');
  const [filter, setFilter] = useState('todos');
  const [editing, setEditing] = useState(null);
  const toast = useToast();

  const groups = [{ id: 'admin', name: 'Administración', color: '#19345F' }, ...ramas];
  const inGroup = (m, g) => m.unidad === g || (g === 'admin' && m.alsoAdmin);
  const visibleGroups = groups.filter((g) => filter === 'todos' || filter === g.id);
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));

  const del = async (m) => {
    if (!window.confirm(`¿Eliminar a ${m.name} del equipo?`)) return;
    try {
      await db.remove('members', m.id);
      toast('Integrante eliminado');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <>
      <PageHero eyebrow="Equipo" title="Nuestros dirigentes" subtitle="Voluntarias y voluntarios que dedican su tiempo a acompañar a cada rama." />
      <section className="section">
        <div className="container">
          <div className="toolbar">
            <div className="chips" role="group" aria-label="Filtrar por unidad">
              <button className={`chip ${filter === 'todos' ? 'active' : ''}`} onClick={() => setFilter('todos')}>Todos</button>
              {groups.map((g) => (
                <button key={g.id} className={`chip ${filter === g.id ? 'active' : ''}`} style={{ '--rama': g.color }} onClick={() => setFilter(g.id)}>{g.name}</button>
              ))}
            </div>
            {isAdmin && <button className="btn btn-primary" onClick={() => setEditing({ ...EMPTY })}><Plus size={18} /> Agregar integrante</button>}
          </div>

          {loading ? <Loading /> : error ? <Empty title="No se pudo cargar el equipo" text={error} /> : items.length === 0 ? (
            <Empty icon={Users} title="Aún no hay integrantes registrados" text={isAdmin ? 'Agrega al primer dirigente con el botón de arriba.' : 'Pronto presentaremos al equipo.'} />
          ) : (
            visibleGroups.map((g) => {
              const list = sorted.filter((m) => inGroup(m, g.id));
              if (!list.length && filter === 'todos') return null;
              return (
                <div className="team-group" key={g.id}>
                  <h2 className="block-title"><span className="dot lg" style={{ background: g.color }} /> {g.name}</h2>
                  {list.length ? (
                    <div className="grid-3">
                      {list.map((m) => (
                        <MemberCard key={m.id} m={m} ramas={ramas} showContact onEdit={isAdmin ? (x) => setEditing({ ...EMPTY, ...x }) : null} onDelete={isAdmin ? del : null} />
                      ))}
                    </div>
                  ) : <Empty icon={Users} title={`No hay integrantes en ${g.name}`} />}
                </div>
              );
            })
          )}
        </div>
      </section>
      {editing && <MemberForm initial={editing} ramas={ramas} onClose={() => setEditing(null)} />}
    </>
  );
}

function MemberForm({ initial, ramas, onClose }) {
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }));
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast('El nombre es obligatorio', 'error');
    setSaving(true);
    try {
      await db.save('members', { ...f, name: f.name.trim(), alsoAdmin: f.unidad === 'admin' ? false : f.alsoAdmin });
      toast(initial.id ? 'Integrante actualizado' : 'Integrante agregado');
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title={initial.id ? 'Editar integrante' : 'Nuevo integrante'} onClose={onClose} wide>
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          <div className="full"><ImageInput label="Foto" value={f.photo} onChange={set('photo')} folder="equipo" maxDim={600} /></div>
          <Field label="Nombre" required><input required value={f.name} onChange={set('name')} /></Field>
          <Field label="Cargo"><input value={f.cargo} onChange={set('cargo')} placeholder="Ej: Jefa de rama" /></Field>
          <Field label="Unidad">
            <select value={f.unidad} onChange={set('unidad')}>
              <option value="admin">Administración</option>
              {ramas.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Edad"><input type="number" min="14" max="99" value={f.edad} onChange={set('edad')} /></Field>
          {f.unidad !== 'admin' && (
            <label className="checkbox full">
              <input type="checkbox" checked={!!f.alsoAdmin} onChange={set('alsoAdmin')} />
              También pertenece a Administración
            </label>
          )}
          <Field label="Descripción" full><textarea rows={3} value={f.descripcion} onChange={set('descripcion')} /></Field>
          <Field label="Correo"><input type="email" value={f.email} onChange={set('email')} /></Field>
          <Field label="Teléfono (opcional)"><input type="tel" value={f.telefono} onChange={set('telefono')} /></Field>
          <Field label="Danza favorita"><input value={f.danza} onChange={set('danza')} /></Field>
          <Field label="Comida favorita de campamento"><input value={f.comida} onChange={set('comida')} /></Field>
          <Field label="Dato curioso" full><input value={f.dato} onChange={set('dato')} /></Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}
