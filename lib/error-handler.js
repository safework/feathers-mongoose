'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = errorHandler;

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function errorHandler(error) {
  if (error.name) {
    switch (error.name) {
      case 'ValidationError':
      case 'ValidatorError':
      case 'CastError':
      case 'VersionError':
        return Promise.reject(new _feathersErrors2.default.BadRequest(error));
      case 'OverwriteModelError':
        return Promise.reject(new _feathersErrors2.default.Conflict(error));
      case 'MissingSchemaError':
      case 'DivergentArrayError':
        return Promise.reject(new _feathersErrors2.default.GeneralError(error));
      case 'MongoError':
        if (error.code === 11000 || error.code === 11001) {
          // NOTE (EK): Error parsing as discussed in this github thread
          // https://github.com/Automattic/mongoose/issues/2129
          var match1 = error.message.match(/_?([a-zA-Z]*)_?\d?\s*dup key/i);
          var match2 = error.message.match(/\s*dup key:\s*\{\s*:\s*"?(\S+)"?\s*\}/i);

          var key = match1 ? match1[1] : 'path';
          var value = match2 ? match2[1] : 'value';

          if (value === 'null') {
            value = null;
          } else if (value === 'undefined') {
            value = undefined;
          }

          error.message = key + ': ' + value + ' already exists.';
          error.errors = _defineProperty({}, key, value);

          return Promise.reject(new _feathersErrors2.default.Conflict(error));
        }

        return Promise.reject(new _feathersErrors2.default.GeneralError(error));
    }
  }

  return Promise.reject(error);
}
module.exports = exports['default'];