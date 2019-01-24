import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import _ from "lodash";

import { composeWithTracker } from "/imports/plugins/core/components/lib/composer";
import { Packages } from "/lib/collections";
import { Reaction, i18next } from "/client/api";

import MollieSettingsForm from "../components/MollieSettingsForm";
import { API_PAYMENTS, NAME } from "../../../misc/consts";

class MollieSettingsFormContainer extends Component {
  state = {
    apiKey: _.get(this.props, `packageData.settings.${NAME}.apiKey`, ""),
    api: _.get(this.props, `packageData.settings.public.api`, API_PAYMENTS),
    methods: _.get(this.props, `packageData.settings.public.methods`, []),
    shopLocale: _.get(this.props, `packageData.settings.${NAME}.shopLocale`, []),
    idealQr: _.get(this.props, `packageData.settings.public.idealQr`, []),
    issuerList: _.get(this.props, `packageData.settings.public.issuerList`, []),
    description: _.get(this.props, `packageData.settings.${NAME}.description`, "Cart %"),
  };

  static propTypes = {
    packageData: PropTypes.object,
  };
  
  componentWillReceiveProps(newProps) {
    const methods = _.get(newProps, `packageData.settings.public.methods`);
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
      case "api":
        return this.handleApiChange(value);
      case "methods":
        return this.handleMethodsChange(value);
      case "shopLocale":
        return this.handleShopLocaleChange(value);
      case "idealQr":
        return this.handleIdealQrChange(value);
      case "issuerList":
        return this.handleIssuerListchange(value);
      case "description":
        return this.handleDescriptionChange(value);
    }
  };

  handleApiKeyChange = ({ target: { value: apiKey }}) => {
    this.setState({ apiKey });
  };

  handleApiChange = (api) => {
    this.setState({ api });
  };

  handleMethodsChange = (methods) => {
    this.setState({ methods });
  };
  
  handleShopLocaleChange = (shopLocale) => {
    this.setState({ shopLocale });
  };
  
  handleIdealQrChange = (idealQr) => {
    this.setState({ idealQr });
  };

  handleIssuerListchange = (issuerList) => {
    this.setState({ issuerList });
  };
  
  handleDescriptionChange = ({ target: { value: description }}) => {
    this.setState({ description });
  };

  handleSubmit = () => {
    const { apiKey, api, methods, shopLocale, idealQr, issuerList, description } = _.cloneDeep(this.state);
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
        property: "api",
        value: api,
      },
      {
        property: "methods",
        value: methods,
      },
      {
        property: "shopLocale",
        value: shopLocale,
      },
      {
        property: "idealQr",
        value: idealQr,
      },
      {
        property: "issuerList",
        value: issuerList,
      },
      {
        property: "description",
        value: description,
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
    const { packageData } = this.props;

    return (
      <MollieSettingsForm
        onChange={this.handleChange}
        onSubmit={this.handleSubmit}
        initialSettings={_.pick(packageData.settings, ["apiKey", "methods"])}
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
      }),
    });
  }
};

export default composeWithTracker(composer)(MollieSettingsFormContainer);
