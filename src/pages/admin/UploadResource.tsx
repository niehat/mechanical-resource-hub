import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ResourceForm } from '../../components/ResourceForm';

export default function UploadResource() {
  const [formKey, setFormKey] = useState(0);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold sm:text-3xl">Upload new resource</h1>
      <p className="mt-1 text-sm text-slate-600">
        Choose the semester and subject, describe the document and attach a PDF. It appears on the subject page straight away.
        Need a new subject first? <Link to="/admin/subjects" className="text-brand-700 underline">Manage subjects</Link>.
      </p>
      <div className="card mt-6 p-5 sm:p-6">
        <ResourceForm key={formKey} onSaved={() => setFormKey((k) => k + 1)} />
      </div>
    </div>
  );
}
