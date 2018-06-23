import Random from "@reactioncommerce/random";
import SimpleSchema from "simpl-schema";
import { ValidatedMethod } from "meteor/mdg:validated-method";
import { registerSchema } from "@reactioncommerce/schemas";

// Test card to use to add risk level flag for testing purposes only.
export const RISKY_TEST_CARD = "4000000000009235";

// You should not implement ThirdPartyAPI. It is supposed to represent your third party API
// And is called so that it can be stubbed out for testing. This would be a library
// like Stripe or Authorize.net usually just included with a NPM.require

const ThirdPartyAPI = {
  authorize(transactionType, cardData, paymentData) {
    if (transactionType === "authorize") {
      const results = {
        success: true,
        id: Random.id(),
        cardNumber: cardData.number.slice(-4),
        amount: paymentData.total,
        currency: "USD"
      };
      // This is for testing risk evaluation. Proper payment methods have dectection mechanisms for this.
      // This is just a sample
      if (cardData.number === RISKY_TEST_CARD) {
        results.riskStatus = "highest_risk_level";
      }
      return results;
    }
    return {
      success: false
    };
  },
  capture(authorizationId, amount) {
    return {
      authorizationId,
      amount,
      success: true
    };
  },
  refund(transactionId, amount) {
    return {
      success: true,
      transactionId,
      amount
    };
  },
  listRefunds(transactionId) {
    return {
      transactionId,
      refunds: [
        {
          type: "refund",
          amount: 3.99,
          created: 1454034562000,
          currency: "usd",
          raw: {}
        }
      ]
    };
  }
};

// This is the "wrapper" functions you should write in order to make your code more
// testable. You can either mirror the API calls or normalize them to the authorize/capture/refund/refunds
// that Reaction is expecting
export const MollieApi = {};
MollieApi.methods = {};

/**
 * @name cardSchema
 * @memberof Schemas
 * @type {SimpleSchema}
 */
export const cardSchema = new SimpleSchema({
  number: String,
  name: String,
  cvv2: String,
  expireMonth: String,
  expireYear: String,
  type: String
});

registerSchema("cardSchema", cardSchema);

/**
 * @name paymentDataSchema
 * @memberof Schemas
 * @type {SimpleSchema}
 */
export const paymentDataSchema = new SimpleSchema({
  total: String,
  currency: String
});

registerSchema("paymentDataSchema", paymentDataSchema);


MollieApi.methods.authorize = new ValidatedMethod({
  name: "MollieApi.methods.authorize",
  validate: new SimpleSchema({
    transactionType: String,
    cardData: { type: cardSchema },
    paymentData: { type: paymentDataSchema }
  }).validator(),
  run({ transactionType, cardData, paymentData }) {
    const results = ThirdPartyAPI.authorize(transactionType, cardData, paymentData);
    return results;
  }
});


MollieApi.methods.capture = new ValidatedMethod({
  name: "MollieApi.methods.capture",
  validate: new SimpleSchema({
    authorizationId: String,
    amount: Number
  }).validator(),
  run(args) {
    const transactionId = args.authorizationId;
    const { amount } = args;
    const results = ThirdPartyAPI.capture(transactionId, amount);
    return results;
  }
});


MollieApi.methods.refund = new ValidatedMethod({
  name: "MollieApi.methods.refund",
  validate: new SimpleSchema({
    transactionId: String,
    amount: Number
  }).validator(),
  run(args) {
    const { transactionId, amount } = args.transactionId;
    const results = ThirdPartyAPI.refund(transactionId, amount);
    return results;
  }
});


MollieApi.methods.refunds = new ValidatedMethod({
  name: "MollieApi.methods.refunds",
  validate: new SimpleSchema({
    transactionId: String
  }).validator(),
  run(args) {
    const { transactionId } = args;
    const results = ThirdPartyAPI.listRefunds(transactionId);
    return results;
  }
});
