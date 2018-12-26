/**
 * Created by tobias on 11/3/14.
 */

CRM.$(function ($) {

  CRM.PricingLogic.TriggerRunning = false;


  /***************[  ]***************/
  CRM.PricingLogic.EvaluateCondition = function (caseData) {
    if (caseData.field == "javascript") {
      return CRM.PricingLogic.RunFunction(caseData.value);
    }

    if (caseData.field == "cividiscount") {
      return true;
    }

    var fieldVal,fieldType, optionValue;
    //This is a Price Field
    if ($.isNumeric(caseData.field)) {
      fieldType = "price";
      if ($("#price_" + caseData.field + "_" + caseData.option).length == 1) {
        //checkboxes
        fieldVal = $("#price_" + caseData.field + "_" + caseData.option).is(":checked");
      } else if ($("input.crm-form-radio[name='price_" + caseData.field + "']").length > 0) {
        //Radio Buttons
        fieldVal = $("input.crm-form-radio[name='price_" + caseData.field + "']:checked").val();
      } else {
        //Select boxes and text inputs
        fieldVal = $("#price_" + caseData.field).val();
      }

      //And these are profile fields
    } else {

      fieldType = "profile";

      //Custom data fields within profiles
      if (CRM.PricingLogic.ProfileFields[caseData.field].type == "custom") {

        //Switch based on the HTML type we have on file in the profile
        //field definitions provided by price-set-logic in the CRM.PricingLogic var
        switch (CRM.PricingLogic.ProfileFields[caseData.field].html_type) {

          //Select and Text Boxes
          case "select":
          case "autocomplete-select":
          case "text":
            fieldVal = $("#" + caseData.field).val();
            break;

          //Radio Buttons
          case "radio":
            fieldVal = $("input.crm-form-radio[name='custom_" + caseData.field + "']:checked").val();
            break;

          //Checkboxes
          case "checkbox":
            optionValue = CRM._.where(CRM.PricingLogic.ProfileFields[caseData.field].values, {"id": caseData.option[0]})[0].value;
            fieldVal = $("input[id='" + caseData.field + "_" + optionValue + "']").is(":checked");
            break;

          //Unknown html Type
          default:
            //Should this return false?
            if(window.console) {console.error("Unknown html_type: " + CRM.PricingLogic.ProfileFields[caseData.field].html_type); }
            return false;

        }

        //Core Fields
      } else {

        switch (CRM.PricingLogic.ProfileFields[caseData.field].html_type) {

          //Radio Buttons
          case "select":
          case "radio":
            if(CRM.$("[name='" + caseData.field + "']")[0].type == "radio") {
              fieldVal = $("input.crm-form-radio[name='" + caseData.field + "']:checked").val();
            } else {
              fieldVal = $("#" + caseData.field).val();
            }
            break;

          //Checkboxes
          case "CheckBox":
          case "checkbox":
            fieldVal = $("#" + caseData.field).is(":checked");
            break;

          //Select and Text Boxes
          case "autocomplete-select":
          case "text":
            fieldVal = $("#" + caseData.field).val();
            break;

          //todo: handle Dates

          default:
            if(window.console) {console.error("Unknown html_type: " + CRM.PricingLogic.ProfileFields[caseData.field].html_type); }
            fieldVal = $("#" + caseData.field).val();
            break;

        }
      }
    }

    //Actually do the evaluation
    switch( caseData.op ) {
      case '=':
        return (fieldVal == caseData.value);
      case '<':
        return (fieldVal < caseData.value);
      case '>':
        return (fieldVal > caseData.value);
      case '<>':
        return (fieldVal != caseData.value);
      case 'regex':
        if(fieldVal) {
          return (fieldVal.search(caseData.value) != -1);
        } else {
          return false;
        }
      case 'empty':
        return !(fieldVal);
      case 'not-empty':
        return !!(fieldVal);
      case 'checked':
        return !!fieldVal;
      case 'not-checked':
        return !(fieldVal);
      case 'selected':
        if(fieldType == "profile") {
          var optVal = CRM._.where(CRM.PricingLogic.ProfileFields[caseData.field].values, {"id": caseData.option[0]})[0].value;
          return (fieldVal == optVal);
        } else {
          return (fieldVal == caseData.option[0]);
        }
      case 'not-selected':
        if(fieldType == "profile") {
          var optVal = CRM._.where(CRM.PricingLogic.ProfileFields[caseData.field].values, {"id": caseData.option[0]})[0].value;
          return (fieldVal != optVal);
        } else {
          return (fieldVal != caseData.option[0]);
        }
      case 'in':
        if ($.isArray(caseData.option)) {
          return !($.inArray(fieldVal, caseData.option) === -1);
        } else {
          return (fieldVal == caseData.option);
        }
      case 'not-in':
        if ($.isArray(caseData.option)) {
          return ($.inArray(fieldVal, caseData.option) === -1);
        } else {
          return (fieldVal != caseData.option);
        }
      default:
        return false;
    }

  };

  /***************[  ]***************/
  CRM.PricingLogic.EvaluateCase = function (caseData) {
    var result, s;
    if(caseData.type == "union") {
      if (caseData.op == "and") {
        result = true;
        for(s in caseData.slot) {
          if (!result) {
            return result;
          }
          result = result && CRM.PricingLogic.EvaluateCase( caseData.slot[s] );
        }
        return result;
      } else if (caseData.op == "or") {
        result = false;
        for(s in caseData.slot) {
          if (result) {
            return result;
          }

          result = result || CRM.PricingLogic.EvaluateCase( caseData.slot[s] );
        }

        return result;
      } else {
        return false;
      }
    } else if (caseData.type == "condition") {
      return CRM.PricingLogic.EvaluateCondition(caseData);
    }

    return false;
  };


  /**
   * This function creates a unique value for use as an array key
   * that identifies a price field/option pair.
   *
   * @param priceField
   */
  CRM.PricingLogic.makePriceFieldList = function(priceFields) {
    var fieldList = {};
    for(var i in priceFields) {
      if(priceFields[i].hasOwnProperty("option")) {
        fieldList[priceFields[i].field + "_" + priceFields[i].option] = priceFields[i];
      } else {
        fieldList[priceFields[i].field] = priceFields[i];
      }
    }
    return fieldList;
  };


  /**
   * This function looks into the various namespaces and
   * runs the requested function
   *
   * @constructor
   */
  CRM.PricingLogic.RunFunction = function RunFunction(functionName) {

    if($.isFunction( CRM.PricingLogic[functionName] )) {
      return CRM.PricingLogic[functionName]();
    }

    if($.isFunction( CRM[functionName] )) {
      return CRM[functionName]();
    }

    if($.isFunction( window[functionName] )) {
      return window[functionName]();
    }

    return null;
  };


  /**
   * This function returns a function to be bound
   * to the change event of our trigger elements.
   *
   *
   * @param cases
   * @returns {Function}
   * @constructor
   */
  CRM.PricingLogic.TriggerEventWatcher = function(event) {
    if(!CRM.PricingLogic.TriggerRunning) {
      CRM.PricingLogic.TriggerRunning = true;
      CRM.PricingLogic.EvaluateCases();
      CRM.PricingLogic.TriggerRunning = false;
    }
  };


  /**
   *This is a function that can be called to trigger a
   * cascade re-evaluation of all case logic
   * It is useful because we have javascript cases that
   * can't trigger based directly on user input
   *
   * @param cases - a list of case indexes to evaluate empty for all
   */
  CRM.PricingLogic.EvaluateCases = function () {

    var cases = Object.keys(CRM.PricingLogic.Cases);

    var toDefault = {};
    var alreadySet = {};

    for (var i in cases) {
      if(CRM.PricingLogic.Cases.hasOwnProperty(cases[i])) {
        if (CRM.PricingLogic.EvaluateCase( CRM.PricingLogic.Cases[cases[i]] )) {
          //todo: Some sort of Optimization
          CRM.PricingLogic.ChangePrices( CRM.PricingLogic.Cases[cases[i]].values );
          if($.isFunction( window[CRM.PricingLogic.Cases[cases[i]].truefunction] )) {
            CRM.PricingLogic.RunFunction(CRM.PricingLogic.Cases[cases[i]].truefunction);
          }
          alreadySet = $.extend(alreadySet, CRM.PricingLogic.makePriceFieldList(CRM.PricingLogic.Cases[cases[i]].values));
          //console.log("Evaluates to true: ", CRM.PricingLogic.Cases[cases[i]] );
        } else {
          CRM.PricingLogic.RunFunction(CRM.PricingLogic.Cases[cases[i]].falsefunction);
          toDefault = $.extend(toDefault, CRM.PricingLogic.makePriceFieldList(CRM.PricingLogic.Cases[cases[i]].values));

          //console.log("Evaluates to false: ", CRM.PricingLogic.Cases[cases[i]] );
        }
      } else {
        //console.log("Cannot find case", cases[i]);
      }
    }

    for(i in toDefault) {
      if(alreadySet.hasOwnProperty(i)) {
        delete toDefault[i];
      }
    }

    CRM.PricingLogic.setToDefaultPricing(toDefault);
  };

  //reset the price calculation functions for all the price fields we may touch
  for(var i in CRM.PricingLogic.PriceFields) {
    CRM.PricingLogic.resetPricing(CRM.PricingLogic.PriceFields[i]);
  }


  //Now set up all of our triggers
  var sels = [];
  for(i in CRM.PricingLogic.TriggerFields) {

    if(i.substring(0, 5) === "price") {
      var pfid = i.substring(6);
      switch (CRM.PricingLogic.AllPriceFields[pfid].html_type) {
        case "checkbox":
          //checkboxes
          for (var o in CRM.PricingLogic.TriggerFields[i]) {
            sels.push("#" + i + "_" + CRM.PricingLogic.TriggerFields[i][o]);
          }

          break;
        case "radio":
          sels.push("input.crm-form-radio[name='" + i + "']");
          break;
        default:
          //Select boxes and text inputs
          sels.push("#" + i);
          break;
      }
    } else if (i == "cividiscount") {
      //Do we need to do anything here or just make sure NOT to break anything?
    } else {
      //Profile Fields


      //Switch based on the HTML type we have on file in the profile
      //field definitions provided by price-set-logic in the CRM.PricingLogic var
      switch (CRM.PricingLogic.ProfileFields[i].html_type) {

        //Radio Buttons
        case "radio":
          sels.push("input.crm-form-radio[name='" + i + "']");
          break;

        //Checkboxes
        case "checkbox":
          if (CRM.PricingLogic.ProfileFields[i].type == "custom") {
            for(var o in CRM.PricingLogic.TriggerFields[i]) {
              optionValue = CRM._.where(CRM.PricingLogic.ProfileFields[i].values, {"id": CRM.PricingLogic.TriggerFields[i][o]})[0].value;
              sels.push("input[id='" + i + "_" + optionValue + "']");
            }
          } else {
            sels.push("#" + i);
          }

          break;

        default:
          sels.push("#" + i);
          break;
      }

    }
  }

  sel = sels.join(",");
  $(sel).change(CRM.PricingLogic.TriggerEventWatcher);


  //Handle civiDiscount setup
  if(CRM.PricingLogic.hasOwnProperty("civiDiscount") && CRM.PricingLogic.civiDiscount.case !== false) {
    CRM.PricingLogic.Cases[CRM.PricingLogic.civiDiscount.case].values = CRM.PricingLogic.civiDiscount.values;
  }



  //Trigger a complete evaluation on page load So that we take into account
  //The data in boxes that doesn't change like name or country etc.
  CRM.PricingLogic.EvaluateCases();

});
