import { Mongo } from "meteor/mongo";

import { MolliePaymentsSchema } from "./schemas";

export const MolliePayments = new Mongo.Collection("MolliePayments");
MolliePayments.attachSchema(MolliePaymentsSchema);
