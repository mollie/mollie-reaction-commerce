import { Meteor } from "meteor/meteor";
import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";

import { getSupportedMethods } from "../../../misc/paymentmethods";
import { Shops } from "../../../../../../../lib/collections";
import { Reaction } from "../../../../../../../client/api";

class MolliePaymentSelector extends Component {
  state = {
    methods: _.get(this.props, 'methods', []),
  };

  static propTypes = {
    methods: PropTypes.any,
  };

  componentWillReceiveProps(nextProps) {
    if (Array.isArray(nextProps.methods)) {
      this.setState({
        methods: nextProps.methods,
      });
    }
  }

  static initPayment(method) {
    Meteor.call("mollie/payment/create", method, (error, result) => {
      if (error || typeof result !== "string") {
        Alerts.inline("An error occurred while initializing the payment. Please contact our customer service.", "error", {
          placement: "paymentMethod",
          i18nKey: "mollie.payment.paymentInitError",
          autoHide: 10000,
        });
      } else {
        window.location.href = result;
      }
    });
  }

  render() {
    const availableMethods = getSupportedMethods(Shops.findOne({ _id: Reaction.getShopId() }).currency);

    return (
      <div>
        {_.filter(this.state.methods, item => item.enabled && _.includes(availableMethods, item._id)).map((method) => (
          <a
            className="rui btn btn-lg btn-default btn-block"
            style={{ display: "block", height: "60px" }}
            key={method.name}
            onClick={() => this.constructor.initPayment(method._id)}
          >
            <div style={{ textAlign: "left", marginRight: "20px", overflow: "hidden", textOverflow: "ellipsis" }}>
              <img src={`https://www.mollie.com/images/payscreen/methods/${method._id}.png`} style={{ display: "inline" }}/>
              <strong style={{ display: "inline" }}>
                &nbsp;{method.name}
              </strong>
            </div>
            <i className="fa fa-chevron-right" style={{ float: "right", marginTop: "-30px" }}/>
          </a>
        ))}
      </div>
    );
  }
}

export default MolliePaymentSelector;
