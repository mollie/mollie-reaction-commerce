import Mollie from "@mollie/api-client";
import Hooks from "@reactioncommerce/hooks";
import _ from 'lodash';
import util from "util";

import { Packages } from "lib/collections";
import { Logger, Reaction } from "server/api";
import { NAME } from "../misc/consts";
import { MolliePayments } from "../collections";

Hooks.Events.add("onOrderShipmentShipped", (order) => {
  const packageData = Packages.findOne({
    name: NAME,
    shopId: Reaction.getShopId(),
  });
  const apiKey = _.get(packageData, `settings.${NAME}.apiKey`);
  if (!apiKey) {
    return;
  }

  const dbPayment = MolliePayments.findOne({
    orderId: order._id,
  });
  if (!dbPayment || !_.startsWith(dbPayment.transactionId, "ord_")) {
    return;
  }
  const mollie = new Mollie({ apiKey });
  try {
    Promise.await(mollie.orders_shipments.create({ orderId: dbPayment.transactionId, lines: [] }));
  } catch (e) {
    Logger.error("Mollie shipment error: " + JSON.stringify(util.inspect(e)));
  }

  Logger.debug("Order shipped: " + JSON.stringify(order));
});
