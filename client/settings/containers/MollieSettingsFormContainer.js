import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import _ from "lodash";

import { composeWithTracker } from "/imports/plugins/core/components/lib/composer";
import { Packages } from "/lib/collections";
import { Reaction, i18next } from "/client/api";

import MollieSettingsForm from "../components/MollieSettingsForm";
import { NAME } from "../../../misc/consts";

class MollieSettingsFormContainer extends Component {
  state = {
    apiKey: _.get(this.props, `packageData.settings.${NAME}.apiKey`, ""),
    methods: _.get(this.props, `packageData.settings.${NAME}.methods`, []),
  };

  static propTypes = {
    packageData: PropTypes.object,
  };
  
  componentWillReceiveProps(newProps) {
    const methods = _.get(newProps, `packageData.settings.${NAME}.methods`);
    if (!_.isEmpty(methods)) {
      this.setState({
        methods,
      });
    }
  }

  handleChange = (key, value) => {
    switch (key) {
      case "apiKey":
        return this.handleApiKeyChange(value);
      case "methods":
        return this.handleMethodsChange(value);
    }
  };

  handleApiKeyChange = (e) => {
    this.setState({ apiKey: e.target.value });
  };

  handleMethodsChange = (methods) => {
    this.setState({ methods });
  };

  handleSubmit = () => {
    const { apiKey, methods } = _.cloneDeep(this.state);
    const { _id: packageId } = _.get(this.props, "packageData", { _id: false });
    if (!packageId) {
      return Alerts.toast(i18next.t("admin.settings.saveFailed", { ns: "mollie" }), "error");
    }

    const fields = [
      {
        property: "apiKey",
        value: apiKey,
      },
      {
        property: "methods",
        value: methods,
      },
    ];

    this.saveUpdate(fields, packageId, NAME);
  };

  saveUpdate = (fields, id, settingsKey) => {
    Meteor.call("mollie/settings/save", id, settingsKey, fields, (err) => {
      if (err) {
        return Alerts.toast(i18next.t("admin.settings.saveFailed", { ns: "mollie" }), "error");
      }
      return Alerts.toast(i18next.t("admin.settings.saveSuccess", { ns: "mollie" }), "success");
    });
  };

  render() {
    return (
      <MollieSettingsForm
        onChange={this.handleChange}
        onSubmit={this.handleSubmit}
        initialSettings={_.pick(this.props.packageData.settings, ["apiKey", "methods"])}
        settings={this.state}
      />
    );
  }
}

const composer = (props, onData) => {
  const subscription = Meteor.subscribe("Packages", Reaction.getShopId(), () => {
    const packages = Packages.find({
      name: NAME,
      shopId: Reaction.getShopId(),
    }, {
      limit: 1,
    });
    packages
      .observe({
        changedAt(newDoc) {
          onData(null, { packageData: newDoc });
        }
      });
  });
  if (subscription.ready()) {
    onData(null, {
      packageData: Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      })
    });
  }
};

export default composeWithTracker(composer)(MollieSettingsFormContainer);
