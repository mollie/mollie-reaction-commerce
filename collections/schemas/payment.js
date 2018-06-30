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
export const MolliePaymentsSchema = new SimpleSchema({
  transactionId: {
    type: String,
    label: "Transaction ID"
  },
  userId: {
    type: String,
    label: "User ID",
  },
  amount: {
    type: Number,
    label: "Amount",
  },
  currency: {
    type: String,
    max: 3,
    label: "Currency"
  },
  cartId: {
    type: String,
    label: "Cart ID"
  },
  orderId: {
    type: String,
    label: "Order ID",
    optional: true,
  },
  method: {
    type: String,
    label: "Payment Method"
  },
  bankStatus: {
    type: String,
    label: "Bank Status"
  },
  createdAt: {
    type: Date,
    autoValue: createdAtAutoValue,
  },
  updatedAt: {
    type: Date,
    autoValue: updatedAtAutoValue,
    optional: true,
  },
}, { check, tracker: Tracker });

registerSchema("MolliePayments", MolliePaymentsSchema);
