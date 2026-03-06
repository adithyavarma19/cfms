const express = require('express');
const pool = require('../config/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { coursesCreateBodySchema, coursesUpdateBodySchema } = require('../validation/schemas');

const router = express.Router();

// Get all courses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY semester, code');
    res.json(result.rows);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get course by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create course (admin only)
router.post('/', authMiddleware, requireRole('admin'), validateBody(coursesCreateBodySchema), async (req, res) => {
  try {
    const { code, course_name, short_name, credits, semester, course_type } = req.body;
    
    const result = await pool.query(
      `INSERT INTO courses (code, course_name, short_name, credits, semester, course_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [code, course_name, short_name, credits, semester, course_type]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update course (admin only)
router.put('/:id', authMiddleware, requireRole('admin'), validateBody(coursesUpdateBodySchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { code, course_name, short_name, credits, semester, course_type } = req.body;
    
    const result = await pool.query(
      `UPDATE courses 
       SET code = COALESCE($1, code),
           course_name = COALESCE($2, course_name),
           short_name = COALESCE($3, short_name),
           credits = COALESCE($4, credits),
           semester = COALESCE($5, semester),
           course_type = COALESCE($6, course_type)
       WHERE id = $7
       RETURNING *`,
      [code, course_name, short_name, credits, semester, course_type, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete course (admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM courses WHERE id = $1', [id]);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
