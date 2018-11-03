import path from 'path';
import fs from 'fs';
import https from 'https';
import axios from 'axios';
import qs from 'qs';
import toPlainObject from 'lodash/toPlainObject';
import omit from 'lodash/omit';

var cert = "3ff3fa80174db1c1.pem";

var version = "2.1.0";

/**
 * Create pre-configured httpClient instance
 * @private
 */
function createHttpClient(options) {
    if (options === void 0) { options = {}; }
    options.baseURL = 'https://api.mollie.com:443/v2/';
    options.headers = Object.assign({}, options.headers, {
        Authorization: "Bearer " + options.apiKey,
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json',
        'User-Agent': "node.js/" + process.version,
        'X-Mollie-User-Agent': "mollie/" + version
    });
    try {
        options.httpsAgent = new https.Agent({
            cert: fs.readFileSync(path.resolve(__dirname, cert), 'utf8')
        });
    }
    catch (e) {
        // We could be in a browser environment
    }
    options.paramsSerializer = options.paramsSerializer || qs.stringify;
    return axios.create(options);
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var url = require('url');
// eslint-disable-next-line import/prefer-default-export
var parseCursorUrl = function (cursorUrl) { return url.parse(cursorUrl, true); };

/**
 * A list helper class
 */
var List = /** @class */ (function (_super) {
    __extends(List, _super);
    function List() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.links = null;
        _this.count = null;
        _this.nextPage = null;
        _this.previousPage = null;
        _this.nextPageCursor = null;
        _this.previousPageCursor = null;
        return _this;
    }
    List.getNextPageParams = function (links) {
        if (links.next && links.next.href) {
            return parseCursorUrl(links.next.href).query;
        }
        return {};
    };
    List.getPreviousPageParams = function (links) {
        if (links.previous && links.previous.href) {
            return parseCursorUrl(links.previous.href).query;
        }
        return {};
    };
    List.buildResourceList = function (_a) {
        var response = _a.response, resourceName = _a.resourceName, params = _a.params, callback = _a.callback, getResources = _a.getResources, Model = _a.Model;
        var _embedded = response._embedded, _b = response.count, count = _b === void 0 ? 0 : _b, _c = response._links, _links = _c === void 0 ? [] : _c;
        var resources = _embedded[resourceName];
        var list = new List();
        list.links = _links;
        list.count = count;
        list.nextPage = function () {
            return getResources(__assign({}, params, List.getNextPageParams(_links)), callback);
        };
        list.previousPage = function () {
            return getResources(__assign({}, params, List.getPreviousPageParams(_links)), callback);
        };
        list.nextPageCursor = List.getNextPageParams(_links).from;
        list.previousPageCursor = List.getPreviousPageParams(_links).from;
        list.push.apply(list, resources.map(function (resource) { return new Model(resource); }));
        return list;
    };
    return List;
}(Array));

/* eslint-disable new-cap */
/**
 * The base resource
 * @private
 */
var Resource = /** @class */ (function () {
    /**
     * Constructor
     */
    function Resource(httpClient) {
        this.httpClient = httpClient;
    }
    /**
     * Error handler
     */
    Resource.errorHandler = function (response, cb) {
        var error = (response && response.data) || response;
        if (cb) {
            return cb(error);
        }
        throw error;
    };
    /**
     * Get the API client
     *
     * @since 2.0.0
     */
    Resource.prototype.getClient = function () {
        return this.httpClient;
    };
    /**
     * Set the parent ID by providing the parent
     *
     * @since 1.1.1
     * @deprecated
     */
    Resource.prototype.withParent = function (parent) {
        if (parent && parent.id) {
            this.setParentId(parent.id);
        }
        return this;
    };
    /**
     * Set the parent ID
     *
     * @since 2.0.0
     */
    Resource.prototype.setParentId = function (parentId) {
        this.parentId = parentId;
    };
    /**
     * If the parent ID is set
     *
     * @since 2.0.0
     */
    Resource.prototype.hasParentId = function () {
        return !!this.parentId;
    };
    /**
     * Create a resource URL with the parent ID
     *
     * @since 2.0.0
     */
    Resource.prototype.getResourceUrl = function () {
        if (this.constructor.resource.indexOf('_') !== -1) {
            var parts = this.constructor.resource.split('_');
            return parts[0] + "/" + this.parentId + "/" + parts[1];
        }
        return this.constructor.resource;
    };
    /**
     * Get the resource name from the resource identifier
     * @since 2.0.0-rc.2
     */
    Resource.prototype.getResourceName = function () {
        if (this.constructor.resource.includes('_')) {
            return this.constructor.resource.split('_')[1];
        }
        return this.constructor.resource;
    };
    /**
     * Create a resource by ID
     * @since 1.0.0
     */
    Resource.prototype.create = function (data, cb) {
        var _this = this;
        var query = '';
        if (typeof data === 'function') {
            cb = data; // eslint-disable-line no-param-reassign
        }
        else if (typeof data === 'object' && typeof data.include === 'string') {
            query = "?include=" + data.include;
            delete data.include;
        }
        return this.getClient()
            .post("" + this.getResourceUrl() + query, data)
            .then(function (response) {
            var model = new _this.constructor.model(response.data);
            if (cb) {
                return cb(null, model);
            }
            return model;
        })["catch"](function (error) { return Resource.errorHandler(error.response, cb); });
    };
    /**
     * Get a resource by ID
     * @since 1.0.0
     */
    Resource.prototype.get = function (id, params, cb) {
        var _this = this;
        if (typeof params === 'function') {
            cb = params; // eslint-disable-line no-param-reassign
        }
        return this.getClient()
            .get(this.getResourceUrl() + "/" + id, { params: params })
            .then(function (response) {
            var model = new _this.constructor.model(response.data);
            if (cb) {
                return cb(null, model);
            }
            return model;
        })["catch"](function (error) { return Resource.errorHandler(error.response, cb); });
    };
    /**
     * Get all resources
     * @since 1.0.0
     */
    Resource.prototype.all = function (params, cb) {
        var _this = this;
        if (typeof params === 'function') {
            cb = params; // eslint-disable-line no-param-reassign
        }
        return this.getClient()
            .get(this.getResourceUrl(), { params: params })
            .then(function (response) {
            var resourceName = _this.getResourceName();
            var list = List.buildResourceList({
                response: response.data,
                resourceName: resourceName,
                params: params,
                callback: cb,
                getResources: _this.all.bind(_this),
                Model: _this.constructor.model
            });
            if (cb) {
                return cb(null, list);
            }
            return list;
        })["catch"](function (error) {
            return _this.constructor.errorHandler(error.response, cb);
        });
    };
    /**
     * Update a resource by ID
     * @since 1.0.0
     */
    Resource.prototype.update = function (id, data, cb) {
        var _this = this;
        if (typeof data === 'function') {
            cb = data; // eslint-disable-line no-param-reassign
        }
        return this.getClient()
            .post(this.getResourceUrl() + "/" + id, data)
            .then(function (response) {
            var model = new _this.constructor.model(response.data);
            if (cb) {
                return cb(null, model);
            }
            return model;
        })["catch"](function (error) { return _this.constructor.errorHandler(error.response, cb); });
    };
    /**
     * Delete a resource by ID
     * @since 1.0.0
     */
    Resource.prototype["delete"] = function (id, cb) {
        var _this = this;
        return this.getClient()["delete"](this.getResourceUrl() + "/" + id)
            .then(function (response) {
            var model = new _this.constructor.model(response.data);
            if (cb) {
                return cb(null, model);
            }
            return model;
        })["catch"](function (error) { return _this.constructor.errorHandler(error.response, cb); });
    };
    return Resource;
}());

/**
 * Base model
 */
var Model = /** @class */ (function () {
    function Model(data) {
        this.data = data;
    }
    /**
     * Converts a model into a plain object
     * @returns {Object}
     */
    Model.prototype.toPlainObject = function () {
        return toPlainObject(this);
    };
    return Model;
}());

/**
 * The `Payment` model
 */
var Payment = /** @class */ (function (_super) {
    __extends(Payment, _super);
    function Payment(props) {
        var _this = _super.call(this, props) || this;
        var defaults = {
            resource: 'payment',
            id: null,
            mode: null,
            createdAt: null,
            status: null,
            isCancelable: null,
            paidAt: null,
            canceledAt: null,
            expiresAt: null,
            expiredAt: null,
            failedAt: null,
            amount: {
                value: null,
                currency: null
            },
            amountRefunded: null,
            amountRemaining: null,
            description: null,
            redirectUrl: null,
            webhookUrl: null,
            method: null,
            metadata: null,
            locale: null,
            countryCode: null,
            profileId: null,
            settlementAmount: null,
            settlementId: null,
            customerId: null,
            sequenceType: null,
            mandateId: null,
            subscriptionId: null,
            applicationFee: {
                amount: {
                    value: null,
                    currency: null
                },
                description: null
            },
            details: null,
            _links: {
                checkout: null,
                refunds: null,
                chargebacks: null,
                settlement: null,
                mandate: null,
                subscription: null,
                customer: null
            }
        };
        Object.assign(_this, defaults, props);
        return _this;
    }
    /**
     * If the payment is open
     * @returns {boolean}
     */
    Payment.prototype.isOpen = function () {
        return this.status === Payment.STATUS_OPEN;
    };
    /**
     * If the payment is authorized
     * @returns {boolean}
     */
    Payment.prototype.isAuthorized = function () {
        return this.status === Payment.STATUS_AUTHORIZED;
    };
    /**
     * If the payment is paid
     * @returns {boolean}
     */
    Payment.prototype.isPaid = function () {
        return !!this.paidAt;
    };
    /**
     * If the payment is canceled
     * @returns {boolean}
     */
    Payment.prototype.isCanceled = function () {
        return !!this.canceledAt;
    };
    /**
     * If the payment is expired
     * @returns {boolean}
     */
    Payment.prototype.isExpired = function () {
        return !!this.expiredAt;
    };
    /**
     * If the payment is refundable
     * @returns {boolean}
     * @since 2.0.0-rc.2
     */
    Payment.prototype.isRefundable = function () {
        return this.amountRemaining !== null;
    };
    /**
     * Get the payment URL
     * @returns {string|null}
     */
    Payment.prototype.getPaymentUrl = function () {
        return this._links && this._links.checkout && this._links.checkout.href;
    };
    Payment.STATUS_OPEN = 'open';
    Payment.STATUS_PENDING = 'pending';
    Payment.STATUS_CANCELED = 'canceled';
    Payment.STATUS_EXPIRED = 'expired';
    Payment.STATUS_PAID = 'paid';
    Payment.STATUS_FAILED = 'failed';
    Payment.STATUS_AUTHORIZED = 'authorized';
    Payment.SEQUENCETYPE_ONEOFF = 'oneoff';
    Payment.SEQUENCETYPE_FIRST = 'first';
    Payment.SEQUENCETYPE_RECURRING = 'recurring';
    return Payment;
}(Model));

/**
 * The `payments` resource
 * @static {string} resource
 * @static {Object} model
 * @since 1.0.0
 */
var Payments = /** @class */ (function (_super) {
    __extends(Payments, _super);
    function Payments() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Payments.resource = 'payments';
    Payments.model = Payment;
    return Payments;
}(Resource));

/**
 * Payments base resource
 * @private
 */
var PaymentsResource = /** @class */ (function (_super) {
    __extends(PaymentsResource, _super);
    function PaymentsResource() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Set the parent
     * @since 2.0.0
     */
    PaymentsResource.prototype.setParent = function (params) {
        if (params === void 0) { params = {}; }
        if (!params.paymentId && !this.hasParentId()) {
            throw TypeError('Missing parameter "paymentId".');
        }
        else if (params.paymentId) {
            this.setParentId(params.paymentId);
        }
    };
    return PaymentsResource;
}(Resource));

/**
 * The `Refund` model
 */
var Refund = /** @class */ (function (_super) {
    __extends(Refund, _super);
    function Refund(props) {
        var _this = _super.call(this, props) || this;
        var defaults = {
            resource: 'refund',
            id: null,
            amount: {
                currency: null,
                value: null
            },
            settlementAmount: null,
            description: null,
            status: null,
            createdAt: null,
            paymentId: null,
            _links: {
                payment: null,
                settlement: null
            }
        };
        Object.assign(_this, defaults, props);
        return _this;
    }
    /**
     * The refund is queued until there is enough balance to process te refund. You can still cancel
     * the refund.
     * @returns {boolean}
     */
    Refund.prototype.isQueued = function () {
        return this.status === Refund.STATUS_QUEUED;
    };
    /**
     * The refund will be sent to the bank on the next business day. You can still cancel the refund.
     * @returns {boolean}
     */
    Refund.prototype.isPending = function () {
        return this.status === Refund.STATUS_PENDING;
    };
    /**
     * The refund has been sent to the bank. The refund amount will be transferred to the consumer
     * account as soon as possible.
     * @returns {boolean}
     */
    Refund.prototype.isProcessing = function () {
        return this.status === Refund.STATUS_PROCESSING;
    };
    /**
     * The refund amount has been transferred to the consumer.
     * @returns {boolean}
     */
    Refund.prototype.isRefunded = function () {
        return this.status === Refund.STATUS_REFUNDED;
    };
    /**
     * The refund has failed during processing.
     * @returns {boolean}
     */
    Refund.prototype.isFailed = function () {
        return this.status === Refund.STATUS_FAILED;
    };
    Refund.STATUS_QUEUED = 'queued';
    Refund.STATUS_PENDING = 'pending';
    Refund.STATUS_PROCESSING = 'processing';
    Refund.STATUS_REFUNDED = 'refunded';
    Refund.STATUS_FAILED = 'failed';
    return Refund;
}(Model));

/**
 * The `payments_refunds` resource
 * @static {string} resource
 * @static {Object} model
 * @since 1.1.1
 */
var PaymentsRefunds = /** @class */ (function (_super) {
    __extends(PaymentsRefunds, _super);
    function PaymentsRefunds() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Create a payment refund
     * @since 1.1.1
     */
    PaymentsRefunds.prototype.create = function (data, cb) {
        this.setParent(data);
        if (typeof data === 'object') {
            data = omit(data, 'paymentId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.create.call(this, data, cb);
    };
    /**
     * Get a payment refund by ID
     * @since 1.1.1
     */
    PaymentsRefunds.prototype.get = function (id, params, cb) {
        this.setParent(params);
        if (typeof params === 'object') {
            params = omit(params, 'paymentId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.get.call(this, id, params, cb);
    };
    /**
     * Get all payment refunds
     * @since 1.1.1
     */
    PaymentsRefunds.prototype.all = function (params, cb) {
        this.setParent(params);
        if (typeof params === 'object') {
            params = omit(params, 'paymentId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.all.call(this, params, cb);
    };
    /**
     * Delete a payment_refund by ID
     * @since 1.1.1
     */
    PaymentsRefunds.prototype["delete"] = function (id, params, cb) {
        if (typeof params === 'function') {
            cb = params; // eslint-disable-line no-param-reassign
        }
        this.setParent(params);
        return _super.prototype["delete"].call(this, id, cb);
    };
    /**
     * Alias for delete
     * @since 1.3.2
     */
    PaymentsRefunds.prototype.cancel = function () {
        return this["delete"](arguments[0], arguments[1], arguments[2]);
    };
    PaymentsRefunds.resource = 'payments_refunds';
    PaymentsRefunds.model = Refund;
    return PaymentsRefunds;
}(PaymentsResource));

/**
 * The `Chargeback` model
 */
var Chargeback = /** @class */ (function (_super) {
    __extends(Chargeback, _super);
    function Chargeback(props) {
        var _this = _super.call(this, props) || this;
        var defaults = {
            resource: 'chargeback',
            id: null,
            amount: null,
            settlementAmount: null,
            createdAt: null,
            reversedAt: null,
            paymentId: null,
            _links: {
                payment: null,
                settlement: null
            }
        };
        Object.assign(_this, defaults, props);
        return _this;
    }
    return Chargeback;
}(Model));

/**
 * The `payments_refunds` resource
 * @static {string} resource
 * @static {Object} model
 * @since 1.1.1
 */
var PaymentsChargebacks = /** @class */ (function (_super) {
    __extends(PaymentsChargebacks, _super);
    function PaymentsChargebacks() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Get a payment refund by ID
     * @since 1.1.1
     */
    PaymentsChargebacks.prototype.get = function (id, params, cb) {
        this.setParent(params);
        if (typeof params === 'object') {
            params = omit(params, 'paymentId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.get.call(this, id, params, cb);
    };
    /**
     * Get all payment refunds
     * @since 1.1.1
     */
    PaymentsChargebacks.prototype.all = function (params, cb) {
        this.setParent(params);
        if (typeof params === 'object') {
            params = omit(params, 'paymentId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.all.call(this, params, cb);
    };
    PaymentsChargebacks.resource = 'payments_chargebacks';
    PaymentsChargebacks.model = Chargeback;
    return PaymentsChargebacks;
}(PaymentsResource));

/**
 * The `Method` model
 */
var Method = /** @class */ (function (_super) {
    __extends(Method, _super);
    function Method(props) {
        var _this = _super.call(this, props) || this;
        var defaults = {
            resource: 'method',
            id: null,
            description: null,
            image: {
                size1x: null,
                size2x: null,
                svg: null
            },
            _links: {}
        };
        Object.assign(_this, defaults, props);
        return _this;
    }
    Method.prototype.getImage = function (size) {
        if (size === void 0) { size = '2x'; }
        return this.image && (size === '1x' ? this.image.size1x : this.image.size2x);
    };
    Method.IDEAL = 'ideal';
    Method.CREDITCARD = 'creditcard';
    Method.MISTERCASH = 'mistercash';
    Method.SOFORT = 'sofort';
    Method.BANKTRANSFER = 'banktransfer';
    Method.DIRECTDEBIT = 'directdebit';
    Method.BITCOIN = 'bitcoin';
    Method.PAYPAL = 'paypal';
    Method.BELFIUS = 'belfius';
    Method.PAYSAFECARD = 'paysafecard';
    Method.PODIUMCADEAUKAART = 'podiumcadeaukaart';
    Method.KBC = 'kbc';
    Method.INGHOMEPAY = 'inghomepay';
    Method.KLARNAPAYLATER = 'klarnapaylater';
    Method.KLARNASLICEIT = 'klarnasliceit';
    return Method;
}(Model));

/**
 * The `methods` resource
 * @static {string} resource
 * @static {Object} model
 * @since 1.0.0
 */
var Methods = /** @class */ (function (_super) {
    __extends(Methods, _super);
    function Methods() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Methods.resource = 'methods';
    Methods.model = Method;
    return Methods;
}(Resource));

/**
 * The `refunds` resource
 * @static {string} resource
 * @static {Object} model
 * @since 2.0.0
 */
var Refunds = /** @class */ (function (_super) {
    __extends(Refunds, _super);
    function Refunds() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Refunds.resource = 'refunds';
    Refunds.model = Refund;
    return Refunds;
}(Resource));

/**
 * The `Customer` model
 */
var Customer = /** @class */ (function (_super) {
    __extends(Customer, _super);
    function Customer(props) {
        var _this = _super.call(this, props) || this;
        var defaults = {
            resource: 'customer',
            id: null,
            mode: null,
            name: null,
            email: null,
            locale: null,
            metadata: null,
            recentlyUsedMethods: null,
            createdAt: null,
            _links: {
                mandates: null,
                subscriptions: null,
                payments: null
            }
        };
        Object.assign(_this, defaults, props);
        return _this;
    }
    return Customer;
}(Model));

/**
 * The `customers` resource
 * @static {string} resource
 * @static {Object} model
 * @since 1.1.1
 */
var Customers = /** @class */ (function (_super) {
    __extends(Customers, _super);
    function Customers() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Customers.resource = 'customers';
    Customers.model = Customer;
    return Customers;
}(Resource));

/**
 * Customers base resource
 * @private
 */
var CustomersResource = /** @class */ (function (_super) {
    __extends(CustomersResource, _super);
    function CustomersResource() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Set the parent
     * @since 2.0.0
     */
    CustomersResource.prototype.setParent = function (params) {
        if (params === void 0) { params = {}; }
        if (!params.customerId && !this.hasParentId()) {
            throw TypeError('Missing parameter "customerId".');
        }
        else if (params.customerId) {
            this.setParentId(params.customerId);
        }
    };
    return CustomersResource;
}(Resource));

/**
 * The `customers_payments` resource
 * @static {string} resource
 * @static {Object} model
 * @since 1.1.1
 */
var CustomersPayments = /** @class */ (function (_super) {
    __extends(CustomersPayments, _super);
    function CustomersPayments() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Create a customer payment
     * @since 1.1.1
     */
    CustomersPayments.prototype.create = function (data, cb) {
        this.setParent(data);
        if (typeof data === 'object') {
            data = omit(data, 'customerId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.create.call(this, data, cb);
    };
    /**
     * Get a customer payment
     * @since 1.1.1
     */
    CustomersPayments.prototype.get = function (id, params, cb) {
        this.setParent(params);
        if (typeof params === 'object') {
            params = omit(params, 'customerId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.get.call(this, id, params, cb);
    };
    /**
     * Get all of a customer's payments
     * @since 1.1.1
     */
    CustomersPayments.prototype.all = function (params, cb) {
        this.setParent(params);
        if (typeof params === 'object') {
            params = omit(params, 'customerId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.all.call(this, params, cb);
    };
    CustomersPayments.resource = 'customers_payments';
    CustomersPayments.model = Payment;
    return CustomersPayments;
}(CustomersResource));

/**
 * The `Mandate` model
 */
var Mandate = /** @class */ (function (_super) {
    __extends(Mandate, _super);
    function Mandate(props) {
        var _this = _super.call(this, props) || this;
        var defaults = {
            resource: 'mandate',
            id: null,
            status: null,
            method: null,
            details: null,
            mode: null,
            mandateReference: null,
            signatureDate: null,
            createdAt: null,
            _links: {
                customer: null
            }
        };
        Object.assign(_this, defaults, props);
        return _this;
    }
    /**
     * If the mandate is valid
     * @returns {boolean}
     */
    Mandate.prototype.isValid = function () {
        return this.status === Mandate.STATUS_VALID;
    };
    Mandate.STATUS_VALID = 'valid';
    Mandate.STATUS_INVALID = 'invalid';
    return Mandate;
}(Model));

/**
 * The `customers_mandates` resource
 * @static {string} resource
 * @static {Object} model
 * @since 1.2.0
 */
var CustomersMandates = /** @class */ (function (_super) {
    __extends(CustomersMandates, _super);
    function CustomersMandates() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Create a customer mandate
     * @since 1.2.0
     */
    CustomersMandates.prototype.create = function (data, cb) {
        this.setParent(data);
        if (typeof data === 'object') {
            data = omit(data, 'customerId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.create.call(this, data, cb);
    };
    /**
     * Get a customer mandate by ID
     * @since 1.2.0
     */
    CustomersMandates.prototype.get = function (id, params, cb) {
        this.setParent(params);
        if (typeof params === 'object') {
            params = omit(params, 'customerId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.get.call(this, id, params, cb);
    };
    /**
     * Get all of a customer's mandates
     * @since 1.2.0
     */
    CustomersMandates.prototype.all = function (params, cb) {
        this.setParent(params);
        if (typeof params === 'object') {
            params = omit(params, 'customerId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.all.call(this, params, cb);
    };
    /**
     * Delete a customer subscription
     * @since 2.0.0
     */
    CustomersMandates.prototype["delete"] = function (id, params, cb) {
        if (typeof params === 'function') {
            cb = params; // eslint-disable-line no-param-reassign
        }
        this.setParent(params);
        return _super.prototype["delete"].call(this, id, cb);
    };
    /**
     * Alias for delete
     * @since 1.3.2
     */
    CustomersMandates.prototype.cancel = function () {
        return this["delete"](arguments[0], arguments[1], arguments[2]);
    };
    /**
     * Alias of delete
     * @since 2.0.0
     */
    CustomersMandates.prototype.revoke = function () {
        return this["delete"](arguments[0], arguments[1], arguments[2]);
    };
    CustomersMandates.resource = 'customers_mandates';
    CustomersMandates.model = Mandate;
    return CustomersMandates;
}(CustomersResource));

/**
 * The `Subscription` model
 */
var Subscription = /** @class */ (function (_super) {
    __extends(Subscription, _super);
    function Subscription(props) {
        var _this = _super.call(this, props) || this;
        var defaults = {
            resource: 'subscription',
            id: null,
            mode: null,
            createdAt: null,
            status: null,
            amount: {
                currency: null,
                value: null
            },
            times: null,
            interval: null,
            startDate: null,
            description: null,
            method: null,
            canceledAt: null,
            webhookUrl: null,
            timesRemaining: null,
            metadata: null,
            _links: {
                customer: null
            }
        };
        Object.assign(_this, defaults, props);
        return _this;
    }
    /**
     * Get the webhook url
     * @returns {boolean|string}
     */
    Subscription.prototype.getWebhookUrl = function () {
        return this.webhookUrl;
    };
    /**
     * If the subscription is active
     * @returns {boolean}
     */
    Subscription.prototype.isActive = function () {
        return this.status === Subscription.STATUS_ACTIVE;
    };
    /**
     * If the subscription is pending
     * @returns {boolean}
     */
    Subscription.prototype.isPending = function () {
        return this.status === Subscription.STATUS_PENDING;
    };
    /**
     * If the subscription is completed
     * @returns {boolean}
     */
    Subscription.prototype.isCompleted = function () {
        return this.status === Subscription.STATUS_COMPLETED;
    };
    /**
     * If the subscription is suspended
     * @returns {boolean}
     */
    Subscription.prototype.isSuspended = function () {
        return this.status === Subscription.STATUS_SUSPENDED;
    };
    /**
     * If the subscription is canceled
     * @returns {boolean}
     */
    Subscription.prototype.isCanceled = function () {
        return !!this.canceledAt;
    };
    Subscription.STATUS_ACTIVE = 'active';
    Subscription.STATUS_PENDING = 'pending'; // Waiting for a valid mandate.
    Subscription.STATUS_CANCELED = 'canceled';
    Subscription.STATUS_SUSPENDED = 'suspended'; // Active, but mandate became invalid.
    Subscription.STATUS_COMPLETED = 'completed';
    return Subscription;
}(Model));

/**
 * The `customers_subscriptions` resource
 * @static {string} resource
 * @static {Object} model
 * @since 1.3.2
 */
var CustomersSubscriptions = /** @class */ (function (_super) {
    __extends(CustomersSubscriptions, _super);
    function CustomersSubscriptions() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Create a customer subscription
     * @since 1.3.2
     */
    CustomersSubscriptions.prototype.create = function (data, cb) {
        this.setParent(data);
        if (typeof data === 'object') {
            data = omit(data, 'customerId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.create.call(this, data, cb);
    };
    /**
     * Get a customer subscription
     * @since 1.3.2
     */
    CustomersSubscriptions.prototype.get = function (id, params, cb) {
        this.setParent(params);
        if (typeof params === 'object') {
            params = omit(params, 'customerId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.get.call(this, id, params, cb);
    };
    /**
     * Get all customer's subscriptions
     * @since 1.3.2
     */
    CustomersSubscriptions.prototype.all = function (params, cb) {
        this.setParent(params);
        if (typeof params === 'object') {
            params = omit(params, 'customerId'); // eslint-disable-line no-param-reassign
        }
        return _super.prototype.all.call(this, params, cb);
    };
    /**
     * Delete a customer subscription
     * @since 1.3.2
     */
    CustomersSubscriptions.prototype["delete"] = function (id, params, cb) {
        if (typeof params === 'function') {
            cb = params; // eslint-disable-line no-param-reassign
        }
        this.setParent(params);
        return _super.prototype["delete"].call(this, id, cb);
    };
    /**
     * Alias for delete
     * @since 1.3.2
     */
    CustomersSubscriptions.prototype.cancel = function (id, params, cb) {
        return this["delete"](id, params, cb);
    };
    CustomersSubscriptions.resource = 'customers_subscriptions';
    CustomersSubscriptions.model = Subscription;
    return CustomersSubscriptions;
}(CustomersResource));

/**
 * The `chargebacks` resource
 * @static {string} resource
 * @static {Object} model
 * @since 2.0.0-rc.1
 */
var Chargebacks = /** @class */ (function (_super) {
    __extends(Chargebacks, _super);
    function Chargebacks() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Chargebacks.resource = 'chargebacks';
    Chargebacks.model = Chargeback;
    return Chargebacks;
}(Resource));

/**
 * Create Mollie API
 *
 * @since 2.0.0
 */
function createMollieApi(_a) {
    var httpClient = _a.httpClient;
    return {
        payments: new Payments(httpClient),
        payments_refunds: new PaymentsRefunds(httpClient),
        methods: new Methods(httpClient),
        refunds: new Refunds(httpClient),
        customers: new Customers(httpClient),
        customers_payments: new CustomersPayments(httpClient),
        customers_mandates: new CustomersMandates(httpClient),
        customers_subscriptions: new CustomersSubscriptions(httpClient),
        chargebacks: new Chargebacks(httpClient),
        payments_chargebacks: new PaymentsChargebacks(httpClient)
    };
}

/**
 * Create Mollie client.
 * @since 2.0.0
 */
function mollie(options) {
    if (options === void 0) { options = {}; }
    if (!options.apiKey) {
        throw new TypeError('Missing parameter "apiKey".');
    }
    var httpClient = createHttpClient(options);
    return createMollieApi({ httpClient: httpClient });
}

export default mollie;
