# civicrm-priceset-logic

This extension allows an administrator to set up complex pricing logic for contribution pages that include price-sets.

## JavaScript functions
There are a few connections to external javascript functions that are possible.

1. In the advanced option for a condition there is a box for true or false. A function placed in these boxes will be triggered when that condition is true or false respectively.
2. The custom JavaScript condition type: This is the name of a function that will be called when that case is being evaluated. This is especially useful as only one part of a multi-part condition as it will fire whenever the other fields change. Otherwise you must manually trigger evaluation of the case, and that sorta defeats the purpose.

**Note:** Javascript functions are called in one of three scopes. You should place your functions in one of these scopes. They are searched in this order and the first one found is executed.

1. CRM.PricingLogic.#function_name#
2. CRM.#function_name#
3. window.#function_name#





## Known Issues
- It currently only supports contribution pages, though I am working to add event registrations
- It does not currently support fields in the auto-included billing contact information block
- Custom fields in profiles are only partially supported
- The admin interface has some issues when fields no longer exist in the profile but do in the config.
