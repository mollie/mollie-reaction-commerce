import React, { Component } from "react";
import { Meteor } from "meteor/meteor";

import { Reaction } from "/client/api";
import { composeWithTracker } from "/imports/plugins/core/components/lib/composer";
import { Orders } from "/lib/collections";
import Translation from "/imports/plugins/core/ui/client/components/translation/translation";

class MollieReturnContainer extends Component {
  render() {
    return (
      <div className="completed-order-container">
        <div className="container order-completed">
          <div className="order-details-header">
            <h3><Translation i18nKey="mollie.return.welcomeBack" defaultValue="Welcome back!"/></h3>
            <p><Translation i18nKey="mollie.return.notReceivedPaymentStatus" defaultValue="We have not yet received a definite payment status. You will be notified once your payment has been accepted."/></p>
          </div>
        </div>
      </div>
    )
  }
}

const composer = (props, onData) => {
  Meteor.subscribe("Orders");
  const cartId = Reaction.Router.getQueryParam("cartId");
  if (cartId) {
    const order = Orders.findOne({
      cartId,
    });
    if (order) {
      Reaction.Router.go("cart/completed", {}, { _id: cartId });
    } else {
      // Observe orders
      Orders.find({
        cartId,
      }, {
        limit: 1,
      })
        .observe({
          changedAt(order) {
            if (order) {
              Reaction.Router.go("cart/completed", {}, { _id: order.cartId });
            }
          }
        });
    }

    onData(null, {});
  }
};

export default composeWithTracker(composer)(MollieReturnContainer);
