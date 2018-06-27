/* eslint camelcase: 0 */
import { Reaction } from "/server/api"
import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import _ from "lodash";

import { Logger } from "/server/api";
import { PaymentMethodArgument } from "/lib/collections/schemas";
import { Packages } from "/lib/collections";

import { NAME } from "../../misc/consts";
import Mollie from '../../lib/api/src/mollie';

let mollie;
const { settings: { [NAME]: { apiKey }} } = Packages.findOne({
  name: NAME,
  shopId: Reaction.getShopId()
});
try {
  mollie = Mollie({ apiKey });
} catch (e) {
}

/**
 * Meteor methods for the Mollie Plugin. Run these methods using `Meteor.call()`
 * @namespace Payment/Mollie/Methods
 */
Meteor.methods({
  async "mollie/settings/save"(id, settingsKey, fields) {
    check(id, Match.Any);
    check(settingsKey, Match.Any);
    check(fields, Match.Any);

    return await new Promise((resolve, reject) => {
      const field = _.defaults(_.head(_.remove(fields, ['property', 'methods'])), { property: 'methods', value: [] });
      if (!Array.isArray(field.value)) {
        field.value = [];
      }
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
          Meteor.call("registry/update", id, settingsKey, fields, (err) => {
            if (err) {
              return reject(err);
            }
            return resolve();
          });
        })
        .catch(err => reject(err))
      ;
    });
  },

  /**
   * Create a new payment
   *
   * @method
   * @memberof Payment/Mollie/Methods
   *
   * @param  {Object}   paymentData The details of the Payment Needed
   *
   * @return {Object} results normalized
   */
  async "mollie/payment/create"(paymentData) {
    check(paymentData, Object);

    return await new Promise((resolve, reject) => {
      if (!mollie) {
        reject(new Meteor.Error('mollie-undefined', 'mollie is `undefined`'));
      }
      mollie.payments.create({
        amount:      10.00,
        description: 'My first API payment',
        redirectUrl: 'http://localhost:3000/mollie/success',
      })
        .then(payment => resolve(payment))
        .catch(err => reject(err));
    });
  },

  /**
   * Create a refund
   * @method
   * @memberof Payment/Mollie/Methods
   * @param  {Object} paymentMethod object
   * @param  {Number} amount The amount to be refunded
   * @return {Object} result
   */
  "mollie/refund/create"(paymentMethod, amount) {
    check(amount, Number);

    // Call both check and validate because by calling `clean`, the audit pkg
    // thinks that we haven't checked paymentMethod arg
    check(paymentMethod, Object);
    PaymentMethodArgument.validate(PaymentMethodArgument.clean(paymentMethod));

    const { transactionId } = paymentMethod;
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
   * @param  {Object} paymentMethod Object containing the pertinant data
   * @return {Object} result
   */
  "mollie/refund/list"(paymentMethod) {
    // Call both check and validate because by calling `clean`, the audit pkg
    // thinks that we haven't checked paymentMethod arg
    check(paymentMethod, Object);
    PaymentMethodArgument.validate(PaymentMethodArgument.clean(paymentMethod));

    // const { transactionId } = paymentMethod;
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
