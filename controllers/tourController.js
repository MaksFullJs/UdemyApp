const multer = require('multer');
const Tour = require('../models/Tour');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const sharp = require('sharp');

const alias = (req, res, next) => {
  req.query.limit = '5';
  next();
};

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

const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

const resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`./public/img/tours/${req.body.imageCover}`);

  const imageFilenames = await Promise.all(
    req.files.images.map(async (image, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`./public/img/tours/${filename}`);

      return filename;
    })
  );

  req.body.images = imageFilenames;
  next();
});

// const getAllTours = catchAsync(async (req, res, next) => {
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .field()
//     .paginate();

//   const tours = await features.queryObject;

//   res.json({
//     status: 'Good',
//     data: tours,
//   });
// });

const getAllTours = factory.getAll(Tour);

// const getTour = catchAsync(async (req, res, next) => {
//   // populate щоб відобразилась повні інформація про референс обєкт і селект для фільтру

//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   if (!tour) {
//     return next(
//       new AppError(`Tour with ${req.params.id} id does not exist!`, 404)
//     );
//   }

//   res.status(200).json({
//     status: 'Good',
//     data: tour,
//   });
// });

const getTour = factory.getOne(Tour, 'reviews');

// const createTour = catchAsync(async (req, res, next) => {
//   //   const { destination, price } = req.body;
//   //   const newTour = new Tour({
//   //     destination,
//   //     price,
//   //   });
//   //   newTour.save()
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'Good',
//     data: newTour,
//   });
// });

const createTour = factory.createOne(Tour);

const deleteTour = factory.deleteOne(Tour);

const updateTour = factory.updateOne(Tour);

// const deleteTour = catchAsync(async (req, res, next) => {
//   await Tour.findByIdAndDelete(req.params.id);

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

const getTourStat = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        quantityTours: { $sum: 1 },
        quantityRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { minPrice: 1 },
    },
    //   {
    //     $match: { _id: { $ne: 'EASY' } },
    //   },
  ]);
  res.status(200).json({
    status: 'Good',
    stats,
  });
});

const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        quantity: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { quantity: 1 },
    },
  ]);
  res.status(200).json({
    status: 'Good',
    count: plan.length,
    plan,
  });
});

const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'ml' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng'
      )
    );
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  });

  res.status(200).json({
    status: 'Good',
    data: tours,
  });
});

const getToursDistanceTo = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng'
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'Good',
    data: distances,
  });
});

module.exports = {
  getAllTours,
  createTour,
  getTour,
  deleteTour,
  alias,
  getTourStat,
  getMonthlyPlan,
  updateTour,
  getToursWithin,
  getToursDistanceTo,
  uploadTourImages,
  resizeTourImages,
};
