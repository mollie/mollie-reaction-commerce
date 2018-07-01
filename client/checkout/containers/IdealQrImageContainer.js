import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";

import { Reaction } from "/client/api";
import { Cart, Orders } from "/lib/collections";
import { MollieQrCodes } from "../../../collections";

import { composeWithTracker } from "/imports/plugins/core/components/lib";
import IdealQrImage from "../components/IdealQrImage";

class IssuerListContainer extends Component {
  static propTypes = {
    width: PropTypes.string,
    height: PropTypes.string,
  };

  render() {
    return <IdealQrImage {...this.props}/>;
  }
}

const compose = (props, onData) => {
  // Subscribe to the collections we need
  Meteor.wrapAsync(Meteor.subscribe("Orders"));
  Meteor.wrapAsync(Meteor.subscribe("MollieQrCodes"));
  // Get the cart
  const cart = Cart.findOne({}, { sort: { createdAt: -1 } });
  // Send a call to check the iDEAL QR Code
  Meteor.wrapAsync(Meteor.call("mollie/idealqr/refresh", cart._id));

  // Keep an eye on new orders linked to this cart
  Orders.find({
    cartId: cart._id,
  }, {
    sort: { createdAt: -1 },
  })
    .observe({
      addedAt(order) {
        // Order found. Continue to the order confirmation page.
        Reaction.Router.go("cart/completed", {}, { _id: order.cartId });
      },
      changedAt(order) {
        // Order found. Continue to the order confirmation page.
        Reaction.Router.go("cart/completed", {}, { _id: order.cartId });
      },
    });
  // Keep an eye on expired QR codes
  MollieQrCodes.find({
    cartId: cart._id,
  })
    .observe({
      addedAt(qrCode) {
        onData(null, { imageUrl: qrCode.imageUrl });
      },
      changedAt(qrCode) {
        onData(null, { imageUrl: qrCode.imageUrl });
      },
      removedAt() {
        // The QR Code has expired, refresh
        onData(null, { imageUrl: null });
        Meteor.call("mollie/idealqr/refresh", cart._id);
      },
    });

  // Check if there might have already been an order with this cart ID
  const order = Orders.findOne({ cartId: cart._id });
  if (order) {
    Reaction.Router.go("/cart/completed", {}, { _id: cart._id });
  }
  // Check if the QR code is available and display the image
  const qrCode = MollieQrCodes.findOne({
    cartId: cart._id,
  });
  if (qrCode) {
    onData(null, { imageUrl: qrCode.imageUrl });
  }
};

export default composeWithTracker(compose)(IssuerListContainer);
