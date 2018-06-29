import { Meteor } from "meteor/meteor";

import { PaymentMethodArgument } from "/lib/collections/schemas";
import { Packages, Cart } from "/lib/collections";

import { NAME } from "../../misc/consts";
import { check, Match } from "meteor/check";
import { MolliePayments } from "../../collections";

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
  });
});
