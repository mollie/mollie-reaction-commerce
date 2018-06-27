import React, { Component } from "react";
import PropTypes from "prop-types";

class MolliePaymentSelector extends Component {
  state = {
    methods: [],
  };

  static propTypes = {
    methods: PropTypes.any,
  };

  componentWillReceiveProps(nextProps) {
    if (Array.isArray(nextProps.methods)) {
      this.setState({
        methods: nextProps.methods,
      });
    }
  }

  render() {
    return (
      <div>
        {_.filter(this.state.methods, item => item.enabled).map((method) => (
          <a className="rui btn btn-lg btn-default btn-block" style={{ display: "block", height: "60px" }} key={method.name}>
            <div style={{ textAlign: "left", marginRight: "20px", overflow: "hidden", textOverflow: "ellipsis" }}>
              <img src={`https://www.mollie.com/images/payscreen/methods/${method._id}.png`} style={{ display: "inline" }}/>
              <strong style={{ display: "inline" }}>
                &nbsp;{method.name}
              </strong>
            </div>
            <i className="fa fa-chevron-right" style={{ float: "right", marginTop: "-30px" }}/>
          </a>
        ))}
      </div>
    );
  }
}

export default MolliePaymentSelector;
