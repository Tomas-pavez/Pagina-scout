import { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { Navbar, Footer } from './components/Layout.jsx';
import { Empty, RequireMember, EditModeToggle } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Ramas from './pages/Ramas.jsx';
import RamaDetail from './pages/RamaDetail.jsx';
import PatrullaDetail from './pages/PatrullaDetail.jsx';
import Team from './pages/Team.jsx';
import Events from './pages/Events.jsx';
import Photos from './pages/Photos.jsx';
import AlbumDetail from './pages/AlbumDetail.jsx';
import Comms from './pages/Comms.jsx';
import FAQ from './pages/FAQ.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Admin from './pages/Admin.jsx';
import { useAuth, useContent } from './lib/hooks.jsx';
import { MODE } from './lib/db.js';

/** Anima suavemente los elementos con clase .reveal al entrar en pantalla. */
function useReveal() {
  const loc = useLocation();
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
      { threshold: 0.12 }
    );
    const scan = () => document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [loc.pathname]);
}

/** Usa el logo subido por un administrador como ícono de la pestaña del navegador. */
function useFavicon() {
  const { site } = useContent();
  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]'); // el primero: 32x32
    if (!link) return;
    if (site.logo) { link.href = site.logo; link.removeAttribute('type'); }
    else { link.href = './favicon-32.png'; link.type = 'image/png'; }
  }, [site.logo]);
}

function AdminOnly({ children }) {
  const { isAdmin, ready } = useAuth();
  if (!ready) return null;
  return isAdmin ? children : (
    <div className="container section"><Empty title="Acceso solo para administradores"><Link className="btn btn-primary" to="/">Volver al inicio</Link></Empty></div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useReveal();
  useFavicon();
  return (
    <>
      <Navbar />
      {MODE === 'local' && <div className="mode-banner">Modo demostración: los datos se guardan en este navegador.</div>}
      <main id="contenido">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quienes-somos" element={<About />} />
          <Route path="/ramas" element={<Ramas />} />
          <Route path="/ramas/:id" element={<RamaDetail />} />
          <Route path="/ramas/:id/patrullas/:pid" element={<PatrullaDetail />} />
          <Route path="/preguntas-frecuentes" element={<FAQ />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/ingresar" element={<Login />} />
          <Route path="/equipo" element={<RequireMember><Team /></RequireMember>} />
          <Route path="/eventos" element={<RequireMember><Events /></RequireMember>} />
          <Route path="/fotos" element={<RequireMember><Photos /></RequireMember>} />
          <Route path="/fotos/:id" element={<RequireMember><AlbumDetail /></RequireMember>} />
          <Route path="/comunicaciones" element={<RequireMember><Comms /></RequireMember>} />
          <Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />
          <Route path="*" element={<div className="container section"><Empty title="Página no encontrada" text="La página que buscas no existe."><Link className="btn btn-primary" to="/">Ir al inicio</Link></Empty></div>} />
        </Routes>
      </main>
      <Footer />
      <EditModeToggle />
    </>
  );
}
