const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN, authMiddleware, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const {
  authLoginBodySchema,
  authStudentLoginBodySchema,
  authRegisterBodySchema,
} = require('../validation/schemas');

const router = express.Router();
const AUTH_ROLES = new Set(['admin', 'student']);
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, try again later.' },
});

// Login
router.post('/login', loginLimiter, validateBody(authLoginBodySchema), async (req, res) => {
  try {
    const { loginId, email, password } = req.body;
    const normalizedLoginId = String(loginId ?? email ?? '').trim();
    if (!normalizedLoginId || !password) {
      return res.status(400).json({ error: 'Login ID and password are required' });
    }
    
    // Find user in auth_users table
    const result = await pool.query(
      'SELECT * FROM auth_users WHERE UPPER(TRIM(login_id)) = UPPER(TRIM($1))',
      [normalizedLoginId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, login_id: user.login_id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Get role-specific data
    let roleData = {};
    if (user.role === 'student') {
      const studentResult = await pool.query(
        'SELECT * FROM students WHERE user_id = $1',
        [user.id]
      );
      roleData = studentResult.rows[0] || {};
    }
    
    res.json({
      token,
      user: {
        id: user.id,
        login_id: user.login_id,
        role: user.role,
        ...roleData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Student login (special endpoint for student reg number + dob)
router.post('/student/login', loginLimiter, validateBody(authStudentLoginBodySchema), async (req, res) => {
  try {
    const { registrationNumber, dob } = req.body;
    const normalizedRegNo = String(registrationNumber || '').trim().toUpperCase();
    const normalizedDob = String(dob || '').trim().replace(/\//g, '-');
    let dobYmd = null;

    if (/^\d{8}$/.test(normalizedDob)) {
      // YYYYMMDD
      dobYmd = `${normalizedDob.slice(0, 4)}-${normalizedDob.slice(4, 6)}-${normalizedDob.slice(6, 8)}`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDob)) {
      // YYYY-MM-DD
      dobYmd = normalizedDob;
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(normalizedDob)) {
      // DD-MM-YYYY
      const [dd, mm, yyyy] = normalizedDob.split('-');
      dobYmd = `${yyyy}-${mm}-${dd}`;
    }

    if (!normalizedRegNo || !dobYmd) {
      return res.status(400).json({ error: 'Registration number and DOB are required' });
    }
    
    // Find student by registration number and DOB using SQL date comparison
    const studentResult = await pool.query(
      'SELECT * FROM students WHERE UPPER(TRIM(registration_number)) = $1 AND dob = $2::date',
      [normalizedRegNo, dobYmd]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid registration number or date of birth' });
    }
    
    const student = studentResult.rows[0];
    
    // Get or create auth_user for student
    let authResult = await pool.query(
      'SELECT * FROM auth_users WHERE id = $1',
      [student.user_id]
    );
    
    if (authResult.rows.length === 0) {
      // Create auth user for student
      const tempPassword = await bcrypt.hash(dobYmd, 10);
      
      authResult = await pool.query(
        'INSERT INTO auth_users (id, login_id, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [student.user_id, normalizedRegNo, tempPassword, 'student']
      );
      
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: student.user_id, login_id: student.registration_number, role: 'student' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      token,
      user: {
        id: student.user_id,
        login_id: student.registration_number,
        role: 'student',
        ...student
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register (for creating new users - admin only in production)
router.post('/register', authMiddleware, requireRole('admin'), validateBody(authRegisterBodySchema), async (req, res) => {
  try {
    const { loginId, password, role } = req.body;
    const normalizedLoginId = String(loginId || '').trim();
    const requestedRole = role || 'student';
    const canCreateAdmin = String(process.env.ALLOW_ADMIN_REGISTRATION || '').toLowerCase() === 'true';

    if (!AUTH_ROLES.has(requestedRole)) {
      return res.status(400).json({ error: 'Invalid role value' });
    }
    if (requestedRole === 'admin' && !canCreateAdmin) {
      return res.status(403).json({ error: 'Admin user creation is disabled' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO auth_users (login_id, password, role) VALUES ($1, $2, $3) RETURNING id, login_id, role',
      [normalizedLoginId, hashedPassword, requestedRole]
    );
    
    const user = result.rows[0];
    
    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Login ID already exists' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, login_id, role FROM auth_users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Get role-specific data
    let roleData = {};
    if (user.role === 'student') {
      const studentResult = await pool.query(
        'SELECT * FROM students WHERE user_id = $1',
        [user.id]
      );
      roleData = studentResult.rows[0] || {};
    }
    
    res.json({ ...user, ...roleData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
