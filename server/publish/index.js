import { Meteor } from "meteor/meteor";

import { PaymentMethodArgument } from "/lib/collections/schemas";
import { Packages } from "/lib/collections";

import { NAME } from "../../misc/consts";
import { check, Match } from "meteor/check";

Meteor.publish("mollie/methods/list", function (shopId) {
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
