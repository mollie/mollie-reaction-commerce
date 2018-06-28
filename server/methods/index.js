/* eslint camelcase: 0 */
import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import util from "util";
import _ from "lodash";

import { Cart } from "/lib/collections";
import { MolliePayments } from "../collections";

import mollie from "../api/mollie";
import { Logger, Reaction } from "/server/api";
import { Shops } from "../../../../../../lib/collections";

/**
 * Meteor methods for the Mollie Plugin. Run these methods using `Meteor.call()`
 * @namespace Payment/Mollie/Methods
 */
Meteor.methods({
  async "mollie/settings/save"(id, settingsKey, fields) {
    // Check all arguments
    check(id, Match.Any);
    check(settingsKey, Match.Any);
    check(fields, Match.Any);

    return await new Promise((resolve, reject) => {
      // Grab the payment methods from the list that is going to be saved
      const field = _.defaults(_.head(_.remove(fields, ['property', 'methods'])), { property: 'methods', value: [] });
      if (!Array.isArray(field.value)) {
        field.value = [];
      }
      // Retrieve all payment methods from Mollie and merge
      mollie.methods.all()
        .then(methods => {
          _.remove(field.value, item => !_.includes(_.map(methods, "id"), item._id));
          _.forEach(methods, method => {
            if (!_.includes(_.map(field.value, '_id'), method.id)) {
              field.value.push({
                _id: method.id,
                name: method.description,
                enabled: false,
              });
            }
          });
          fields.push(field);
          // Save the new list and other settings
          Meteor.call("registry/update", id, settingsKey, fields, (err) => {
            if (err) {
              return reject(err);
            }
            return resolve();
          });
        })
        .catch(err => {
          Logger.error(`Mollie error: ${JSON.stringify(err)}`);
          reject(err);
        })
      ;
    });
  },

  async "mollie/payment/create"(method, issuer) {
    // Check all arguments
    check(method, String);
    check(issuer, Match.Maybe(String));

    try {
      return await new Promise((resolve, reject) => {
        // Grab the current cart
        const cart = Cart.findOne();
        const currency = Shops.findOne().currency;
        const value = cart.getTotal();
        // Grab the payment info
        const paymentInfo = {
          amount: {
            value,
            currency,
          },
          description: `Cart ${cart._id}`,
          redirectUrl: `${Meteor.absoluteUrl()}mollie/return`,
          webhookUrl: `${Meteor.absoluteUrl()}mollie/webhook`,
        };
        if (method) {
          paymentInfo.method = method;
        }
        if (issuer) {
          paymentInfo.issuer = issuer;
        }

        mollie.payments.create(paymentInfo)
          .then(payment => {
            MolliePayments.insert({
              transactionId: payment.id,
              cartId: cart._id,
              method: payment.method,
              bankStatus: payment.status,
            });
            resolve(payment.getPaymentUrl());
          })
          .catch(err => {
            Logger.error(`Mollie error: ${JSON.stringify(util.inspect(err))}`);
            reject(err);
          })
        ;
      });
    } catch (e) {
      if (e.title && e.detail) {
        throw new Meteor.Error(e.title, e.detail);
      }

      throw new Meteor.Error("An unknown error occurred.");
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
    // Call both check and validate because by calling `clean`, the audit pkg
    // thinks that we haven't checked paymentMethod arg
    check(reactionPayment, Object);
    MolliePayments.validate(MolliePayments.clean(reactionPayment));

    const { transactionId } = reactionPayment;
    // const response = Mollie.methods.refund.call({
    //   transactionId,
    //   amount
    // });
    // const results = {
    //   saved: true,
    //   response
    // };
    // return results;
    return {};
  },

  /**
   * List refunds
   * @method
   * @memberof Payment/Mollie/Methods
   * @param  {Object} reactionPayment Object containing the pertinant data
   * @return {Object} result
   */
  "mollie/refund/list"(reactionPayment) {
    // Call both check and validate because by calling `clean`, the audit pkg
    // thinks that we haven't checked reactionPayment arg
    check(reactionPayment, Object);
    MolliePayments.validate(MolliePayments.clean(reactionPayment));

    // const { transactionId } = reactionPayment;
    // const response = Mollie.methods.refunds.call({
    //   transactionId
    // });
    // const result = [];
    // for (const refund of response.refunds) {
    //   result.push(refund);
    // }

    // The results retured from the GenericAPI just so happen to look like exactly what the dashboard
    // wants. The return package should ba an array of objects that look like this
    // {
    //   type: "refund",
    //   amount: Number,
    //   created: Number: Epoch Time,
    //   currency: String,
    //   raw: Object
    // }
    // const emptyResult = [];
    // return emptyResult;
    return [];
  }
});
