/* eslint camelcase: 0 */
import { Reaction } from "/server/api";
import { ISSUER_LIST_MODAL, API_PAYMENTS } from "./misc/consts";

Reaction.registerPackage({
  label: "Mollie",
  name: "mollie",
  icon: "fa fa-credit-card-alt",
  autoEnable: true,
  settings: {
    public: {
      methods: [],
      api: API_PAYMENTS,
      idealQr: false,
      issuerList: ISSUER_LIST_MODAL,
    },
    "mollie": {
      enabled: false,
      apiKey: "",
      support: [
        "Authorize",
        "Capture",
        "Refund",
      ],
      shopLocale: false,
      description: "Cart %",
    },
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
      route: "/mollie/return",
      template: "mollieReturn",
      workflow: "coreWorkflow",
    },
    {
      route: "/mollie/ideal",
      template: "mollieIdeal",
      workflow: "coreWorkflow",
    },
  ],
});
