import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import _ from "lodash";

import { Reaction } from "/client/api";
import { Packages } from "/lib/collections"
import { composeWithTracker } from "@reactioncommerce/reaction-components";

import MolliePaymentSelector from "../components/MolliePaymentSelector";
import { NAME } from "../../../misc/consts";

class MolliePaymentSelectorContainer extends Component {
  render() {
    return <MolliePaymentSelector{...this.props}/>;
  }
}

const composer = (props, onData) => {
  const subscription = Meteor.subscribe("Packages");
  Meteor.subscribe("mollie/methods/list", Reaction.getShopId(), () => {
    const packages = Packages.find({
      name: NAME,
      shopId: Reaction.getShopId(),
    }, {
      limit: 1,
    });
    packages
      .observe({
        changedAt(data) {
          onData(null, { methods: _.get(data, `settings.${NAME}.methods`, [])});
        }
      });
  });
  if (subscription.ready()) {
    const packageData = Packages.findOne({
      name: NAME,
      shopId: Reaction.getShopId()
    });
    onData(null, { methods: _.get(packageData, `settings.${NAME}.methods`, []) });
  }
};

export default composeWithTracker(composer)(MolliePaymentSelectorContainer);
