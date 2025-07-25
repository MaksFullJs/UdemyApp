const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({
  path: './config.env',
});

const app = require('./app');

mongoose.connect(process.env.URL).then(() => {
  console.log('Connected to MongoDB Atlas!');
});
// .catch((err) => {
//   console.error('Error connecting to MongoDB Atlas:', err.message);
// });

console.log(process.env.PORT);
console.log(process.env.NODE_ENV);
const port = process.env.PORT || 5050;

const server = app.listen(port, () => {
  console.log(`App starts running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
