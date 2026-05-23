const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middlewares/isAuthenticated');
const isAdmin = require('../middlewares/isAdmin');
const {
  getAllUsers,
  deleteUser,
  updateUserStatus,
  getAllTasks,
  deleteAnyTask,
  getActivityLogs,
  getSummary,
} = require('../controllers/adminController');

// All routes require authentication + admin role
router.use(isAuthenticated);
router.use(isAdmin);

// User management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/status', updateUserStatus);

// Task monitoring
router.get('/tasks', getAllTasks);
router.delete('/tasks/:id', deleteAnyTask);

// Activity logs
router.get('/logs', getActivityLogs);

// Analytics summary
router.get('/summary', getSummary);

module.exports = router;
