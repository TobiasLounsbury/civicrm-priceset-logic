CRM.$(function($) {

  //Make sure this objec texists before we start working with it.
  CRM.PricingLogic = CRM.PricingLogic || {};

  /**
   * Rebuild The field assignment names so as to preserve order
   *
   * @param caseObj
   */
  CRM.PricingLogic.refreshAssignmentList = function refreshAssignmentList(caseObj) {
    let baseName = caseObj.attr("name");
    caseObj.children(".FieldsList").children(".ValueAssignment").each(function(i) {
      $(this).attr("name", baseName + "[values][" + i +"]");
      $(this).find(".PriceFieldSelect").attr("name", baseName + "[values][" + i +"][field]");
      $(this).find(".PriceFieldOptionSelect").attr("name", baseName + "[values][" + i +"][option]");
      $(this).find(".ValueField").attr("name", baseName + "[values][" + i +"][price]");
    });
  }

  /**
   * Rebuild the name attributes for each case so that is preserves
   * order of execution
   *
   * @param caseObj
   */
  CRM.PricingLogic.rebuildCaseNames = function rebuildCaseNames(caseObj) {
    let baseName = caseObj.attr("name");
    caseObj.children(".CaseType").attr("name", baseName + "[type]");
    caseObj.children(".AdvancedList").find(".TrueFunction").attr("name", baseName + "[truefunction]");
    caseObj.children(".AdvancedList").find(".FalseFunction").attr("name", baseName + "[falsefunction]");

    if(caseObj.hasClass("UnionCase")) {
      caseObj.children(".UnionType").attr("name", baseName + "[op]");
      //Handle "renaming" child cases
      caseObj.children(".ChildCases").children(".Case").each(function(index, child) {
        CRM.PricingLogic.rebuildCaseNames($(child).attr("name", baseName + "[slot][" + index + "]"));
      });
    }

    if(caseObj.hasClass("FieldCase")) {
      caseObj.find(".caseFields").attr("name", baseName + "[field]");
      caseObj.find("select.FieldCaseOption").attr("name", baseName + "[option][]");
      caseObj.find(".op").attr("name", baseName + "[op]");
      caseObj.find(".FieldCaseValue").attr("name", baseName + "[value]");
    }
  }

  /**
   * Rebuilds the names for the sub-cases inside a union
   * to preserve order
   */
  CRM.PricingLogic.rebuildNames = function rebuildNames() {
    $("#Cases .Slot").removeClass("empty");
    $("#Cases .Slot:empty").addClass("empty");

    $("#Cases > .Case").each(function(i) {
      $(this).attr("name", "cases[" + i + "]");
      CRM.PricingLogic.rebuildCaseNames( $(this) );
      CRM.PricingLogic.refreshAssignmentList( $(this) );
    });
  }

  /**
   * Wrappper to refresh the sortable lists after adding items
   */
  CRM.PricingLogic.refreshSortables = function refreshSortables() {
    $("#Cases, #Cases .Slot").sortable('refresh');
    $("#Cases .FieldsList").sortable('refresh');
  }


  CRM.PricingLogic.handleSubSectionVisibility = function handleSubSectionVisibility() {
    $("#Cases > .Case > .FieldsList, #Cases > .Case > .AdvancedList").slideDown();
    $("#Cases > .Case .Case .FieldsList, #Cases > .Case .Case .AdvancedList").slideUp();
    $("#Cases > .Case.pseudotype .FieldsList, #Cases > .Case.pseudotype .AdvancedList").slideUp();
  }


  /**
   * Makes a case sortable
   *
   * This is done as a function because if you make the templates
   * sortable first and then do the deep clone it doesn't properly
   * clone the sortable widgets and fails silently.
   *
   * @param selector
   */
  CRM.PricingLogic.makeCaseSortable = function makeCaseSortable(selector) {
    //Make the Cases sortable
    $(selector).sortable({
      handle: ".CaseGrabHandle",
      items: "> div.Case",
      connectWith: "#Cases, .Slot",
      revert: true,
      helper: 'clone',
      opacity: 0.7,
      placeholder: "custom-value-highlight",
      start: function (e, ui) { ui.item.show(); },
      receive: function( event, ui ) {
        if($(event.target).attr("id") != "Cases") {
          $(event.target).closest(".Case").find(".FieldsList").append(ui.item.find(".ValueAssignment"));
          ui.item.find(".ValueAssignment").remove();
        }
        CRM.PricingLogic.handleSubSectionVisibility();
      },
      stop: function( event, ui ) {
        //Refresh the names
        CRM.PricingLogic.rebuildNames();
      }
    });

    //Make the Values Sortable
    $(selector).find(".FieldsList").sortable({
      handle: ".ValueGrabHandle",
      placeholder: "custom-value-highlight",
      forcePlaceholderSize: true,
      items: "> div.ValueAssignment",
      connectWith: "#Cases .FieldsList",
      revert: true,
      receive: function( event, ui ) {
        CRM.PricingLogic.refreshAssignmentList( $(event.target) );
      }
    });
  }


  /**
   * Used to build a case interface element from saved data
   *
   * @param caseData
   * @returns {*}
   */
  CRM.PricingLogic.buildCaseFromData = function buildCaseFromData(caseData) {
    let obj;
    if (caseData.type == "union") {
      obj = $("#Templates .UnionCase").clone(true);
      //Set the UnionType
      obj.find(".UnionType").val(caseData.op);

      //recursively load Child Cases
      if(caseData.hasOwnProperty("slot")) {
        for(s in caseData.slot) {
          obj.children(".ChildCases").append(CRM.PricingLogic.buildCaseFromData(caseData.slot[s]));
        }
      }

    } else if (caseData.type == "condition") {
      obj = $("#Templates .FieldCase").clone(true);

      //Load the data into their respective fields
      //TODO: Set the Data in the Fields

      //Set the field the condition hinges on
      obj.find(".caseFields").val(caseData.field);

      if (caseData.field == 'javascript') {
        obj.find(".FieldCaseValue").addClass("javascript");
      } else if (caseData.field == 'cividiscount') {
        obj.addClass("pseudotype");
        obj.find(".FieldCaseValue").hide();
      } else {

        let field;

        //Handle Missing Locations.
        if (caseData.field.substr(-1) === "-") {
          caseData.field = caseData.field + "Primary";
        }

        if ( $.isNumeric( caseData.field ) ) {
          field = CRM.PricingLogic.PriceFields[caseData.field];
        } else {
          field = CRM.PricingLogic.ProfileFields[caseData.field];
        }


        let optsObj = obj.find("select.FieldCaseOption");

        if (caseData.op == "in" || caseData.op == "not-in") {
          optsObj.prop("multiple", "multiple");
        }


        //Set the options (if any)
        let newOpts = CRM.PricingLogic.getValueOptions(field);
        if (newOpts) {
          //TODO: fix: .FieldCaseOption
          optsObj.append(newOpts);
          optsObj.val( caseData.option );
          optsObj.select2();
          obj.find("div.FieldCaseOption").css("display", "inline-block");
        }

        //Populate and Set the operation type
        let op = obj.find(".op").show();
        let n = CRM.PricingLogic.getOpOptions(field, op);
        op.addClass(n.class).append(n.options);
        op.val( caseData.op );
        if (n.class == 'quantity') {
          obj.find(".FieldCaseValue").css("width", "100");
        } else if (caseData.op == 'regex') {
          obj.find(".FieldCaseValue").addClass("regex");
        } else {
          obj.find(".FieldCaseValue").hide();
        }

        if(field.html_type == 'checkbox') {
          obj.find("div.FieldCaseOption").after( op );
        } else {
          obj.find("div.FieldCaseOption").before( op );
        }

      }
      //Set the Case Value (if any)
      obj.find(".FieldCaseValue").val( caseData.value );

    }
    //Load the Value Assignments if there are any.
    if(caseData.hasOwnProperty("values")) {
      let vals = obj.children(".FieldsList");
      for (let i in caseData.values) {
        //Create the structure from Template
        let valObj = $("#Templates .ValueAssignment").clone(true);

        //Set the Field
        valObj.find(".PriceFieldSelect").val( caseData.values[i].field );

        //Populate the Field Options
        if (CRM.PricingLogic.PriceFields[caseData.values[i].field].hasOwnProperty("values")) {
          CRM.PricingLogic.populatePriceFieldOption(caseData.values[i].field, valObj.find(".PriceFieldOptionSelect"));
          valObj.find(".PriceFieldOptionSelect").val(caseData.values[i].option).show();
          valObj.find(".DefaultPrice").text(Number(CRM.PricingLogic.PriceFields[caseData.values[i].field].values[caseData.values[i].option].price).toFixed(2));
        } else {
          valObj.find(".PriceFieldOptionSelect").hide();
          valObj.find(".DefaultPrice").text(Number(CRM.PricingLogic.PriceFields[caseData.values[i].field].price).toFixed(2));
        }

        //Set the Price
        valObj.find(".ValueField").val(caseData.values[i].price);

        //Add it to the Case
        vals.append(valObj);
      }

      vals.append(vals.find(".AddButton"));
    }

    //Set the Advanced Options
    obj.children(".AdvancedList").find(".TrueFunction").val( caseData.truefunction);
    obj.children(".AdvancedList").find(".FalseFunction").val( caseData.falsefunction);

    return obj;
  }


  /**
   * Populates the list of price-set fields
   *
   * @param field
   * @param trgt
   */
  CRM.PricingLogic.populatePriceFieldOption = function populatePriceFieldOption(field, trgt) {
    for (let i in CRM.PricingLogic.PriceFields[field].values) {
      trgt.append("<option value='" + CRM.PricingLogic.PriceFields[field].values[i].id + "'>" + CRM.PricingLogic.PriceFields[field].values[i].label + "</option>")
    }
  }


  /**
   * Get the Operation Options for a given field type
   *
   * @param field
   * @param op
   * @returns {{options: (*|jQuery|HTMLElement), class: string}}
   */
  CRM.PricingLogic.getOpOptions = function getOpOptions(field, op) {
    let newOptions = $(false);
    let newClass = "";
    switch(field.html_type) {


      case 'core':
        CRM.alert(ts("Certain core fields are not yet fully supported."), ts("Warning"), "warning");
      case 'range':
      case 'date':
      case 'datetime-local':
      case 'month':
      case 'week':
      case 'color':
      case 'number':
        CRM.alert(ts("You are using a field that is not yet fully supported. They are treated as text boxes, and may lack some functionality or not behave as expected."), ts("Warning"), "warning");
      case 'phone':
      case 'tel':
      case 'email':
      case 'text':
      case 'hidden':
        if(field.type == "price" && field.is_enter_qty == 1) {
          if(!op.hasClass("quantity")) {
            newClass = "quantity";
            newOptions = $("#Templates .quantity-ops > option").clone();
          }
        } else {
          if(!op.hasClass("text")) {
            newClass = "text";
            newOptions = $("#Templates .text-ops > option").clone();
          }
        }
        break;

      case 'multi-select':
        CRM.alert(ts("Please be aware: Multi-select boxes are only partially supported."), ts("Warning"), "warning");
      case 'autocomplete-select':
      case 'select':
        if(!op.hasClass("select")) {
          newClass = "select";
          newOptions = $("#Templates .select-ops > option").clone();
        }
        break;

      case 'checkbox':
        if(!op.hasClass("checkbox")) {
          newClass = "checkbox";
          newOptions = $("#Templates .checkbox-ops > option").clone();
        }
        break;

      case 'radio':
        if(!op.hasClass("radio")) {
          newClass = "radio";
          newOptions = $("#Templates .radio-ops > option").clone();
        }
        break;

      case 'country':
        if(!op.hasClass("country")) {
          newClass = "country";
          newOptions = $("#Templates .select-ops > option").clone();
        }
        break;

      case 'state':
        if(!op.hasClass("state")) {
          newClass = "state";
          newOptions = $("#Templates .select-ops > option").clone();
        }
        break;

      default:
        console.log(field.html_type);
        CRM.alert(ts("Something has gone wrong, please contact the your administrator or the plugin author"), ts("Unknown Type") + ": " + field.html_type, "error");
    }
    return {'options': newOptions, 'class': newClass};
  }

  /**
   * Retrieves/generates the value options for a given field value assignment
   *
   * @param field
   * @returns {*}
   */
  CRM.PricingLogic.getValueOptions = function getValueOptions(field) {
    if (field.html_type == "radio" && field.hasOwnProperty("data_type") && (field.data_type == "binary" || field.data_type == "boolean")) {
      return "<option value='1'>" + ts("Yes") + "</option><option value='0'>" + ts("No") + "</option>";
    } else if (field.html_type == "country") {
      return $("#Templates #CountryTemplate > option").clone();
    } else if (field.html_type == "state") {
      return $("#Templates .StateTemplate > optgroup").clone();
    } else if (field.hasOwnProperty("values")) {
      let vals = "";
      for (let i in field.values) {
        if ($.isPlainObject(field.values[i])) {
          vals = vals + "<option value='"+field.values[i].id+"'>" + field.values[i].label + "</option>";
        } else {
          vals = vals + "<option value='"+i+"'>" + field.values[i] + "</option>";
        }
      }
      return vals;
    } else {
      return false;
    }
  }

  /**
   * This function is used when you add a ase to scroll to
   * the bottom of the editor and reveal the new case.
   */
  CRM.PricingLogic.scrollToEditorBottom = function scrollToEditorBottom() {
    if ($("#ValueEditor").hasClass("CVMax")) {
      $("#ValueEditor").animate({ scrollTop: $("#ValueEditor").height() }, "fast");
    } else {
      $("html, body").animate({ scrollTop: $("#Cases").height() }, "fast");
    }
  }

  // bind click event to pricesetlogic_active checkbox
  $('#pricesetlogic_active').click(function () {
    PriceSetLogicSettingsBlock();
  });

  // hide settings if not enabled
  if (!$('#pricesetlogic_active').prop('checked')) {
    $('#PriceSetLogicSettings').hide();
  }




  //todo: Look into refactoring this block into a tpl function
  //Load the fields and options
  //Load OptGroups for the Profiles Fields
  for(let i in CRM.PricingLogic.Profiles) {
    $("#Templates .FieldCase > .caseFields").append("<optgroup id='caseField_group_"+ i +"' label='" + CRM.PricingLogic.Profiles[i] + "'></optgroup>");
  }

  //Load Profile Fields into their corresponding optgroups
  for(let i in CRM.PricingLogic.ProfileFields) {
    $("#caseField_group_" + CRM.PricingLogic.ProfileFields[i].uf_group_id).append("<option value='" + CRM.PricingLogic.ProfileFields[i].field_name + "'>" + CRM.PricingLogic.ProfileFields[i].label + "</option>");
  }

  //Create an optgroup for the Price-Set Fields
  $("#Templates .FieldCase > .caseFields").append("<optgroup id='caseField_price' label='" + CRM.PricingLogic.PriceTitle + "'></optgroup>");

  //Load the Price-Set Fields into the select
  for(let i in CRM.PricingLogic.PriceFields) {
    $("#caseField_price").append("<option value='" + CRM.PricingLogic.PriceFields[i].id + "'>" + CRM.PricingLogic.PriceFields[i].label + "</option>");
  }

  //Add Javascript type
  $("#Templates .FieldCase > .caseFields").append("<option value='javascript'>" + ts("Custom JavaScript Function") + "</option>");


  //Add a civiDiscount evaluation pseudo type so the admin can
  //choose where to evaluate discounts within the rest of the pricing logic
  $("#Templates .FieldCase > .caseFields").append("<option value='cividiscount'>" + ts("CiviDiscount Codes") + "</option>");




  //Create the select2 input for case options
  //$("#Templates .FieldCase > .FieldCaseOption").select2();

  //Populate the State Select Box
  for(let g in CRM.PricingLogic.States) {
    let sGroup = $("<optgroup id='state_group_"+ g +"' label='" + CRM.PricingLogic.States[g].value + "'></optgroup>");

    for(let s in CRM.PricingLogic.States[g].children) {
      sGroup.append("<option value='" + CRM.PricingLogic.States[g].children[s].key + "'>" + CRM.PricingLogic.States[g].children[s].value + "</option>");
    }

    $("#Templates .StateTemplate").append(sGroup);
  }


  //Setup the logic that will change the price_field_value select
  $("#Templates .PriceFieldSelect").change(function(e) {
    let t = $(this).parent().find(".PriceFieldOptionSelect");
    let pField = $(this).val();
    if (CRM.PricingLogic.PriceFields[pField].hasOwnProperty("values")) {
      if(t.is(":visible")) {
        t.hide({"slide": {direction: 'left'}, done: function() {
            t.find("option,optgroup").remove();
            CRM.PricingLogic.populatePriceFieldOption(pField, t);
            t.show({"slide": {direction: 'left'}});
            t.change();
          }});
      } else {
        t.find("option,optgroup").remove();
        CRM.PricingLogic.populatePriceFieldOption(pField, t);
        t.show({"slide": {direction: 'left'}});
        t.change();
      }
    } else {
      $(this).parent().find(".DefaultPrice").text( Number(CRM.PricingLogic.PriceFields[pField].price).toFixed(2) );
      t.hide({"slide": {direction: 'left'}});
      t.find("option,optgroup").remove();
    }
  });


  //Setup the displaying of the default price for price fields with options
  $("#Templates .ValueAssignment .PriceFieldOptionSelect").change(function(e) {
    let pField = $(this).parent().find(".PriceFieldSelect").val();
    let newVal = CRM.PricingLogic.PriceFields[pField].values[ $(this).val() ].price;
    $(this).parent().find(".DefaultPrice").text( Number(newVal).toFixed(2) );
  });

  //Setup the logic for condition field changes
  $("#Templates .FieldCase .caseFields").change(function(e) {
    let caseObj = $(this).parent();
    let op = caseObj.find(".op");
    let valsObj = caseObj.find("select.FieldCaseOption");
    let valsDisplayObj = caseObj.find("div.FieldCaseOption");

    caseObj.removeClass("pseudotype");

    if ( $(this).val() == "javascript") {
      //JavaScript
      let fval = caseObj.find(".FieldCaseValue");
      op.removeClass().addClass("op").hide({slide: 'left'});
      if (valsDisplayObj && valsDisplayObj.is(":visible")) {
        valsDisplayObj.hide({
          slide: 'left', done: function () {
            valsObj.find("option,optgroup").remove();
            valsObj.val(null).select2('destroy');
            valsObj.hide();
          }
        });
      }
      let nWidth = (caseObj.find(".DeleteHandle").offset().left - ($(this).offset().left + $(this).outerWidth()) - 15);

      if (fval.is(":visible")) {
        fval.animate({width: nWidth});
      } else {
        fval.css({width: nWidth});
        fval.show({slide: 'left'});
      }



    } else if ( $(this).val() == "cividiscount") {
      caseObj.addClass("pseudotype");
      caseObj.find(".FieldCaseValue").hide({slide: 'left'}).val("");
      op.removeClass().addClass("op").hide({slide: 'left'});
      if (valsDisplayObj && valsDisplayObj.is(":visible")) {
        valsDisplayObj.hide({
          slide: 'left', done: function () {
            valsObj.find("option,optgroup").remove();
            valsObj.val(null).select2('destroy');
            valsObj.hide();
          }
        });
      }
    } else {
      if ($.isNumeric($(this).val())) {
        //PriceSet Fields
        let field = CRM.PricingLogic.PriceFields[ $(this).val() ];
      } else {
        //Core Fields
        let field = CRM.PricingLogic.ProfileFields[ $(this).val() ];
      }

      let vals = CRM.PricingLogic.getValueOptions(field);

      if (vals) {
        if (valsDisplayObj && valsDisplayObj.is(":visible")) {
          valsDisplayObj.hide({slide: 'left', done: function() {

              valsObj.select2('destroy');

              if(field.html_type == 'checkbox') {
                valsObj.insertBefore( op ).prop("multiple", null);
              } else {
                valsObj.insertAfter( op );
              }

              valsObj.find("option,optgroup").remove();
              valsObj.append(vals);
              valsObj.select2();
              caseObj.find("div.FieldCaseOption").show({slide: 'left'});
            }});
        } else {
          if(field.html_type == 'checkbox') {
            valsObj.insertBefore( op ).prop("multiple", null);
          } else {
            valsObj.insertAfter( op );
          }
          valsObj.find("option,optgroup").remove();
          valsObj.append(vals);
          valsObj.select2();
          caseObj.find("div.FieldCaseOption").show({slide: 'left'});
        }
      } else if (valsDisplayObj && valsDisplayObj.is(":visible")) {
        valsDisplayObj.hide({
          slide: 'left', done: function () {
            valsObj.find("option,optgroup").remove();
            valsObj.val(null).select2('destroy');
            valsObj.hide();
          }
        });
      }


      let n = CRM.PricingLogic.getOpOptions(field, op);

      if (n.options.length > 0) {
        op.hide({
          slide: 'left', done: function () {
            op.find("option,optgroup").remove();
            op.append(n.options).show({slide: 'left'});
            op.removeClass().addClass("op").addClass(n.class);
            op.change();
          }
        });
      } else {
        op.change();
      }
    }

    CRM.PricingLogic.handleSubSectionVisibility();
  });

  //Setup the logic for conditional operation changes
  $("#Templates .FieldCase .op").change(function(e) {
    let optsObj;
    let caseObj = $(this).parent();
    let valObj = caseObj.find(".FieldCaseValue");
    switch( $(this).val() ) {
      case '=':
      case '<':
      case '>':
      case '<>':
        if( valObj.is(":visible") ) {
          valObj.animate({width: 100});
        } else {
          valObj.css({width: 100}).show({slide: 'left'});
        }
        break;

      case 'regex':
        let nWidth = (caseObj.find(".DeleteHandle").offset().left - ($(this).offset().left + $(this).outerWidth()) - 15);
        if (valObj.is(":visible")) {
          valObj.animate({width: nWidth});
        } else {
          valObj.css({width: nWidth});
          valObj.show({slide: 'left'});
        }

        break;
      case 'empty':
      case 'not-empty':
      case 'checked':
      case 'not-checked':
        if( valObj.is(":visible") ) {
          valObj.hide({slide: 'left'});
        }
        break;

      case 'selected':
      case 'not-selected':
        if( valObj.is(":visible") ) {
          valObj.hide({slide: 'left'});
        }

        optsObj = caseObj.find("select.FieldCaseOption");
        if (optsObj.prop("multiple")) {
          caseObj.find("div.FieldCaseOption").hide({slide: 'left', done: function() {
              optsObj.select2('destroy').prop("multiple", null).select2();
              caseObj.find("div.FieldCaseOption").hide().show({slide: 'left'});
            }});
        }
        break;
      case 'in':
      case 'not-in':
        if( valObj.is(":visible") ) {
          valObj.hide({slide: 'left'});
        }
        optsObj = caseObj.find("select.FieldCaseOption");
        if (!optsObj.prop("multiple")) {
          caseObj.find("div.FieldCaseOption").hide({slide: 'left', done: function() {
              optsObj.select2('destroy').prop("multiple", "multiple").select2().hide();
              caseObj.find("div.FieldCaseOption").hide().show({slide: 'left'});
            }});
        }
        break;
    }
  });

  //Create the Toggle Button for Advanced Options
  $("#Templates .AdvancedButton").click(function(e) {
    $(this).find("span").toggleClass("ui-icon-triangle-1-n ui-icon-triangle-1-s");
    $(this).parent().find(".AdvancedOptions").slideToggle();
    return e.preventDefault();
  });

  //Create the delete functionality for the ValueAssignments
  $("#Templates .ValueAssignment .DeleteHandle").click(function(e) {
    if (confirm(ts("Are you sure you want to delete this value assignment?"))) {
      $(this).closest(".ValueAssignment").remove();
    }
    return e.preventDefault();
  });

  //Create a delete handler that can move values to parent.
  $("#Templates .Case .DeleteHandle").click(function(e) {
    if (confirm(ts("Are you sure you want to delete this whole condition and its values?"))) {
      $(this).closest(".Case").remove();
    }
    return e.preventDefault();
  });

  //Create the add new field price functionality
  $(".AddButton").click(function(e) {
    $(this).parent().append( $("#Templates > .ValueAssignment").clone(true) );
    $(this).parent().append($(this));
    CRM.PricingLogic.refreshSortables();
    CRM.PricingLogic.refreshAssignmentList( $(this).closest(".Case") );
    return e.preventDefault();
  });

  //Add A Union to Cases
  $(".pricesetlogic-addunion").click(function(e) {
    let obj = $("#Templates > .UnionCase").clone(true);
    obj.attr("name", "cases[" + $("#Cases>.Case").size() + "]");
    $("#Cases").append( obj );

    CRM.PricingLogic.makeCaseSortable( obj.add( obj.find(".Slot") ) );
    CRM.PricingLogic.refreshSortables();
    CRM.PricingLogic.rebuildNames();
    CRM.PricingLogic.scrollToEditorBottom();
    return e.preventDefault();
  });

  //Add a new single case field condition
  $(".pricesetlogic-addcase").click(function(e) {
    //This makes it so a new field condition is added directly to the first empty slot in a union
    let obj = $("#Templates > .FieldCase").clone(true);

    if ($("#Cases .Slot:empty").size() > 0) {
      $("#Cases .Slot:empty").first().append( obj );
      obj.children(".FieldsList,.AdvancedList").hide();
    } else {
      $("#Cases").append( obj );
    }

    CRM.PricingLogic.makeCaseSortable( obj );
    CRM.PricingLogic.refreshSortables();
    CRM.PricingLogic.rebuildNames();
    obj.find(".caseFields").change();
    CRM.PricingLogic.scrollToEditorBottom();
    return e.preventDefault();
  });

  /**
   * wire up the Min/Max functionality
   */
  $(".pricesetlogic-minmax").click(function() {
    if($("#ValueEditor").hasClass("CVMax")) {
      //Minimize the editor
      $("#BottomButtons").hide().appendTo("#PriceSetLogicSettings");
      $("#ValueEditor h3").css({"position": "relative"});
      let pd = $("#ValueEditor").prop("originalSize");
      $("#ValueEditor").animate(pd, function() {
        $("#ValueEditor").removeClass("CVMax");
        $("#ValueEditor").appendTo("#ValueAnchor");
        $("#BottomButtons").fadeIn();
        $("#ValueEditor").css({position: 'relative', top: 0, left: 0, height: 'auto', width: 'auto'});
        $("#Cases").css("padding-top", "3px");
      });

      $("#MinMaxTop span").switchClass( "ui-icon-arrowstop-1-s", "ui-icon-extlink" );
      $("#MinMaxTop").attr("title", ts("Maximize the editor"));
    } else {
      //Maximize the window
      //store the original position height and width;
      let pd = $("#ValueEditor").offset();
      pd.height = $("#ValueEditor").height();
      pd.width = $("#ValueEditor").width();
      $("#ValueEditor").prop("originalSize", pd);


      $("#ValueEditor").appendTo("body");
      $("#ValueEditor").css("position", "absolute");
      $("#ValueEditor").css(pd);
      $("html, body").animate({ scrollTop: 0 }, "fast");
      $("#ValueEditor").animate({top: '3%', left: 0, height: '97%', width: '100%'}, function() {
        $("#ValueEditor h3").css({"position": "fixed"});
        $("#Cases").css({"padding-top":  $("#ValueEditor h3").outerHeight() + 3});
        $("#BottomButtons").hide().appendTo("#ValueEditor").fadeIn();
      });
      $("#ValueEditor").addClass("CVMax");
      $("#MinMaxTop span").switchClass( "ui-icon-extlink", "ui-icon-arrowstop-1-s" );
      $("#MinMaxTop").attr("title", ts("Minimize the editor"));
    }
  });
  $("#Cases").resizable({handles: 'e',alsoResize: "#PriceSetLogicSettings h3.pricesetlogic-section"});
  //This is a handler that watches to see if the submit button is clicked
  //if the editor is in "fullscreen mode" when submit is clicked the form elements
  //are outside the form object and the form data is not included. This moves the "fullscreen"
  //editor box to a child node of the form before allowing the submission to continue.
  $("#PricingLogic").submit(function(e) {
    if ($("#Cases").hasClass("CVMax")) {
      $("#Cases").appendTo("#ValueAnchor");
    }
  });

  //Load the current cases and values
  for (let i in CRM.PricingLogic.Cases) {
    $("#Cases").append( CRM.PricingLogic.buildCaseFromData(CRM.PricingLogic.Cases[i]) );
  }

  //Hide the values section for nested Cases
  $("#Cases > .Case .Case .FieldsList").hide();
  //Hide the advanced section for nested Cases
  $("#Cases > .Case .Case .AdvancedList").hide();


  //todo: check to see if this is still needed and refactor
  //This is a "hack" to handle problems with the javascript input boxes not resizing
  // on page load because this is called before rendering.
  $("#Cases .javascript,#Cases .regex").each(function() {
    let obj = $(this);
    setTimeout(function() {
      let b = obj.prevAll(":visible:first").offset().left + obj.prevAll(":visible:first").outerWidth();
      obj.css('width', obj.parent().find(".DeleteHandle").offset().left - b - 15);
    }, 200);
  });

  //Rebuild the name structure
  CRM.PricingLogic.rebuildNames();

  //Create the initial Sortables
  CRM.PricingLogic.makeCaseSortable("#Cases, #Cases .Slot");

  //Handle hiding and showing subsections on page load.
  CRM.PricingLogic.handleSubSectionVisibility();
});

// function to show/hide settings
function PriceSetLogicSettingsBlock() {
  let psm_status = 0;
  if (CRM.$('#pricesetlogic_active').prop('checked')) {
    psm_status = 1;
  }
  CRM.api3('PriceSetLogic', 'ToggleSet', {
    "sequential": 1,
    "page_id": CRM.PricingLogic.PageID,
    "page_type": CRM.PricingLogic.PageType,
    "status": psm_status
  }).done(function(result) {
    // do something
    if (result.is_error) {
      CRM.alert(result.error_message, ts("Error"), "error");
    } else {
      if (CRM.$('#pricesetlogic_active').prop('checked')) {
        CRM.$('#PriceSetLogicSettings').slideDown("fast");
      }
      else {
        CRM.$('#PriceSetLogicSettings').slideUp("fast");
      }
    }
  });

  return false;
}
