import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Eye, Trees, Users, HeartHandshake, Globe2, PlayCircle, Pencil, Star, Smile, Shield } from 'lucide-react';
import { PageHero, Modal, Field } from '../components/ui.jsx';
import { useAuth, useSettings, useToast } from '../lib/hooks.jsx';
import { LEY_SCOUT } from '../data/seed.js';
import * as db from '../lib/db.js';

const PRINCIPIOS = [
  { icon: Star, title: 'Espiritualidad', text: 'Buscamos el sentido de la vida y vivimos nuestra fe con respeto por todas las creencias.' },
  { icon: Users, title: 'Compromiso con los demás', text: 'Nos comprometemos con nuestra comunidad, el país y la paz entre los pueblos.' },
  { icon: Smile, title: 'Responsabilidad personal', text: 'Cada persona es protagonista de su propio desarrollo.' },
  { icon: Shield, title: 'Protección', text: 'Cuidamos que cada actividad sea un espacio seguro, respetuoso e inclusivo.' },
];

export function toEmbed(url) {
  if (!url) return '';
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

export default function About() {
  const { isAdmin } = useAuth();
  const { settings } = useSettings();
  const [editing, setEditing] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const embed = toEmbed(settings.videoUrl);

  const saveVideo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.patch('settings', 'site', { videoUrl: videoUrl.trim() }, settings);
      toast('Video actualizado');
      setEditing(false);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHero eyebrow="Quiénes somos" title="Nuestra historia y propósito" subtitle="Un grupo de familias, jóvenes y voluntarios que cree en el poder del escultismo para formar mejores personas." />

      <section className="section">
        <div className="container split">
          <div className="reveal">
            <span className="eyebrow">Historia</span>
            <h2>Grupo Scout Alcázar</h2>
            <p>Nacimos en Las Condes con el sueño de ofrecer a niñas, niños y jóvenes un espacio para crecer en libertad, en contacto con la naturaleza y comprometidos con su entorno. A lo largo de los años, cientos de lobatos, golondrinas, guías, scouts, pioneros y caminantes han pasado por nuestras filas.</p>
            <p>Hoy seguimos fieles a la idea de Baden-Powell: dejar el mundo en mejores condiciones de como lo encontramos.</p>
          </div>
          <div className="card highlight reveal">
            <span className="icon-circle"><Globe2 size={26} /></span>
            <h3>Asociación de Guías y Scouts de Chile</h3>
            <p>Somos parte de la Asociación de Guías y Scouts de Chile, miembro de la Organización Mundial del Movimiento Scout y de la Asociación Mundial de las Guías Scouts. Seguimos su programa educativo, sus políticas de protección y su formación de dirigentes.</p>
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container grid-2">
          <div className="card feature reveal">
            <span className="icon-circle orange"><Target size={26} /></span>
            <h3>Misión</h3>
            <p>Contribuir a la educación de niñas, niños y jóvenes mediante un sistema de valores basado en la Promesa y la Ley Scout, para que construyan un mundo mejor y se realicen como personas.</p>
          </div>
          <div className="card feature reveal">
            <span className="icon-circle orange"><Eye size={26} /></span>
            <h3>Visión</h3>
            <p>Ser un grupo reconocido en Las Condes por formar jóvenes autónomos, solidarios, responsables y comprometidos, con una comunidad de familias activa y unida.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-3">
          {[
            { icon: Trees, title: 'Vida al aire libre', text: 'La naturaleza es nuestra sala de clases: campamentos, caminatas y respeto por el medioambiente.' },
            { icon: Users, title: 'Comunidad', text: 'Familias, dirigentes y jóvenes forman una gran comunidad que se apoya y celebra junta.' },
            { icon: HeartHandshake, title: 'Servicio', text: 'Aprendemos a mirar las necesidades de los demás y a actuar para transformar nuestro entorno.' },
          ].map(({ icon: Icon, title, text }) => (
            <div className="card feature reveal" key={title}>
              <span className="icon-circle green"><Icon size={26} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">En video</span>
            <h2>Conócenos en acción</h2>
            {isAdmin && (
              <button className="btn btn-outline btn-sm" onClick={() => { setVideoUrl(settings.videoUrl || ''); setEditing(true); }}>
                <Pencil size={16} /> Configurar video
              </button>
            )}
          </div>
          <div className="video-wrap reveal">
            {embed ? (
              <iframe src={embed} title="Video del Grupo Scout Alcázar" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : (
              <div className="video-empty"><PlayCircle size={56} /><p>Pronto compartiremos un video del grupo.</p></div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Nuestros valores</span>
            <h2>La Ley Scout</h2>
          </div>
          <div className="law-grid">
            {LEY_SCOUT.map((l, i) => (
              <div className="card law reveal" key={i}><b>{i + 1}</b><p>{l}</p></div>
            ))}
          </div>
          <div className="section-head reveal" style={{ marginTop: 56 }}>
            <span className="eyebrow">Lo que nos guía</span>
            <h2>Principios del grupo</h2>
          </div>
          <div className="grid-4">
            {PRINCIPIOS.map(({ icon: Icon, title, text }) => (
              <div className="card feature reveal" key={title}>
                <span className="icon-circle"><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="center" style={{ marginTop: 40 }}>
            <Link className="btn btn-primary btn-lg" to="/contacto?motivo=inscripcion">Quiero ser parte</Link>
          </div>
        </div>
      </section>

      {editing && (
        <Modal title="Configurar video" onClose={() => setEditing(false)}>
          <form onSubmit={saveVideo} className="form">
            <Field label="Enlace del video" hint="Pega un enlace de YouTube o Vimeo. Déjalo vacío para ocultar el video." full>
              <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
            </Field>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
              <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
