import { Reaction } from "/server/api";

const processWebhook = (req, res) => {
  Reaction.Endpoints.sendResponse(res, {
    data: {
      success: true,
    },
  });
};

Reaction.Endpoints.add("get", "/mollie/webhook", processWebhook);
Reaction.Endpoints.add("post", "/mollie/webhook", processWebhook);

Reaction.Endpoints.add("get", "/mollie/success", (req, res) => {
  Reaction.Endpoints.sendResponse(res, {
    data: {
      success: true,
    }
  })
});
