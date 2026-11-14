import { useAuth } from '../auth/AuthContext.jsx';

// Placeholder until the dashboard (WBS 4.4) is built in sprint S4.
export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <section>
      <h1>Hello, {user.name}</h1>
      <p className="muted">Upcoming exams and averages will be shown here.</p>
    </section>
  );
}
