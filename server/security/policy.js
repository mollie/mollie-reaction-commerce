import { BrowserPolicy } from "meteor/browser-policy-common";

// Content-Security-Policy header: allow images from mollie.com and ideal.nl to be displayed
BrowserPolicy.content.allowImageOrigin("*.mollie.com");
BrowserPolicy.content.allowImageOrigin("*.ideal.nl");
