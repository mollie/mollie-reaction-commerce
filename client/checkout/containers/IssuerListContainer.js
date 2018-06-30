import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import _ from "lodash";

import { composeWithTracker } from "/imports/plugins/core/components/lib";

import IssuerList from "../components/IssuerList";

let banks;
let selectedBank;

class IssuerListContainer extends Component {
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
      banks = _.get(result, 'issuers', []);
      selectedBank = _.get(_.head(banks), 'id', '');

      return onData(null, { banks, selectedBank });
    }
  });
};

export default composeWithTracker(compose)(IssuerListContainer);
