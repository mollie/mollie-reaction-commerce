/* eslint camelcase: 0 */
import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: "Mollie",
  name: "mollie",
  icon: "fa fa-credit-card-alt",
  autoEnable: true,
  settings: {
    "apiKey": "",
  },
  registry: [
    // Settings panel
    {
      label: "Mollie",
      provides: ["paymentSettings"],
      container: "dashboard",
      template: "mollieSettings",
      hideForShopTypes: ["merchant", "affiliate"],
    },
    // Payment form for checkout
    {
      template: "molliePaymentForm",
      provides: ["paymentMethod"],
      icon: "fa fa-credit-card-alt",
    },
    {
      route:"/mollie/ideal",
      name:"mollieIdeal",
      template:"mollieIdeal",
      workflow:"coreWorkflow"
    }
  ],
});
