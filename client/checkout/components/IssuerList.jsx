import React, { Component } from "react";
import PropTypes from "prop-types";

import { Translation } from "/imports/plugins/core/ui/client/components";

import BankSelect from "./BankSelect";

export default class IssuerList extends Component {
  static propTypes = {
    banks: PropTypes.arrayOf(PropTypes.object),
    selectedBank: PropTypes.string,
    qrCode: PropTypes.bool,
    submit: PropTypes.bool,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    submit: false,
    onChange: () => {},
  };

  state = {
    selectedBank: this.props.selectedBank,
  };

  componentDidUpdate() {
    if (this.props.submit) {
      const { selectedBank } = this.state;
      Meteor.call("mollie/payment/create", "ideal", selectedBank, Meteor.user().profile.lang, (error, result) => {
        if (error || typeof result !== "string") {
          // When an error occurs the message will be embedded in the payment methods box on the checkout page
          Alerts.alert("An error occurred while initializing the payment. Please contact our customer service.", "error", {
            placement: "paymentMethod",
            i18nKey: "reaction-payments.payment.paymentInitError",
            autoHide: 10000,
          });
        } else {
          // Redirect to the payment screen
          window.location.href = result;
        }
      });
    }
  }

  handleBankChange = (selectedBank) => {
    this.setState({
      selectedBank,
    });
  };

  render() {
    const { banks, qrCode } = this.props;
    const { selectedBank } = this.state;

    if (!banks || !selectedBank) {
      return null;
    }

    const bankButtons = banks.map((bank) => {
      return {
        id: bank.id,
        name: bank.name,
        active: bank.id === selectedBank,
        status: "success",
        bgColor: "bg-success",
        buttonType: "button",
      };
    });
    return (
      <div style={{ backgroundColor: "inherit" }}>
        <strong>
          <Translation
            i18nKey="checkout.issuers.selectABank"
            style={{ marginBottom: "12px", display: "block" }}
          />
        </strong>
        {banks.length ?
        <BankSelect
          buttons={bankButtons}
          onChange={this.handleBankChange}
        /> : null}
        {qrCode ?
          <div style={{ backgroundColor: "inherit" }}>
            <div
              style={{
                width: "100%",
                height: "24px",
                borderBottom: "1px solid black",
                textAlign: "center",
                backgroundColor: "inherit",
              }}
            >
            <span
              style={{
                fontSize: "30px",
                backgroundColor: "inherit",
                padding: "0 10px",
              }}>
              <Translation i18nKey="checkout.issuers.or"/>
            </span>
            </div>
            <br />
            <strong><Translation i18nKey="checkout.issuers.scanTheQrCode"/></strong>
            <img
              src="https://qr2.ideal.nl/ideal-qr/qr/get/b3ada671-6534-44de-a823-5df34c494ac0"
              alt="iDEAL QR code"
              style={{
                width: "400px",
                height: "400px",
              }}
            />
          </div> : null }
      </div>
    );
  }
}
