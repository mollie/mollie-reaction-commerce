import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import _ from "lodash";

import { Reaction } from "/client/api";
import { composeWithTracker } from "/imports/plugins/core/components/lib/composer";
import { Orders } from "/lib/collections";
import Translation from "/imports/plugins/core/ui/client/components/translation/translation";

import { MolliePayments } from "../../../collections";
import { MollieApiPayment, MollieApiMethod } from "../../../lib/api/src/models";

class MollieReturnContainer extends Component {
  render() {
    return (
      <div className="completed-order-container">
        <div className="container order-completed">
          <div className="order-details-header">
            <h3><Translation i18nKey="return.welcomeBack"/></h3>
            <p>
              <Translation i18nKey="return.notReceivedPaymentStatus"/>
            </p>
          </div>
        </div>
      </div>
    );
  }
}

const composer = (props, onData) => {
  // The return page fully utilizes Meteor's DDP, so in case a webhook is delayed we still have the change to redirect
  // the visitor to the confirmation page
  Meteor.subscribe("Orders");
  Meteor.subscribe("MolliePayments");
  const cartId = Reaction.Router.getQueryParam("cartId");
  if (cartId) {
    // Get the order if available
    const order = Orders.findOne({
      cartId,
    });
    if (order) {
      return Reaction.Router.go("cart/completed", {}, { _id: cartId });
    } else {
      // No order found. Check if the payment might have been canceled, expired or failed.
      const molliePayment = MolliePayments.findOne({
        cartId,
      }, {
        sort: { createdAt: -1 },
      });
      if (_.includes([
        MollieApiPayment.STATUS_OPEN,
        MollieApiPayment.STATUS_PENDING,
        MollieApiPayment.STATUS_CANCELED,
        MollieApiPayment.STATUS_EXPIRED,
        MollieApiPayment.STATUS_FAILED,
      ], _.get(molliePayment, "bankStatus"))) {
        // Back to the checkout
        if (!(MollieApiPayment.STATUS_OPEN && molliePayment.method === MollieApiMethod.BANKTRANSFER)) {
          return Reaction.Router.go("cart/checkout", {}, {});
        }
      }

      // Observe orders when there initially isn't one available
      Orders.find({
        cartId,
      }, {
        limit: 1,
      })
        .observe({
          changedAt(order) {
            // Order found. Continue to the order confirmation page.
            Reaction.Router.go("cart/completed", {}, { _id: order.cartId });
          }
        });

      // Also keep an eye on other statuses, such as expired, canceled and failed
      MolliePayments.find({
        cartId,
      }, {
        sort: { createdAt: -1 },
        limit: 1,
      })
        .observe({
          changedAt(molliePayment) {
            if (_.includes([
              MollieApiPayment.STATUS_OPEN,
              MollieApiPayment.STATUS_PENDING,
              MollieApiPayment.STATUS_CANCELED,
              MollieApiPayment.STATUS_EXPIRED,
              MollieApiPayment.STATUS_FAILED,
            ], molliePayment.bankStatus)) {
              // Back to the checkout
              if (!(MollieApiPayment.STATUS_OPEN && molliePayment.method === MollieApiMethod.BANKTRANSFER)) {
                return Reaction.Router.go("cart/checkout", {}, {});
              }
            }
          }
        })
    }

    onData(null, {});
  } else {
    // No Cart ID found, back to the homepage
    Reaction.Router.go("/", {}, {});
  }
};

export default composeWithTracker(composer)(MollieReturnContainer);
