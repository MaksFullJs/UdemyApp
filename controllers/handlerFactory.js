const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/APIFeatures');

const getAll = (Model, populateOption) =>
  catchAsync(async (req, res, next) => {
    let filter = {};

    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .field()
      .paginate();

    if (populateOption) {
      features.queryObject = features.queryObject.populate(populateOption);
    }

    const alls = await features.queryObject;

    res.json({
      status: 'Good',
      data: alls,
    });
  });

const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    await Model.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

const updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const updatedOne = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedOne) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'Good',
      data: updatedOne,
    });
  });

const createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newOne = await Model.create(req.body);
    res.status(201).json({
      status: 'Good',
      data: newOne,
    });
  });

const getOne = (Model, populateOption) =>
  catchAsync(async (req, res, next) => {
    // populate щоб відобразилась повні інформація про референс обєкт і селект для фільтру

    let query = Model.findById(req.params.id);

    if (populateOption) {
      query = query.populate(populateOption);
    }

    const one = await query;

    if (!one) {
      return next(
        new AppError(`Document with ${req.params.id} id does not exist!`, 404)
      );
    }

    res.status(200).json({
      status: 'Good',
      data: one,
    });
  });

module.exports = { getAll, deleteOne, updateOne, createOne, getOne };
