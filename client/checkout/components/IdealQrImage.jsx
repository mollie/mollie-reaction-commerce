import React, { Component } from "react";
import PropTypes from "prop-types";

export default class IdealQrImage extends Component {
  static propTypes = {
    imageUrl: PropTypes.string,
    width: PropTypes.string,
    height: PropTypes.string,
  };

  static defaultProps = {
    width: "400px",
    height: "400px",
  };

  render() {
    const { imageUrl, width, height } = this.props;

    if (!imageUrl) {
      return null;
    }

    return (
      <img
        src={imageUrl}
        alt="iDEAL QR code"
        style={{
          width,
          height,
        }}
      />
    )
  }
}
