const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_me_in_production',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
        data: null,
      });
    }

    // Create user. Note: We allow setting role in registration for development/testing if passed.
    // If not passed, it will default to 'User'.
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'User',
    });

    if (user) {
      const token = generateToken(user._id);
      
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
          },
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data',
        data: null,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
      data: null,
    });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
      });
    }

    // Check if user account is active
    if (user.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive. Please contact support.',
        data: null,
      });
    }

    // Match password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
      });
    }

    // Return token
    const token = generateToken(user._id);

    // Log LOGIN activity (fire-and-forget, don't block response)
    ActivityLog.create({ userId: user._id, action: 'LOGIN', details: `${user.email} logged in` }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
      data: null,
    });
  }
};
