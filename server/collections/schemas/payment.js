import SimpleSchema from "simpl-schema";
import { check } from "meteor/check";
import { Tracker } from "meteor/tracker";
import { registerSchema } from "@reactioncommerce/schemas";

/**
 * @name MolliePayment
 * @memberof Schemas
 * @type {SimpleSchema}
 * @summary MolliePayment schema
 */
export const MolliePayment = new SimpleSchema({
  transactionId: {
    type: String,
    label: "Transaction ID"
  },
  cartId: {
    type: String,
    label: "Cart ID"
  },
  orderId: {
    type: String,
    label: "Order ID"
  },
  method: {
    type: String,
    label: "Payment Method"
  },
  bankStatus: {
    type: String,
    max: 4,
    label: "Bank Status"
  },
}, { check, tracker: Tracker });

registerSchema("MolliePayment", MolliePayment);
