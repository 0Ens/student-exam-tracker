import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          Exam Tracker
        </Link>
        {user && (
          <nav>
            <NavLink to="/">Dashboard</NavLink>
            <span className="muted">{user.name}</span>
            <button type="button" className="secondary" onClick={onLogout}>
              Log out
            </button>
          </nav>
        )}
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
