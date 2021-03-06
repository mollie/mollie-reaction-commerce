import { Mongo } from "meteor/mongo";

import { MollieQrCodesSchema } from "./schemas";

export const MollieQrCodes = new Mongo.Collection("MollieQrCodes");
MollieQrCodes.attachSchema(MollieQrCodesSchema);

if (Meteor.isServer) {
  // Make sure that MongoDB automatically removes expired QR codes
  Meteor.startup(function() {
    const rawCollection = MollieQrCodes.rawCollection();
    const ensureIndex = Meteor.wrapAsync(rawCollection.ensureIndex, rawCollection);
    ensureIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  });
}
