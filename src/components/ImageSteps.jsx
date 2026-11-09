import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Field, ImageEditButton, Modal } from './ui.jsx';
import { useToast } from '../lib/hooks.jsx';

/**
 * Fila de recuadros con imagen grande, nombre y texto debajo.
 * Se usa para las Etapas de progresión y los Pañolines de cada rama.
 * Cada cambio guarda solo la lista de ESTA sección de ESTA rama (onSave).
 */
export default function ImageSteps({ title, icon: Icon, intro, items, isAdmin, onSave, arrows, itemName, folder, color }) {
  const [editing, setEditing] = useState(null); // índice o 'nuevo'
  const toast = useToast();
  const hasContent = items.some((i) => i.imagen || i.texto);
  if (!isAdmin && !items.length) return null;
  if (!isAdmin && !hasContent && !arrows) return null;

  const save = async (next, msg) => {
    try {
      await onSave(next);
      if (msg) toast(msg);
    } catch (e) {
      toast(e.message || 'No se pudo guardar', 'error');
      throw e;
    }
  };
  const move = (i, d) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    save(next);
  };
  const remove = (i) => {
    if (!window.confirm(`¿Quitar "${items[i].nombre || itemName}"? Se borra su imagen y su texto.`)) return;
    save(items.filter((_, j) => j !== i), `${itemName} quitado`);
  };

  return (
    <div className="block reveal">
      <div className="steps-head">
        <h2 className="block-title"><Icon size={24} /> {title}</h2>
        {isAdmin && (
          <button className="btn btn-sm btn-outline" onClick={() => setEditing('nuevo')}><Plus size={16} /> Agregar {itemName.toLowerCase()}</button>
        )}
      </div>
      {intro && <p className="muted">{intro}</p>}
      {items.length === 0 ? (
        <p className="muted">Aún no hay recuadros. Pulsa "Agregar {itemName.toLowerCase()}".</p>
      ) : (
        <div className={`steps-row ${arrows ? 'with-arrows' : ''}`} style={{ '--n': items.length, '--rama': color }}>
          {items.map((it, i) => (
            <figure key={it.id || i} className="step-card card">
              <div className="step-img">
                {it.imagen ? (
                  <img src={it.imagen} alt={it.nombre || itemName} loading="lazy" />
                ) : (
                  <div className="step-ph"><ImagePlus size={40} strokeWidth={1.5} /><span>{isAdmin ? 'Sube una imagen' : 'Imagen pendiente'}</span></div>
                )}
                {arrows && <span className="step-num">{i + 1}</span>}
                {isAdmin && (
                  <ImageEditButton folder={folder} keepPng label={it.imagen ? 'Cambiar' : 'Subir imagen'}
                    onSave={(url) => save(items.map((x, j) => (j === i ? { ...x, imagen: url } : x)))} />
                )}
              </div>
              <figcaption>
                <h3>{it.nombre || `${itemName} ${i + 1}`}</h3>
                {it.texto ? <p className="pre">{it.texto}</p> : isAdmin ? <p className="muted small">Sin descripción todavía.</p> : null}
                {isAdmin && (
                  <div className="step-tools">
                    <button className="icon-btn" title="Editar nombre y texto" aria-label="Editar nombre y texto" onClick={() => setEditing(i)}><Pencil size={16} /></button>
                    <button className="icon-btn" title="Mover a la izquierda" aria-label="Mover a la izquierda" disabled={i === 0} onClick={() => move(i, -1)}><ChevronLeft size={18} /></button>
                    <button className="icon-btn" title="Mover a la derecha" aria-label="Mover a la derecha" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ChevronRight size={18} /></button>
                    <button className="icon-btn danger" title="Quitar" aria-label="Quitar" onClick={() => remove(i)}><Trash2 size={16} /></button>
                  </div>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {editing !== null && (
        <StepForm
          itemName={itemName}
          initial={editing === 'nuevo' ? { nombre: '', texto: '' } : items[editing]}
          onClose={() => setEditing(null)}
          onSubmit={async (data) => {
            const next = editing === 'nuevo'
              ? [...items, { id: Math.random().toString(36).slice(2), imagen: '', ...data }]
              : items.map((x, j) => (j === editing ? { ...x, ...data } : x));
            await save(next, editing === 'nuevo' ? `${itemName} agregado` : 'Cambios guardados');
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function StepForm({ itemName, initial, onClose, onSubmit }) {
  const [f, setF] = useState({ nombre: initial.nombre || '', texto: initial.texto || '' });
  const [saving, setSaving] = useState(false);
  return (
    <Modal title={initial.nombre ? `Editar: ${initial.nombre}` : `Nuevo: ${itemName.toLowerCase()}`} onClose={onClose}>
      <form className="form" onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try { await onSubmit({ nombre: f.nombre.trim(), texto: f.texto.trim() }); } catch { setSaving(false); }
      }}>
        <Field label="Nombre" required full><input required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} autoFocus /></Field>
        <Field label="¿Qué significa?" hint="Este texto aparece debajo de la imagen." full>
          <textarea rows={6} value={f.texto} onChange={(e) => setF({ ...f, texto: e.target.value })} />
        </Field>
        <p className="hint">La imagen se sube con el botón que aparece sobre cada recuadro.</p>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={saving || !f.nombre.trim()}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}
