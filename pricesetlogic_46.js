/**
 *
 * These functions are used for managing the front
 * end changes to prices on civicrm version <= 4.6
 *
 */
CRM.$(function ($) {

  /***************[  ]***************/
  CRM.PricingLogic.ChangePrice = function (value) {
    var obj;
    var addprice;
    switch (CRM.PricingLogic.AllPriceFields[value.field].html_type) {

      case 'select':
        //Do for Select Boxes
        obj = $("#price_" + value.field);
        var optObj = obj.find("option[value='" + value.option + "']");

        eval('var option = ' + obj.attr('price'));
        addprice = parseFloat(option[value.option].replace("|", ""))

        if (optObj.is(":selected")) {
          totalfee -= addprice;
        }

        addprice = parseFloat(value.price);

        var selectValues = obj.data("price-field-values");
        option[value.option] = addprice + "||";
        selectValues[value.option].amount = addprice;


        //Display the Price for the Option
        var field_name = optObj.text();
        field_name = field_name.substring(0, field_name.indexOf('-')).trim();
        optObj.text(field_name + " - " + symbol + addprice.toFixed(2));


        if (optObj.is(":selected")) {
          totalfee += addprice;
          price["price_" + value.field] = addprice;
        }

        obj.attr("price", JSON.stringify(option));
        break;


      case 'radio':
      case 'checkbox':
        //radio
        obj = $("input.crm-form-radio[name='price_" + value.field + "'][value='" + value.option + "']");
        //Checkbox
        if(obj.length < 1) {
          obj = $("#price_" + value.field + "_" + value.option);
        }
        eval('var option = ' + obj.attr('price'));
        ele = option[0];
        optionPart = option[1].split(optionSep);
        addprice = parseFloat(optionPart[0]);

        if (obj.is(':checked')) {
          totalfee -= addprice;
          price[ele] -= addprice;
        }

        addprice = parseFloat(value.price);
        obj.attr('price', '["' + ele + '", "' + addprice + '||"]');
        //set the data-amount
        obj.attr('data-amount', addprice);

        if (obj.attr("type") == "radio") {

          var dataAmountValues = obj.data("price-field-values");
          dataAmountValues[value.option].amount = addprice;

          //change the Label
          obj.next().find(".crm-price-amount-amount").text(symbol + " " + addprice.toFixed(2));
        } else if (obj.attr("type") == "checkbox") {

          //change the Label
          var field_label = obj.next().find(".crm-price-amount-label").text();
          obj.next().html("<span class='crm-price-amount-label'>" + field_label  + "</span> - " + symbol + " " + addprice.toFixed(2));
        }

        if (obj.is(':checked')) {
          totalfee += addprice;
          price[ele] += addprice;
        }
        break;

      case 'text':
        //Do For Quantity Fields
        obj = $("#price_" + value.field);

        eval('var option = ' + obj.attr('price'));
        var ele = option[0];
        if (!price[ele]) {
          price[ele] = 0;
        }
        totalfee = parseFloat(totalfee) - parseFloat(price[ele]);
        price[ele] = 0;

        addprice = parseFloat(value.price);
        obj.attr('price', '["' + ele + '", "' + addprice.toFixed(2) + '||"]');


        $("#price_" + value.field).parent().find("span.price-field-amount").text(symbol + " " + formatMoney(addprice, 2, seperator, thousandMarker));
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
      for(var i in values) {
        CRM.PricingLogic.ChangePrice(values[i]);
      }
    }
    display(totalfee);
  };

  /**
   * This function takes a list of pricefields and returns
   * their price to the default.
   *
   * @param fields
   */
  CRM.PricingLogic.setToDefaultPricing = function(fields) {
    for(var i in fields) {
      var opts = {};
      opts.field = fields[i].field;
      if(fields[i].hasOwnProperty("option")) {
        opts.option = fields[i].option;
        opts.price = CRM.PricingLogic.AllPriceFields[fields[i].field].values[fields[i].option].price;
      } else {
        opts.price = CRM.PricingLogic.AllPriceFields[fields[i].field].price;
      }
      CRM.PricingLogic.ChangePrice(opts);
    }
    display(totalfee);
  };


  /**
   * This functin will take a priceField definition and reset its
   * Default calculation behavior to reflect our custom price changes.
   *
   * @param priceField
   */
  CRM.PricingLogic.resetPricing = function(priceField) {
    var obj;

    switch( CRM.PricingLogic.AllPriceFields[priceField.field].html_type ) {

      case 'checkbox':
        obj = $("#price_" + priceField.field + "_" + priceField.option);
        //event driven calculation of element.
        obj.off("click");
        obj.click( function(){
          //Calculate Element Price
          eval( 'var option = ' + obj.attr('price') ) ;
          ele        = option[0];
          optionPart = option[1].split(optionSep);
          addprice   = parseFloat( optionPart[0] );

          if ( obj.prop('checked') )  {
            totalfee   += addprice;
            price[ele] += addprice;
          } else {
            totalfee   -= addprice;
            price[ele] -= addprice;
          }
          display( totalfee );
        });
        break;

      case 'radio':
        obj = $("#" + CRM.PricingLogic.FormId + " input[name='price_"+priceField.field+"'][value='" + priceField.option + "'");

        obj.off("click");
        //event driven calculation of element.
        obj.click( function(){
          eval( 'var option = ' + obj.attr('price') );
          ele        = option[0];
          optionPart = option[1].split(optionSep);
          addprice   = parseFloat( optionPart[0] );

          if ( ! price[ele] ) {
            price[ele] = 0;
          }

          totalfee   = parseFloat(totalfee) + addprice - parseFloat(price[ele]);
          price[ele] = addprice;

          display( totalfee );
        });
        break;
    }
  };

});