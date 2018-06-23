import React, { Component } from "react";
import PropTypes from "prop-types";
import { composeWithTracker } from "@reactioncommerce/reaction-components";
import { Meteor } from "meteor/meteor";
import { Packages } from "/lib/collections";
import { Reaction, i18next } from "/client/api";
import { MollieSettingsForm } from "../components";

class MollieSettingsFormContainer extends Component {
  state = {
    apiKey: "",
  };

  static propTypes = {
    packageData: PropTypes.object,
  };

  handleChange = (e) => {
    e.preventDefault();
    this.setState({ apiKey: e.target.value });
  };

  handleSubmit = (settings) => {
    const packageId = this.props.packageData._id;
    const { settingsKey } = this.props.packageData.registry[0];

    const fields = [{
      property: "apiKey",
      value: settings.apiKey
    }, {
      property: "support",
      value: settings.support
    }];

    this.saveUpdate(fields, packageId, settingsKey);
  };

  saveUpdate = (fields, id, settingsKey) => {
    Meteor.call("registry/update", id, settingsKey, fields, (err) => {
      if (err) {
        return Alerts.toast(i18next.t("admin.settings.saveFailed"), "error");
      }
      return Alerts.toast(i18next.t("admin.settings.saveSuccess"), "success");
    });
  };

  render() {
    return (
      <MollieSettingsForm
        onChange={this.handleChange}
        onSubmit={this.handleSubmit}
        settings={this.props.packageData.settings}
      />
    );
  }
}

const composer = (props, onData) => {
  const subscription = Meteor.subscribe("Packages", Reaction.getShopId());
  if (subscription.ready()) {
    const packageData = Packages.findOne({
      name: "mollie",
      shopId: Reaction.getShopId()
    });
    onData(null, { packageData });
  }
};

export default composeWithTracker(composer)(MollieSettingsFormContainer);
