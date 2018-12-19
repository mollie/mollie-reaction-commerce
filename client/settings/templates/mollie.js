import { Template } from "meteor/templating";

import MollieSettingsFormContainer from "../containers/MollieSettingsFormContainer";
import "./mollie.html";

Template.mollieSettings.helpers({
  MollieSettings() {
    return {
      component: MollieSettingsFormContainer,
    };
  }
});
