/* eslint camelcase: 0 */
// meteor modules
import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
// reaction modules
import { Logger } from "/server/api";
import { ValidCardNumber, ValidExpireMonth, ValidExpireYear, ValidCVV } from "/lib/api";
import { Mollie } from "./mollieapi";
import { PaymentMethodArgument } from "/lib/collections/schemas";

// function chargeObj() {
//   return {
//     amount: "",
//     currency: "",
//     card: {},
//     capture: true
//   };
// }

// function parseCardData(data) {
//   return {
//     number: data.number,
//     name: data.name,
//     cvc: data.cvv2,
//     expireMonth: data.expire_month,
//     expireYear: data.expire_year
//   };
// }

/**
 * Meteor methods for the Mollie Plugin. Run these methods using `Meteor.call()`
 * @namespace Payment/Mollie/Methods
 */


Meteor.methods({
  /**
   * Submit a card for Authorization
   * @method
   * @memberof Payment/Mollie/Methods
   * @param  {Object} transactionType authorize or capture
   * @param  {Object} cardData card Details
   * @param  {Object} paymentData The details of the Payment Needed
   * @return {Object} results normalized
   */
  "mollieSubmit"(transactionType, cardData, paymentData) {
    check(transactionType, String);
    check(cardData, {
      name: String,
      number: ValidCardNumber,
      expireMonth: ValidExpireMonth,
      expireYear: ValidExpireYear,
      cvv2: ValidCVV,
      type: String
    });

    check(paymentData, {
      total: String,
      currency: String
    });
    const total = parseFloat(paymentData.total);
    let result;
    try {
      const transaction = Mollie.methods.authorize.call({
        transactionType,
        cardData,
        paymentData
      });

      result = {
        saved: true,
        status: "created",
        currency: paymentData.currency,
        amount: total,
        riskLevel: normalizeRiskLevel(transaction),
        transactionId: transaction.id,
        response: {
          amount: total,
          transactionId: transaction.id,
          currency: paymentData.currency
        }
      };
    } catch (error) {
      Logger.warn(error);
      result = {
        saved: false,
        error
      };
    }
    return result;
  },

  /**
   * Capture a Charge
   * @method
   * @memberof Payment/Mollie/Methods
   * @param {Object} paymentMethod Object containing data about the transaction to capture
   * @return {Object} results normalized
   */
  "mollie/payment/capture"(paymentMethod) {
    // Call both check and validate because by calling `clean`, the audit pkg
    // thinks that we haven't checked paymentMethod arg
    check(paymentMethod, Object);
    PaymentMethodArgument.validate(PaymentMethodArgument.clean(paymentMethod));

    const { amount, transactionId: authorizationId } = paymentMethod;
    const response = Mollie.methods.capture.call({
      authorizationId,
      amount
    });
    const result = {
      saved: true,
      response
    };
    return result;
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
    const response = Mollie.methods.refund.call({
      transactionId,
      amount
    });
    const results = {
      saved: true,
      response
    };
    return results;
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

    const { transactionId } = paymentMethod;
    const response = Mollie.methods.refunds.call({
      transactionId
    });
    const result = [];
    for (const refund of response.refunds) {
      result.push(refund);
    }

    // The results retured from the GenericAPI just so happen to look like exactly what the dashboard
    // wants. The return package should ba an array of objects that look like this
    // {
    //   type: "refund",
    //   amount: Number,
    //   created: Number: Epoch Time,
    //   currency: String,
    //   raw: Object
    // }
    const emptyResult = [];
    return emptyResult;
  }
});

/**
 * @method normalizeRiskLevel
 * @private
 * @summary Normalizes the risk level response of a transaction to the values defined in paymentMethod schema
 * @param  {object} transaction - The transaction that we need to normalize
 * @return {string} normalized status string - either elevated, high, or normal
 */
function normalizeRiskLevel(transaction) {
  // the values to be checked against will depend on the return codes/values from the payment API
  if (transaction.riskStatus === "low_risk_level") {
    return "elevated";
  }

  if (transaction.riskStatus === "highest_risk_level") {
    return "high";
  }

  // default to normal if no other flagged
  return "normal";
}