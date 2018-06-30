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
  // Grab the module configuration
  const packageData = Packages.findOne({
    name: NAME,
    shopId: Reaction.getShopId(),
  });

  try {
    // Get the API key and initialize the Mollie client
    const mollie = Mollie({ apiKey: _.get(packageData, `settings.${NAME}.apiKey`)});

    // We are grabbing the Cart ID from the URL since we can't parse the body
    const cartId = _.get(req.url.split("="), "[1]");
    // There might be a cart, there might be an order. We'll have to work with both
    const cart = Cart.findOne({
      _id: cartId,
    });
    let order = Orders.findOne({
      cartId,
    });

    // Get the payment status from the database
    const dbPayment = MolliePayments.findOne({ cartId });
    if (typeof dbPayment !== "object") {
      // If there is no payment info available, we'd better skip this call
      Reaction.Endpoints.sendResponse(res, {
        data: {
          success: true,
        },
      });
    }

    // Get the payment
    const molliePayment = Promise.await(mollie.payments.get(dbPayment.transactionId));
    // Set the new status in the database
    MolliePayments.update(
      { transactionId: molliePayment.id },
      { $set: { bankStatus: molliePayment.status },
    });

    Logger.debug(molliePayment);

    // We'll need to leave "server mode" and initialize a DDP Client to manipulate data and run the internal
    // Reaction Commerce functionality.
    // We can do so by using an internal DDP method invocation to run the order processing methods.
    // Within this method invocation we'll set the User ID which basically authenticates this webhook call to
    // adjust the user information in the database.
    const invocation = new DDPCommon.MethodInvocation({
      isSimulation: false,
      userId: _.get(cart, "userId", _.get(order, "userId")),
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
          transactionId: molliePayment.id,
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

        // Attach the ne order ID to the new MolliePayment
        MolliePayments.update({
          transactionId: molliePayment.id,
        }, {
          $set: { orderId: order._id },
        });
      } else if (typeof order !== "undefined"
        && molliePayment.method === MollieApiMethod.BANKTRANSFER
        && (molliePayment.isExpired() || molliePayment.isCanceled())
      ) {
        // Release the previously reserved products because the bank transfer has expired
        Meteor.call("inventory/clearReserve", _.get(order, "items", _.get(cart, "items", [])));
      }
    });
  } catch (err) {
    Logger.error(`Mollie Webhook Error: ${JSON.stringify(util.inspect(err))}`);
    Reaction.Endpoints.sendResponse(res, {
      code: 500,
      data: {
        success: false,
      },
    });
  }

  Reaction.Endpoints.sendResponse(res, {
    data: {
      success: true,
    },
  });
};

// We are registering two endpoints, one is the regular and documented POST webhook call, the other is to make
// it easier to run the webhook again. The user can just navigate to the webhook URL as displayed on the Mollie
// dashboard.
// Unfortunately, we are not able to parse the body of the call, since Reaction Commerce only registers a
// JSON body parse during the core initialization, but by appending the Cart ID to the URL (`?cartId=tr_...`)
// we can still find the transaction ID via the database and grab the payment information from the Mollie API.
Reaction.Endpoints.add("get", "/mollie/webhook", processWebhook);
Reaction.Endpoints.add("post", "/mollie/webhook", processWebhook);
