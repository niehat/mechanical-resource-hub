# Mechanical Academic Resource Hub

A public, mobile-friendly website where Mechanical Engineering students can browse all 8 semesters, open subjects, and read or download PDF books, notes, suggestions and assignments. One administrator manages everything from a protected dashboard. Students never need an account.

**Stack:** React, Vite, TypeScript, Tailwind CSS, Supabase (Postgres, Auth, Storage), hosted on Vercel.

---

## 1. What is in the box

```
mechanical-resource-hub/
├── index.html, package.json, vite.config.ts, vercel.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── tailwind.config.js, postcss.config.js
├── .env.example, .gitignore
├── public/favicon.svg
├── supabase/
│   ├── setup.sql              <- run this once (schema + security + storage + 8 semesters)
│   ├── create_admin.sql       <- run this once after creating your admin user
│   └── parts/                 <- the same setup split into 4 readable files
│       ├── 01_schema.sql      tables, indexes, triggers, views, helper functions
│       ├── 02_rls_policies.sql  Row Level Security for every table
│       ├── 03_storage.sql     "academic-resources" bucket and storage policies
│       └── 04_seed.sql        the 8 semesters
└── src/
    ├── main.tsx, App.tsx, index.css
    ├── lib/         supabase client, API layer, types, constants
    ├── hooks/       useAsync, useDebounce, useTitle
    ├── context/     AuthContext, ToastContext
    ├── components/  Layout, ui (buttons, modals, pagination...), ResourceCard, forms
    └── pages/       Home, SemesterPage, SubjectPage, SearchPage, ResourceViewer,
                     AdminLogin, admin/ (Overview, Manage*, UploadResource)
```

## 2. How security works

* **One administrator.** The table `admin_profiles` holds the single admin's user id. A unique index makes a second admin impossible. The only way to add a row is the SQL Editor (`create_admin.sql`); the website API cannot write to it.
* **Row Level Security (RLS)** is enabled on every table. Everyone can read. Only users for whom `is_admin()` is true can insert, update or delete.
* **Storage policies** do the same for the `academic-resources` bucket: public read, admin-only upload, replace and delete.
* Hiding buttons in the website is only cosmetic. Even if someone calls the API directly, the database refuses.
* The website only contains the public anon key. Never put the `service_role` key anywhere in this project.
* Turn off public sign-ups (step 3.5) so strangers cannot even create accounts. Even if they did, they would be ordinary users with no write permission.

## 3. Supabase setup (about 10 minutes)

1. **Create an account** at https://supabase.com (free plan is enough) and choose **New project**. Pick a name, a strong database password (save it in a password manager) and the region nearest your students.
2. **Run the database script.** Open **SQL Editor** > **New query**, paste the entire contents of `supabase/setup.sql`, and press **Run**. It should finish with "Success". This creates the tables, security rules, the `academic-resources` bucket and the 8 semesters. It is safe to run again.
3. **Check the bucket.** Open **Storage**. You should see `academic-resources` marked Public. (It was created by the script; no manual work is needed.)
4. **Create the administrator login.** Open **Authentication** > **Users** > **Add user** > **Create new user**. Enter your email and a strong password, tick **Auto Confirm User**, and create it.
5. **Close public sign-ups.** Open **Authentication** > **Sign In / Providers** (older dashboards: **Providers** > **Email** or **Settings**) and switch **Allow new users to sign up** off.
6. **Authorize that user as the administrator.** Open `supabase/create_admin.sql`, replace `YOUR_ADMIN_EMAIL_HERE` with your exact email, paste it in a new SQL query and Run. The last query should show one row with your email.
7. **Copy your keys.** Open **Project Settings** > **API** (or **Connect**). Copy:
   * **Project URL** (looks like `https://abcdxyz.supabase.co`)
   * **anon / publishable key** (the public one, NOT `service_role`)

## 4. Run it on your computer (optional)

You need Node.js 18 or newer from https://nodejs.org.

```bash
cd mechanical-resource-hub
cp .env.example .env        # then paste your two values into .env
npm install
npm run dev                 # open the address it prints
npm run build               # type-checks and builds to /dist
```

## 5. Put it on GitHub

1. Create a free account at https://github.com and click **New repository** (name it `mechanical-resource-hub`, leave it empty).
2. In the project folder run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/mechanical-resource-hub.git
   git push -u origin main
   ```
   (`.env` is excluded by `.gitignore`, so your keys are not uploaded. That is intended.)

## 6. Deploy on Vercel

1. Sign up at https://vercel.com using **Continue with GitHub**.
2. Click **Add New** > **Project**, then **Import** your repository.
3. Vercel detects Vite automatically. Open **Environment Variables** and add:
   * `VITE_SUPABASE_URL` = your Project URL
   * `VITE_SUPABASE_ANON_KEY` = your anon / publishable key
   * `VITE_MAX_PDF_MB` = `20` (optional)
4. Click **Deploy**. After about a minute you receive a free address such as `https://mechanical-resource-hub.vercel.app`.
5. To change the name: **Project** > **Settings** > **Domains** and edit the `.vercel.app` domain (the name must be available).
6. If you change an environment variable later, go to **Deployments** > the latest one > **Redeploy**.

## 7. Using the site

* **Sign in:** open `/admin/login` on your site (also linked as "Administrator sign in" in the footer). Use the email and password from step 3.4.
* **Recommended first-use order**
  1. **Teachers and course info:** add teachers (name, contact number).
  2. **Manage subjects:** add subjects to each semester (name, code, credit hours, teacher, description).
  3. **Upload new resource:** pick semester, subject, category, then choose a PDF.
* While signed in you also see **Add subject** on semester pages and **Add new resource**, edit and delete buttons on subject pages.
* Replace a PDF: edit a resource and choose a new file; the old file is deleted from storage automatically. Deleting a resource or subject also deletes its PDFs.
* Semesters are fixed at numbers 1 to 8; you can rename them or re-add one that you deleted. A semester with subjects cannot be deleted.

### Changing the maximum PDF size
The website limit is `VITE_MAX_PDF_MB` (default 20). The bucket has its own limit of 20 MB in `supabase/parts/03_storage.sql` (`file_size_limit`). Change both together. The Supabase free plan allows files up to 50 MB.

## 8. Troubleshooting

| Problem | Fix |
| --- | --- |
| "Connect Supabase to finish setup" screen | Environment variables are missing; add them and redeploy. |
| Home page shows an error | `supabase/setup.sql` was not run (or failed). Run it again and read any error message. |
| Sign in says "not authorized" | `create_admin.sql` was not run, or the email does not match exactly. |
| Upload says "Permission denied" | You are not signed in as the admin, or `03_storage.sql` did not run. |
| PDF does not display on a phone | Use "Try the compatibility viewer", Download, or Open in new tab. |
| Refreshing a page shows 404 | Make sure `vercel.json` was committed. |

Deleting rows or files directly in the Supabase dashboard bypasses the website's cleanup, so remove PDFs from **Storage** by hand in that case.

## 9. What was and was not verified

Verified in the build environment: every TypeScript/TSX file parses, and all 116 relative imports resolve to real exports.

**Not verified** (the environment had no internet access and no Supabase project): `npm install`, the TypeScript type-check, the production build, the SQL scripts against a real Postgres, and every sign-in, upload, search and delete flow. Run `npm install && npm run build` first; if the build reports an error, it will name the exact file and line to fix.
