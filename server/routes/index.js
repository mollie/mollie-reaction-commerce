import { Reaction, Logger } from "/server/api";
import { Cart } from "/lib/collections";

import mollie from "../api/mollie";

const processWebhook = (req, res) => {
  Reaction.Endpoints.sendResponse(res, {
    data: {
      success: true,
    },
  });
};

const processPayment = (req, res) => {
  const cart = Cart.findOne({
    sessionId: Reaction.sessionId,
    shopId: Reaction.getShopId(),
  });
  if (typeof cart === 'undefined') {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }

  const paymentInfo = {
    amount: cart.getTotal(),
    description: `Cart ${cart._id}`,
    redirectUrl: `${Meteor.absoluteUrl()}/mollie/return`,
    webhookUrl: `${Meteor.absoluteUrl()}/mollie/webhook`,
  };
  if (_.has(req.params, "method")) {
    paymentInfo.method = req.params.method;
  }
  if (_.has(req.params, "issuer")) {
    paymentInfo.issuer = req.params.issuer;
  }

  mollie.payments.create(paymentInfo)
    .then(payment => {
      res.statusCode = 302;
      res.setHeader('Location', payment.links.paymentUrl);
      res.end();
    })
    .catch(err => {
      Logger.error(err);
      Reaction.Endpoints.sendResponse(res, {error: err});
    })
  ;
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
