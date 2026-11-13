export type Category = 'reference_book' | 'study_material' | 'suggestion' | 'assignment' | 'other';

export interface Semester {
  id: string;
  number: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface SemesterOverview {
  id: string;
  number: number;
  name: string;
  subject_count: number;
  resource_count: number;
  assignment_count: number;
}

export interface SubjectOverview {
  id: string;
  semester_id: string;
  teacher_id: string | null;
  name: string;
  code: string | null;
  credit_hours: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  teacher_name: string | null;
  teacher_phone: string | null;
  teacher_email: string | null;
  semester_number: number;
  semester_name: string;
  resource_count: number;
  assignment_count: number;
}

export interface Resource {
  id: string;
  subject_id: string;
  title: string;
  author: string | null;
  description: string | null;
  category: Category;
  file_type: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceDetail extends Resource {
  subject_name: string;
  subject_code: string | null;
  teacher_id: string | null;
  teacher_name: string | null;
  semester_id: string;
  semester_number: number;
  semester_name: string;
}

export interface DashboardStats {
  semesters: number;
  subjects: number;
  resources: number;
  assignments: number;
  reference_books: number;
  study_materials: number;
  suggestions: number;
  other_documents: number;
}

export interface ResourceInput {
  subject_id: string;
  title: string;
  author: string | null;
  description: string | null;
  category: Category;
}

export interface SubjectInput {
  semester_id: string;
  teacher_id: string | null;
  name: string;
  code: string | null;
  credit_hours: number | null;
  description: string | null;
}

export interface TeacherInput {
  name: string;
  phone: string | null;
  email: string | null;
}

export interface SearchParams {
  q?: string;
  semesterId?: string;
  subjectId?: string;
  category?: Category | '';
  teacherId?: string;
  fileType?: string;
  sort?: 'newest' | 'alpha';
  page?: number;
  pageSize?: number;
}
