const express = require('express');
const router = express.Router();
const {
  getServiceItems,
  addServiceItem,
  updateServiceItem,
  deleteServiceItem,
  getMembershipTypes,
  addMembershipType,
  updateMembershipType,
  deleteMembershipType
} = require('../controllers/settings');

// 服务项目路由
router.route('/service-items')
  .get(getServiceItems)
  .post(addServiceItem);

router.route('/service-items/:id')
  .put(updateServiceItem)
  .delete(deleteServiceItem);

// 会员卡类型路由
router.route('/membership-types')
  .get(getMembershipTypes)
  .post(addMembershipType);

router.route('/membership-types/:id')
  .put(updateMembershipType)
  .delete(deleteMembershipType);

module.exports = router; 