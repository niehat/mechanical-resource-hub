import { lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SemesterPage from './pages/SemesterPage';
import SubjectPage from './pages/SubjectPage';
import SearchPage from './pages/SearchPage';
import NotFound from './pages/NotFound';

const ResourceViewer = lazy(() => import('./pages/ResourceViewer'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Overview = lazy(() => import('./pages/admin/Overview'));
const ManageSemesters = lazy(() => import('./pages/admin/ManageSemesters'));
const ManageSubjects = lazy(() => import('./pages/admin/ManageSubjects'));
const ManageTeachers = lazy(() => import('./pages/admin/ManageTeachers'));
const ManageResources = lazy(() => import('./pages/admin/ManageResources'));
const UploadResource = lazy(() => import('./pages/admin/UploadResource'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="semester/:number" element={<SemesterPage />} />
          <Route path="semester/:number/subject/:subjectId" element={<SubjectPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="resource/:id" element={<ResourceViewer />} />
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="semesters" element={<ManageSemesters />} />
          <Route path="subjects" element={<ManageSubjects />} />
          <Route path="teachers" element={<ManageTeachers />} />
          <Route path="resources" element={<ManageResources key="all" />} />
          <Route path="reference-books" element={<ManageResources key="reference_book" category="reference_book" />} />
          <Route path="study-materials" element={<ManageResources key="study_material" category="study_material" />} />
          <Route path="suggestions" element={<ManageResources key="suggestion" category="suggestion" />} />
          <Route path="assignments" element={<ManageResources key="assignment" category="assignment" />} />
          <Route path="other-documents" element={<ManageResources key="other" category="other" />} />
          <Route path="upload" element={<UploadResource />} />
        </Route>
      </Routes>
    </>
  );
}
