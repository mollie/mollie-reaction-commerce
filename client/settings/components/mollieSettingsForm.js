import React, { Component } from "react";
import PropTypes from "prop-types";
import { TextField, Translation } from "/imports/plugins/core/ui/client/components";
import _ from 'lodash';

class MollieSettingsForm extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    onSubmit: PropTypes.func,
    settings: PropTypes.object,
    initialSettings: PropTypes.object,
  };

  static defaultProps = {
    settings: {
      apiKey: "",
    },
  };

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.settings, nextProps.settings)) {
      this.forceUpdate();
    }
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.onSubmit(e);
  };

  render() {
    const { settings, initialSettings } = this.props;

    return (
      <div>
        { !initialSettings.apiKey &&
          <div className="alert alert-info">
            <Translation defaultValue="Enter your API Key to begin using this plugin" i18nKey="mollie.settings.enterYourApiKey"/>
          </div>
        }

        <form onSubmit={this.handleSubmit}>
          <TextField
            label="API Key"
            name="apiKey"
            type="text"
            onChange={this.props.onChange}
            value={settings.apiKey}
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
