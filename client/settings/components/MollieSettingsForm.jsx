import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import i18next from "i18next";

import { TextField, Translation, Select } from "/imports/plugins/core/ui/client/components";
import Checkbox from "./Checkbox";

import MolliePaymentTagList from "./MolliePaymentTagList";
import { ISSUER_LIST_MODAL, ISSUER_LIST_PAGE, ISSUER_LIST_MOLLIE } from "../../../misc/consts";

class MollieSettingsForm extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    onSubmit: PropTypes.func,
    initialSettings: PropTypes.object,
    settings: PropTypes.object,
  };

  static defaultProps = {
    onChange: () => {},
    onSubmit: () => {},
    initialSettings: {
      apiKey: "",
      methods: [],
      shopLocale: false,
      idealQr: false,
      issuerList: ISSUER_LIST_MODAL,
      description: "Cart %",
    },
    settings: {
      apiKey: "",
      methods: [],
      shopLocale: false,
      idealQr: false,
      issuerList: ISSUER_LIST_MODAL,
      description: "Cart %",
    },
  };

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.settings, nextProps.settings)) {
      this.forceUpdate();
    }
  }

  onApiKeyChange = (e) => {
    this.props.onChange("apiKey", e);
  };

  onMethodsChange = (methods) => {
    this.props.onChange("methods", methods);
  };

  onShopLocaleChange = (event) => {
    this.props.onChange("shopLocale", event);
  };

  onIssuerListchange = (event) => {
    this.props.onChange("issuerList", event);
  };

  onIdealQrChange = (event, checked) => {
    this.props.onChange("idealQr", checked);
  };

  onDescriptionChange = (e) => {
    this.props.onChange("description", e);
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.onSubmit(e);
  };

  render() {
    const { settings: { apiKey, methods, shopLocale, idealQr, issuerList, description, payments } } = this.props;

    const shopLocaleOptions = [
        { value: false, label: i18next.t("admin.paymentSettings.doNotSendLocale") },
        { value: true, label: i18next.t("admin.paymentSettings.sendLocale") },
    ];

    const issuerListOptions = [
      { value: ISSUER_LIST_MODAL, label: i18next.t("admin.paymentSettings.onClick") },
      { value: ISSUER_LIST_PAGE, label: i18next.t("admin.paymentSettings.ownPage") },
      { value: ISSUER_LIST_MOLLIE, label: i18next.t("admin.paymentSettings.paymentScreen") },
    ];

    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <TextField
            label="API Key"
            i18nKeyLabel="settings.apiKey"
            name="apiKey"
            type="text"
            onChange={this.onApiKeyChange}
            value={apiKey}
          />

          <MolliePaymentTagList
            data-i18n="settings.paymentMethods"
            label={i18next.t("admin.paymentSettings.paymentMethods")}
            onChange={this.onMethodsChange}
            methods={methods}
          />

          <div className="rui form-group">
            <Checkbox
              className="checkbox-switch"
              label="Enable iDEAL QR codes"
              i18nKeyLabel="admin.paymentSettings.enableIdealQr"
              checked={idealQr}
              onChange={this.onIdealQrChange}
            />
          </div>

          <div className="rui multiselect form-group">
            <label>
              <Translation i18nKey="admin.paymentSettings.shopLocalePaymentScreen"/>
            </label>
            <Select
              searchable={false}
              onChange={this.onShopLocaleChange}
              value={shopLocale}
              options={shopLocaleOptions}
            />
          </div>

          <div className="rui multiselect form-group">
            <label>
              <Translation i18nKey="admin.paymentSettings.issuerList"/>
            </label>
            <Select
              searchable={false}
              onChange={this.onIssuerListchange}
              value={issuerList}
              options={issuerListOptions}
            />
          </div>

          <TextField
            label="Description"
            i18nKeyLabel="admin.paymentSettings.description"
            name="cartDescription"
            type="text"
            onChange={this.onDescriptionChange}
            value={description}
            helpText="Enter a description here. Note: Payment methods may have a character limit, best keep the description under 29 characters."
            i18nKeyHelpText="admin.paymentSettings.enterADescriptionHere"
          />

          <button className="btn btn-primary pull-right" type="submit">
            <Translation i18nKey="app.saveChanges"/>
          </button>
        </form>

      </div>
    );
  }
}

export default MollieSettingsForm;
