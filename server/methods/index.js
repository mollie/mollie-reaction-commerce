/* eslint camelcase: 0 */
import { Logger, Reaction } from "/server/api";
import { Meteor } from "meteor/meteor";
import { Promise } from "meteor/promise";
import { check, Match } from "meteor/check";
import Mollie from "@mollie/api-client";
import util from "util";
import _ from "lodash";

import { Accounts, Cart, Packages, Shops } from "/lib/collections";
import { MolliePayments, MollieQrCodes } from "../../collections";
import { API_ORDERS, API_PAYMENTS, NAME } from "../../misc/consts";
import { getMollieLocale } from "../../misc";

function prepareSettings(fields) {
  const set = {};
  _.forEach(fields, (field) => {
    if (_.includes(["api", "methods", "idealQr", "issuerList"], field.property)) {
      // Public
      set[`settings.public.${field.property}`] = field.value;
    } else {
      set[`settings.${NAME}.${field.property}`] = field.value
    }
  });

  return set;
}

function getCartLines(cartSummary, currency) {
  const lines = [];
  _.forEach(cartSummary.items, (item) => {
    const quantity = Math.ceil(item.quantity);
    const vatRate = Math.round(((item.taxRate || 0) * 100) * 100) / 100;
    const unitPrice = (Math.round(item.variants.price * 100) / 100) * (1 + vatRate / 100);
    const totalAmount = quantity * unitPrice;
    const vatAmount = totalAmount * (vatRate / (100 + vatRate));

    lines.push({
      type: "physical",
      name: item.title,
      quantity,
      unitPrice: { value: unitPrice.toFixed(2), currency },
      totalAmount: { value: totalAmount.toFixed(2), currency },
      vatRate: vatRate.toFixed(2),
      vatAmount: { value: vatAmount.toFixed(2), currency },
    });
  });

  if (cartSummary.shipping) {
    const quantity = 1;
    const vatRate = Math.round((_.get(cartSummary, 'items[0].taxRate', 0) * 100) * 100) / 100;
    const unitPrice = (Math.round(Number(cartSummary.shipping) * 100) / 100);
    const vatAmount = unitPrice * (vatRate / (100 + vatRate));
    lines.push({
      type: "shipping_fee",
      name: "Shipping",
      quantity,
      unitPrice: { value:  unitPrice.toFixed(2), currency },
      totalAmount: { value: unitPrice.toFixed(2), currency },
      vatRate: vatRate.toFixed(2),
      vatAmount: { value: vatAmount.toFixed(2), currency },
    });
  }

  return lines;
}

/**
 * Meteor methods for the Mollie Plugin. Run these methods using `Meteor.call()`
 * @namespace Payment/Mollie/Methods
 */
Meteor.methods({
  /**
   * Save Mollie settings
   *
   * @method
   * @memberof Payment/Mollie/Methods
   * @siunce 1.0.l0
   *
   * @param {string} id          The ID we need to pass to Meteor
   * @param {string} settingsKey The settings key
   * @param {Array}  fields      The fields to save
   * @return {boolean} result
   */
  "mollie/settings/save"(id, settingsKey, fields) {
    // Check all arguments
    check(id, String);
    check(settingsKey, String);
    check(fields, Array);

    try {
      // Grab the payment methods from the list that is going to be saved
      const field = _.defaults(_.head(_.remove(fields, ["property", "methods"])), { property: "methods", value: [] });
      if (!Array.isArray(field.value)) {
        field.value = [];
      }
      // Grab the previous module configuration
      const packageData = Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      });

      // Grab the API key and initialize the Mollie client
      let apiKey = _.get(_.find(fields, ["property", "apiKey"]), "value", _.get(packageData, `settings.${NAME}.apiKey`));
      try {
        const mollie = Mollie({ apiKey });
        if (typeof mollie === "undefined") {
          // Likely not a valid API key, but we still need to update the settings
          Packages.update({
            name: NAME,
            shopId: Reaction.getShopId()
          }, {
            $set: prepareSettings(fields),
          });
          return true;
        }

        // Retrieve all local payment methods settings and availability; merge with Mollie's
        const methods = Promise.await(mollie.methods.all());

        // Remove methods that are no longer available in the Mollie account
        _.remove(field.value, (item) => {
          if (_.includes(["creditcard", "cartesbancaires"], item._id)) {
            return _.findIndex(methods, ["id", "creditcard"]) < 0; // Remove these methods when credit cards have been disabled
          }

          return _.findIndex(methods, ["id", item._id]) < 0;
        });

        // Inject CartaSi and Cartes Bancaires when credit cards are enabled in the Mollie account
        const ccIndex = _.findIndex(methods, ["id", "creditcard"]);
        if (ccIndex > -1) {
          _.forEach(
            [
              { id: "cartasi", description: "CartaSi", enabled: false },
              { id: "cartesbancaires", description: "Cartes Bancaires", enabled: false },
            ],
            (method) => {
              if (_.findIndex(field.value, ["_id", method.id]) < 0) {
                methods.splice(ccIndex, 0, method);
              }
            }
          );
        }

        // Check if the additional credit card methods might have to be disabled
        ["cartasi", "cartesbancaires"].map((name) => {
          if (!_.get(_.find(field.value, ["_id", "creditcard"]), "enabled", false)) {
            const method = _.find(field.value, ["_id", name]);
            if (typeof method === "object") {
              method.enabled = false;
            }
          }
        });

        _.forEach(methods, method => {
          if (_.findIndex(field.value, ["_id", method.id]) < 0) {
            field.value.push({
              _id: method.id,
              name: method.description,
              enabled: false,
            });
          }
        });
        fields.push(field);

        // Save the new list and other settings
        Packages.update({
          name: NAME,
          shopId: Reaction.getShopId()
        }, {
          $set: prepareSettings(fields),
        });
        return true;
      } catch (err) {
        Logger.error(`Mollie error: ${JSON.stringify(util.inspect(err))}`);
        // Save the new list and other settings
        Packages.update({
          name: NAME,
          shopId: Reaction.getShopId()
        }, {
          $set: prepareSettings(fields),
        });
        return true;
      }
    } catch (err) {
      Logger.error(`Mollie error: ${JSON.stringify(util.inspect(err))}`);
      throw new Meteor.Error("server-error", "An unexpected error occurred while saving the Mollie module settings");
    }
  },

  /**
   * Create a payment
   *
   * @method
   * @memberof Payment/Mollie/Methods
   * @since 1.0.0
   *
   * @param {string}      method Method id
   * @param {string|null} issuer The issuer id
   *
   * @return {string} Checkout URL
   */
  "mollie/payment/create"(method, issuer = null) {
    // Check all arguments
    check(method, String);
    check(issuer, Match.Maybe(String));

    const locale = _.get(Reaction, "Locale.curValue.language", "en");
    if (_.includes(["cartasi", "cartesbancaires"], method)) {
      method = "creditcard";
    }

    try {
      // Grab the module configuration
      const packageData = Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      });
      const api = _.get(packageData, `settings.public.api`, API_PAYMENTS);

      // Grab the current (latest) cart
      const cart = Cart.findOne({
        userId: Meteor.userId(),
      }, {
        sort: { createdAt: -1 },
      });
      const currency = Shops.findOne().currency;
      const account = Accounts.findOne({
        userId: cart.userId,
      });

      const value = cart.getTotal();

      if (api === API_ORDERS) {
// Grab the order info
        const shippingFullName = _.get(cart, "shipping[0].address.fullName");
        const billingFullName = _.get(cart, "billing[0].address.fullName");
        const orderInfo = {
          amount: {
            value: parseFloat(_.toString(value)).toFixed(2),
            currency,
          },
          orderNumber: cart._id,
          lines: getCartLines(Object.values(cart.getShopSummary()[0])[0], currency),
          redirectUrl: `${Meteor.absoluteUrl()}mollie/return?cartId=${cart._id}`, // By the time the visitor returns, the cart ID has changed, adding it to the query for cart recovery
          webhookUrl: `${Meteor.absoluteUrl()}mollie/webhook?cartId=${cart._id}`, // We're unable to access the webhook's content since Reaction only exposes JSON functionality,
          shippingAddress: {
            givenName: _.head(shippingFullName.split(" ")),
            familyName: _.tail(shippingFullName.split(" ")).join(" ") || "-",
            email: _.get(account, "emails[0].address"),
            streetAndNumber:
              _.trim(_.get(cart, "shipping[0].address.address1", "")
                + " "
                + _.get(cart, "shipping[0].address.address2", "")),
            city: _.get(cart, "shipping[0].address.city"),
            region: _.get(cart, "shipping[0].address.region"),
            postalCode: _.get(cart, "shipping[0].address.postal"),
            country: _.get(cart, "shipping[0].address.country"),
          },
          billingAddress: {
            givenName: _.head(billingFullName.split(" ")),
            familyName: _.tail(billingFullName.split(" ")).join(" ") || "-",
            email: _.get(account, "emails[0].address"),
            streetAndNumber:
              _.trim(_.get(cart, "billing[0].address.address1", "")
                + " "
                + _.get(cart, "billing[0].address.address2", "")),
            city: _.get(cart, "billing[0].address.city", ""),
            region: _.get(cart, "billing[0].address.region"),
            postalCode: _.get(cart, "billing[0].address.postal"),
            country: _.get(cart, "billing[0].address.country"),
          },
          locale: getMollieLocale(locale),
        };
        // Optionally add the method -- no method = generic payment screen
        if (method) {
          orderInfo.method = method;
        }
        // Optionally add the issuer -- no issuer = iDEAL bank select on payment screen
        if (issuer) {
          orderInfo.payment = {
            issuer,
          };
        }

        Logger.debug(`Mollie Order: ${JSON.stringify(orderInfo)}`);

        // Initialize mollie and create the payment
        const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`) });
        const order = Promise.await(mollie.orders.create(orderInfo));
        MolliePayments.insert({
          transactionId: order.id,
          userId: this.userId,
          cartId: cart._id,
          method: order.method,
          bankStatus: order.status,
          amount: order.amount.value,
          currency: order.amount.currency || Shops.findOne().currency,
        });

        // Reserve the items in case we're dealing with a bank transfer
        if (order.method === "banktransfer") {
          Meteor.call("inventory/addReserve", _.get(cart, "items", []));
        }

        // Return the payment screen URL
        return order._links.checkout.href;
      } else {
        let description = _.get(packageData, `settings.${NAME}.description`, "Cart %");
        description = description.replace(/%/, cart._id);
        description = description.replace(/{cart\.id}/, cart._id);
        description = description.replace(/{customer\.name}/, _.get(cart, "shipping[0].address.fullName", ""));

        // Grab the payment info
        const paymentInfo = {
          amount: {
            value: parseFloat(_.toString(value)).toFixed(2),
            currency,
          },
          description,
          redirectUrl: `${Meteor.absoluteUrl()}mollie/return?cartId=${cart._id}`, // By the time the visitor returns, the cart ID has changed, adding it to the query for cart recovery
          webhookUrl: `${Meteor.absoluteUrl()}mollie/webhook?cartId=${cart._id}`, // We're unable to access the webhook's content since Reaction only exposes JSON functionality
          billingEmail: _.get(account, "emails[0].address"),
          shippingAddress: {
            streetAndNumber:
              _.trim(_.get(cart, "shipping[0].address.address1", "")
                + " "
                + _.get(cart, "shipping[0].address.address2", "")),
            city: _.get(cart, "shipping[0].address.city"),
            region: _.get(cart, "shipping[0].address.region"),
            postalCode: _.get(cart, "shipping[0].address.postal"),
            country: _.get(cart, "shipping[0].address.country"),
          },
          billingAddress: {
            streetAndNumber:
              _.trim(_.get(cart, "billing[0].address.address1", "")
                + " "
                + _.get(cart, "billing[0].address.address2", "")),
            city: _.get(cart, "billing[0].address.city", ""),
            region: _.get(cart, "billing[0].address.region"),
            postalCode: _.get(cart, "billing[0].address.postal"),
            country: _.get(cart, "billing[0].address.country"),
          },
        };
        // Optionally add the method -- no method = generic payment screen
        if (method) {
          paymentInfo.method = method;
        }
        // Optionally add the issuer -- no issuer = iDEAL bank select on payment screen
        if (issuer) {
          paymentInfo.issuer = issuer;
        }
        // Share the shop locale when enabled
        if (locale && _.get(packageData, `settings.${NAME}.shopLocale`) || _.includes(["banktransfer", "bitcoin"], method)) {
          paymentInfo.locale = getMollieLocale(locale);
        }

        Logger.debug(`Mollie Payment: ${JSON.stringify(paymentInfo)}`);

        // Initialize mollie and create the payment
        const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`) });
        const payment = Promise.await(mollie.payments.create(paymentInfo));
        MolliePayments.insert({
          transactionId: payment.id,
          userId: this.userId,
          cartId: cart._id,
          method: payment.method,
          bankStatus: payment.status,
          amount: payment.amount.value,
          currency: payment.amount.currency || Shops.findOne().currency,
        });

        // Reserve the items in case we're dealing with a bank transfer
        if (payment.method === "banktransfer") {
          Meteor.call("inventory/addReserve", _.get(cart, "items", []));
        }

        // Return the payment screen URL
        return payment.getPaymentUrl();
      }
    } catch (e) {
      console.log(JSON.stringify(util.inspect(e)));
      if (e.title && e.detail) {
        throw new Meteor.Error(e.title, e.detail);
      }

      Logger.error(JSON.stringify(util.inspect(e)));
      throw new Meteor.Error("server-error", "An unexpected error occurred while creating a Mollie payment");
    }
  },

  /**
   * Create a refund
   *
   * @method
   * @memberof Payment/Mollie/Methods
   * @since 1.0.0
   *
   * @param  {Object} reactionPayment object
   * @param  {Number} amount The amount to be refunded
   *
   * @return {Object} result
   */
  "mollie/refund/create"(reactionPayment, amount) {
    // Check all arguments
    check(amount, Number);
    check(reactionPayment, Object);

    try {
      let { transactionId } = reactionPayment;

      const packageData = Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      });
      const dbPayment = MolliePayments.findOne({
        transactionId,
      });
      if (!dbPayment) {
        Logger.error(`Mollie Error: payment for transaction ID ${transactionId} not found`);
        return { saved: false };
      }

      try {
        // Grab the API key and initialize the Mollie client
        const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`) });
        // In case of Mollie Order, find the corresponding Payment ID
        if (_.startsWith(transactionId, "ord_")) {
          const apiOrder = Promise.await(mollie.orders.get(transactionId, { embed: ["payments"] }));
          transactionId = apiOrder._embedded.payments[0].id;
        }
        // Create the refund
        Promise.await(mollie.payments_refunds.create({
          paymentId: transactionId,
          amount: {
            currency: dbPayment.currency || Shops.findOne().currency,
            value: parseFloat(_.toString(amount)).toFixed(2),
          }
        }));

        return {
          saved: true,
          response: null,
        };
      } catch (e) {
        Logger.error(`Mollie Error - unable to initialize: ${JSON.stringify(util.inspect(e))}`);
        return { saved: false };
      }
    } catch (e) {
      Logger.error(`Mollie Error: ${JSON.stringify(util.inspect(e))}`);
      throw new Meteor.Error("server-error", "An unexpected error occurred while processing Mollie refunds");
    }
  },

  /**
   * List refunds for a payment
   *
   * @method
   * @memberof Payment/Mollie/Methods
   * @since 1.0.0
   *
   * @param  {Object} reactionPayment Object containing the pertinent data
   *
   * @return {Object} result
   */
  "mollie/refund/list"(reactionPayment) {
    // Check all arguments
    check(reactionPayment, Object);

    try {
      const { transactionId } = reactionPayment;

      const packageData = Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      });
      const apiKey = _.get(packageData, `settings.${NAME}.apiKey`);
      const api = _.startsWith(transactionId, "tr_") ? API_PAYMENTS : API_ORDERS;

      try {
        // Grab the API key and initialize the Mollie client
        const mollie = Mollie({ apiKey });
        // Get the refund list for the transaction ID
        const refunds = api === API_ORDERS
          ? Promise.await(mollie.orders_refunds.all({ orderId: String(transactionId) }))
          : Promise.await(mollie.payments_refunds.all({ paymentId: String(transactionId) }));

        // Shove the refunds into a standardized format and return
        const results = [];
        _.forEach(refunds, refund => {
          results.push({
            type: "refund",
            amount: parseFloat(refund.amount.value),
            created: refund.createdAt,
            currency: refund.amount.currency || Shops.findOne().currency,
            raw: null,
          });
        });

        return results;
      } catch (e) {
        Logger.error(`Mollie Error: ${JSON.stringify(util.inspect(e))}`);
        throw new Meteor.Error("server-error", "An unexpected error occurred while processing Mollie refunds");
      }
    } catch (e) {
      if (e.error && e.reason) {
        throw new Meteor.Error(e.error, e.reason);
      }

      Logger.error(`Mollie Error: ${JSON.stringify(util.inspect(e))}`);
      throw new Meteor.Error("server-error", "An unexpected error occurred while processing Mollie refunds");
    }
  },

  /**
   * List iDEAL issuers
   *
   * @method
   * @memberof Payment/Mollie/Methods
   * @since 1.0.0
   *
   * @return {Object} result
   */
  "mollie/ideal/list"() {
    try {
      const packageData = Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      });

      try {
        // Grab the API key and initialize the Mollie client
        const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`) });
        // Get the refund list for the transaction ID
        return Promise.await(mollie.methods.get("ideal", { include: "issuers" }));
      } catch (e) {
        Logger.error(`Mollie Error: ${JSON.stringify(util.inspect(e))}`);
        throw new Meteor.Error("server-error", "An unexpected error occurred while processing Mollie refunds");
      }
    } catch (e) {
      if (e.error && e.reason) {
        throw new Meteor.Error(e.error, e.reason);
      }

      Logger.error(`Mollie Error: ${JSON.stringify(util.inspect(e))}`);
      throw new Meteor.Error("server-error", "An unexpected error occurred while processing Mollie refunds");
    }
  },

  /**
   * Refresh the iDEAL QR Code
   *
   * @method
   * @memberof Payment/Mollie/Methods
   * @since 1.0.0
   *
   * @return {Boolean} result
   */
  "mollie/idealqr/refresh"(cartId) {
    check(cartId, String);

    const locale = _.get(Reaction, "Locale.curValue.language", "en");

    const code = MollieQrCodes.findOne({
      cartId,
    });
    const cart = Cart.findOne({
      userId: Meteor.userId,
      _id: cartId,
    });
    if (!code) {
      const packageData = Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      });

      if (_.get(packageData, `settings.public.api` !== API_PAYMENTS)) {
        return false;
      }

      try {
        const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`) });

        const currency = Shops.findOne().currency;
        const account = Accounts.findOne({
          userId: cart.userId,
        });

        const value = cart.getTotal();

        let description = _.get(packageData, `settings.${NAME}.description`, "Cart %");
        description = description.replace(/%/, cart._id);
        description = description.replace(/{cart\.id}/, cart._id);
        description = description.replace(/{customer\.name}/, _.get(cart, "shipping[0].address.fullName", ""));

        // Grab the payment info
        const paymentInfo = {
          amount: {
            value: parseFloat(_.toString(value)).toFixed(2),
            currency,
          },
          description,
          redirectUrl: `${Meteor.absoluteUrl()}mollie/return?cartId=${cart._id}`, // By the time the visitor returns, the cart ID has changed, adding it to the query for cart recovery
          webhookUrl: `${Meteor.absoluteUrl()}mollie/webhook?cartId=${cart._id}`, // We're unable to access the webhook's content since Reaction only exposes JSON functionality
          billingEmail: _.get(account, "emails[0].address"),
          shippingAddress: {
            streetAndNumber:
              _.trim(_.get(cart, "shipping[0].address.address1", "")
                + " "
                + _.get(cart, "shipping[0].address.address2", "")),
            city: _.get(cart, "shipping[0].address.city"),
            region: _.get(cart, "shipping[0].address.region"),
            postalCode: _.get(cart, "shipping[0].address.postal"),
            country: _.get(cart, "shipping[0].address.country"),
          },
          billingAddress: {
            streetAndNumber:
              _.trim(_.get(cart, "billing[0].address.address1", "")
                + " "
                + _.get(cart, "billing[0].address.address2", "")),
            city: _.get(cart, "billing[0].address.city", ""),
            region: _.get(cart, "billing[0].address.region"),
            postalCode: _.get(cart, "billing[0].address.postal"),
            country: _.get(cart, "billing[0].address.country"),
          },
        };
        paymentInfo.method = "ideal";
        // Share the shop locale when enabled
        if (locale && _.get(packageData, `settings.${NAME}.shopLocale`)) {
          paymentInfo.locale = getMollieLocale(locale);
        }
        paymentInfo.include = "details.qrCode";

        Logger.debug(`Mollie Payment: ${JSON.stringify(paymentInfo)}`);

        // Initialize mollie and create the payment
        const payment = Promise.await(mollie.payments.create(paymentInfo));
        MolliePayments.insert({
          transactionId: payment.id,
          userId: this.userId,
          cartId: cart._id,
          method: payment.method,
          bankStatus: payment.status,
          amount: payment.amount.value,
          currency: payment.amount.currency || Shops.findOne().currency,
        });
        MollieQrCodes.insert({
          transactionId: payment.id,
          userId: this.userId,
          cartId: cart._id,
          method: payment.method,
          amount: payment.amount.value,
          expiresAt: payment.expiresAt,
          imageUrl: payment.details.qrCode.src,
        });

        return true;
      } catch (e) {
        if (e.title && e.detail) {
          throw new Meteor.Error(e.title, e.detail);
        }

        Logger.error(JSON.stringify(util.inspect(e)));
        throw new Meteor.Error("server-error", "An unexpected error occurred while creating a Mollie payment");
      }
    }
  }
});
