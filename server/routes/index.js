import { Meteor } from "meteor/meteor";
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
    const dbPayment = MolliePayments.findOne({ cartId });
    if (typeof dbPayment !== 'object' || typeof cart !== 'object') {
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

        if (typeof cart === 'object' && (molliePayment.isPaid() || molliePayment.method === MollieApiMethod.BANKTRANSFER && molliePayment.isOpen())) {
          // Use an internal DDP method invocation to run the order processing methods
          const invocation = new DDPCommon.MethodInvocation({
            isSimulation: false,
            userId: cart.userId,
            setUserId: () => {},
            unblock: () => {},
            connection: {},
            randomSeed: Math.random(),
          });
          DDP._CurrentInvocation.withValue(invocation, () => {
            const packageData = Packages.findOne({
              name: NAME,
              shopId: Reaction.getShopId()
            });
            const newCart = Meteor.call("cart/submitPayment", {
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
            MolliePayments.update({
              _id: molliePayment.id,
            }, {
              $set: { orderId: newCart.orderId },
            });
          });
        } 
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
