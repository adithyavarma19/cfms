

## Summary of All Changes

This is a large set of UI/UX and data model changes across the entire app. Here is the consolidated plan:

---

### 1. Student Login: Change DOB input to password field
- In `Login.tsx`, change the student DOB `<Input type="date">` to `<Input type="password">` with placeholder "YYYYMMDD"
- Update label from "Date of Birth (Default Password)" to "Password"

### 2. Student Dashboard: Hide submitted forms
- In `StudentDashboard.tsx`, filter out forms where `targetStatus === "submitted"` so they no longer appear in the student's list

### 3. Admin Panel: Sidebar layout instead of top tabs
- Replace the horizontal `Tabs` in `AdminDashboard.tsx` with a `SidebarProvider` + `Sidebar` layout
- Side nav items: Students, Faculty, Courses, Forms
- Use `react-router-dom` routes or keep tab-based switching with vertical sidebar triggers

### 4. Remove email column from students and faculty

**Database migration:**
- `ALTER TABLE students DROP COLUMN email;`
- `ALTER TABLE faculty DROP COLUMN email;`

**Frontend updates:**
- Remove email field from StudentsTab add/edit forms, CSV upload headers, and table display
- Remove email field from FacultyTab add/edit forms and table display
- Update `manage-student` edge function to stop using email field
- Update CSV format docs (remove email from required columns)

### 5. Students Tab: Single table with semester/section dropdown filters
- Merge the two tables back into one single table showing: Reg No, Name, DOB, Semester, Section
- Add dropdown filters for Semester and Section at the top
- Sort students by registration_number
- Remove the "Semester & Section Assignments" card entirely
- Keep "Update Assignments" as a separate button with CSV upload (registration_number, semester, section)
- Keep "Reset All Assignments" button

**Add "Delete Students by CSV" section at the bottom:**
- CSV upload accepting `registration_number` column
- Calls edge function to delete matching students (auth user + student record + roles)
- Add new `delete_bulk` action to `manage-student` edge function

### 6. Faculty Tab: Order by faculty_id
- Change `.order("name")` to `.order("faculty_id")` in the query
- Update faculty dropdown in FormsTab to also order by faculty_id

### 7. Courses Tab: Add edit option, order by semester in dropdowns
- Courses already grouped by semester -- keep that
- Add Edit button alongside Delete button
- Add edit dialog (pre-filled form, calls `supabase.from("courses").update(...)`)
- Courses are already ordered by semester in the query

### 8. Forms Tab: Separate page for create/bulk create
- Create new route `/admin/forms/create` with a full-page form creation UI
- Move single create and bulk create logic from dialog to this new page
- Replace dialog triggers with navigation buttons: "Create Form" and "Bulk Create"
- Add route in `App.tsx`: `/admin/forms/create`
- Keep forms listing in the main FormsTab

---

### Files to modify:
1. **`src/pages/Login.tsx`** -- password input for student
2. **`src/pages/student/StudentDashboard.tsx`** -- filter out submitted forms
3. **`src/pages/admin/AdminDashboard.tsx`** -- sidebar layout
4. **`src/components/admin/StudentsTab.tsx`** -- merge tables, add filters, add delete-by-CSV
5. **`src/components/admin/FacultyTab.tsx`** -- remove email, order by faculty_id
6. **`src/components/admin/CoursesTab.tsx`** -- add edit option
7. **`src/components/admin/FormsTab.tsx`** -- remove create dialogs, add nav to create page
8. **`src/pages/admin/CreateForms.tsx`** -- new page for single + bulk form creation
9. **`src/App.tsx`** -- add `/admin/forms/create` route
10. **`supabase/functions/manage-student/index.ts`** -- remove email, add `delete_bulk` action
11. **Database migration** -- drop email columns from students and faculty

