import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<p>Welcome to Student Exam Tracker.</p>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
