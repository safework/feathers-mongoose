'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = init;

var _lodash = require('lodash.omit');

var _lodash2 = _interopRequireDefault(_lodash);

var _uberproto = require('uberproto');

var _uberproto2 = _interopRequireDefault(_uberproto);

var _feathersQueryFilters = require('feathers-query-filters');

var _feathersQueryFilters2 = _interopRequireDefault(_feathersQueryFilters);

var _feathersCommons = require('feathers-commons');

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

var _errorHandler = require('./error-handler');

var _errorHandler2 = _interopRequireDefault(_errorHandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Create the service.
var Service = function () {
  function Service(options) {
    var _this = this;

    _classCallCheck(this, Service);

    if (!options) {
      throw new Error('Mongoose options have to be provided');
    }

    if (!options.Model || !options.Model.modelName) {
      throw new Error('You must provide a Mongoose Model');
    }

    this.Model = options.Model;
    this.discriminatorKey = this.Model.schema.options.discriminatorKey;
    this.discriminators = {};
    (options.discriminators || []).forEach(function (element) {
      if (element.modelName) {
        _this.discriminators[element.modelName] = element;
      }
    });
    this.id = options.id || '_id';
    this.paginate = options.paginate || {};
    this.lean = options.lean === undefined ? true : options.lean;
    this.overwrite = options.overwrite !== false;
    this.events = options.events || [];
  }

  _createClass(Service, [{
    key: 'extend',
    value: function extend(obj) {
      return _uberproto2.default.extend(obj, this);
    }
  }, {
    key: '_find',
    value: function _find(params, count) {
      var getFilter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _feathersQueryFilters2.default;

      var _getFilter = getFilter(params.query || {}),
          filters = _getFilter.filters,
          query = _getFilter.query;

      var discriminator = (params.query || {})[this.discriminatorKey] || this.discriminatorKey;
      var model = this.discriminators[discriminator] || this.Model;
      var q = model.find(query).lean(this.lean);

      // $select uses a specific find syntax, so it has to come first.
      if (Array.isArray(filters.$select)) {
        var fields = {};

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = filters.$select[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            fields[key] = 1;
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        q.select(fields);
      } else if (typeof filters.$select === 'string' || _typeof(filters.$select) === 'object') {
        q.select(filters.$select);
      }

      // Handle $sort
      if (filters.$sort) {
        q.sort(filters.$sort);
      }

      // Handle $limit
      if (typeof filters.$limit !== 'undefined') {
        q.limit(filters.$limit);
      }

      // Handle $skip
      if (filters.$skip) {
        q.skip(filters.$skip);
      }

      // Handle $populate
      if (filters.$populate) {
        q.populate(filters.$populate);
      }

      // Handle collation
      if (params.collation) {
        q.collation(params.collation);
      }

      var executeQuery = function executeQuery(total) {
        return q.exec().then(function (data) {
          return {
            total: total,
            limit: filters.$limit,
            skip: filters.$skip || 0,
            data: data
          };
        });
      };

      if (filters.$limit === 0) {
        executeQuery = function executeQuery(total) {
          return Promise.resolve({
            total: total,
            limit: filters.$limit,
            skip: filters.$skip || 0,
            data: []
          });
        };
      }

      if (count) {
        return model.where(query).count().exec().then(executeQuery);
      }

      return executeQuery();
    }
  }, {
    key: 'find',
    value: function find(params) {
      var paginate = params && typeof params.paginate !== 'undefined' ? params.paginate : this.paginate;
      var result = this._find(params, !!paginate.default, function (query) {
        return (0, _feathersQueryFilters2.default)(query, paginate);
      });

      if (!paginate.default) {
        return result.then(function (page) {
          return page.data;
        });
      }

      return result;
    }
  }, {
    key: '_get',
    value: function _get(id) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      params.query = params.query || {};

      var discriminator = (params.query || {})[this.discriminatorKey] || this.discriminatorKey;
      var model = this.discriminators[discriminator] || this.Model;
      var modelQuery = model.findOne(_defineProperty({}, this.id, id));

      // Handle $populate
      if (params.query.$populate) {
        modelQuery = modelQuery.populate(params.query.$populate);
      }

      // Handle $select
      if (params.query.$select && params.query.$select.length) {
        var fields = _defineProperty({}, this.id, 1);

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = params.query.$select[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var key = _step2.value;

            fields[key] = 1;
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        modelQuery.select(fields);
      } else if (params.query.$select && _typeof(params.query.$select) === 'object') {
        modelQuery.select(params.query.$select);
      }

      return modelQuery.lean(this.lean).exec().then(function (data) {
        if (!data) {
          throw new _feathersErrors2.default.NotFound('No record found for id \'' + id + '\'');
        }

        return data;
      }).catch(_errorHandler2.default);
    }
  }, {
    key: 'get',
    value: function get(id, params) {
      return this._get(id, params);
    }
  }, {
    key: '_getOrFind',
    value: function _getOrFind(id, params) {
      if (id === null) {
        return this._find(params).then(function (page) {
          return page.data;
        });
      }

      return this._get(id, params);
    }
  }, {
    key: 'create',
    value: function create(data, params) {
      var _this2 = this;

      var discriminator = data[this.discriminatorKey] || this.discriminatorKey;
      var model = this.discriminators[discriminator] || this.Model;
      return model.create(data).then(function (result) {
        if (_this2.lean) {
          if (Array.isArray(result)) {
            return result.map(function (item) {
              return item.toObject ? item.toObject() : item;
            });
          }
          return result.toObject ? result.toObject() : result;
        }
        return result;
      }).then((0, _feathersCommons.select)(params, this.id)).catch(_errorHandler2.default);
    }
  }, {
    key: 'update',
    value: function update(id, data, params) {
      if (id === null) {
        return Promise.reject(new _feathersErrors2.default.BadRequest('Not replacing multiple records. Did you mean `patch`?'));
      }

      // Handle case where data might be a mongoose model
      if (typeof data.toObject === 'function') {
        data = data.toObject();
      }

      var options = Object.assign({
        new: true,
        overwrite: this.overwrite,
        runValidators: true,
        context: 'query',
        setDefaultsOnInsert: true
      }, params.mongoose);

      if (this.id === '_id') {
        // We can not update default mongo ids
        data = (0, _lodash2.default)(data, this.id);
      } else {
        // If not using the default Mongo _id field set the id to its
        // previous value. This prevents orphaned documents.
        data = Object.assign({}, data, _defineProperty({}, this.id, id));
      }

      var discriminator = (params.query || {})[this.discriminatorKey] || this.discriminatorKey;
      var model = this.discriminators[discriminator] || this.Model;
      var modelQuery = model.findOneAndUpdate(_defineProperty({}, this.id, id), data, options);

      if (params && params.query && params.query.$populate) {
        modelQuery = modelQuery.populate(params.query.$populate);
      }

      return modelQuery.lean(this.lean).exec().then((0, _feathersCommons.select)(params, this.id)).catch(_errorHandler2.default);
    }
  }, {
    key: 'patch',
    value: function patch(id, data, params) {
      var _this3 = this;

      var query = Object.assign({}, (0, _feathersQueryFilters2.default)(params.query || {}).query);
      var mapIds = function mapIds(page) {
        return page.data.map(function (current) {
          return current[_this3.id];
        });
      };

      // By default we will just query for the one id. For multi patch
      // we create a list of the ids of all items that will be changed
      // to re-query them after the update
      var ids = id === null ? this._find(params).then(mapIds) : Promise.resolve([id]);

      // Handle case where data might be a mongoose model
      if (typeof data.toObject === 'function') {
        data = data.toObject();
      }

      // ensure we are working on a copy
      data = Object.assign({}, data);

      // If we are updating multiple records
      var options = Object.assign({
        multi: id === null,
        runValidators: true,
        context: 'query'
      }, params.mongoose);

      if (id !== null) {
        query[this.id] = id;
      }

      if (this.id === '_id') {
        // We can not update default mongo ids
        delete data[this.id];
      } else if (id !== null) {
        // If not using the default Mongo _id field set the id to its
        // previous value. This prevents orphaned documents.
        data[this.id] = id;
      }

      // NOTE (EK): We need this shitty hack because update doesn't
      // return a promise properly when runValidators is true. WTF!
      try {
        return ids.then(function (idList) {
          // Create a new query that re-queries all ids that
          // were originally changed
          var findParams = idList.length ? Object.assign({}, params, {
            query: _defineProperty({}, _this3.id, { $in: idList })
          }) : params;

          if (params.query && params.query.$populate) {
            findParams.query.$populate = params.query.$populate;
          }

          // If params.query.$populate was provided, remove it
          // from the query sent to mongoose.
          var discriminator = (params.query || {})[_this3.discriminatorKey] || _this3.discriminatorKey;
          var model = _this3.discriminators[discriminator] || _this3.Model;
          return model.update((0, _lodash2.default)(query, '$populate'), data, options).lean(_this3.lean).exec().then(function () {
            return _this3._getOrFind(id, findParams);
          });
        }).then((0, _feathersCommons.select)(params, this.id)).catch(_errorHandler2.default);
      } catch (e) {
        return (0, _errorHandler2.default)(e);
      }
    }
  }, {
    key: 'remove',
    value: function remove(id, params) {
      var _this4 = this;

      var query = Object.assign({}, (0, _feathersQueryFilters2.default)(params.query || {}).query);

      if (id !== null) {
        query[this.id] = id;
      }

      // NOTE (EK): First fetch the record(s) so that we can return
      // it/them when we delete it/them.
      return this._getOrFind(id, params).then(function (data) {
        return _this4.Model.remove(query).lean(_this4.lean).exec().then(function () {
          return data;
        }).then((0, _feathersCommons.select)(params, _this4.id));
      }).catch(_errorHandler2.default);
    }
  }]);

  return Service;
}();

function init(options) {
  return new Service(options);
}

init.Service = Service;
module.exports = exports['default'];