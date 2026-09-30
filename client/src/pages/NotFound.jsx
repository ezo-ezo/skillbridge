import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center">
      <div>
        <Logo className="mb-8" />
        <p className="text-7xl font-extrabold text-brand-gradient">404</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">This page doesn't exist</h1>
        <p className="mt-2 text-slate-500">The link may be broken or the page may have moved.</p>
        <Link to="/"><Button className="mt-6">Back to home</Button></Link>
      </div>
    </div>
  );
}
