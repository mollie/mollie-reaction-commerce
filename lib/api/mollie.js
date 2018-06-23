import { Meteor } from "meteor/meteor";
import { Packages } from "/lib/collections";

export const Mollie = {
  accountOptions() {
    const { settings } = Packages.findOne({
      name: "reaction-paymentmethod"
    });
    if (!settings.apiKey) {
      throw new Meteor.Error("invalid-credentials", "Invalid Credentials");
    }
    return settings.apiKey;
  },

  authorize(cardInfo, paymentInfo, callback) {
    Meteor.call("mollieSubmit", "authorize", cardInfo, paymentInfo, callback);
  }
};
