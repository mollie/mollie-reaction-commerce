import SimpleSchema from "simpl-schema";
import { check } from "meteor/check";
import { Tracker } from "meteor/tracker";
import { registerSchema } from "@reactioncommerce/schemas";
import { createdAtAutoValue, updatedAtAutoValue } from "/imports/collections/schemas/helpers";

/**
 * @name MolliePayment
 * @memberof Schemas
 * @type {SimpleSchema}
 * @summary MolliePayment schema
 */
export const MollieQrCodesSchema = new SimpleSchema({
  transactionId: {
    type: String,
    label: "Transaction ID"
  },
  userId: {
    type: String,
    label: "User ID",
    autoValue: function() {
      return this.userId;
    },
  },
  cartId: {
    type: String,
    label: "Cart ID"
  },
  amount: {
    type: Number,
    label: "Amount"
  },
  method: {
    type: String,
    label: "Payment Method",
  },
  imageUrl: {
    type: String,
    label: "Image URL",
  },
  expiresAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    autoValue: createdAtAutoValue
  },
  updatedAt: {
    type: Date,
    autoValue: updatedAtAutoValue,
    optional: true,
  },
}, { check, tracker: Tracker });

registerSchema("MollieQrCodes", MollieQrCodesSchema);
