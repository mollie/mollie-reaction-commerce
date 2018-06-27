import _ from "lodash";

import { Reaction } from "/server/api";
import Mollie from "../../lib/api/src/mollie";
import { NAME } from "../../misc/consts";
import { Packages } from "/lib/collections";

let mollie; // The client we are going to export
let key;

// Find the Mollie package for this shop to retrieve the settings
const packages = Packages.find({
  name: NAME,
  shopId: Reaction.getShopId()
}, {
  limit: 1,
});

// Try to set the initial key
const { settings: { [NAME]: { apiKey }} } = _.head(packages.fetch());
try {
  key = apiKey;
  mollie = Mollie({ apiKey });
} catch (e) {
}

// Observe the package for key changes
packages
  .observe({
    changedAt(data) {
      const { settings: { [NAME]: { apiKey }} } = data;
      try {
        key = apiKey;
        mollie = Mollie({ apiKey });
      } catch (e) {
      }
    }
  });

export default mollie;
