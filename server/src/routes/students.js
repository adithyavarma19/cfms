const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { studentCreateBodySchema, studentUpdateBodySchema } = require('../validation/schemas');

const router = express.Router();

function canAccessStudentByUser(requestUser, targetUserId) {
  return requestUser && (requestUser.role === 'admin' || requestUser.id === targetUserId);
}

// Get all students (admin only)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student by user ID
router.get('/by-user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!canAccessStudentByUser(req.user, userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query('SELECT * FROM students WHERE user_id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current student's profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students WHERE user_id = $1', [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create student (admin only)
router.post('/', authMiddleware, requireRole('admin'), validateBody(studentCreateBodySchema), async (req, res) => {
  const client = await pool.connect();
  try {
    const { registration_number, name, dob, semester, section } = req.body;
    const regNo = String(registration_number || '').trim().toUpperCase();
    const sectionValue = String(section || '').toUpperCase();

    await client.query('BEGIN');

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(String(dob), 10);
    const loginId = regNo;

    await client.query(
      `INSERT INTO auth_users (id, login_id, password, role)
       VALUES ($1, $2, $3, 'student')`,
      [userId, loginId, hashedPassword]
    );

    const result = await client.query(
      `INSERT INTO students (user_id, registration_number, name, dob, semester, section)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, regNo, name, dob, semester, sectionValue]
    );

    await client.query('COMMIT');
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Registration number or login id already exists' });
    }
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Update student (admin only)
router.put('/:id', authMiddleware, requireRole('admin'), validateBody(studentUpdateBodySchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { registration_number, name, dob, semester, section } = req.body;

    const result = await pool.query(
      `UPDATE students 
       SET registration_number = COALESCE($1, registration_number),
           name = COALESCE($2, name),
           dob = COALESCE($3::date, dob),
           semester = COALESCE($4::integer, semester),
           section = COALESCE($5, section)
       WHERE id = $6
       RETURNING *`,
      [
        registration_number ?? null,
        name ?? null,
        dob ?? null,
        semester ?? null,
        section ? String(section).toUpperCase() : null,
        id,
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete student (admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Get user_id first
    const studentResult = await client.query('SELECT user_id FROM students WHERE id = $1', [id]);
    
    if (studentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student not found' });
    }

    const userId = studentResult.rows[0].user_id;
    await client.query('DELETE FROM students WHERE id = $1', [id]);
    await client.query('DELETE FROM auth_users WHERE id = $1', [userId]);

    await client.query('COMMIT');
    
    res.json({ message: 'Student deleted' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
module.exports.canAccessStudentByUser = canAccessStudentByUser;
