const { z } = require('zod');

const optionalTrimmed = z.string().trim().min(1).optional();
const roleSchema = z.enum(['admin', 'student']);
const sectionSchema = z.enum(['A', 'B', 'C']);
const subjectTypeSchema = z.enum(['core', 'elective']);
const feedbackPeriodSchema = z.enum(['mid_semester', 'end_semester']);
const statusSchema = z.enum(['active', 'closed']);
const targetStatusSchema = z.enum(['pending', 'submitted']);
const mcq5 = z.enum(['A', 'B', 'C', 'D', 'E']);
const mcq6 = z.enum(['A', 'B', 'C', 'D', 'E', 'F']);
const mcq7 = z.enum(['A', 'B', 'C', 'D', 'F']);
const longText = z.string().trim().max(500).optional().or(z.literal(''));
const parseableDateTime = z.string().trim().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: 'Invalid date/time format',
});

const authLoginBodySchema = z.object({
  loginId: z.string().trim().min(1).optional(),
  email: z.string().trim().min(1).optional(),
  password: z.string().min(1),
}).refine((v) => Boolean(v.loginId || v.email), {
  message: 'loginId or email is required',
  path: ['loginId'],
});

const authStudentLoginBodySchema = z.object({
  registrationNumber: z.string().trim().min(1),
  dob: z.string().trim().min(1),
});

const authRegisterBodySchema = z.object({
  loginId: z.string().trim().min(1),
  password: z.string().min(8),
  role: roleSchema.optional(),
});

const studentCreateBodySchema = z.object({
  registration_number: z.string().trim().min(1),
  name: z.string().trim().min(1),
  dob: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'dob must be YYYY-MM-DD'),
  semester: z.coerce.number().int().min(1).max(8),
  section: sectionSchema,
});

const studentUpdateBodySchema = z.object({
  registration_number: optionalTrimmed,
  name: optionalTrimmed,
  dob: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'dob must be YYYY-MM-DD').optional(),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  section: sectionSchema.optional(),
}).refine((v) => Object.keys(v).length > 0, {
  message: 'At least one field is required',
});

const facultyCreateBodySchema = z.object({
  faculty_id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  department: z.string().trim().min(1),
  designation: z.string().trim().min(1),
});

const facultyUpdateBodySchema = z.object({
  faculty_id: optionalTrimmed,
  name: optionalTrimmed,
  department: optionalTrimmed,
  designation: optionalTrimmed,
}).refine((v) => Object.keys(v).length > 0, {
  message: 'At least one field is required',
});

const coursesCreateBodySchema = z.object({
  code: z.string().trim().min(1),
  course_name: z.string().trim().min(1),
  short_name: z.string().trim().min(1),
  credits: z.coerce.number().int().min(1),
  semester: z.coerce.number().int().min(1).max(8),
  course_type: subjectTypeSchema,
});

const coursesUpdateBodySchema = z.object({
  code: optionalTrimmed,
  course_name: optionalTrimmed,
  short_name: optionalTrimmed,
  credits: z.coerce.number().int().min(1).optional(),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  course_type: subjectTypeSchema.optional(),
}).refine((v) => Object.keys(v).length > 0, {
  message: 'At least one field is required',
});

const formsCreateBodySchema = z.object({
  title: z.string().trim().min(1),
  subject_type: subjectTypeSchema,
  academic_year: z.string().trim().min(1),
  semester: z.coerce.number().int().min(1).max(8),
  section: sectionSchema.optional().nullable(),
  feedback_period: feedbackPeriodSchema,
  course_id: z.string().uuid(),
  faculty_id: z.string().uuid(),
  closes_at: parseableDateTime,
});

const formsUpdateBodySchema = z.object({
  title: optionalTrimmed,
  subject_type: subjectTypeSchema.optional(),
  academic_year: optionalTrimmed,
  semester: z.coerce.number().int().min(1).max(8).optional(),
  section: sectionSchema.optional().nullable(),
  feedback_period: feedbackPeriodSchema.optional(),
  course_id: z.string().uuid().optional(),
  faculty_id: z.string().uuid().optional(),
  closes_at: parseableDateTime.optional(),
  status: statusSchema.optional(),
}).refine((v) => Object.keys(v).length > 0, {
  message: 'At least one field is required',
});

const responsesCreateBodySchema = z.object({
  form_id: z.string().uuid(),
  q1: mcq5, q2: mcq5, q3: mcq5, q4: mcq5,
  q5: mcq6, q6: mcq6, q7: mcq7, q8: mcq5, q9: mcq5, q10: mcq5,
  q11: longText, q12: longText, q13: longText,
  q14: mcq5, q15: mcq5, q16: mcq5, q17: mcq5, q18: mcq5, q19: mcq5,
  q20: mcq5, q21: mcq5, q22: mcq5, q23: mcq5, q24: mcq5, q25: mcq5,
  q26: mcq5, q27: mcq5, q28: mcq5, q29: mcq5, q30: mcq5, q31: mcq5,
  q32: longText, q33: longText, q34: longText,
});

const targetsUpdateBodySchema = z.object({
  status: targetStatusSchema,
});

module.exports = {
  authLoginBodySchema,
  authStudentLoginBodySchema,
  authRegisterBodySchema,
  studentCreateBodySchema,
  studentUpdateBodySchema,
  facultyCreateBodySchema,
  facultyUpdateBodySchema,
  coursesCreateBodySchema,
  coursesUpdateBodySchema,
  formsCreateBodySchema,
  formsUpdateBodySchema,
  responsesCreateBodySchema,
  targetsUpdateBodySchema,
};
