
import { supabase as sb, BUCKET, SUPABASE_URL, SUPABASE_KEY } from './supabase';
import { MAX_PDF_BYTES, MAX_PDF_MB, PAGE_SIZE } from './constants';
import type {
  DashboardStats, Resource, ResourceDetail, ResourceInput, SearchParams, Semester,
  SemesterOverview, SubjectInput, SubjectOverview, Teacher, TeacherInput,
} from './types';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function raise(error: { message: string; code?: string } | null): void {
  if (!error) return;

  if (error.code === '23503') {
    throw new Error('This item is still in use by other records. Remove or move those first.');
  }

  if (error.code === '23505') {
    throw new Error('An item with these details already exists.');
  }

  if (error.code === '42501' || /row-level security/i.test(error.message)) {
    throw new Error('Permission denied. Sign in with the administrator account and try again.');
  }

  throw new Error(error.message);
}

function expectRows(data: unknown[] | null): void {
  if (!data || data.length === 0) {
    throw new Error('Nothing was changed. The item may no longer exist, or you may not have permission.');
  }
}

/* ------------------------------------------------------------------ */
/* Authorization                                                       */
/* ------------------------------------------------------------------ */

/**
 * Checks whether the currently authenticated user is an administrator.
 * Logs the actual Supabase error to the browser console for debugging.
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await sb
      .from('admin_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Admin Check Error]', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      return false;
    }

    const isAdmin = Boolean(data);

    console.log('[Admin Check Result]', {
      userId,
      isAdmin,
    });

    return isAdmin;
  } catch (error) {
    console.error('[Admin Check Unexpected Error]', error);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Public reads                                                        */
/* ------------------------------------------------------------------ */

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await sb.rpc('dashboard_stats');
  raise(error);
  return data as DashboardStats;
}

export async function getSemesterOverview(): Promise<SemesterOverview[]> {
  const { data, error } = await sb.from('semester_overview').select('*').order('number');
  raise(error);
  return (data ?? []) as SemesterOverview[];
}

export async function listSemesters(): Promise<Semester[]> {
  const { data, error } = await sb.from('semesters').select('*').order('number');
  raise(error);
  return (data ?? []) as Semester[];
}

export async function getSemesterByNumber(n: number): Promise<Semester | null> {
  const { data, error } = await sb.from('semesters').select('*').eq('number', n).maybeSingle();
  raise(error);
  return (data as Semester | null) ?? null;
}

export async function getSubjectsForSemester(semesterId: string): Promise<SubjectOverview[]> {
  const { data, error } = await sb
    .from('subject_overview')
    .select('*')
    .eq('semester_id', semesterId)
    .order('name');

  raise(error);
  return (data ?? []) as SubjectOverview[];
}

export async function listSubjectsAll(): Promise<SubjectOverview[]> {
  const { data, error } = await sb
    .from('subject_overview')
    .select('*')
    .order('semester_number')
    .order('name');

  raise(error);
  return (data ?? []) as SubjectOverview[];
}

export async function getSubject(id: string): Promise<SubjectOverview | null> {
  const { data, error } = await sb.from('subject_overview').select('*').eq('id', id).maybeSingle();
  raise(error);
  return (data as SubjectOverview | null) ?? null;
}

export async function getResourcesForSubject(subjectId: string): Promise<Resource[]> {
  const { data, error } = await sb
    .from('resources')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });

  raise(error);
  return (data ?? []) as Resource[];
}

export async function getResource(id: string): Promise<ResourceDetail | null> {
  const { data, error } = await sb.from('resource_search').select('*').eq('id', id).maybeSingle();
  raise(error);
  return (data as ResourceDetail | null) ?? null;
}

export async function listTeachers(): Promise<Teacher[]> {
  const { data, error } = await sb.from('teachers').select('*').order('name');
  raise(error);
  return (data ?? []) as Teacher[];
}

/** Strips characters that have a special meaning in PostgREST filters or LIKE patterns. */
function cleanToken(raw: string): string {
  return raw.replace(/[,()"'\\%*_:]/g, ' ').trim();
}

const SEARCH_COLUMNS = [
  'title',
  'author',
  'description',
  'subject_name',
  'subject_code',
  'teacher_name',
  'semester_name',
];

export async function searchResources(
  params: SearchParams,
): Promise<{ rows: ResourceDetail[]; count: number }> {
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const page = Math.max(1, params.page ?? 1);
  const from = (page - 1) * pageSize;

  let query = sb.from('resource_search').select('*', { count: 'exact' });

  // Each word must match at least one searchable column (partial, case-insensitive).
  const tokens = (params.q ?? '')
    .split(/\s+/)
    .map(cleanToken)
    .filter(Boolean)
    .slice(0, 5);

  for (const token of tokens) {
    query = query.or(
      SEARCH_COLUMNS.map((col) => `${col}.ilike."*${token}*"`).join(','),
    );
  }

  if (params.semesterId) query = query.eq('semester_id', params.semesterId);
  if (params.subjectId) query = query.eq('subject_id', params.subjectId);
  if (params.category) query = query.eq('category', params.category);
  if (params.teacherId) query = query.eq('teacher_id', params.teacherId);
  if (params.fileType) query = query.eq('file_type', params.fileType);

  query = params.sort === 'alpha'
    ? query.order('title', { ascending: true })
    : query.order('created_at', { ascending: false });

  const { data, error, count } = await query.range(from, from + pageSize - 1);

  raise(error);

  return {
    rows: (data ?? []) as ResourceDetail[],
    count: count ?? 0,
  };
}

export function publicUrl(path: string, downloadName?: string): string {
  const { data } = sb.storage
    .from(BUCKET)
    .getPublicUrl(path, downloadName ? { download: downloadName } : undefined);

  return data.publicUrl;
}

/* ------------------------------------------------------------------ */
/* Administrator writes: semesters, teachers, subjects                 */
/* ------------------------------------------------------------------ */

export async function saveSemester(
  input: { number: number; name: string },
  id?: string,
): Promise<void> {
  if (id) {
    const { data, error } = await sb
      .from('semesters')
      .update({ name: input.name })
      .eq('id', id)
      .select('id');

    raise(error);
    expectRows(data);
  } else {
    const { error } = await sb.from('semesters').insert(input);
    raise(error);
  }
}

export async function deleteSemester(id: string): Promise<void> {
  const { data, error } = await sb
    .from('semesters')
    .delete()
    .eq('id', id)
    .select('id');

  if (error?.code === '23503') {
    throw new Error('This semester still has subjects. Delete or move its subjects first.');
  }

  raise(error);
  expectRows(data);
}

export async function saveTeacher(input: TeacherInput, id?: string): Promise<void> {
  if (id) {
    const { data, error } = await sb
      .from('teachers')
      .update(input)
      .eq('id', id)
      .select('id');

    raise(error);
    expectRows(data);
  } else {
    const { error } = await sb.from('teachers').insert(input);
    raise(error);
  }
}

export async function deleteTeacher(id: string): Promise<void> {
  const { data, error } = await sb
    .from('teachers')
    .delete()
    .eq('id', id)
    .select('id');

  raise(error);
  expectRows(data);
}

export async function saveSubject(input: SubjectInput, id?: string): Promise<void> {
  if (id) {
    const { data, error } = await sb
      .from('subjects')
      .update(input)
      .eq('id', id)
      .select('id');

    raise(error);
    expectRows(data);
  } else {
    const { error } = await sb.from('subjects').insert(input);
    raise(error);
  }
}

/** Deletes a subject, its resource records and all of its PDF files. */
export async function deleteSubject(id: string): Promise<void> {
  const { data: files, error: listError } = await sb
    .from('resources')
    .select('file_path')
    .eq('subject_id', id);

  raise(listError);

  const paths = (files ?? []).map((f: { file_path: string }) => f.file_path);

  const { data, error } = await sb
    .from('subjects')
    .delete()
    .eq('id', id)
    .select('id');

  raise(error);
  expectRows(data);

  if (paths.length > 0) {
    const { error: removeError } = await sb.storage.from(BUCKET).remove(paths);

    if (removeError) {
      throw new Error(
        'The subject was deleted, but some PDF files could not be removed from storage. Remove them in Supabase -> Storage.',
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* Administrator writes: resources and PDF files                       */
/* ------------------------------------------------------------------ */

export async function validatePdf(file: File): Promise<void> {
  const nameOk = /\.pdf$/i.test(file.name);

  if (!nameOk || file.type !== 'application/pdf') {
    throw new Error('Only PDF files (.pdf) are allowed.');
  }

  if (file.size === 0) {
    throw new Error('This file is empty.');
  }

  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`This file is too large. The maximum size is ${MAX_PDF_MB} MB.`);
  }

  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const signature = String.fromCharCode(...head);

  if (signature !== '%PDF-') {
    throw new Error('This file does not look like a valid PDF document.');
  }
}

async function accessToken(): Promise<string> {
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  return token;
}

function uploadWithProgress(
  path: string,
  file: File,
  token: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.setRequestHeader('x-upsert', 'false');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      let message = 'The upload failed.';

      try {
        const body = JSON.parse(xhr.responseText) as {
          message?: string;
          error?: string;
        };

        message = body.message ?? body.error ?? message;
      } catch {
        /* keep the default message */
      }

      reject(
        new Error(
          /row-level security|unauthorized/i.test(message)
            ? 'Permission denied. Sign in with the administrator account.'
            : message,
        ),
      );
    };

    xhr.onerror = () => {
      reject(new Error('Network error while uploading. Check your connection and try again.'));
    };

    xhr.onabort = () => {
      reject(new Error('The upload was cancelled.'));
    };

    const form = new FormData();
    form.append('cacheControl', '3600');
    form.append('', file);

    xhr.send(form);
  });
}

async function removeFile(path: string): Promise<boolean> {
  const { error } = await sb.storage.from(BUCKET).remove([path]);
  return !error;
}

function newPath(subjectId: string): string {
  return `${subjectId}/${crypto.randomUUID()}.pdf`;
}

export async function createResource(
  input: ResourceInput,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  await validatePdf(file);

  const token = await accessToken();
  const path = newPath(input.subject_id);

  await uploadWithProgress(path, file, token, onProgress);

  const { error } = await sb.from('resources').insert({
    ...input,
    file_type: 'pdf',
    file_path: path,
    file_name: file.name,
    file_size: file.size,
    mime_type: 'application/pdf',
  });

  if (error) {
    await removeFile(path); // never leave an orphaned upload behind
    raise(error);
  }
}

export async function updateResource(
  existing: Resource,
  input: ResourceInput,
  newFile: File | null,
  onProgress: (percent: number) => void,
): Promise<void> {
  if (!newFile) {
    const { data, error } = await sb
      .from('resources')
      .update(input)
      .eq('id', existing.id)
      .select('id');

    raise(error);
    expectRows(data);
    return;
  }

  await validatePdf(newFile);

  const token = await accessToken();
  const path = newPath(input.subject_id);

  await uploadWithProgress(path, newFile, token, onProgress);

  const { data, error } = await sb
    .from('resources')
    .update({
      ...input,
      file_path: path,
      file_name: newFile.name,
      file_size: newFile.size,
      mime_type: 'application/pdf',
    })
    .eq('id', existing.id)
    .select('id');

  if (error || !data || data.length === 0) {
    await removeFile(path);
    raise(error);
    expectRows(data);
  }

  await removeFile(existing.file_path); // replaced file is no longer needed
}

export async function deleteResource(resource: Resource): Promise<void> {
  const { data, error } = await sb
    .from('resources')
    .delete()
    .eq('id', resource.id)
    .select('id');

  raise(error);
  expectRows(data);

  const removed = await removeFile(resource.file_path);

  if (!removed) {
    throw new Error(
      `The record was deleted, but its PDF could not be removed from storage. Delete "${resource.file_path}" manually in Supabase -> Storage.`,
    );
  }
}
