const express = require('express');
const router = express.Router();
const {
  getAllTherapists,
  getTherapist,
  createTherapist,
  updateTherapist,
  deleteTherapist,
  getTherapistStats
} = require('../controllers/therapistController');

// 获取所有医师/创建医师
router.route('/')
  .get(getAllTherapists)
  .post(createTherapist);

// 获取/更新/删除单个医师
router.route('/:id')
  .get(getTherapist)
  .put(updateTherapist)
  .delete(deleteTherapist);

// 获取医师统计数据
router.route('/:id/stats')
  .get(getTherapistStats);

module.exports = router; 