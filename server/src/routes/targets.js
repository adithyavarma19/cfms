const express = require('express');
const pool = require('../config/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { targetsUpdateBodySchema } = require('../validation/schemas');

const router = express.Router();

// Get all form targets (admin)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, s.name as student_name, s.registration_number, f.title as form_title
       FROM form_student_targets t
       LEFT JOIN students s ON t.student_id = s.id
       LEFT JOIN feedback_forms f ON t.form_id = f.id
       ORDER BY f.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get targets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get targets for a specific form (admin)
router.get('/form/:formId', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { formId } = req.params;
    const result = await pool.query(
      `SELECT t.*, s.name as student_name, s.registration_number
       FROM form_student_targets t
       LEFT JOIN students s ON t.student_id = s.id
       WHERE t.form_id = $1`,
      [formId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get form targets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student's targets (for student dashboard)
router.get('/my-targets', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const studentResult = await pool.query(
      'SELECT id, semester, section FROM students WHERE user_id = $1',
      [req.user.id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const student = studentResult.rows[0];
    
    // Get all forms for student's semester
    const formsResult = await pool.query(
      `SELECT f.*, c.course_name, c.code, fac.name as faculty_name
       FROM feedback_forms f
       LEFT JOIN courses c ON f.course_id = c.id
       LEFT JOIN faculty fac ON f.faculty_id = fac.id
       WHERE f.semester = $1`,
      [student.semester]
    );
    
    // Get targets for student
    const targetsResult = await pool.query(
      `SELECT form_id, status FROM form_student_targets WHERE student_id = $1`,
      [student.id]
    );
    
    const targetsMap = new Map();
    targetsResult.rows.forEach(t => targetsMap.set(t.form_id, t.status));
    
    // Filter and combine
    const myTargets = formsResult.rows
      .filter(f => {
        if (f.subject_type === 'core') return f.section === student.section;
        return true;
      })
      .map(f => ({
        ...f,
        target_status: targetsMap.get(f.id) || 'pending'
      }));
    
    res.json(myTargets);
  } catch (error) {
    console.error('Get my targets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update target status (admin)
router.put('/:id', authMiddleware, requireRole('admin'), validateBody(targetsUpdateBodySchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      'UPDATE form_student_targets SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Target not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update target error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
