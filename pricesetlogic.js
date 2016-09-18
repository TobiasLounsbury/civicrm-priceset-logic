/**
 * Created by tobias on 11/3/14.
 */

CRM.$(function ($) {

  /***************[  ]***************/
  CRM.PricingLogic.EvaluateCondition = function (caseData) {
    if (caseData.field == "javascript") {
      return CRM.PricingLogic.RunFunction(caseData.value);
    }

    var fieldVal;
    //This is a Price Field
    if ($.isNumeric(caseData.field)) {

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
      if (caseData.field.substring(0, 6) == "custom") {
        console.log("custom");
        //custom
        //todo: Handle custom fields
        //select
        //radio
        //text
        //checkbox
      } else {
        //todo: handle Dates
        //todo: This should be better tested for profiles that contain other kinds of core fields
        //This is enough for all address fields and that is as far as I've tested
        //so that this point move forward assuming we can just call val()
        fieldVal = $("#" + caseData.field).val();
      }
    }
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
        return (fieldVal == caseData.option[0]);
      case 'not-selected':
        return (fieldVal != caseData.option[0]);
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
  CRM.PricingLogic.CreateTriggerEventWatcher = function(cases) {
    return function() {
      CRM.PricingLogic.Trigger(cases);
    };
  };

  /**
   *This is a function that can be called to trigger a
   * cascade re-evaluation of all case logic
   * It is useful because we have javascript cases that
   * can't trigger based directly on user input
   *
   * @param cases - a list of case indexes to evaluate empty for all
   */
  CRM.PricingLogic.Trigger = function (cases) {
    if (typeof(cases) == 'undefined') {
      cases = Object.keys(CRM.PricingLogic.Cases);
    }

    if (!$.isArray(cases)) {
      cases = [cases];
    }

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
        } else {
          CRM.PricingLogic.RunFunction(CRM.PricingLogic.Cases[cases[i]].falsefunction);
          toDefault = $.extend(toDefault, CRM.PricingLogic.makePriceFieldList(CRM.PricingLogic.Cases[cases[i]].values));
        }
      } else {
        console.log("Cannot find case", cases[i]);
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
  for(i in CRM.PricingLogic.TriggerFields) {
    //console.log("#" + CRM.PricingLogic.FormId + " [name='"+i+"']");
    $("#" + CRM.PricingLogic.FormId + " [name='"+i+"']").change(
      CRM.PricingLogic.CreateTriggerEventWatcher(CRM.PricingLogic.TriggerFields[i])
    );
  }


  //Trigger a complete evaluation on page load So that we take into account
  //The data in boxes that doesn't change like name or country etc.
  CRM.PricingLogic.Trigger();

});
