import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Plus, Pencil, Trash2, HelpCircle, EyeOff } from 'lucide-react';
import { Empty, Field, Loading, Modal, PageHero } from '../components/ui.jsx';
import { useAuth, useCollection, useToast } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

export default function FAQ() {
  const { isAdmin } = useAuth();
  const { items, loading, error } = useCollection('faqs');
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const toast = useToast();
  const list = items.filter((f) => isAdmin || f.active).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  const del = async (f) => {
    if (!window.confirm('¿Eliminar esta pregunta?')) return;
    try { await db.remove('faqs', f.id); toast('Pregunta eliminada'); } catch (e) { toast(e.message, 'error'); }
  };
  const toggle = async (f) => {
    try { await db.save('faqs', { ...f, active: !f.active }); toast(f.active ? 'Pregunta desactivada' : 'Pregunta activada'); } catch (e) { toast(e.message, 'error'); }
  };
  const nextOrder = items.reduce((m, f) => Math.max(m, Number(f.order) || 0), 0) + 1;

  return (
    <>
      <PageHero eyebrow="Ayuda" title="Preguntas frecuentes" subtitle="Todo lo que necesitas saber antes de sumarte al grupo." />
      <section className="section">
        <div className="container narrow">
          {isAdmin && (
            <div className="toolbar end">
              <button className="btn btn-primary" onClick={() => setEditing({ q: '', a: '', order: nextOrder, active: true })}><Plus size={18} /> Agregar pregunta</button>
            </div>
          )}
          {loading ? <Loading /> : error ? <Empty title="No se pudieron cargar las preguntas" text={error} /> : list.length === 0 ? (
            <Empty icon={HelpCircle} title="Aún no hay preguntas frecuentes" />
          ) : (
            <div className="accordion">
              {list.map((f) => (
                <div key={f.id} className={`acc-item ${open === f.id ? 'open' : ''} ${!f.active ? 'inactive' : ''}`}>
                  <button className="acc-q" onClick={() => setOpen(open === f.id ? null : f.id)} aria-expanded={open === f.id}>
                    <span>{!f.active && <EyeOff size={16} />} {f.q}</span>
                    <ChevronDown className="acc-icon" size={20} />
                  </button>
                  <div className="acc-a" hidden={open !== f.id}>
                    <p className="pre">{f.a}</p>
                    {isAdmin && (
                      <div className="admin-row">
                        <span className="muted">Orden: {f.order}</span>
                        <button className="btn btn-sm btn-outline" onClick={() => setEditing(f)}><Pencil size={15} /> Editar</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => toggle(f)}>{f.active ? 'Desactivar' : 'Activar'}</button>
                        <button className="btn btn-sm btn-danger-ghost" onClick={() => del(f)}><Trash2 size={15} /> Eliminar</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="card cta-small reveal">
            <h3>¿No encontraste tu respuesta?</h3>
            <p>Escríbenos y te responderemos a la brevedad.</p>
            <Link className="btn btn-primary" to="/contacto">Contáctanos</Link>
          </div>
        </div>
      </section>
      {editing && <FaqForm initial={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function FaqForm({ initial, onClose }) {
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const submit = async (e) => {
    e.preventDefault();
    if (!f.q.trim() || !f.a.trim()) return toast('Completa la pregunta y la respuesta', 'error');
    setSaving(true);
    try {
      await db.save('faqs', { ...f, q: f.q.trim(), a: f.a.trim(), order: Number(f.order) || 0 });
      toast(initial.id ? 'Pregunta actualizada' : 'Pregunta agregada');
      onClose();
    } catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal title={initial.id ? 'Editar pregunta' : 'Nueva pregunta'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <Field label="Pregunta" required full><input required value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></Field>
        <Field label="Respuesta" required full><textarea required rows={5} value={f.a} onChange={(e) => setF({ ...f, a: e.target.value })} /></Field>
        <div className="form-grid">
          <Field label="Orden" hint="Número menor aparece primero"><input type="number" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} /></Field>
          <label className="checkbox"><input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Activa (visible al público)</label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}
