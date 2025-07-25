const multer = require('multer');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const sharp = require('sharp');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const extension = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('Your file is not an image!! Please upload only image', 400),
      null
    );
  }
};

const upload = multer({
  storage,
  fileFilter: fileFilter,
});

const uploadImageUserData = upload.single('photo');

const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`./public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...fields) => {
  const returnedObj = {};
  Object.keys(obj).forEach((key) => {
    if (fields.includes(key)) {
      returnedObj[key] = obj[key];
    }
  });
  return returnedObj;
};

const updateMe = catchAsync(async (req, res, next) => {
  // 1) show an error when user tries to change password

  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates', 400));
  }

  // 2) update user document
  // We should not just put req.body here bcs user can put role as admin and it will destroy security and smth like that
  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'Good',
    data: updatedUser,
  });
});

const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'Good',
    data: null,
  });
});

const getMe = async (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'Good',
    data: users,
  });
});

// Only for admins

const deleteUser = factory.deleteOne(User);

// not update password here
const updateUser = factory.updateOne(User);

const getUser = factory.getOne(User);

module.exports = {
  updateMe,
  deleteMe,
  getMe,
  getAllUsers,
  deleteUser,
  updateUser,
  getUser,
  uploadImageUserData,
  resizeUserPhoto,
};
