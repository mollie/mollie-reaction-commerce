import React, { Component } from "react";
import PropTypes from "prop-types";
import { TextField, Translation } from "/imports/plugins/core/ui/client/components";

class MollieSettingsForm extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    onSubmit: PropTypes.func,
    settings: PropTypes.object,
  };

  static defaultProps = {
    settings: {
      apiKey: "",
    },
  };

  state = {
    settings: {
      apiKey: this.props.settings.apiKey,
    },
  };

  handleStateChange = (e) => {
    const { settings } = this.state;
    settings[e.target.name] = e.target.value;
    this.setState({ settings });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    return this.props.onSubmit(this.state.settings);
  };

  render() {
    const { settings } = this.props;
    const setting = this.state.settings;

    return (
      <div>
        { !settings.apiKey &&
          <div className="alert alert-info">
            <Translation defaultValue="Enter your API Key to begin using this plugin" i18nKey="mollie.settings.enterYourApiKey"/>
          </div>
        }

        <form onSubmit={this.handleSubmit}>
          <TextField
            label="API Key"
            name="apiKey"
            type="text"
            onChange={this.handleStateChange}
            value={setting.apiKey}
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
