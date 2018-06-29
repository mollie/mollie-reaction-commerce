/* eslint camelcase: 0 */
import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import util from "util";
import _ from "lodash";

import { Reaction, Logger } from "/server/api";
import { Cart, Packages, Shops } from "/lib/collections";

import { MolliePayments } from "../../collections";
import { NAME } from "../../misc/consts";
import Mollie from "../../lib/api/src/mollie";

/**
 * Meteor methods for the Mollie Plugin. Run these methods using `Meteor.call()`
 * @namespace Payment/Mollie/Methods
 */
Meteor.methods({
  "mollie/settings/save"(id, settingsKey, fields) {
    // Check all arguments
    check(id, Match.Any);
    check(settingsKey, Match.Any);
    check(fields, Match.Any);

    try {
      return Promise.await(new Promise((resolve, reject) => {
        const process = () => {
          Meteor.call("registry/update", id, settingsKey, fields, (err) => {
            if (err) {
              return reject(err);
            }
            return resolve();
          });
        };

        // Grab the payment methods from the list that is going to be saved
        const field = _.defaults(_.head(_.remove(fields, ["property", "methods"])), { property: "methods", value: [] });
        if (!Array.isArray(field.value)) {
          field.value = [];
        }
        const packageData = Packages.findOne({
          name: NAME,
          shopId: Reaction.getShopId(),
        });

        let apiKey = _.get(_.find(fields, ["property", "apiKey"]), "value", _.get(packageData, `settings.${NAME}.apiKey`));
        try {
          const mollie = Mollie({ apiKey });
          if (typeof mollie === "undefined") {
            return process();
          }

          // Retrieve all payment methods from Mollie and merge
          mollie.methods.all()
            .then(methods => {
              _.remove(field.value, item => !_.includes(_.map(methods, "id"), item._id));
              _.forEach(methods, method => {
                if (!_.includes(_.map(field.value, "_id"), method.id)) {
                  field.value.push({
                    _id: method.id,
                    name: method.description,
                    enabled: false,
                  });
                }
              });
              fields.push(field);
              // Save the new list and other settings
              return process();
            })
            .catch(err => {
              Logger.error(`Mollie error: ${JSON.stringify(util.inspect(err))}`);
              reject(err);
            })
          ;
        } catch (err) {
          Logger.error(`Mollie error: ${JSON.stringify(util.inspect(err))}`);
          return process();
        }
      }));
    } catch (err) {
      Logger.error(`Mollie error: ${JSON.stringify(util.inspect(err))}`);
      throw new Meteor.Error("server-error", "An unexpected error occurred while saving the Mollie module settings");
    }
  },

  "mollie/payment/create"(method, issuer) {
    // Check all arguments
    check(method, String);
    check(issuer, Match.Maybe(String));

    try {
      return Promise.await(new Promise((resolve, reject) => {
        // Grab the current cart
        const cart = Cart.findOne({
          userId: Meteor.userId(),
        }, {
          sort: { createdAt: -1 },
        });
        const currency = Shops.findOne().currency;
        const value = cart.getTotal();
        // Grab the payment info
        const paymentInfo = {
          amount: {
            value: parseFloat(_.toString(value)).toFixed(2),
            currency,
          },
          description: `Cart ${cart._id}`,
          redirectUrl: `${Meteor.absoluteUrl()}mollie/return?cartId=${cart._id}`, // By the time the visitor returns, the cart ID has changed, adding it to the query for cart recovery
          webhookUrl: `${Meteor.absoluteUrl()}mollie/webhook?cartId=${cart._id}`, // We're unable to access the webhook's content since Reaction only exposes JSON functionality
        };
        if (method) {
          paymentInfo.method = method;
        }
        if (issuer) {
          paymentInfo.issuer = issuer;
        }

        // TODO: set to debug level
        Logger.info(`Mollie Payment: ${JSON.stringify(paymentInfo)}`);

        const packageData = Packages.findOne({
          name: NAME,
          shopId: Reaction.getShopId(),
        });
        try {
          const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`) });
          mollie.payments.create(paymentInfo)
            .then(payment => {
              MolliePayments.insert({
                transactionId: payment.id,
                cartId: cart._id,
                method: payment.method,
                bankStatus: payment.status,
                amount: payment.amount.value,
                currency: payment.amount.currency || Shops.findOne().currency,
              });
              resolve(payment.getPaymentUrl());
            })
            .catch(err => {
              Logger.error(`Mollie error: ${JSON.stringify(util.inspect(err))}`);
              reject(err);
            })
          ;
        } catch (e) {
          reject(e);
          Logger.warning(`Mollie: failed initializing payment. Is the API key valid?`);
        }
      }));
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
      return Promise.await(new Promise((resolve, reject) => {
        const { transactionId } = reactionPayment;

        const packageData = Packages.findOne({
          name: NAME,
          shopId: Reaction.getShopId(),
        });
        const dbPayment = MolliePayments.findOne({
          transactionId,
        });
        if (!dbPayment) {
          Logger.error(`Mollie Error: payment for transaction ID ${transactionId} not found`);
          return resolve({ saved: false });
        }

        try {
          const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`) });
          mollie.payments_refunds.create({
            paymentId: transactionId,
            amount: {
              currency: dbPayment.currency || Shops.findOne().currency,
              value: parseFloat(_.toString(amount)).toFixed(2),
            }
          })
            .then(refund => {
              return resolve({
                saved: true,
                response: refund,
              });
            })
            .catch(e => {
              Logger.error(`Mollie Error: ${JSON.stringify(util.inspect(e))}`);
              return resolve({ saved: false });
            });
        } catch (e) {
          Logger.error(`Mollie Error - unable to initialize: ${JSON.stringify(util.inspect(e))}`);
          return resolve({ saved: false });
        }
      }));
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
      return Promise.await(new Promise((resolve, reject) => {
        const { transactionId } = reactionPayment;

        const packageData = Packages.findOne({
          name: NAME,
          shopId: Reaction.getShopId(),
        });

        try {
          const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`) });
          mollie.payments_refunds.all({ paymentId: transactionId })
            .then(refunds => {
              const results = [];
              _.forEach(refunds, refund => {
                results.push({
                  type: "refund",
                  amount: parseFloat(refund.amount.value),
                  created: refund.createdAt,
                  currency: refund.amount.currency || Shops.findOne().currency,
                  raw: refund,
                });
              });
              return resolve(results);
            })
            .catch(e => {
              Logger.error(`Mollie Error: ${JSON.stringify(util.inspect(e))}`);
              return resolve([]);
            });
        } catch (e) {
          Logger.error(`Mollie Error: ${JSON.stringify(util.inspect(e))}`);
          reject(Meteor.Error("server-error", "An unexpected error occurred while processing Mollie refunds"));
        }
      }));
    } catch (e) {
      Logger.error(`Mollie Error: ${JSON.stringify(util.inspect(e))}`);
      throw new Meteor.Error("server-error", "An unexpected error occurred while processing Mollie refunds");
    }
  }
});
