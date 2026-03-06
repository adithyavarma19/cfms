const express = require('express');
const pool = require('../config/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { responsesCreateBodySchema } = require('../validation/schemas');

const router = express.Router();

// Get all feedback responses (admin)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, s.name as student_name, s.registration_number, f.title as form_title
       FROM feedback_responses r
       LEFT JOIN students s ON r.student_id = s.id
       LEFT JOIN feedback_forms f ON r.form_id = f.id
       ORDER BY r.submitted_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get responses for a specific form (admin)
router.get('/form/:formId', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { formId } = req.params;
    const result = await pool.query(
      `SELECT r.*, s.name as student_name, s.registration_number
       FROM feedback_responses r
       LEFT JOIN students s ON r.student_id = s.id
       WHERE r.form_id = $1
       ORDER BY r.submitted_at DESC`,
      [formId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get form responses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit feedback response (student)
router.post('/', authMiddleware, validateBody(responsesCreateBodySchema), async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit feedback' });
    }
    
    const { form_id, ...ratings } = req.body;
    
    // Get student ID
    const studentResult = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [req.user.id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    
    const studentId = studentResult.rows[0].id;
    
    // Check if already submitted
    const existingResult = await pool.query(
      'SELECT id FROM feedback_responses WHERE form_id = $1 AND student_id = $2',
      [form_id, studentId]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Feedback already submitted' });
    }
    
    // Extract ratings
    const {
      q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11,
      q12, q13, q14,
      q15, q16, q17, q18, q19, q20, q21, q22, q23, q24,
      q25, q26, q27, q28, q29, q30, q31,
      q32, q33, q34
    } = ratings;

    const mcqRules = {
      q1: ['A', 'B', 'C', 'D', 'E'],
      q2: ['A', 'B', 'C', 'D', 'E'],
      q3: ['A', 'B', 'C', 'D', 'E'],
      q4: ['A', 'B', 'C', 'D', 'E'],
      q5: ['A', 'B', 'C', 'D', 'E', 'F'],
      q6: ['A', 'B', 'C', 'D', 'E', 'F'],
      q7: ['A', 'B', 'C', 'D', 'F'],
      q8: ['A', 'B', 'C', 'D', 'E'],
      q9: ['A', 'B', 'C', 'D', 'E'],
      q10: ['A', 'B', 'C', 'D', 'E'],
      q14: ['A', 'B', 'C', 'D', 'E'],
      q15: ['A', 'B', 'C', 'D', 'E'],
      q16: ['A', 'B', 'C', 'D', 'E'],
      q17: ['A', 'B', 'C', 'D', 'E'],
      q18: ['A', 'B', 'C', 'D', 'E'],
      q19: ['A', 'B', 'C', 'D', 'E'],
      q20: ['A', 'B', 'C', 'D', 'E'],
      q21: ['A', 'B', 'C', 'D', 'E'],
      q22: ['A', 'B', 'C', 'D', 'E'],
      q23: ['A', 'B', 'C', 'D', 'E'],
      q24: ['A', 'B', 'C', 'D', 'E'],
      q25: ['A', 'B', 'C', 'D', 'E'],
      q26: ['A', 'B', 'C', 'D', 'E'],
      q27: ['A', 'B', 'C', 'D', 'E'],
      q28: ['A', 'B', 'C', 'D', 'E'],
      q29: ['A', 'B', 'C', 'D', 'E'],
      q30: ['A', 'B', 'C', 'D', 'E'],
      q31: ['A', 'B', 'C', 'D', 'E'],
    };
    const mcqPayload = {
      q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
      q14, q15, q16, q17, q18, q19, q20, q21, q22, q23, q24,
      q25, q26, q27, q28, q29, q30, q31,
    };
    const invalidKey = Object.keys(mcqRules).find((key) => !mcqRules[key].includes(mcqPayload[key]));
    if (invalidKey) {
      return res.status(400).json({ error: `Invalid answer for ${invalidKey}.` });
    }
    
    // Insert response
    const result = await pool.query(
      `INSERT INTO feedback_responses 
       (form_id, student_id, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11,
        q12, q13, q14, q15, q16, q17, q18, q19, q20, q21, q22, q23, q24,
        q25, q26, q27, q28, q29, q30, q31, q32, q33, q34)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
               $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
               $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
       RETURNING *`,
      [form_id, studentId,
       q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11,
       q12, q13, q14, q15, q16, q17, q18, q19, q20, q21, q22, q23, q24,
       q25, q26, q27, q28, q29, q30, q31, q32, q33, q34]
    );
    
    // Update form response count
    await pool.query(
      'UPDATE feedback_forms SET response_count = response_count + 1 WHERE id = $1',
      [form_id]
    );
    
    // Update target status
    await pool.query(
      `INSERT INTO form_student_targets (form_id, student_id, status)
       VALUES ($1, $2, 'submitted')
       ON CONFLICT (form_id, student_id)
       DO UPDATE SET status = 'submitted'`,
      [form_id, studentId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student's submitted feedback
router.get('/my-responses', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const studentResult = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [req.user.id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const result = await pool.query(
      `SELECT r.*, f.title as form_title
       FROM feedback_responses r
       LEFT JOIN feedback_forms f ON r.form_id = f.id
       WHERE r.student_id = $1
       ORDER BY r.submitted_at DESC`,
      [studentResult.rows[0].id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get my responses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if student has submitted feedback for a form
router.get('/check/:formId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const { formId } = req.params;
    
    const studentResult = await pool.query(
      'SELECT id FROM students WHERE user_id = $1',
      [req.user.id]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const result = await pool.query(
      'SELECT id FROM feedback_responses WHERE form_id = $1 AND student_id = $2',
      [formId, studentResult.rows[0].id]
    );
    
    res.json({ submitted: result.rows.length > 0 });
  } catch (error) {
    console.error('Check response error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
