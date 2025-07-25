const AppError = require('../utils/appError');

const isProduction = process.env.NODE_ENV === 'production';

const handleJWTExpiredError = (err) => {
  const message = `Please log in again because your ${err.message}`;
  return new AppError(message, 401);
};

const handleJWTError = () => {
  const message = 'Invalid token, please log in again';
  return new AppError(message, 401);
};

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleMongoError = (err) => {
  const message = `Duplicate field key: ${Object.keys(err.keyValue)}, value: ${
    err.keyValue.name
  }`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((value) => value.message);

  const message = `Invalid input data. ${errors.join(', ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) RENDERED WEBSITE
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    console.log(err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (isProduction) {
    let error;
    if (err.name == 'CastError') {
      error = handleCastError(err);
    }

    if (err.code == 11000) {
      error = handleMongoError(err);
    }

    if (err.name == 'ValidationError') {
      error = handleValidationError(err);
    }

    if (err.name == 'JsonWebTokenError') {
      error = handleJWTError();
    }

    if (err.name == 'TokenExpiredError') {
      error = handleJWTExpiredError(err);
    }

    if (!error) {
      sendErrorProd(err, res);
    }

    sendErrorProd(error, res);
  } else {
    sendErrorDev(err, req, res);
  }
};

module.exports = { globalErrorHandler };
