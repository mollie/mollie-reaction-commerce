import { Meteor } from "meteor/meteor";
import { Promise } from "meteor/promise";
import { Random } from "meteor/random";
import Mollie from "@mollie/api-client";
import _ from "lodash";
import util from "util";
import { Logger, Reaction } from "/server/api";

import { Cart, Orders, Packages } from "/lib/collections";

import { MolliePayments, MollieQrCodes } from "../../collections";
import { NAME } from "../../misc/consts";

const DDPCommon = Package["ddp-common"].DDPCommon;

const processWebhook = (req, res) => {
  // Grab the module configuration
  const packageData = Packages.findOne({
    name: NAME,
    shopId: Reaction.getShopId(),
  });

  // Keep track of the amount of successful requests
  let successful = 0;
  try {
    // Get the API key and initialize the Mollie client
    const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`)});

    // We are grabbing the Cart ID from the URL since we can't parse the body
    const cartId = _.get(req.url.split("="), "[1]");
    // There might be a cart, there might be an order. We'll have to work with both.
    const cart = Cart.findOne({
      _id: cartId,
    });
    let order = Orders.findOne({
      cartId,
    });
    // Get the User ID
    const userId = _.get(cart, "userId", _.get(order, "userId"));

    // Get the payment status from the database
    const dbPayments = MolliePayments.find({
      cartId,
      userId,
    }).fetch();
    if (_.isEmpty(dbPayments)) {
      // If there is no payment info available, we'd better skip this call
      return Reaction.Endpoints.sendResponse(res, {
        data: {
          success: true,
        },
      });
    }

    // Process all the payments that have been found
    dbPayments.map(dbPayment => {
      // Get the payment
      let molliePayment;
      try {
        if (_.startsWith(dbPayment.transactionId, "ord_")) {
          const mollieOrder = Promise.await(mollie.orders.get(dbPayment.transactionId, { embed: ["payments"] }));
          molliePayment = mollieOrder._embedded.payments[0];
        } else {
          molliePayment = Promise.await(mollie.payments.get(dbPayment.transactionId));
        }
      } catch (e) {
        Logger.error(JSON.stringify(util.inspect(e)));
        return;
      }
      // Set the new status in the database
      MolliePayments.update({
        transactionId: dbPayment.transactionId,
        userId,
      }, {
        $set: {
          bankStatus: molliePayment.status,
        },
      });
      if (!_.includes(["open", "pending"])) {
        MollieQrCodes.remove({
          transactionId: dbPayment.transactionId,
        });
      }

      Logger.debug(molliePayment);

      // We'll need to leave "server mode" and initialize a DDP Client to manipulate data and run the internal
      // Reaction Commerce functionality.
      // We can do so by using a DDP method invocation to run the order processing methods.
      // Within this method invocation we'll set the User ID which basically authenticates this webhook call to
      // adjust the user information in the database.
      const invocation = new DDPCommon.MethodInvocation({
        isSimulation: false,
        userId,
        setUserId: () => {},
        unblock: () => {},
        connection: {},
        randomSeed: Random.id(),
      });
      DDP._CurrentInvocation.withValue(invocation, () => {
        if (typeof cart !== "undefined" && molliePayment.isPaid()) {
          Meteor.call("cart/submitPayment", {
            processor: "Mollie",
            paymentPackageId: packageData._id,
            paymentSettingsKey: NAME,
            method: "credit",
            transactionId: dbPayment.transactionId,
            amount: parseFloat(molliePayment.amount.value),
            status: "completed",
            mode: "capture",
            createdAt: new Date(),
            updatedAt: new Date(),
            transactions: [molliePayment],
            workflow: {
              status: "new",
            },
          });

          // The order object should now be available
          order = Orders.findOne({
            cartId,
          });

          // Attach the new order ID to the new MolliePayment
          MolliePayments.update({
            transactionId: dbPayment.transactionId,
            userId,
          }, {
            $set: {
              orderId: order._id,
            },
          });
        } else if (typeof order !== "undefined"
          && molliePayment.method === "banktransfer"
          && (molliePayment.isExpired() || molliePayment.isCanceled())
        ) {
          // Release the previously reserved products because the bank transfer has expired
          Meteor.call("inventory/clearReserve", _.get(order, "items", _.get(cart, "items", [])));
        }
      });
      successful++;
    });
  } catch (err) {
    Logger.error(`Mollie Webhook Error: ${JSON.stringify(util.inspect(err))}`);
    return Reaction.Endpoints.sendResponse(res, {
      code: 500,
      data: {
        success: false,
      },
    });
  }

  return Reaction.Endpoints.sendResponse(res, {
    data: {
      success: !!successful,
    },
  });
};

// We are registering two endpoints, one is the regular and documented POST webhook call, the other is to make
// it easier to run the webhook again. The merchant can just navigate to the webhook URL as displayed on the Mollie
// dashboard.
// Unfortunately, we are not able to parse the body of the call, since Reaction Commerce only registers a
// JSON body parse during the core initialization, but by appending the Cart ID to the URL (`?cartId=tr_...`)
// we can still find the transaction ID via the database and grab the payment information from the Mollie API.
Reaction.Endpoints.add("get", "/mollie/webhook", processWebhook);
Reaction.Endpoints.add("post", "/mollie/webhook", processWebhook);
