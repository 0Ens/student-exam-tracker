import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { deadlinesApi, gradesApi } from '../api.js';
import { TYPE_LABELS } from '../components/ExamForm.jsx';

// Number of days shown in the "upcoming" list.
const WINDOW_DAYS = 14;

// Dates are saved as midnight UTC, so they are shown in UTC to keep the same day.
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

function whenText(daysLeft) {
  if (daysLeft === 0) return 'today';
  if (daysLeft === 1) return 'tomorrow';
  if (daysLeft > 1) return `in ${daysLeft} days`;
  if (daysLeft === -1) return '1 day ago';
  return `${-daysLeft} days ago`;
}

function DeadlineItem({ item, overdue }) {
  return (
    <li className={overdue ? 'deadline overdue' : 'deadline'}>
      <div>
        {overdue && (
          <span className="overdue-mark" aria-hidden="true">
            !{' '}
          </span>
        )}
        <strong>{item.title}</strong> <span className="badge">{TYPE_LABELS[item.type]}</span>
        <div className="muted">
          <Link to={`/courses/${item.course.id}`}>{item.course.code}</Link> ·{' '}
          {dateFormat.format(new Date(item.date))} · {item.weight}%
        </div>
      </div>
      <span className={overdue ? 'when overdue-text' : 'when'}>{whenText(item.daysLeft)}</span>
    </li>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [grades, setGrades] = useState(null);
  const [deadlines, setDeadlines] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([gradesApi.list(), deadlinesApi.list(WINDOW_DAYS)])
      .then(([g, d]) => {
        setGrades(g);
        setDeadlines(d);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const header = <h1>Hello, {user.name}</h1>;

  if (loading) {
    return (
      <section className="stack">
        {header}
        <p className="muted">Loading your dashboard...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="stack">
        {header}
        <p className="error" role="alert">
          Could not load the dashboard: {error}
        </p>
        <Link to="/courses">Manage your courses</Link>
      </section>
    );
  }

  if (grades.courses.length === 0) {
    return (
      <section className="stack">
        {header}
        <div className="card">
          <p>You have no courses yet.</p>
          <Link to="/courses">Add your first course</Link>
        </div>
      </section>
    );
  }

  const { overdue, upcoming } = deadlines;

  return (
    <section className="stack">
      {header}

      <div className="stats">
        <div className="card stat">
          <span className="muted">Estimated GPA</span>
          <strong aria-label="Estimated GPA">
            {grades.gpa === null ? '-' : grades.gpa.toFixed(2)}
          </strong>
          {grades.gpa === null && <span className="muted">No grades yet</span>}
        </div>
        <div className="card stat">
          <span className="muted">Upcoming ({WINDOW_DAYS} days)</span>
          <strong aria-label="Upcoming items">{upcoming.length}</strong>
        </div>
        <div className={overdue.length ? 'card stat stat-overdue' : 'card stat'}>
          <span className="muted">Overdue</span>
          <strong aria-label="Overdue items">{overdue.length}</strong>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="card">
          <h2>Overdue</h2>
          <p className="muted">The date has passed and there is no grade yet.</p>
          <ul className="deadline-list" aria-label="Overdue">
            {overdue.map((item) => (
              <DeadlineItem key={item.id} item={item} overdue />
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="muted">Nothing in the next {WINDOW_DAYS} days.</p>
        ) : (
          <ul className="deadline-list" aria-label="Upcoming">
            {upcoming.map((item) => (
              <DeadlineItem key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Course averages</h2>
        <table className="grades-table">
          <thead>
            <tr>
              <th scope="col">Course</th>
              <th scope="col">Credits</th>
              <th scope="col">Average</th>
              <th scope="col">Letter</th>
            </tr>
          </thead>
          <tbody>
            {grades.courses.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/courses/${c.id}`}>{c.code}</Link> {c.name}
                </td>
                <td>{c.credits}</td>
                <td>
                  {c.average === null ? (
                    <span className="muted">No grades</span>
                  ) : (
                    <>
                      {c.average} <span className="muted">({c.gradedWeight}% graded)</span>
                    </>
                  )}
                </td>
                <td>{c.letter ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">
          The average only uses graded items. The GPA uses a 4.0 scale (AA = 4.0 ... FF = 0) and is
          weighted by credits.
        </p>
      </div>
    </section>
  );
}
