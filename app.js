const express = require('express');
const cors = require('cors');
const AppError = require('./utils/appError');
const tourRoutes = require('./routes/tourRoutes');
const userRoutes = require('./routes/userRoutes');
const viewRoutes = require('./routes/viewRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const errorController = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(cookieParser());
// app.use(cors());
// security http headers
app.use(helmet());

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
//     },
//   })
// );

// rate-limitting requests from same IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  handler: (req, res, next) => {
    return next(
      new AppError(
        'Too many requests from this IP, try a little bit later',
        429
      )
    );
  },
});

// data sanitization against nosql data injection

app.use(mongoSanitize());

// data sanitization against XSS

app.use(xss());

// prevent parametr pollution

app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

app.use('/api', limiter);

app.use('/', viewRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
//app.use('/api/reviews', reviewRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Cant find ${req.url} on this server`, 404));
});

app.use(errorController.globalErrorHandler);

module.exports = app;
