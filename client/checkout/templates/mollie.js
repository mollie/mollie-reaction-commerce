import { Template } from "meteor/templating";

import MolliePaymentSelectorContainer from "../containers/MolliePaymentSelectorContainer";
import "./mollie.html";

Template.molliePaymentForm.helpers({
  MolliePayment() {
    return {
      component: MolliePaymentSelectorContainer,
    };
  }
});
