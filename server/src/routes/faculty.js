const express = require('express');
const pool = require('../config/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { facultyCreateBodySchema, facultyUpdateBodySchema } = require('../validation/schemas');

const router = express.Router();

// Get all faculty
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM faculty ORDER BY faculty_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get faculty by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM faculty WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create faculty (admin only)
router.post('/', authMiddleware, requireRole('admin'), validateBody(facultyCreateBodySchema), async (req, res) => {
  try {
    const { faculty_id, name, department, designation } = req.body;
    
    const result = await pool.query(
      `INSERT INTO faculty (faculty_id, name, department, designation)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [faculty_id, name, department, designation]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Faculty ID already exists' });
    }
    console.error('Create faculty error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update faculty (admin only)
router.put('/:id', authMiddleware, requireRole('admin'), validateBody(facultyUpdateBodySchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { faculty_id, name, department, designation } = req.body;
    
    const result = await pool.query(
      `UPDATE faculty 
       SET faculty_id = COALESCE($1, faculty_id),
           name = COALESCE($2, name),
           department = COALESCE($3, department),
           designation = COALESCE($4, designation)
       WHERE id = $5
       RETURNING *`,
      [faculty_id, name, department, designation, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update faculty error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete faculty (admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM faculty WHERE id = $1', [id]);
    res.json({ message: 'Faculty deleted' });
  } catch (error) {
    console.error('Delete faculty error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
