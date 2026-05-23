const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const isAuthenticated = require('../middlewares/isAuthenticated');

// Protect all routes under this router
router.use(isAuthenticated);

router.route('/')
  .post(createTask)
  .get(getTasks);

router.route('/:id')
  .patch(updateTask)
  .delete(deleteTask);

module.exports = router;
