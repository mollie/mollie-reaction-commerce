import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import _ from "lodash";

import { Reaction } from "/client/api";
import { Packages } from "/lib/collections"
import { composeWithTracker } from "/imports/plugins/core/components/lib/composer";

import MolliePaymentSelector from "../components/MolliePaymentSelector";
import { NAME } from "../../../misc/consts";

class MolliePaymentSelectorContainer extends Component {
  render() {
    return(
      <MolliePaymentSelector
        {...this.props}
      />
    );
  }
}

const composer = (props, onData) => {
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
          console.log(data);
          onData(null, { methods: _.get(data, `settings.${NAME}.methods`)});
        }
      });
    onData(null, { methods: _.get(packages.fetch(), `[0].settings.${NAME}.methods`, "") });
  });
};

export default composeWithTracker(composer)(MolliePaymentSelectorContainer);
