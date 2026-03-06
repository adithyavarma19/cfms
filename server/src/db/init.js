require('dotenv').config();
const pool = require('../config/db');

const initSQL = `
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'student');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth_users(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  course_type TEXT NOT NULL CHECK (course_type IN ('core', 'elective')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('core', 'elective')),
  academic_year TEXT NOT NULL,
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  section TEXT CHECK (section IN ('A', 'B', 'C')),
  feedback_period TEXT NOT NULL CHECK (feedback_period IN ('mid_semester', 'end_semester')),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closes_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  response_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  q1 CHAR(1) CHECK (q1 IN ('A', 'B', 'C', 'D', 'E')),
  q2 CHAR(1) CHECK (q2 IN ('A', 'B', 'C', 'D', 'E')),
  q3 CHAR(1) CHECK (q3 IN ('A', 'B', 'C', 'D', 'E')),
  q4 CHAR(1) CHECK (q4 IN ('A', 'B', 'C', 'D', 'E')),
  q5 CHAR(1) CHECK (q5 IN ('A', 'B', 'C', 'D', 'E', 'F')),
  q6 CHAR(1) CHECK (q6 IN ('A', 'B', 'C', 'D', 'E', 'F')),
  q7 CHAR(1) CHECK (q7 IN ('A', 'B', 'C', 'D', 'F')),
  q8 CHAR(1) CHECK (q8 IN ('A', 'B', 'C', 'D', 'E')),
  q9 CHAR(1) CHECK (q9 IN ('A', 'B', 'C', 'D', 'E')),
  q10 CHAR(1) CHECK (q10 IN ('A', 'B', 'C', 'D', 'E')),
  q11 VARCHAR(500), q12 VARCHAR(500), q13 VARCHAR(500),
  q14 CHAR(1) CHECK (q14 IN ('A', 'B', 'C', 'D', 'E')),
  q15 CHAR(1) CHECK (q15 IN ('A', 'B', 'C', 'D', 'E')),
  q16 CHAR(1) CHECK (q16 IN ('A', 'B', 'C', 'D', 'E')),
  q17 CHAR(1) CHECK (q17 IN ('A', 'B', 'C', 'D', 'E')),
  q18 CHAR(1) CHECK (q18 IN ('A', 'B', 'C', 'D', 'E')),
  q19 CHAR(1) CHECK (q19 IN ('A', 'B', 'C', 'D', 'E')),
  q20 CHAR(1) CHECK (q20 IN ('A', 'B', 'C', 'D', 'E')),
  q21 CHAR(1) CHECK (q21 IN ('A', 'B', 'C', 'D', 'E')),
  q22 CHAR(1) CHECK (q22 IN ('A', 'B', 'C', 'D', 'E')),
  q23 CHAR(1) CHECK (q23 IN ('A', 'B', 'C', 'D', 'E')),
  q24 CHAR(1) CHECK (q24 IN ('A', 'B', 'C', 'D', 'E')),
  q25 CHAR(1) CHECK (q25 IN ('A', 'B', 'C', 'D', 'E')),
  q26 CHAR(1) CHECK (q26 IN ('A', 'B', 'C', 'D', 'E')),
  q27 CHAR(1) CHECK (q27 IN ('A', 'B', 'C', 'D', 'E')),
  q28 CHAR(1) CHECK (q28 IN ('A', 'B', 'C', 'D', 'E')),
  q29 CHAR(1) CHECK (q29 IN ('A', 'B', 'C', 'D', 'E')),
  q30 CHAR(1) CHECK (q30 IN ('A', 'B', 'C', 'D', 'E')),
  q31 CHAR(1) CHECK (q31 IN ('A', 'B', 'C', 'D', 'E')),
  q32 VARCHAR(500), q33 VARCHAR(500), q34 VARCHAR(500),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (form_id, student_id)
);

CREATE TABLE IF NOT EXISTS form_student_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES feedback_forms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(form_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_form_student_targets_form_id ON form_student_targets(form_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faculty_updated_at ON faculty;
CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('Connected to database successfully!');

    await client.query(initSQL);
    console.log('Database tables created successfully!');

    const shouldSeedAdmin = String(process.env.SEED_DEFAULT_ADMIN || '').toLowerCase() === 'true';
    if (shouldSeedAdmin) {
      if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
        console.warn('Warning: default admin seeding is enabled in production.');
      }

      const adminLogin = String(process.env.DEFAULT_ADMIN_LOGIN || '').trim();
      const adminPassword = String(process.env.DEFAULT_ADMIN_PASSWORD || '');

      if (!adminLogin || !adminPassword) {
        throw new Error('DEFAULT_ADMIN_LOGIN and DEFAULT_ADMIN_PASSWORD are required when SEED_DEFAULT_ADMIN=true');
      }

      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await client.query(
        `
        INSERT INTO auth_users (login_id, password, role)
        VALUES ($1, $2, 'admin')
        ON CONFLICT (login_id) DO NOTHING
        `,
        [adminLogin, hashedPassword]
      );
      console.log(`Default admin ensured for login_id: ${adminLogin}`);
    } else {
      console.log('Default admin seeding skipped (SEED_DEFAULT_ADMIN is not true).');
    }

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
