import { Link } from 'react-router-dom';
import {
  Compass, CalendarDays, MessageCircle, Trees, Users, HeartHandshake, Sparkles, Flame, Map, Award, ArrowRight, CheckCircle2,
} from 'lucide-react';
import RamaCard from '../components/RamaCard.jsx';
import { Loading } from '../components/ui.jsx';
import { useRamas } from '../lib/hooks.jsx';

const BENEFITS = [
  { icon: Trees, title: 'Vida al aire libre', text: 'Campamentos, excursiones y aprendizaje en contacto con la naturaleza.' },
  { icon: Users, title: 'Amistad y comunidad', text: 'Un espacio seguro para crecer junto a otros niños, niñas y jóvenes.' },
  { icon: HeartHandshake, title: 'Servicio', text: 'Aprendemos a ayudar y a comprometernos con nuestro entorno.' },
  { icon: Award, title: 'Liderazgo', text: 'Cada joven asume desafíos y responsabilidades a su medida.' },
];

const EXPERIENCE = [
  { icon: Flame, title: 'Fogatas y campamentos', text: 'Noches bajo las estrellas, canciones y tradiciones que se recuerdan toda la vida.' },
  { icon: Map, title: 'Aventura y exploración', text: 'Rutas, orientación, pionerismo y técnicas scout para desenvolverse en cualquier lugar.' },
  { icon: Sparkles, title: 'Aprender haciendo', text: 'Proyectos reales donde cada uno descubre sus talentos y los pone al servicio de los demás.' },
];

export default function Home() {
  const { ramas, loading } = useRamas();
  return (
    <>
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <svg viewBox="0 0 1440 400" preserveAspectRatio="none">
            <path d="M0 400 L240 170 L380 290 L620 90 L860 300 L1040 180 L1240 300 L1440 140 L1440 400 Z" fill="rgba(255,255,255,.06)" />
            <path d="M0 400 L180 280 L360 360 L560 240 L760 380 L980 260 L1200 360 L1440 260 L1440 400 Z" fill="rgba(255,255,255,.08)" />
          </svg>
        </div>
        <div className="container hero-inner">
          <span className="eyebrow light">Asociación de Guías y Scouts de Chile</span>
          <h1>Grupo Scout <span className="accent">Alcázar</span></h1>
          <p className="lead">Desde Las Condes, invitamos a niñas, niños y jóvenes de 7 a 19 años a vivir el escultismo: aventura, amistad, naturaleza y servicio.</p>
          <div className="hero-cta">
            <Link className="btn btn-primary btn-lg" to="/contacto"><MessageCircle size={20} /> Contáctanos</Link>
            <Link className="btn btn-light btn-lg" to="/ramas"><Compass size={20} /> Explora las ramas</Link>
            <Link className="btn btn-outline-light btn-lg" to="/eventos"><CalendarDays size={20} /> Ver eventos</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="reveal">
            <span className="eyebrow">Quiénes somos</span>
            <h2>Un lugar para crecer, explorar y servir</h2>
            <p>Somos un grupo scout de Las Condes formado por familias, jóvenes y dirigentes voluntarios. Cada sábado nos reunimos para jugar, aprender y prepararnos para nuevas aventuras, siguiendo el método scout de la Asociación de Guías y Scouts de Chile.</p>
            <ul className="checklist">
              <li><CheckCircle2 size={20} /> Programa adaptado a cada edad</li>
              <li><CheckCircle2 size={20} /> Dirigentes capacitados y comprometidos</li>
              <li><CheckCircle2 size={20} /> Actividades seguras y con propósito</li>
            </ul>
            <Link to="/quienes-somos" className="btn btn-secondary">Conoce nuestra historia <ArrowRight size={18} /></Link>
          </div>
          <div className="benefit-grid">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div className="card benefit reveal" key={title}>
                <span className="icon-circle"><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">La experiencia scout</span>
            <h2>Más que una actividad de fin de semana</h2>
            <p>El escultismo es un movimiento educativo presente en más de 170 países. Aquí cada joven es protagonista de su propio crecimiento.</p>
          </div>
          <div className="grid-3">
            {EXPERIENCE.map(({ icon: Icon, title, text }) => (
              <div className="card feature reveal" key={title}>
                <span className="icon-circle orange"><Icon size={26} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Nuestras ramas</span>
            <h2>Una unidad para cada etapa</h2>
            <p>Seis ramas acompañan a niñas, niños y jóvenes en cada momento de su desarrollo.</p>
          </div>
          {loading ? <Loading /> : (
            <div className="grid-3">{ramas.map((r) => <RamaCard key={r.id} rama={r} cta="Conocer" />)}</div>
          )}
        </div>
      </section>

      <section className="section section-tint">
        <div className="container join reveal">
          <div>
            <span className="eyebrow">Súmate</span>
            <h2>¿Cómo integrarse al grupo?</h2>
          </div>
          <ol className="steps">
            <li><b>1</b><div><h3>Escríbenos</h3><p>Completa el formulario de contacto con la edad de tu hijo o hija.</p></div></li>
            <li><b>2</b><div><h3>Ven a una reunión</h3><p>Te invitamos a un sábado de prueba para conocer la rama.</p></div></li>
            <li><b>3</b><div><h3>Inscríbete</h3><p>Completa la inscripción en la Asociación y ¡comienza la aventura!</p></div></li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-final reveal">
            <h2>¿Listos para la aventura?</h2>
            <p>Ven a conocernos un sábado. Te esperamos con los brazos abiertos y el pañolín puesto.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" to="/contacto?motivo=inscripcion">Quiero unirme</Link>
              <Link className="btn btn-outline-light btn-lg" to="/preguntas-frecuentes">Preguntas frecuentes</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
