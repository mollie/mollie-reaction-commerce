import _ from "lodash";

export const supportedCurrencies = {
  banktransfer: ["eur"],
  belfius: ["eur"],
  bitcoin: ["eur"],
  creditcard: ["aud", "bgn", "cad", "chf", "czk", "dkk", "eur", "gbp", "hkd", "hrk", "huf", "ils", "isk", "jpy", "pln", "ron", "sek", "usd"],
  directdebit: ["eur"],
  eps: ["eur"],
  giftcard: ["eur"],
  giropay: ["eur"],
  ideal: ["eur"],
  inghomepay: ["eur"],
  kbc: ["eur"],
  bancontact: ["eur"],
  paypal: ["aud", "brl", "cad", "chf", "czk", "dkk", "eur", "gbp", "hkd", "huf", "ils", "jpy", "mxn", "myr", "nok", "nzd", "php", "pln", "rub", "sek", "sgd", "thb", "twd", "usd"],
  paysafecard: ["eur"],
  sofort: ["eur"],
};

export const getSupportedMethods = (currency) => {
  const methods = [];
  _.forEach(supportedCurrencies, (currencies, method) => {
    if (_.includes(currencies, currency.toLowerCase())) {
      methods.push(method);
    }
  });

  return methods;
};

export default supportedCurrencies;
