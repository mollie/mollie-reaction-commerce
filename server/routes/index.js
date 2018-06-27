import { Reaction, Logger } from "/server/api";
import Router from "/imports/plugins/core/router/lib/router";
import mollie from "../api/mollie";

const processWebhook = (req, res) => {
  Reaction.Endpoints.sendResponse(res, {
    data: {
      success: true,
    },
  });
};

const processPayment = (req, res) => {
  const method = Router.getQueryParam("method");
  const issuer = Router.getQueryParam("issuer");
  Logger.info([method, issuer]);
  Reaction.Endpoints.sendResponse(res, {
    data: {
      method,
      issuer,
    },
  });
};
Reaction.Endpoints.add("get", "/mollie/webhook", processWebhook);
Reaction.Endpoints.add("post", "/mollie/webhook", processWebhook);

Reaction.Endpoints.add("get", "/mollie/payment", processPayment);

Reaction.Endpoints.add("get", "/mollie/return", (req, res) => {
  Reaction.Endpoints.sendResponse(res, {
    data: {
      success: true,
    }
  })
});
