import Meteor from "meteor/meteor";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { Random } from "meteor/random";

import { Packages } from "/lib/collections";
import { Button } from "/imports/plugins/core/ui/client/components";
import IssuerList from "../containers/IssuerListContainer";
import { Reaction } from "/client/api";
import { NAME } from "../../../misc/consts";

class IssuerListModal extends Component {
  static propTypes = {
    isDisabled: PropTypes.bool,
    isOpen: PropTypes.bool,
    banks: PropTypes.arrayOf(PropTypes.object),
    onCancel: PropTypes.func,
    onFormSubmit: PropTypes.func,
    qrCode: PropTypes.bool,
    uniqueId: PropTypes.string,
  };

  static defaultProps = {
    isDisabled: false,
    isOpen: false,
    banks: [],
    onCancel: () => {},
    onFormSubmit: () => {},
    qrCode: false,
    uniqueId: Random.id(),
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
      Meteor.wrapAsync(Meteor.subscribe("Packages", Reaction.getShopId()));
      const packageData = Packages.findOne({
        name: NAME,
        shopId: Reaction.getShopId(),
      });
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

  handleCancel = (event) => {
    if (this.props.onCancel) {
      this.props.onCancel(event);
    }
  };

  render() {
    const { isDisabled, isOpen, uniqueId, qrCode } = this.props;
    const { submit, width, name } = this.state;

    return (
      <div>
        {isOpen === true &&
        <div>
          <div className="modal-backdrop fade in" id={`modal-backdrop-${uniqueId}`}/>
          <div className="modal fade in" id={`modal-${uniqueId}`} style={{ display: "block" }}>
            <div className="modal-dialog" style={{ maxWidth: "430px", margin: "10px auto" }}>
              <form className="modal-content" onSubmit={this.handleSubmit}>
                <div className="modal-header">
                  <h4 className="modal-title">{name}</h4>
                </div>

                <div className="modal-body" style={{ backgroundColor: "#fff" }}>
                  <IssuerList
                    submit={submit}
                    qrCode={qrCode && width >= 768}
                  />
                </div>

                <div className="modal-footer">
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

              </form>
            </div>
          </div>
        </div>}
      </div>
    );
  }
}

export default IssuerListModal;
