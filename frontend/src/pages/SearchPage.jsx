import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { coursesApi, examsApi } from '../api.js';
import { TYPE_LABELS } from '../components/ExamForm.jsx';

const FIELDS = ['q', 'courseId', 'type', 'from', 'to'];

// Dates are saved as midnight UTC, so they are shown in UTC to keep the same day.
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

// The filters live in the URL (/search?type=exam), so the back button and
// a reload keep the last search.
function readFilters(params) {
  return Object.fromEntries(FIELDS.map((key) => [key, params.get(key) ?? '']));
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState(() => readFilters(params));
  const [courses, setCourses] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // The course list is only needed for the course filter.
  useEffect(() => {
    coursesApi
      .list()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    const filters = readFilters(params);
    setForm(filters);
    setLoading(true);
    setError('');
    examsApi
      .search(filters)
      .then(setResults)
      .catch((err) => {
        setResults(null);
        // A 400 has field errors such as { to: ['From must be before To'] }.
        const firstDetail = err.details && Object.values(err.details)[0]?.[0];
        setError(firstDetail || err.message);
      })
      .finally(() => setLoading(false));
  }, [params]);

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = (event) => {
    event.preventDefault();
    setParams(Object.fromEntries(Object.entries(form).filter(([, value]) => value.trim() !== '')));
  };

  const clear = () => setParams({});

  return (
    <section className="stack">
      <h1>Search</h1>

      <form className="card search-form" onSubmit={submit} aria-label="Search filters">
        <label className="search-text">
          Search
          <input
            name="q"
            type="search"
            placeholder="Title or course code"
            value={form.q}
            onChange={change}
            maxLength={100}
          />
        </label>
        <label>
          Course
          <select name="courseId" value={form.courseId} onChange={change}>
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select name="type" value={form.type} onChange={change}>
            <option value="">All types</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input name="from" type="date" value={form.from} onChange={change} />
        </label>
        <label>
          To
          <input name="to" type="date" value={form.to} onChange={change} />
        </label>
        <div className="actions search-actions">
          <button type="submit">Search</button>
          <button type="button" className="secondary" onClick={clear}>
            Clear
          </button>
        </div>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading && <p className="muted">Searching...</p>}

      {!loading && results && (
        <div className="card">
          {results.length === 0 ? (
            <p>No results. Try other words or fewer filters.</p>
          ) : (
            <>
              <p className="muted">
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </p>
              <ul className="deadline-list" aria-label="Results">
                {results.map((exam) => (
                  <li key={exam.id} className="deadline">
                    <div>
                      <strong>{exam.title}</strong>{' '}
                      <span className="badge">{TYPE_LABELS[exam.type]}</span>
                      <div className="muted">
                        <Link to={`/courses/${exam.course.id}`}>{exam.course.code}</Link> ·{' '}
                        {dateFormat.format(new Date(exam.date))} · {exam.weight}%
                      </div>
                    </div>
                    <span className="when">
                      {exam.grade === null ? 'Not graded' : `Grade ${exam.grade}`}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
