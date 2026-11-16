import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { coursesApi, examsApi } from '../api.js';
import ExamForm, { TYPE_LABELS } from '../components/ExamForm.jsx';

// Dates are saved as midnight UTC, so they are shown in UTC to keep the same day.
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const byDate = (a, b) => a.date.localeCompare(b.date) || a.id - b.id;

// Rounds away floating point noise such as 0.1 + 0.2.
const round = (value) => Math.round(value * 100) / 100;

export default function CourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    Promise.all([coursesApi.get(id), examsApi.list(id)])
      .then(([c, list]) => {
        setCourse(c);
        setExams(list);
      })
      .catch((err) => setError(err.status === 404 ? 'Course not found' : err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const usedWeight = round(exams.reduce((sum, e) => sum + e.weight, 0));
  const weightLeft = round(100 - usedWeight);

  const addExam = async (input) => {
    const created = await examsApi.create(id, input);
    setExams((list) => [...list, created].sort(byDate));
  };

  const saveExam = async (examId, input) => {
    const updated = await examsApi.update(examId, input);
    setExams((list) => list.map((e) => (e.id === examId ? updated : e)).sort(byDate));
    setEditingId(null);
  };

  const deleteExam = async (exam) => {
    if (!window.confirm(`Delete ${exam.title}?`)) {
      return;
    }
    setError('');
    try {
      await examsApi.remove(exam.id);
      setExams((list) => list.filter((e) => e.id !== exam.id));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p className="muted">Loading course...</p>;
  }

  if (!course) {
    return (
      <section className="stack">
        <p className="error" role="alert">
          {error}
        </p>
        <Link to="/courses">Back to my courses</Link>
      </section>
    );
  }

  return (
    <section className="stack">
      <Link to="/courses">&larr; My courses</Link>
      <div>
        <h1>
          {course.code} {course.name}
        </h1>
        <p className="muted">
          {course.credits} credits · {course.term}
        </p>
      </div>

      <div className="card">
        <h2>Add an exam or assignment</h2>
        {weightLeft > 0 ? (
          <ExamForm submitLabel="Add exam" weightLeft={weightLeft} onSubmit={addExam} />
        ) : (
          <p className="muted">
            The weights of this course already add up to 100%. Edit an exam to change them.
          </p>
        )}
      </div>

      <p className="weight-summary" aria-live="polite">
        Weight used: <strong>{usedWeight}%</strong> of 100%
      </p>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {exams.length === 0 ? (
        <p className="muted">No exams yet. Add the first exam or assignment above.</p>
      ) : (
        <ul className="course-list">
          {exams.map((exam) => (
            <li key={exam.id} className="card">
              {editingId === exam.id ? (
                <ExamForm
                  initial={exam}
                  weightLeft={round(weightLeft + exam.weight)}
                  submitLabel="Save"
                  onSubmit={(input) => saveExam(exam.id, input)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="course-row">
                  <div>
                    <strong>{exam.title}</strong>{' '}
                    <span className="badge">{TYPE_LABELS[exam.type]}</span>
                    <div className="muted">
                      {dateFormat.format(new Date(exam.date))} · {exam.weight}% ·{' '}
                      {exam.grade === null ? 'Not graded yet' : `Grade ${exam.grade}`}
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setEditingId(exam.id)}
                      aria-label={`Edit ${exam.title}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => deleteExam(exam)}
                      aria-label={`Delete ${exam.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
