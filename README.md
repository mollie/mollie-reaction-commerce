<p align="center">
  <img src="https://info.mollie.com/hubfs/github/reaction/logo.png" width="128" height="128"/>
</p>
<h1 align="center">Mollie for Reaction Commerce</h1>

Download the [Mollie](https://www.mollie.com/) module for Reaction Commerce. Mollie is a payment service provider (PSP) which provides your online store with the most popular online payment methods. 

Receive payments from European customers with ease. Mollie provides payment methods at higly competitive rates. Only pay per transaction and no hidden fees.

Choose the best payment provider available for your online Reaction Commerce store. Create your merchant account at [Mollie.com](https://www.mollie.com/). 
Download and install the Mollie Reaction Commerce payment module and start receiving online payments now!

<!-- # Reaction Commerce payment service provider [Mollie](https://www.mollie.com/). #

Download the [Mollie](https://www.mollie.com/) module for Reaction Commerce. Mollie is a payment service provider (PSP) which provides your online store with the most popular online payment methods. 

Our Multi-currency system allows you to receive payments from customers worldwide with ease. Mollie provides payment methods at higly competitive rates. Only pay per transaction and no hidden fees.

Choose the best payment provider available for your online Reaction Commerce store. Create your new merchant account at [Mollie.com](https://www.mollie.com/). 
Download and install the Mollie Reaction Commerce payment module and start receiving online payments now! -->


## Made and maintained by [Snowy Cat Software](https://www.snowycatsoftware.com/). ##

## Compatible with Reaction Commerce 1.x ##

**Please note:** SSH access to your web server could be required for the installation of this module.
If you have no experience with this, then leave the installation of this module to your website developer or server administrator.

## Installation Reaction Commerce ##

* Install this module into the folder `/imports/plugins/custom/mollie-reaction` from the root directory:
  ```shell
  $ npm install --prefix ./imports/plugins/custom/mollie-reaction @mollie/reaction
  ```
* Go to the dashboard of your Reaction Commerce webshop
* Scroll to the Payments tab
* Enable Mollie
* Enter your API key and save the data
* After entering your API keys, you can configure your local payment methods.
If you don't see all your payment methods in the plugin, you might have to enable them on your Mollie dashboard.  

# Supported payment methods

### iDeal 

[iDEAL](https://www.mollie.com/en/payments/ideal) makes paying for your online purchases safe, secure and easy.
iDEAL is a Dutch payment system which links customers directly to their online banking program when making an online purchase.

[Mollie](https://www.mollie.com/) makes it easy to connect with iDEAL,  without the usual technical and administrative hassle.
Mollie gives you access to your transaction overviews and other statistics at any time. It is also possible to receive a notification by e-mail or SMS after every successful payment.

[Mollie](https://www.mollie.com/) is the perfect partner for recieving iDEAL payments and it is not surprising that [Mollie](https://www.mollie.com/) provides iDEAL payments 
for more than 40,000 websites.

### Credit card
[Credit card](https://www.mollie.com/en/payments/credit-card) is virtually the best-known method for receiving payments with global coverage. 

Because [Mollie](https://www.mollie.com/) supports the biggest credit card brands like Mastercard, VISA and American Express, your store will attract a lot more potential buyers.

### Bancontact
[Bancontact](https://www.mollie.com/en/payments/bancontact) uses a physical card that is linked to credit on a Belgian bank account. Payments via Bancontact / Mister Cash are guaranteed and strongly resemble the iDEAL payment system for the Netherlands.

Because payments are guaranteed, this payment method is a huge surplus for your online store.

### SOFORT Banking
[SOFORT Banking](https://www.mollie.com/en/payments/sofort) is one of the most popular payment methods in Germany and active in 9 European countries:

Germany, Belgium, the Netherlands, Italy, Austria, Poland, Switzerland, Spain and the United Kingdom.

Payments are direct, non-reversible and this payment method opens up a huge market potential for your online store.

### Bank transfers
[Bank transfers](https://www.mollie.com/en/payments/bank-transfer) received in the SEPA zone via [Mollie](https://www.mollie.com/). This allows you to receive payments from both individuals and business customers in more than 35 European countries.

### PayPal
[PayPal](https://www.mollie.com/en/payments/paypal) is a very popular payment method which is used worldwide. In a just few clicks, you can receive payments by bank transfer, credit card or PayPal balance.

### Bitcoin
[Bitcoin](https://www.mollie.com/en/payments/bitcoin) is a form of electronic money. The exchange rate is determined at the time of the transaction, so the amount and the payment are guaranteed.

### paysafecard
[paysafecard](https://www.mollie.com/en/payments/paysafecard) is the most popular prepaid card for online payments. With paysafecard you can receive prepaid payments from 43 countries.

### KBC/CBC-Betaalknop
The [KBC / CBC Payment Button](https://www.mollie.com/en/payments/kbc-cbc) is an online payment method for KBC and CBC customers, together the largest bank in Belgium. 

KBC focuses on Flanders and CBC on Wallonia.

### Belfius Pay Button
[Belfius](https://www.mollie.com/en/payments/belfius) is one of the largest banks in Belgium. By introducing the Belfius Pay Button, the bank provides its customers with their own payment solution.

### CartaSi
[CartaSi](https://www.mollie.com/en/payments/cartasi) is one of the most widely used payment methods in Italy. 

There are over 13 million CartaSi credit cards in circulation.

### Cartes Bancaires
[Cartes Bancaires](https://www.mollie.com/en/payments/cartes-bancaires) are the most used credit cards in France, with more than 64 million cards in circulation.

### Giropay

[Giropay](https://www.mollie.com/en/payments/giropay) is a popular bank transfer payment method in Germany. It uses more than 1,500 German banks, which makes it a trusted payment method under German customers.

### EPS
[EPS](https://www.mollie.com/en/payments/eps) holds the position of most popular bank transfer payment method in Austria. 

The cards are co-branded with Visa.

# Frequently Asked Questions #

**I have installed the module, but the module does not appear during checkout.**

* Check if the module is switched on and the correct API key is set. See the installation instructions.
* Check if the payment methods have been enabled.
* Check if the store currency is supported.

**Do I also need to set a return and / or webhook URL?**

There is no need to set a redirect URL or webhook. The module automatically does this with every order.

**The order status is not updated**

Mollie sends a message to your website when the status of the payment changes.
It is possible that Mollie could not reach your website or that your website could not process the status.

* Check your [Mollie management](https://www.mollie.com/beheer/) whether there are failed reports. <!-- [More information](https://www.mollie.com/nl/support/post/ik-krijg-een-e-mail-over-gefaalde-http-rapportages-wat-nu/)-->

# Would you like to help improve this module? #

Would you like to help make this module for Reaction Commerce even better? We are always open to [pull requests](https://github.com/mollie/mollie-reaction-commerce/pulls?utf8=%E2%9C%93&q=is%3Apr).

And how about working at a [technology driven organization](https://jobs.mollie.com/)? Mollie is always looking for developers and system engineers. [Check our vacancies](https://jobs.mollie.com/) or [contact us](mailto:info@mollie.com).

# License #
[BSD (Berkeley Software Distribution) License](http://www.opensource.org/licenses/bsd-license.php).
Copyright (c) 2013-2018, Mollie B.V.

# Support #

Do you have problems with the installation or do you think the module contains a bug? Send an email
to info@mollie.com with a accurate description of the problem.
