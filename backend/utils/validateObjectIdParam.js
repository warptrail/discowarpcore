// utils/validateObjectIdParam.js
const mongoose = require('mongoose');
const createHttpError = require('http-errors');

function validateObjectIdParam(paramName) {
  return (req, _res, next) => {
    const val = req.params[paramName];
    if (!mongoose.isValidObjectId(val)) {
      return next(
        createHttpError(400, `Invalid ${paramName} (must be a Mongo ObjectId)`)
      );
    }
    return next();
  };
}

module.exports = { validateObjectIdParam };
