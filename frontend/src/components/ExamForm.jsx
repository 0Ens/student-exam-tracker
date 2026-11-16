import { useId, useState } from 'react';
import { EXAM_TYPES, validateExam } from '../validation/exam.js';

const EMPTY = { title: '', type: 'exam', date: '', weight: '', grade: '' };

const TYPE_LABELS = {
  exam: 'Exam',
  quiz: 'Quiz',
  assignment: 'Assignment',
  project: 'Project',
};

// Turns an exam from the API into form values (date input needs YYYY-MM-DD).
function toValues(exam) {
  return {
    title: exam.title,
    type: exam.type,
    date: exam.date.slice(0, 10),
    weight: String(exam.weight),
    grade: exam.grade === null ? '' : String(exam.grade),
  };
}

export default function ExamForm({ initial, weightLeft, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => (initial ? toValues(initial) : EMPTY));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formId = useId();

  const onChange = (e) => setValues({ ...values, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validateExam(values, weightLeft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        type: values.type,
        date: values.date,
        weight: Number(values.weight),
        grade: values.grade === '' ? null : Number(values.grade),
      });
      if (!initial) {
        setValues(EMPTY);
      }
    } catch (err) {
      setFormError(err.message);
      const details = err.details || {};
      setErrors(Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v.join(', ')])));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, label, control) => {
    const id = `${formId}-${name}`;
    const props = {
      id,
      name,
      value: values[name],
      onChange,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `${id}-error` : undefined,
    };
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        {control(props)}
        {errors[name] && (
          <span id={`${id}-error`} className="error">
            {errors[name]}
          </span>
        )}
      </div>
    );
  };

  return (
    <form className="form exam-form" onSubmit={handleSubmit} noValidate>
      {field('title', 'Title', (p) => (
        <input {...p} placeholder="Midterm" />
      ))}
      {field('type', 'Type', (p) => (
        <select {...p}>
          {EXAM_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      ))}
      {field('date', 'Date', (p) => (
        <input {...p} type="date" />
      ))}
      {field('weight', 'Weight (%)', (p) => (
        <input {...p} type="number" min="0" max="100" step="any" />
      ))}
      {field('grade', 'Grade (optional)', (p) => (
        <input {...p} type="number" min="0" max="100" step="any" placeholder="Not graded yet" />
      ))}
      {formError && (
        <p className="error" role="alert">
          {formError}
        </p>
      )}
      <div className="actions">
        <button type="submit" disabled={submitting}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export { TYPE_LABELS };
