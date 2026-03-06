const express = require('express');
const pool = require('../config/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { formsCreateBodySchema, formsUpdateBodySchema } = require('../validation/schemas');

const router = express.Router();

// Get all feedback forms (admin)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, c.course_name, c.code, fac.name as faculty_name
       FROM feedback_forms f
       LEFT JOIN courses c ON f.course_id = c.id
       LEFT JOIN faculty fac ON f.faculty_id = fac.id
       ORDER BY f.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get feedback forms for student (based on semester/section)
router.get('/student', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Get student's semester and section
    const studentResult = await pool.query(
      'SELECT semester, section FROM students WHERE user_id = $1',
      [req.user.id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const { semester, section } = studentResult.rows[0];
    
    // Get relevant forms
    const result = await pool.query(
      `SELECT f.*, c.course_name, c.code, fac.name as faculty_name
       FROM feedback_forms f
       LEFT JOIN courses c ON f.course_id = c.id
       LEFT JOIN faculty fac ON f.faculty_id = fac.id
       WHERE f.semester = $1
       ORDER BY f.created_at DESC`,
      [semester]
    );
    
    // Filter by section for core courses
    const filteredForms = result.rows.filter(f => {
      if (f.subject_type === 'core') return f.section === section;
      return true;
    });
    
    res.json(filteredForms);
  } catch (error) {
    console.error('Get student forms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get form by ID with details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT f.*, c.course_name, c.code, fac.name as faculty_name
       FROM feedback_forms f
       LEFT JOIN courses c ON f.course_id = c.id
       LEFT JOIN faculty fac ON f.faculty_id = fac.id
       WHERE f.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create feedback form (admin only)
router.post('/', authMiddleware, requireRole('admin'), validateBody(formsCreateBodySchema), async (req, res) => {
  try {
    const { 
      title, subject_type, academic_year, semester, section, 
      feedback_period, course_id, faculty_id, closes_at 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO feedback_forms 
       (title, subject_type, academic_year, semester, section, 
        feedback_period, course_id, faculty_id, closes_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
       RETURNING *`,
      [title, subject_type, academic_year, semester, section,
       feedback_period, course_id, faculty_id, closes_at]
    );
    
    const form = result.rows[0];
    
    // Generate targets for students
    await generateFormTargets(form);
    
    res.status(201).json(form);
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update feedback form (admin only)
router.put('/:id', authMiddleware, requireRole('admin'), validateBody(formsUpdateBodySchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject_type, academic_year, semester, section,
            feedback_period, course_id, faculty_id, closes_at, status } = req.body;
    
    const result = await pool.query(
      `UPDATE feedback_forms 
       SET title = COALESCE($1, title), subject_type = COALESCE($2, subject_type), academic_year = COALESCE($3, academic_year), semester = COALESCE($4, semester),
           section = COALESCE($5, section), feedback_period = COALESCE($6, feedback_period), course_id = COALESCE($7, course_id), faculty_id = COALESCE($8, faculty_id),
           closes_at = COALESCE($9, closes_at), status = COALESCE($10, status)
       WHERE id = $11
       RETURNING *`,
      [title, subject_type, academic_year, semester, section,
       feedback_period, course_id, faculty_id, closes_at, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete feedback form (admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM feedback_forms WHERE id = $1', [id]);
    res.json({ message: 'Form deleted' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to generate form targets
async function generateFormTargets(form) {
  try {
    let students;
    
    if (form.subject_type === 'core') {
      // Core: all students matching semester + section
      students = await pool.query(
        'SELECT id FROM students WHERE semester = $1 AND section = $2',
        [form.semester, form.section]
      );
    } else {
      // Elective: all students matching semester
      students = await pool.query(
        'SELECT id FROM students WHERE semester = $1',
        [form.semester]
      );
    }
    
    // Insert targets
    for (const student of students.rows) {
      await pool.query(
        `INSERT INTO form_student_targets (form_id, student_id, status)
         VALUES ($1, $2, 'pending')
         ON CONFLICT DO NOTHING`,
        [form.id, student.id]
      );
    }
    
    console.log(`Generated ${students.rows.length} form targets`);
  } catch (error) {
    console.error('Generate targets error:', error);
  }
}

module.exports = router;
