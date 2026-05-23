const User = require('../models/User');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all users (excluding passwords)
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server Error', data: null });
  }
};

// @desc    Delete a user by ID
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account', data: null });
    }

    // Delete user's tasks and activity logs too
    await Task.deleteMany({ userId: user._id });
    await ActivityLog.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });

    return res.status(200).json({
      success: true,
      message: 'User and associated data deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server Error', data: null });
  }
};

// @desc    Update user status (Active/Inactive)
// @route   PATCH /api/admin/users/:id/status
// @access  Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value. Must be Active or Inactive', data: null });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own status', data: null });
    }

    user.status = status;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server Error', data: null });
  }
};

// @desc    Get all tasks (with user info)
// @route   GET /api/admin/tasks
// @access  Admin
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'All tasks retrieved successfully',
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server Error', data: null });
  }
};

// @desc    Delete any task by ID
// @route   DELETE /api/admin/tasks/:id
// @access  Admin
exports.deleteAnyTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found', data: null });
    }

    await Task.deleteOne({ _id: task._id });

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server Error', data: null });
  }
};

// @desc    Get all activity logs (with user info)
// @route   GET /api/admin/logs
// @access  Admin
exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 });

    return res.status(200).json({
      success: true,
      message: 'Activity logs retrieved successfully',
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server Error', data: null });
  }
};

// @desc    Get summary analytics
// @route   GET /api/admin/summary
// @access  Admin
exports.getSummary = async (req, res) => {
  try {
    const [totalUsers, totalTasks, completedTasks, pendingTasks] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Task.countDocuments({ status: 'Completed' }),
      Task.countDocuments({ status: 'Pending' }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Summary retrieved successfully',
      data: { totalUsers, totalTasks, completedTasks, pendingTasks },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server Error', data: null });
  }
};
