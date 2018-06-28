import { Template } from "meteor/templating";
import MollieReturnContainer from "../containers/MollieReturnContainer";
import "./return.html";

Template.mollieReturn.helpers({
  MollieReturn() {
    return {
      component: MollieReturnContainer,
    };
  }
});
