import React, { Component } from "react";
import PropTypes from "prop-types";

import { Translation } from "/imports/plugins/core/ui/client/components";

import ButtonSelect from "./ButtonSelect";

export default class IssuerList extends Component {
  static propTypes = {
    banks: PropTypes.arrayOf(PropTypes.object),
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
            i18nKey: "mollie.payment.paymentInitError",
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
      <div>
        <strong>
          <Translation
            i18nKey="mollie.issuers.selectABank"
            style={{ marginBottom: "6px", display: "block" }}
          />
        </strong>
        {banks.length ?
        <ButtonSelect
          buttons={bankButtons}
          onChange={this.handleBankChange}
        /> : null}
        {qrCode ?
          <div>
            <div style={{ width: "100%", height: "24px", borderBottom: "1px solid black", textAlign: "center" }}>
            <span style={{ fontSize: "30px", backgroundColor: "#fff", padding: "0 10px" }}>
              <Translation i18nKey="mollie.issuers.or"/>
            </span>
            </div>
            <br />
            <strong><Translation i18nKey="mollie.issuers.scanTheQrCode"/></strong>
          </div> : null }
      </div>
    );
  }
}
