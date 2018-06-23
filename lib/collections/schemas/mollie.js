import SimpleSchema from "simpl-schema";
import { check } from "meteor/check";
import { Tracker } from "meteor/tracker";
import { PackageConfig } from "/lib/collections/schemas";
import { registerSchema } from "@reactioncommerce/schemas";

/**
 * @name MolliePackageConfig
 * @memberof Schemas
 * @type {SimpleSchema}
 */
export const MolliePackageConfig = PackageConfig.clone().extend({
  // Remove blackbox: true from settings obj
  "settings": {
    type: Object,
    optional: true,
    blackbox: false,
    defaultValue: {}
  },
  "settings.mode": {
    type: Boolean,
    defaultValue: true
  },
  "settings.apiKey": {
    type: String,
    label: "API Key",
    optional: true
  }
});

registerSchema("MolliePackageConfig", MolliePackageConfig);

/**
 * @name MolliePayment
 * @memberof Schemas
 * @type {SimpleSchema}
 * @summary MolliePayment schema
 */
export const MolliePayment = new SimpleSchema({
  payerName: {
    type: String,
    label: "Cardholder name"
  },
  cardNumber: {
    type: String,
    min: 13,
    max: 16,
    label: "Card number"
  },
  expireMonth: {
    type: String,
    max: 2,
    label: "Expiration month"
  },
  expireYear: {
    type: String,
    max: 4,
    label: "Expiration year"
  },
  cvv: {
    type: String,
    max: 4,
    label: "CVV"
  }
}, { check, tracker: Tracker });

registerSchema("MolliePayment", MolliePayment);
