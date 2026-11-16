import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coursesApi } from '../api.js';
import CourseForm from '../components/CourseForm.jsx';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    coursesApi
      .list()
      .then(setCourses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const addCourse = async (input) => {
    const created = await coursesApi.create(input);
    setCourses((list) => [...list, created]);
  };

  const saveCourse = async (id, input) => {
    const updated = await coursesApi.update(id, input);
    setCourses((list) => list.map((c) => (c.id === id ? updated : c)));
    setEditingId(null);
  };

  const deleteCourse = async (course) => {
    if (!window.confirm(`Delete ${course.code}? Its exams will be deleted too.`)) {
      return;
    }
    setError('');
    try {
      await coursesApi.remove(course.id);
      setCourses((list) => list.filter((c) => c.id !== course.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="stack">
      <h1>My courses</h1>

      <div className="card">
        <h2>Add a course</h2>
        <CourseForm submitLabel="Add course" onSubmit={addCourse} />
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="muted">Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="muted">No courses yet. Add your first course above.</p>
      ) : (
        <ul className="course-list">
          {courses.map((course) => (
            <li key={course.id} className="card">
              {editingId === course.id ? (
                <CourseForm
                  initial={course}
                  submitLabel="Save"
                  onSubmit={(input) => saveCourse(course.id, input)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="course-row">
                  <div>
                    <Link to={`/courses/${course.id}`}>
                      <strong>{course.code}</strong> {course.name}
                    </Link>
                    <div className="muted">
                      {course.credits} credits · {course.term}
                    </div>
                  </div>
                  <div className="actions">
                    <Link
                      className="button-link"
                      to={`/courses/${course.id}`}
                      aria-label={`Exams for ${course.code}`}
                    >
                      Exams
                    </Link>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setEditingId(course.id)}
                      aria-label={`Edit ${course.code}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => deleteCourse(course)}
                      aria-label={`Delete ${course.code}`}
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
