const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/auth');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// 公开路由
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// 私有路由 - 需要认证
router.use(protect);
router.get('/logout', logout);
router.get('/me', getMe);
router.put('/updatepassword', updatePassword);

module.exports = router; 