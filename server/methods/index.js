/* eslint camelcase: 0 */
import { Meteor } from "meteor/meteor";
import { Promise } from "meteor/promise";
import { check, Match } from "meteor/check";
import util from "util";
import _ from "lodash";

import { Reaction, Logger } from "/server/api";
import { Cart, Packages, Shops, Accounts } from "/lib/collections";

import { MolliePayments } from "../../collections";
import { NAME } from "../../misc/consts";
import Mollie from "../../lib/api/src/mollie";
import { MollieApiMethod } from "../../lib/api/src/models";
import { getMollieLocale } from "../../misc";

/**
 * Meteor methods for the Mollie Plugin. Run these methods using `Meteor.call()`
 * @namespace Payment/Mollie/Methods
 */
Meteor.methods({
  /**
   * Save Mollie settings
   * @method
   * @memberof Payment/Mollie/Methods
   * @param {String} id          The ID we need to pass to Meteor
   * @param {String} settingsKey The settings key
   * @param {Array}  fields      The fields to save
   * @return {Object} result
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
            Meteor.call("registry/update", id, settingsKey, fields);
            return true;
          }

          // Retrieve all local payment methods settings and availability; merge with Mollie's
          const methods = Promise.await(mollie.methods.all());

          // Remove methods that are no longer available in the Mollie account
          _.remove(field.value, (item) => {
            if (_.includes(["cartasi", "cartesbancaires"], item._id)) {
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
          Meteor.call("registry/update", id, settingsKey, fields);
          return true;
        } catch (err) {
          Logger.error(`Mollie error: ${JSON.stringify(util.inspect(err))}`);
          Meteor.call("registry/update", id, settingsKey, fields);
          return true;
        }
    } catch (err) {
      Logger.error(`Mollie error: ${JSON.stringify(util.inspect(err))}`);
      throw new Meteor.Error("server-error", "An unexpected error occurred while saving the Mollie module settings");
    }
  },

  /**
   * Create a payment
   * @method
   * @memberof Payment/Mollie/Methods
   * @param {String}      method Method id
   * @param {String|null} issuer The issuer id
   * @param {String|null} locale The Reaction locale to use
   * @return {Object} result
   */
  "mollie/payment/create"(method, issuer = null, locale = null) {
    // Check all arguments
    check(method, String);
    check(issuer, Match.Maybe(String));
    check(locale, Match.Maybe(String));

    if (_.includes(["cartasi", "cartesbancaires"], method)) {
      method = "creditcard";
    }

    try {
      // Grab the module configuration
      const packageData = Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      });

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
        billingEmail: _.get(account, "email[0].address"),
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
      if (locale && _.get(packageData, `settings.${NAME}.shopLocale`)) {
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
      if (payment.method === MollieApiMethod.BANKTRANSFER) {
        Meteor.call("inventory/addReserve", _.get(cart, "items", []));
      }

      // Return the payment screen URL
      return payment.getPaymentUrl();
    } catch (e) {
      if (e.title && e.detail) {
        throw new Meteor.Error(e.title, e.detail);
      }

      Logger.error(JSON.stringify(util.inspect(e)));
      throw new Meteor.Error("server-error", "An unexpected error occurred while creating a Mollie payment");
    }
  },

  /**
   * Create a refund
   * @method
   * @memberof Payment/Mollie/Methods
   * @param  {Object} reactionPayment object
   * @param  {Number} amount The amount to be refunded
   * @return {Object} result
   */
  "mollie/refund/create"(reactionPayment, amount) {
    // Check all arguments
    check(amount, Number);
    check(reactionPayment, Object);

    try {
      const { transactionId } = reactionPayment;

      const packageData = Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      });
      const dbPayment = MolliePayments.findOne({
        userId: Meteor.userId(),
        transactionId,
      });
      if (!dbPayment) {
        Logger.error(`Mollie Error: payment for transaction ID ${transactionId} not found`);
        return resolve({ saved: false });
      }

      try {
        // Grab the API key and initialize the Mollie client
        const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`) });
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
   * List refunds
   * @method
   * @memberof Payment/Mollie/Methods
   * @param  {Object} reactionPayment Object containing the pertinent data
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

        try {
          // Grab the API key and initialize the Mollie client
          const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`) });
          // Get the refund list for the transaction ID
          const refunds = Promise.await(mollie.payments_refunds.all({ paymentId: transactionId }));
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
   * List refunds
   * @method
   * @memberof Payment/Mollie/Methods
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
  }
});
