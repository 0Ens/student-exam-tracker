import { useId, useState } from 'react';
import { validateCourse } from '../validation/course.js';

const EMPTY = { name: '', code: '', credits: '', term: '' };

export default function CourseForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(() =>
    initial ? { ...initial, credits: String(initial.credits) } : EMPTY,
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formId = useId();

  const onChange = (e) => setValues({ ...values, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validateCourse(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        code: values.code.trim(),
        credits: Number(values.credits),
        term: values.term.trim(),
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

  const field = (name, label, props = {}) => {
    const id = `${formId}-${name}`;
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          name={name}
          value={values[name]}
          onChange={onChange}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${id}-error` : undefined}
          {...props}
        />
        {errors[name] && (
          <span id={`${id}-error`} className="error">
            {errors[name]}
          </span>
        )}
      </div>
    );
  };

  return (
    <form className="form course-form" onSubmit={handleSubmit} noValidate>
      {field('name', 'Course name', { placeholder: 'Software Project Management' })}
      {field('code', 'Code', { placeholder: 'SWE488' })}
      {field('credits', 'Credits', { type: 'number', min: 0, max: 30 })}
      {field('term', 'Term', { placeholder: '2026 Fall' })}
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
