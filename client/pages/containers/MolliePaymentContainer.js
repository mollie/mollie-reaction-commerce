import React, { Component } from "react";
import { Meteor } from "meteor/meteor";
import _ from "lodash";

import { composeWithTracker } from "../../../../../core/components/lib/composer";

class MolliePaymentContainer extends Component {
  state = {
    apiKey: _.get(this.props, 'apiKey'),
    payment: _.get(this.props, 'payment'),
    error: _.get(this.props, 'error'),
  };

  componentWillReceiveProps(nextProps) {
    this.setState({
      payment: nextProps.payment,
      error: nextProps.error,
      apiKey: nextProps.apiKey,
    });
  }

  render() {
    if (!this.state.payment) {
      return (
        <p>Loading</p>
      );
    } else {
      window.location.href = this.state.payment.links.paymentUrl;
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
  Meteor.call("mollie/test", function (error, result) {
    onData(error, { payment: result });
  });
};

export default composeWithTracker(composer)(MolliePaymentContainer);
