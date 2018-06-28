import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";

import { TextField, Translation } from "/imports/plugins/core/ui/client/components";

import MolliePaymentTagList from "./MolliePaymentTagList";

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
    },
    settings: {
      apiKey: "",
      methods: [],
    }
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

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.onSubmit(e);
  };

  render() {
    const { settings: { apiKey, methods } } = this.props;
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <TextField
            label="API Key"
            name="apiKey"
            type="text"
            onChange={this.onApiKeyChange}
            value={apiKey}
          />

          <MolliePaymentTagList
            label="Payment Methods"
            onChange={this.onMethodsChange}
            methods={methods}
          />

          <button className="btn btn-primary pull-right" type="submit">
            <Translation defaultValue="Save Changes" i18nKey="app.saveChanges"/>
          </button>
        </form>

      </div>
    );
  }
}

export default MollieSettingsForm;
