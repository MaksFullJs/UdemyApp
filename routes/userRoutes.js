const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);
router.route('/forgotPassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

// ----------------------- need protection

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrict('admin'), userController.getAllUsers);

router
  .route('/updateMe')
  .patch(
    userController.uploadImageUserData,
    userController.resizeUserPhoto,
    userController.updateMe
  );
router.route('/updatePassword').patch(authController.updatePassword);

router
  .route('/:id')
  .delete(authController.restrict('admin'), userController.deleteUser)
  .patch(authController.restrict('admin'), userController.updateUser);

router.route('/deleteMe').delete(userController.deleteMe);

router.route('/getMe').get(userController.getMe, userController.getUser);

module.exports = router;
