const express = require('express');
const router = express.Router();

// 导入路由文件
const customers = require('./customers');
const services = require('./services');
const memberships = require('./memberships');
const statistics = require('./statistics');
const therapists = require('./therapists');

// API路由
router.use('/customers', customers);
router.use('/services', services);
router.use('/memberships', memberships);
router.use('/statistics', statistics);
router.use('/therapists', therapists);

module.exports = router; 