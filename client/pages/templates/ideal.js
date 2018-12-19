import { Template } from "meteor/templating";
import MollieIdeal from "../components/MollieIdeal";
import "./ideal.html";

Template.mollieIdeal.helpers({
  MollieIdeal() {
    return {
      component: MollieIdeal,
    };
  }
});
