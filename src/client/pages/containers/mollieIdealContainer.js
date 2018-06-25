import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import { Reaction, i18next } from "/client/api";
import _ from "lodash";
import Mollie from 'mollie-api-node';

class MollieIdealContainer extends Component {
  state = {
    payment: null,
  };

  componentDidMount() {
    const mollie = new Mollie.API.Client;
    mollie.setApiKey("test_yxdNf3jE3sfcAEg9n4jv9uGcc28spc");
    mollie.payments.create({
      amount:      10.00,
      description: "My first API payment",
      redirectUrl: "https://localhost:3000/",
      webhookUrl:  "https://localhost:3000/mollie/webhook/"
    }, function (payment) {
      response.writeHead(302, { Location: payment.getPaymentUrl() })
    });
  }

  render() {
    if (!this.state.payment) {
      return (
        <p>Loading</p>
      );
    }

    return (
      <pre><code>{JSON.stringify(this.state.payment)}</code></pre>
    );
  }
}

export default MollieIdealContainer;
