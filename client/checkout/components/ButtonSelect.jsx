import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import { Button, Translation } from "/imports/plugins/core/ui/client/components";

class ButtonSelect extends Component {
  static propTypes = {
    buttons: PropTypes.array,
    currentButton: PropTypes.node,
    defaultButton: PropTypes.object,
    defaultNonActiveButtons: PropTypes.array,
    nonActiveButtons: PropTypes.array,
    onChange: PropTypes.func,
  };

  state = {
    toggle: "hidden",
    currentButton: {},
    buttons: [],
    activeButton: "",
    nonActiveButtons: [],
    defaultBgClassNames: "",
    toggleIcon: classnames({ "fa": true, "fa-chevron-down": true, "text-center": true, "fa-icon": true }),
    toggleClassNames: classnames({ "button-dropdown": true, "hidden": true }),
    onChange: () => {},
  };

  componentWillMount() {
    this.handleDefaultState();
  };

  handleDefaultState = () => {
    const { props } = this;
    const defaultButton = props.buttons.find((button) => button.active);
    const defaultBgClassNames = classnames({ "button-select": true, [defaultButton.bgColor]: true });

    const defaultNonActiveButtons = props.buttons.filter((button) => (button.active === false || button.active === undefined));
    const currentButton = (
      <Button
        eventAction={defaultButton.eventAction}
        status={defaultButton.status}
        bezelStyle="solid"
        label={defaultButton.name}
        type={defaultButton.buttonType}
        style={{
          textAlign: "left",
          borderRadius: 0,
        }}
        onClick={this.handleToggle}
      />
    );

    return this.setState({
      currentButton,
      defaultBgClassNames,
      buttons: props.buttons,
      nonActiveButtons: defaultNonActiveButtons
    });
  };

  filterButtons = () => {
    const { activeButton, buttons } = this.state;

    const nonActiveButtons = buttons.filter((button) => button.name !== activeButton);
    return this.setState({ nonActiveButtons });
  };

  handleToggle = () => {
    const { toggle } = this.state;
    let className;

    if (toggle === "hidden") {
      className = classnames({ "button-dropdown": true, "hidden": false });
      return this.setState({
        toggle: "show",
        toggleClassNames: className,
        toggleIcon: classnames({ "fa": true, "fa-chevron-up": true, "text-center": true, "fa-icon": true })
      });
    }

    className = classnames({ "button-dropdown": true, "hidden": true });
    return this.setState({
      toggle: "hidden",
      toggleClassNames: className,
      toggleIcon: classnames({ "fa": true, "fa-chevron-down": true, "text-center": true, "fa-icon": true }),
    });
  };

  handleButtonChange = (button) => {
    const currentButton = (
      <Button
        eventAction={button.eventAction}
        status={button.status}
        bezelStyle="solid"
        label={button.name}
        i18nKeyLabel={button.i18nKeyLabel}
        type={button.buttonType}
        style={{
          textAlign: "left",
          borderRadius: 0,
        }}
        onClick={this.handleToggle}
      />
    );

    this.props.onChange(button.id);

    this.handleToggle();

    return this.setState({
      currentButton,
      defaultBgClassNames: classnames({ "button-select": true, [button.bgColor]: true }),
      activeButton: button.name
    }, () => {
      this.filterButtons();
    });
  };

  render() {
    const { toggleClassNames, nonActiveButtons, defaultBgClassNames, toggleIcon, currentButton } = this.state;
    return (
      <div className={defaultBgClassNames}>
        <div className="button-group">
          {currentButton}
          <Button
            tagName="div"
            className={{
              "btn": false,
              "button-toggle": true,
            }}
            style={{
              borderRadius: 0,
            }}
            onClick={this.handleToggle}
          >
            <i className={toggleIcon} aria-hidden="true"/>
          </Button>
        </div>
        <div className={toggleClassNames}>
          {nonActiveButtons.map((button, key) => (
            <Button
              key={key}
              className="btn button-item"
              type="button"
              onClick={() => this.handleButtonChange(button)}
              style={{
                paddingTop: 0,
                borderRadius: 0,
                textAlign: "left",
              }}
            >
              <Translation defaultValue={button.name} i18nKey={button.i18nKeyLabel} />
            </Button>))}
        </div>
      </div>
    );
  }
}

export default ButtonSelect;
