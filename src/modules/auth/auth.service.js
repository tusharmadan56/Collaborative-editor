const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const logger = require('../../utils/logger');

const SALT_ROUNDS = 12;

/**
 * Generate a JWT for a user.
 * @param {{ id: string, email: string }} user
 * @returns {string} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Register a new user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, token: string }>}
 */
async function register(email, password) {
  // Check if user already exists
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, passwordHash]
  );

  const user = result.rows[0];
  const token = generateToken(user);

  logger.info('User registered', { userId: user.id, email: user.email });

  return { user, token };
}

/**
 * Login an existing user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, token: string }>}
 */
async function login(email, password) {
  const result = await db.query(
    'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  logger.info('User logged in', { userId: user.id, email: user.email });

  return {
    user: { id: user.id, email: user.email, created_at: user.created_at },
    token,
  };
}

module.exports = { register, login, generateToken };
