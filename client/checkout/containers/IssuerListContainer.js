import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import _ from "lodash";

import { composeWithTracker } from "@reactioncommerce/reaction-components";

import IssuerList from "../components/IssuerList";

let banks;
let selectedBank;

class IssuerListContainer extends Component {
  static propTypes = {
    qrCode: PropTypes.bool,
    submit: PropTypes.bool,
    onChange: PropTypes.func,
  };

  render() {
    return <IssuerList {...this.props}/>;
  }
}

const compose = (props, onData) => {
  if (banks && selectedBank) {
    // Return cached results
    return onData(null, { banks, selectedBank });
  }
  
  Meteor.call("mollie/ideal/list", (err, result) => {
    if (err) {
      return onData(err);
    } else {
      banks = _.get(result, "issuers", []);
      selectedBank = _.get(_.head(banks), "id", "");

      return onData(null, { banks, selectedBank });
    }
  });
};

export default composeWithTracker(compose)(IssuerListContainer);
