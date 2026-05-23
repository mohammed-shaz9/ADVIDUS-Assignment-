const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const { title, description, status } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
        data: null,
      });
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'Pending',
      userId: req.user._id,
    });

    ActivityLog.create({ userId: req.user._id, action: 'TASK_CREATED', details: task.title }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
      data: null,
    });
  }
};

// @desc    Get all tasks for the logged-in user
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
      data: null,
    });
  }
};

// @desc    Update a task (own task only)
// @route   PATCH /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const taskId = req.params.id;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        data: null,
      });
    }

    // Check if task belongs to user
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task',
        data: null,
      });
    }

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;

    const updatedTask = await task.save();

    ActivityLog.create({ userId: req.user._id, action: 'TASK_UPDATED', details: updatedTask.title }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
      data: null,
    });
  }
};

// @desc    Delete a task (own task only)
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        data: null,
      });
    }

    // Check if task belongs to user
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task',
        data: null,
      });
    }

    // Delete task
    await Task.deleteOne({ _id: taskId });

    ActivityLog.create({ userId: req.user._id, action: 'TASK_DELETED', details: task.title }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { id: taskId },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
      data: null,
    });
  }
};
