import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { Field, Logo } from '../components/ui.jsx';
import { useAuth, useToast } from '../lib/hooks.jsx';
import * as db from '../lib/db.js';

export default function Login() {
  const { user } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const from = loc.state?.from || '/';
  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        const u = await db.auth.login(f.email, f.password);
        toast(`¡Hola, ${u.name.split(' ')[0]}!`);
      } else {
        const u = await db.auth.register(f.name, f.email, f.password);
        if (!u) toast('Revisa tu correo para confirmar la cuenta.');
        else if (u.role === 'admin') toast('Cuenta creada como administrador');
        else toast('Cuenta creada. Un administrador debe aprobarla.');
      }
      nav(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section auth-section">
      <div className="card auth-card">
        <div className="center"><Logo size={64} /></div>
        <h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
        <p className="muted center">{mode === 'login' ? 'Accede a fotos, eventos, comunicaciones y equipo.' : 'Las cuentas nuevas quedan pendientes hasta que un administrador las apruebe.'}</p>
        <form className="form" onSubmit={submit}>
          {mode === 'register' && <Field label="Nombre" required full><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></Field>}
          <Field label="Correo" required full><input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></Field>
          <Field label="Contraseña" required full><input required type="password" minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></Field>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {mode === 'login' ? <><LogIn size={18} /> {busy ? 'Ingresando…' : 'Ingresar'}</> : <><UserPlus size={18} /> {busy ? 'Creando…' : 'Crear cuenta'}</>}
          </button>
        </form>
        <button className="btn btn-ghost btn-block" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </section>
  );
}
