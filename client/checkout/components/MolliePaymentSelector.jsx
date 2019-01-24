import { Meteor } from "meteor/meteor";
import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";

import { Packages, Shops } from "/lib/collections";
import { Reaction } from "/client/api";

import IssuerListModal from "./IssuerListModal";
import { getPaymentIcon, getSupportedMethods } from "../../../misc";
import { ISSUER_LIST_MODAL, ISSUER_LIST_PAGE, NAME } from "../../../misc/consts";

let packageData;

class MolliePaymentSelector extends Component {
  state = {
    methods: _.get(this.props, "methods", []),
    issuerListVisible: false,
  };

  static propTypes = {
    methods: PropTypes.array,
  };

  componentWillReceiveProps(nextProps) {
    if (Array.isArray(nextProps.methods)) {
      this.setState({
        methods: nextProps.methods,
      });
    }
  }

  static initPayment(method, issuer = null) {
    Meteor.call("mollie/payment/create", method, issuer, (error, result) => {
      if (error || typeof result !== "string") {
        // When an error occurs the message will be embedded in the payment methods box on the checkout page
        Alerts.inline("An error occurred while initializing the payment. Please contact our customer service.", "error", {
          placement: "paymentMethod",
          i18nKey: "mollie.payment.paymentInitError",
          autoHide: 10000,
        });
      } else {
        // Redirect to the payment screen
        window.location.href = result;
      }
    });
  }

  handleClick = (method) => {
    if (!packageData) {
      Meteor.wrapAsync(Meteor.subscribe("Packages"));
      packageData = Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      });
    }

    if (method._id === "ideal") {
      const issuerList = _.get(packageData, `settings.public.issuerList`);
      switch (issuerList) {
        case ISSUER_LIST_MODAL:
          return this.setState({ issuerListVisible: true});
        case ISSUER_LIST_PAGE:
          return Reaction.Router.go("/mollie/ideal", {}, {});
        default:
          this.constructor.initPayment(method._id);
      }
    } else {
      this.constructor.initPayment(method._id);
    }
  };

  render() {
    const { issuerListVisible } = this.state;

    if (!packageData) {
      Meteor.wrapAsync(Meteor.subscribe("Packages"));
      packageData = Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      });
    }

    // Check method availability against the configuration and currency
    const availableMethods = _.filter(
      this.state.methods,
      (item) => item.enabled && _.includes(getSupportedMethods(Shops.findOne({ _id: Reaction.getShopId() }).currency), item._id)
    );
    if (_.isEmpty(availableMethods)) {
      return null;
    }

    return (
      <div>
        <IssuerListModal
          isOpen={issuerListVisible}
          qrCode={_.get(packageData, `settings.public.idealQr`, false)}
          onCancel={() => this.setState({ issuerListVisible: false })}
        />
        {availableMethods.map((method) => (
          <a
            className="rui btn btn-lg btn-default btn-block"
            style={{ display: "block", height: "60px" }}
            key={method.name}
            onClick={() => this.handleClick(method)}
          >
            <div style={{ textAlign: "left", marginRight: "20px", overflow: "hidden", textOverflow: "ellipsis" }}>
              <img src={getPaymentIcon(method._id)} style={{ display: "inline", height: "40px", width: "40px" }}/>
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
