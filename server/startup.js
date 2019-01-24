import Hooks from "@reactioncommerce/hooks";

Hooks.Events.add("onOrderShipmentShipped", (payload) => {
  console.log("Order shipped: " + JSON.stringify(payload));
});
