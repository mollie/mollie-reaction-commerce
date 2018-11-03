import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import _ from "lodash";

import { Reaction } from "/client/api";
import { Button } from "@reactioncommerce/reaction-ui";
import { Packages } from "/lib/collections";

import IssuerList from "../../checkout/containers/IssuerListContainer";
import { NAME } from "../../../misc/consts";

let packageData;

export default class MollieIdeal extends Component {
  static propTypes = {
    isDisabled: PropTypes.bool,
  };

  static defaultProps = {
    isDisabled: false,
  };

  state = {
    name: "iDEAL",
    submit: false,
    width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
  };

  componentDidMount() {
    const self = this;
    // Keep an eye on the window width, too small and the QR code should be hidden
    window.addEventListener("resize", _.throttle(() => {
      self.setState({ width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth });
    }, 200));
    try {
      if (!packageData) {
        Meteor.wrapAsync(Meteor.subscribe("Packages", Reaction.getShopId()));
        packageData = Packages.findOne({
          name: NAME,
          shopId: Reaction.getShopId(),
        });
      }
      this.setState({
        name: _.get(_.find(_.get(packageData, `settings.${NAME}.methods`), item => item._id === "ideal"), "name", "iDEAL"),
      });
    } catch (e) {
    }
  }

  handleSubmit = () => {
    this.setState({
      submit: true,
    });
  };

  handleCancel = () => {
    Reaction.Router.go("/cart/checkout");
  };

  render() {
    const { isDisabled } = this.props;
    const { submit, width, name } = this.state;

    if (!packageData) {
      Meteor.wrapAsync(Meteor.subscribe("Packages", Reaction.getShopId()));
      packageData = Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      });
    }

    return (
      <div className="panel" style={{ maxWidth: "430px", margin: "10px auto" }}>
        <div className="panel-heading" style={{ padding: "10px 10px 0px 10px" }}>
          <img
            src="https://www.mollie.com/images/payscreen/methods/ideal.png"
            alt={name}
            style={{ width: "40px", height: "40px", display: "inline" }}
          />&nbsp;
          <h4 className="modal-title" style={{ display: "inline" }}>{name}</h4>
        </div>
        <div className="panel-body" style={{ backgroundColor: "inherit" }}>

          <div style={{ backgroundColor: "inherit" }}>
            <IssuerList
              submit={submit}
              qrCode={_.get(packageData, `settings.${NAME}.idealQr`, false) && width >= 768}
              onSubmit={this.handleSubmit}
              onCancel={this.handleCancel}
            />
          </div>

          <div style={{ margin: "10px -5px 0 -5px" }}>
            <div className="col-xs-6">
              <Button
                className="btn-block"
                status="default"
                bezelStyle="solid"
                i18nKeyLabel="app.cancel"
                label="Cancel"
                type="button"
                onClick={this.handleCancel}
                disabled={isDisabled}
              />
            </div>
            <div className="col-xs-6">
              <Button
                className="btn-block"
                status="success"
                bezelStyle="solid"
                i18nKeyLabel="app.continue"
                label="Continue"
                type="button"
                onClick={this.handleSubmit}
                disabled={isDisabled}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
