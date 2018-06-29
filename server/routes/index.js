import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import _ from "lodash";
import util from "util";
import { Reaction, Logger } from "/server/api";
import { Packages, Cart, Orders } from "/lib/collections";

import Mollie from "../../lib/api/src/mollie";
import { MolliePayments } from "../../collections";
import { NAME } from "../../misc/consts";
import { MollieApiMethod } from "../../lib/api/src/models";

const DDPCommon = Package["ddp-common"].DDPCommon;

const processWebhook = (req, res) => {
  const packageData = Packages.findOne({
    name: NAME,
    shopId: Reaction.getShopId(),
  });
  try {
    const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`)});
    const cartId = _.get(req.url.split('='), '[1]');
    const cart = Cart.findOne({
      _id: cartId,
    });
    let order = Orders.findOne({
      cartId,
    });
    const dbPayment = MolliePayments.findOne({ cartId });
    if (typeof dbPayment !== 'object') {
      Reaction.Endpoints.sendResponse(res, {
        data: {
          success: true,
        },
      });
    }
    mollie.payments.get(dbPayment.transactionId)
      .then(molliePayment => {
        MolliePayments.update(
          { transactionId: molliePayment.id },
          { $set: { bankStatus: molliePayment.status },
        });
        Logger.debug(molliePayment);

        // Use an internal DDP method invocation to run the order processing methods
        const invocation = new DDPCommon.MethodInvocation({
          isSimulation: false,
          userId: _.get(cart, 'userId', _.get(order, 'userId')),
          setUserId: () => {},
          unblock: () => {},
          connection: {},
          randomSeed: Random.id(),
        });
        DDP._CurrentInvocation.withValue(invocation, () => {
          if (typeof cart === 'object' && (molliePayment.isPaid())) {
            const packageData = Packages.findOne({
              name: NAME,
              shopId: Reaction.getShopId()
            });
            Meteor.call("cart/submitPayment", {
              processor: "Mollie",
              paymentPackageId: packageData._id,
              paymentSettingsKey: NAME,
              method: "credit",
              transactionId: molliePayment.id,
              amount: parseFloat(molliePayment.amount.value),
              status: "completed",
              mode: "capture",
              createdAt: new Date(),
              updatedAt: new Date(),
              transactions: [molliePayment],
              workflow: {
                status: "new"
              },
            });
            // The order object should now be available
            order = Orders.findOne({
              cartId,
            });
            // Attach the ne order ID to the new MolliePayment
            MolliePayments.update({
              transactionId: molliePayment.id,
            }, {
              $set: { orderId: order._id },
            });
          } else if (typeof order !== 'undefined' && molliePayment.method === MollieApiMethod.BANKTRANSFER && (molliePayment.isExpired() || molliePayment.isCanceled())) {
            // Release the products because the bank transfer has expired
            Meteor.call("inventory/clearReserve", _.get(order, 'items', _.get(cart, 'items', [])));
          }
        });
      })
      .catch(err => Logger.error(`Mollie Webhook Error: ${JSON.stringify(util.inspect(err))}`))
  } catch (e) {
    Logger.error(`Mollie error: ${JSON.stringify(util.inspect(e))}`);
    Reaction.Endpoints.sendResponse(res, {
      code: 500,
      data: {
        success: false,
      },
    });
  }
};

Reaction.Endpoints.add("get", "/mollie/webhook", processWebhook);
Reaction.Endpoints.add("post", "/mollie/webhook", processWebhook);
