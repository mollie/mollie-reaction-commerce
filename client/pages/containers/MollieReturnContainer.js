import React, { Component } from "react";
import PropTypes from "prop-types";

import { Reaction } from "/client/api";
import { Meteor } from "meteor/meteor";
import _ from "lodash";

import { composeWithTracker } from "../../../../../core/components/lib/composer";

class MollieReturnContainer extends Component {
  static propTypes = {
    result: PropTypes.string,
    orderId: PropTypes.string,
  };

  state = {
    result: _.get(this.props, 'result'),
    orderId: _.get(this.props, 'orderId'),
  };

  componentWillReceiveProps(nextProps) {
    this.setState({
      result: nextProps.result,
      orderId: nextProps.orderId,
    });
  }

  render() {
    if (_.includes([STATUS_PAID, STATUS_CANCELED], this.state.status)) {
      Reaction.Router.go("/");
    }

    if (!this.state.payment) {
      return (
        <p>Loading</p>
      );
    }

    return (
      <pre>
        <code>
          {JSON.stringify(this.state.payment, null, 2)}
        </code>
      </pre>
    );
  }
}

const composer = (props, onData) => {
  Meteor.subscribe("mollie/payments/status", Reaction.Router.getQueryParam('cartId'), function (error, result) {
    onData(error, { result, orderId });
  });
};

export default composeWithTracker(composer)(MollieReturnContainer);
