import { Template } from "meteor/templating";
import { MollieIdealContainer } from "../containers";
import "./ideal.html";

Template.mollieIdeal.helpers({
  MollieIdeal() {
    return {
      component: MollieIdealContainer
    };
  }
});
