import { Meteor } from "meteor/meteor";

import { Packages, Cart } from "/lib/collections";

import { NAME } from "../../misc/consts";
import { check, Match } from "meteor/check";
import { MolliePayments, MollieQrCodes } from "../../collections";

Meteor.publish("mollie/methods/list", (shopId) => {
  check(shopId, Match.Maybe(String));

  return Packages.find({
    name: NAME,
    shopId,
  }, {
    limit: 1,
    fields: {
      [`settings.${NAME}.methods`]: 1,
    },
  });
});

Meteor.publish("mollie/payment/status", () => {
  return MolliePayments.find({
    cartId: Cart.findOne()._id,
    userId: Meteor.userId(),
  });
});

Meteor.publish("MolliePayments", () => {
  return MolliePayments.find({
    userId: Meteor.userId(),
  }, {
    fields: {
      transactionId: 0,
    },
  });
});

Meteor.publish("MollieQrCodes", () => {
  return MollieQrCodes.find({
    userId: Meteor.userId(),
  }, {
    fields: {
      transactionId: 0,
    },
  });
});
