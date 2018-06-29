import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { Meteor } from "meteor/meteor";

import { Reaction } from "/client/api";
import { composeWithTracker } from "/imports/plugins/core/components/lib/composer";
import { Orders } from "/lib/collections";
import Translation from "/imports/plugins/core/ui/client/components/translation/translation";

class MollieReturnContainer extends Component {
  static propTypes = {
    result: PropTypes.any,
  };

  state = {
    result: _.get(this.props, 'result'),
  };

  componentWillReceiveProps(nextProps) {
    this.setState({
      result: nextProps.result,
    });
  }

  render() {
    return (
      <strong><Translation i18nKey="mollie.return.checkingForOrders" defaultValue="Checking for new orders..."/></strong>
    )
  }
}

const composer = () => {
  Meteor.subscribe("Orders");
  const cartId = Reaction.Router.getQueryParam('cartId');
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
  }
};

export default composeWithTracker(composer)(MollieReturnContainer);
