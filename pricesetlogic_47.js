/**
 *
 * These functions are used for managing the front
 * end changes to prices on civicrm version > 4.7
 *
 */
CRM.$(function ($) {

  /***************[  ]***************/
  CRM.PricingLogic.ChangePrice = function (value) {
    //console.log(value);
    let obj, newPrice, priceText, option, ele;
    let format$ = (amount) => {
      if (typeof formatMoney === "function") {
        return symbol + " " + formatMoney(amount, 2, window.separator, window.thousandMarker);
      }
      return CRM.formatMoney(amount);
    };

    switch (CRM.PricingLogic.AllPriceFields[value.field].html_type) {

      case 'select':
        //Do for Select Boxes
        obj = $("#price_" + value.field);

        //If we can't find the object in question we can't proceed.
        if(obj.length <= 0) {
          break;
        }

        let optObj = obj.find("option[value='" + value.option + "']");
        //Fetch the price data
        option = JSON.parse(obj.attr('price'));
        newPrice = parseFloat(value.price);

        //Fetch the list of additional price data
        let selectValues = obj.data("price-field-values");
        option[value.option] = newPrice + optionSep + optionSep;
        selectValues[value.option].amount = newPrice;

        //Display the Price for the Option
        let field_name = optObj.text();
        field_name = field_name.substring(0, field_name.indexOf('-')).trim();
        optObj.text(field_name + " - " + format$(newPrice));

        //Save the update price data
        obj.attr("price", JSON.stringify(option));

        //Trigger an update of te select2 display
        obj.change();
        //Update the total price display
        calculateSelectLineItemValue(obj[0]);
        break;

      case 'radio':
      case 'checkbox':
        //radio
        obj = $("input.crm-form-radio[name='price_" + value.field + "'][value='" + value.option + "']");
        //Checkbox
        if(obj.length < 1) {
          obj = $("#price_" + value.field + "_" + value.option);
        }

        //If we can't find the object in question we can't proceed.
        if(obj.length <= 0) {
          break;
        }

        option = JSON.parse(obj.attr('price'));
        ele = option[0];

        newPrice = parseFloat(value.price);
        obj.attr('price', '["' + ele + '", "' + newPrice + optionSep + optionSep + '"]');
        //set the data-amount
        obj.attr('data-amount', newPrice);

        priceText = format$(newPrice);

        if (obj.attr("type") == "radio") {

          let dataAmountValues = obj.data("price-field-values");
          dataAmountValues[value.option].amount = newPrice;

          //change the Label
          obj.next().find(".crm-price-amount-amount").text(priceText);
          calculateRadioLineItemValue(obj[0]);
        } else if (obj.attr("type") == "checkbox") {
          //change the Label
          let field_label = obj.next().find(".crm-price-amount-label").text();
          obj.next().html("<span class='crm-price-amount-label'>" + field_label  + "</span> - " + priceText);
          calculateCheckboxLineItemValue(obj[0]);
        }

        break;

      case 'text':

        //Do For Quantity Fields
        obj = $("#price_" + value.field);

        //If we can't find the object in question we can't proceed.
        if(obj.length <= 0) {
          break;
        }

        //Parse the price object
        option = JSON.parse(obj.attr('price'));
        ele = option[0];
        //set the new price.
        newPrice = parseFloat(value.price);
        obj.attr('price', '["' + ele + '", "' + newPrice.toFixed(2) + optionSep + optionSep + '"]');

        //Calculate the line total
        let qty = parseInt(obj.val()) || 0;
        let rawTotal = qty * newPrice;

        //set the line total
        obj.attr("line_raw_total", rawTotal);

        priceText = symbol + " " + format$(newPrice);
        $("#price_" + value.field).parent().find("span.price-field-amount").text(priceText);
        obj.keyup();
        break;
    }
  };

  /**
   * This function loops through a list of price fields and
   * sets their price.
   *
   * @param values
   * @constructor
   */
  CRM.PricingLogic.ChangePrices = function (values) {
    if ($.isArray(values)) {
      for(let i in values) {
        CRM.PricingLogic.ChangePrice(values[i]);
      }
    }
    display(calculateTotalFee());
  };

  /**
   * This function takes a list of pricefields and returns
   * their price to the default.
   *
   * @param fields
   */
  CRM.PricingLogic.setToDefaultPricing = function(fields) {
    for(let i in fields) {
      let opts = {};
      opts.field = fields[i].field;
      if(fields[i].hasOwnProperty("option")) {
        opts.option = fields[i].option;
        opts.price = CRM.PricingLogic.AllPriceFields[fields[i].field].values[fields[i].option].price;
      } else {
        opts.price = CRM.PricingLogic.AllPriceFields[fields[i].field].price;
      }
      CRM.PricingLogic.ChangePrice(opts);
    }
    display(calculateTotalFee());
  };


  /**
   * This function needs to be defined because the base functionality
   * expects to call it, but is not needed for CiviCRM version greater
   * than 4.7, so the function is empty.
   *
   * @param priceField
   */
  CRM.PricingLogic.resetPricing = function(priceField) {};

});
