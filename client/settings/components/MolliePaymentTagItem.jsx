import React, { Component } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import Autosuggest from "react-autosuggest";
import Velocity from "velocity-animate";
import "velocity-animate/velocity.ui";
import _ from "lodash";

import { i18next } from "/client/api";
import { Button, Handle } from "/imports/plugins/core/ui/client/components";
import { SortableItem } from "/imports/plugins/core/ui/client/containers";
import { Router } from "/imports/plugins/core/router/lib";

class MolliePaymentTagItem extends Component {
  static propTypes = {
    blank: PropTypes.bool, // eslint-disable-line react/boolean-prop-naming
    connectDragSource: PropTypes.func,
    connectDropTarget: PropTypes.func,
    draggable: PropTypes.bool, // eslint-disable-line react/boolean-prop-naming
    editable: PropTypes.bool, // eslint-disable-line react/boolean-prop-naming
    i18nKeyInputPlaceholder: PropTypes.string,
    index: PropTypes.number,
    inputPlaceholder: PropTypes.string,
    isTagNav: PropTypes.bool,
    onClearSuggestions: PropTypes.func,
    onGetSuggestions: PropTypes.func,
    onTagInputBlur: PropTypes.func,
    onChecked: PropTypes.func,
    suggestions: PropTypes.arrayOf(PropTypes.object),
    tag: PropTypes.object,
  };

  static defaultProps = {
    blank: false,
    connectDragSource: () => {},
    connectDropTarget: () => {},
    draggable: false,
    editable: false,
    i18nKeyInputPlaceholder: "",
    index: 0,
    inputPlaceholder: "",
    isTagNav: false,
    onClearSuggestions: () => {},
    onGetSuggestions: () => {},
    onTagInputBlur: () => {},
    onChecked: () => {},
    suggestions: [],
    tag: {},
  };

  componentWillReceiveProps(nextProps) {
    if (this._updated && this._saved && this.refs.autoSuggestInput) {
      const { input } = this.refs.autoSuggestInput;

      Velocity.RunSequence([
        { e: input, p: { backgroundColor: "#e2f2e2" }, o: { duration: 200 } },
        { e: input, p: { backgroundColor: "#fff" }, o: { duration: 100 } }
      ]);

      this._updated = false;
    }

    if ((nextProps.tag.name !== this.props.tag.name)) {
      this._updated = true;
    }
  }

  get inputPlaceholder() {
    return i18next.t(this.props.i18nKeyInputPlaceholder || "tags.tagName", {
      defaultValue: this.props.inputPlaceholder || "Tag Name"
    });
  }

  static renderSuggestion(suggestion) {
    return (
      <span>{suggestion.label}</span>
    );
  }

  static getSuggestionValue(suggestion) {
    return suggestion.label;
  }

  /**
   * Handle tag inout blur events and pass them up the component chain
   * @param  {Event} event Event object
   * @return {void} no return value
   */
  handleTagInputBlur = (event) => {
    this.props.onTagInputBlur(event, this.props.tag);
  };

  handleInputChange = (event) => {
    this.props.onTagUpdate(this.props.tag._id, event);
  };

  handleCheckChange = ({ target: { checked }}) => {
    this.props.onChecked(this.props.tag._id, checked);
  };

  handleSuggestionsUpdateRequested = (suggestion) => {
    this.props.onGetSuggestions(suggestion);
  };

  handleSuggestionsClearRequested = () => {
    this.props.onClearSuggestions();
  };

  handleClick = (event) => {
    event.preventDefault();
    this.props.onTagClick(event, this.props.tag);
  };

  /**
   * Render a simple tag for display purposes only
   * @return {JSX} simple tag
   */
  renderTag() {
    const baseClassName = classnames({
      "rui": true,
      "tag": true,
      "link": true,
      "full-width": true,
    });

    const url = Router.pathFor("tag", {
      hash: {
        slug: this.props.tag.slug
      }
    });

    return (
      <a
        className={baseClassName}
        href={url}
        onFocus={this.handleTagMouseOver}
        onBlur={this.handleTagMouseOut}
        onMouseOut={this.handleTagMouseOut}
        onMouseOver={this.handleTagMouseOver}
        onClick={this.handleClick}
      >
        {this.props.tag.name}
      </a>
    );
  }

  /**
   * Render an admin editable tag
   * @return {JSX} editable tag
   */
  renderEditableTag() {
    const baseClassName = classnames({
      "rui": true,
      "tag": true,
      "edit": true,
      "draggable": this.props.draggable,
      "full-width": this.props.fullWidth
    });
    const {tag} = this.props;

    return (
      this.props.connectDropTarget(
        <div className="rui item edit draggable">
          <div
            className={baseClassName}
            data-id={tag._id}
            style={{marginLeft: 0, marginRight: 0}}
          >
            <Handle connectDragSource={this.props.connectDragSource} style={{ cursor: "move" }} />
            <div className="rui btn" style={{ padding: "4px 12px", cursor: "default" }}>
              <img
                src={`https://www.mollie.com/images/payscreen/methods/${tag._id}.png`}
                width="40"
                height="40"
                style={{ width: "20px", height: "20px" }}
              />
            </div>
            {this.renderAutosuggestInput()}
            <div className="rui btn flat" style={{ cursor: "default" }}>
              <div style={{ width: "36px", marginTop: "-16px" }}>
                <input
                  className="checkbox-switch"
                  type="checkbox"
                  checked={this.props.tag.enabled}
                  onChange={(e) => {
                    e.persist();
                    this.handleCheckChange(e);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )
    );
  }

  /**
   * Render a tag
   *
   * @return {JSX} blank tag for creating new tags
   */
  renderBlankEditableTag() {
    const baseClassName = classnames({
      "rui": true,
      "tag": true,
      "edit": true,
      "create": true,
      "full-width": this.props.fullWidth
    });

    return (
      <div className="rui item edit draggable">
        <div className={baseClassName}>
          <Button icon="tag" />
          {this.renderAutosuggestInput()}
          <Button icon="plus" />
        </div>
      </div>
    );
  }

  renderAutosuggestInput() {
    return (
      <Autosuggest
        getSuggestionValue={this.constructor.getSuggestionValue}
        inputProps={{
          placeholder: this.inputPlaceholder,
          value: this.props.tag.name,
          onKeyDown(event) {
            // 9 == Tab key
            // 13 == Enter Key
            if (event.keyCode === 9 || event.keyCode === 13) {
              // this.handleUpdate
              // options.onUpdateCallback && options.onUpdateCallback();
            }
          },
          onBlur: this.handleTagInputBlur,
          onChange: this.handleInputChange
        }}
        onSuggestionsClearRequested={this.handleSuggestionsClearRequested}
        onSuggestionsFetchRequested={this.handleSuggestionsUpdateRequested}
        ref="autoSuggestInput"
        renderSuggestion={this.constructor.renderSuggestion}
        suggestions={this.props.suggestions}
      />
    );
  }

  /**
   * Render component
   * @return {JSX} tag component
   */
  render() {
    if (this.props.blank) {
      return this.renderBlankEditableTag();
    } else if (this.props.editable) {
      return this.renderEditableTag();
    }

    return this.renderTag();
  }
}

export default SortableItem("tag")(MolliePaymentTagItem);
