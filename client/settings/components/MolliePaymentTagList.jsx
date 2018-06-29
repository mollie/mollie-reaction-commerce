import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";

import { Components } from "/imports/plugins/core/components/lib";
import { Translation } from "/imports/plugins/core/ui/client/components";

import MolliePaymentTagItem from "./MolliePaymentTagItem";

Array.prototype.move = function(from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};

class MolliePaymentTagList extends Component {
  static propTypes = {
    editable: PropTypes.bool, // eslint-disable-line react/boolean-prop-naming
    methods: PropTypes.array,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    label: "",
    methods: [],
  };

  state = {
    methods: _.get(this.props, "methods", []),
  };

  componentWillReceiveProps({ methods }) {
    if (Array.isArray(methods)) {
      this.setState({
        methods,
      });
    }
  }

  get tags() {
    return this.state.methods;
  };

  handleMoveTag = (dragIndex, hoverIndex) => {
    const tag = this.tags[dragIndex];
    if (!tag) {
      return false;
    }

    const tags = _.cloneDeep(this.tags);
    tags.move(dragIndex, hoverIndex);
    this.props.onChange(tags);
  };

  handleChecked = (id, checked) => {
    const tags = _.cloneDeep(this.tags);
    const tag = _.find(tags, item => item._id == id);
    if (typeof tag !== "undefined") {
      tag.enabled = checked;
    }
    this.setState({
      methods: tags,
    }, () => {
      this.props.onChange(tags);
    });
  };

  handleTagSave = (event, tag) => {
    if (this.props.onUpdateTag) {
      this.props.onUpdateTag(tag._id, tag.name);
    }
  };

  generateTagsList(t) {
    const tags = _.cloneDeep(t);
    _.sortBy(tags, "_id");
    if (Array.isArray(tags)) {
      return tags.map((tag, index) => (
        <MolliePaymentTagItem
          tag={tag}
          index={index}
          key={index}
          suggestions={[]}
          data-id={tag._id}
          editable={true}
          isSelected={false}
          draggable={true}
          selectable={true}
          onMove={this.handleMoveTag}
          onChecked={this.handleChecked}
        />
      ));
    }
  }

  render() {
    if (_.isEmpty(this.tags)) {
      return (
        <div className="alert alert-info">
          <Translation defaultValue="No payment methods found. Make sure the API key is correct and that you have enabled at least one payment method." i18nKey="mollie.settings.noPaymentMethodsFound"/>
        </div>
      )
    }

    return (
      <Components.DragDropProvider>
        <div className="rui tags" style={{ display: "block" }}>
          <label><span>{this.props.label}</span></label>
          {this.generateTagsList(_.compact(this.state.methods))}
        </div>
      </Components.DragDropProvider>
    );
  }
}

export default MolliePaymentTagList;
