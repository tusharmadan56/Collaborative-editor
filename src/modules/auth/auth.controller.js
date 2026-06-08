const { registerSchema, loginSchema } = require('./auth.schema');
const authService = require('./auth.service');
const logger = require('../../utils/logger');

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: validation.error.errors[0].message });
    }

    const { email, password } = validation.data;
    const result = await authService.register(email, password);

    return res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    logger.error('Register error', { error: err.message });
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: validation.error.errors[0].message });
    }

    const { email, password } = validation.data;
    const result = await authService.login(email, password);

    return res.status(200).json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
    });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    next(err);
  }
}

module.exports = { register, login };
