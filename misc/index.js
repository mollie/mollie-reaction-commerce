import _ from "lodash";
import { CartaSiIcon, CartesBancairesIcon } from "./images";

export const supportedCurrencies = {
  banktransfer: ["eur"],
  belfius: ["eur"],
  bitcoin: ["eur"],
  creditcard: ["aud", "bgn", "cad", "chf", "czk", "dkk", "eur", "gbp", "hkd", "hrk", "huf", "ils", "isk", "jpy", "pln", "ron", "sek", "usd"],
  cartesbancaires: ["eur"],
  cartasi: ["eur"],
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


// en_US nl_NL nl_BE fr_FR fr_BE de_DE de_AT de_CH es_ES ca_ES pt_PT it_IT nb_NO sv_SE fi_FI da_DK is_IS hu_HU pl_PL lv_LV lt_LT
export const mollieLocales = {
  "nl": ["nl_NL", "nl_BE"],
  "en": ["en_US"],
  "fr": ["fr_FR", "fr_BE"],
  "de": ["de_DE", "de_AT", "de_CH"],
  "es": ["es_ES", "ca_ES"],
  "pt": ["pt_PT"],
  "it": ["it_IT"],
  "no": ["nb_NO"],
  "sv": ["sv_SE"],
  "fi": ["fi_FI"],
  "da": ["da_DK"],
  "is": ["is_IS"],
  "hu": ["hu_HU"],
  "pl": ["pl_PL"],
  "lv": ["lv_LV"],
  "lt": ["lt_LT"],
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

export const getMollieLocale = (langIso) => {
  return _.get(mollieLocales, `${langIso}[0]`, "en_US");
};

export const getPaymentIcon = (method) => {
  let imageSrc;
  switch (method) {
    case "cartasi":
      imageSrc = CartaSiIcon;
      break;
    case "cartesbancaires":
      imageSrc = CartesBancairesIcon;
      break;
    default:
      imageSrc = imageSrc = `https://www.mollie.com/images/payscreen/methods/${method}.png`;
      break;
  }

  return imageSrc;
};
