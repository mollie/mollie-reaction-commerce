import { Template } from "meteor/templating";
import MolliePaymentContainer from "../containers/MolliePaymentContainer";
import "./ideal.html";

Template.mollieIdeal.helpers({
  MollieIdeal() {
    return {
      component: MolliePaymentContainer
    };
  }
});
