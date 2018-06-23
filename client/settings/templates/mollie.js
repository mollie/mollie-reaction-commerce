import { Template } from "meteor/templating";
import { MollieSettingsFormContainer } from "../containers";
import "./mollie.html";

Template.mollieSettings.helpers({
  MollieSettings() {
    return {
      component: MollieSettingsFormContainer
    };
  }
});
