import React, { Component } from "react";
import PropTypes from "prop-types";
import { Components } from "../../../../../core/components/lib";

class Checkbox extends Component {
  // Create a semi-random ID
  //
  // IDs are required for form controls and their labels for ARIA compliance.
  // This will be the default ID for this component unless once is passed in through props.
  _id = `checkbox-${Math.floor(Math.random() * 100000)}`;

  get id() {
    return this.props.id || this._id;
  }

  handleChange = (event) => {
    if (this.props.onChange) {
      const isInputChecked = !this.props.checked;
      this.props.onChange(event, isInputChecked, this.props.name);
    }
  };

  renderLabel() {
    const { label, i18nKeyLabel } = this.props;
    if (label || i18nKeyLabel) {
      return (
        <Components.Translation
          defaultValue={this.props.label}
          i18nKey={this.props.i18nKeyLabel}
          style={{
            display: "inline-block",
            verticalAlign: "top",
            marginTop: "5px",
            marginLeft: "5px",
          }}
        />
      );
    }
    return null;
  }

  render() {
    return (
      <label htmlFor={this.id}>
        <input
          id={this.id}
          checked={this.props.checked}
          onChange={this.handleChange}
          className={this.props.className}
          ref="checkbox"
          type="checkbox"
          onBlur={this.props.onMouseOut}
          onMouseOut={this.props.onMouseOut}
        />
        {this.renderLabel()}
      </label>
    );
  }
}

Checkbox.defaultProps = {
  checked: false
};

Checkbox.propTypes = {
  checked: PropTypes.bool, // eslint-disable-line react/boolean-prop-naming
  className: PropTypes.string,
  i18nKeyLabel: PropTypes.string,
  id: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  onMouseOut: PropTypes.func
};

export default Checkbox;
