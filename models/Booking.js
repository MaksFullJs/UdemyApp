const { Schema, default: mongoose } = require('mongoose');

const bookingSchema = new Schema({
  tour: {
    type: Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to tour'],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to user'],
  },
  price: {
    type: Number,
    required: [true, 'Booking must contain a price'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: 'tour',
      select: 'name',
    },
    {
      path: 'user',
    },
  ]);
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
