import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          Exam Tracker
        </Link>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
