class APIFeatures {
  constructor(queryObject, queryString) {
    this.queryObject = queryObject;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.queryObject = this.queryObject.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.queryObject = this.queryObject.sort(sortBy);
      console.log('hello');
    } else {
      this.queryObject = this.queryObject.sort('-createdAt');
    }

    return this;
  }

  field() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.replace(',', ' ');
      this.queryObject = this.queryObject.select(fields);
    } else {
      this.queryObject = this.queryObject.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.queryObject = this.queryObject.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
