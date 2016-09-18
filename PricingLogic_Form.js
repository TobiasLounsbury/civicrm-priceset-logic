CRM.$(function($) {

    function refreshAssignmentList(caseObj) {
        var baseName = caseObj.attr("name");
        caseObj.children(".FieldsList").children(".ValueAssignment").each(function(i) {
            $(this).attr("name", baseName + "[values][" + i +"]");
            $(this).find(".PriceFieldSelect").attr("name", baseName + "[values][" + i +"][field]");
            $(this).find(".PriceFieldOptionSelect").attr("name", baseName + "[values][" + i +"][option]");
            $(this).find(".ValueField").attr("name", baseName + "[values][" + i +"][price]");
        });
    }

    function rebuildCaseNames(caseObj) {
        var baseName = caseObj.attr("name");
        caseObj.children(".CaseType").attr("name", baseName + "[type]");
        caseObj.children(".AdvancedList").find(".TrueFunction").attr("name", baseName + "[truefunction]");
        caseObj.children(".AdvancedList").find(".FalseFunction").attr("name", baseName + "[falsefunction]");
        if(caseObj.hasClass("UnionCase")) {
            caseObj.children(".UnionType").attr("name", baseName + "[op]");
            slot1 = caseObj.children(".Slot1").children(".Case");
            if(slot1.length == 1) {
                slot1.attr("name", baseName + "[slot][1]");
                rebuildCaseNames(slot1);
            }
            slot2 = caseObj.children(".Slot2").children(".Case");
            if(slot2.length == 1) {
                slot2.attr("name", baseName + "[slot][2]");
                rebuildCaseNames(slot2);
            }
        }
        if(caseObj.hasClass("FieldCase")) {
            caseObj.find(".caseFields").attr("name", baseName + "[field]");
            caseObj.find("select.FieldCaseOption").attr("name", baseName + "[option][]");
            caseObj.find(".op").attr("name", baseName + "[op]");
            caseObj.find(".FieldCaseValue").attr("name", baseName + "[value]");
        }
    }

    function rebuildNames() {
        $("#Cases .Slot").removeClass("empty");
        $("#Cases .Slot:empty").addClass("empty");

        $("#Cases > .Case").each(function(i) {
            $(this).attr("name", "cases[" + i + "]");
            rebuildCaseNames( $(this) );
            refreshAssignmentList( $(this) );
        });
    }

    function refreshSortables() {
        $("#Cases, #Cases .Slot").sortable('refresh');
        $("#Cases .FieldsList").sortable('refresh');
    }

    //This is done as a function because if you make the templates
    //sortable first and then do the deep clone it doesn't properly
    //clone the sortable widgets and fails silently.
    function makeCaseSortable(selector) {
        //Make the Cases sortable
        $(selector).sortable({
            handle: ".CaseGrabHandle",
            items: "> div.Case",
            connectWith: "#Cases, .Slot",
            revert: true,
            helper: 'clone',
            opacity: 0.7,
            placeholder: "custom-value-highlight",
            start: function (e, ui) { ui.item.show();},
            receive: function( event, ui ) {
                if($(event.target).attr("id") != "Cases") {
                    var receiver = $(event.target).closest(".Case");
                    if($(event.target).children(".Case").length > 1) {
                        //Limit Slots to one sub-case
                        $(ui.sender).sortable('cancel');
                    } else {
                        receiver.find(".FieldsList").append(ui.item.find(".ValueAssignment"));
                        ui.item.find(".ValueAssignment").remove();
                    }
                }
                $("#Cases > .Case > .FieldsList, #Cases > .Case > .AdvancedList").slideDown();
                $("#Cases > .Case .Case .FieldsList, #Cases > .Case .Case .AdvancedList").slideUp();
            },
            stop: function( event, ui ) {
                //Refresh the names
                rebuildNames();
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
                refreshAssignmentList( $(event.target) );
            }
        });
    }

    function buildCaseFromData(caseData) {
        var obj;
        if (caseData.type == "union") {
            obj = $("#Templates .UnionCase").clone(true);
            //Set the UnionType
            obj.find(".UnionType").val(caseData.op);
            //recursively load slot 1
            if(caseData.hasOwnProperty("slot") && $.isPlainObject(caseData.slot[1])) {
                obj.children(".Slot1").append( buildCaseFromData(caseData.slot[1]) )
            }
            //Recursively load Slot 2
            if(caseData.hasOwnProperty("slot") && $.isPlainObject(caseData.slot[2])) {
                obj.children(".Slot2").append( buildCaseFromData(caseData.slot[2]) )
            }
        } else if (caseData.type == "condition") {
            obj = $("#Templates .FieldCase").clone(true);

            //Load the data into their respective fields
            //TODO: Set the Data in the Fields

            //Set the field the condition hinges on
            obj.find(".caseFields").val(caseData.field);

            if (caseData.field == 'javascript') {
                obj.find(".FieldCaseValue").addClass("javascript");
            } else {

                var field;

                //Handle Missing Locations.
                if (caseData.field.substr(-1) === "-") {
                    caseData.field = caseData.field + "Primary";
                }

                if ( $.isNumeric( caseData.field ) ) {
                    field = CRM.PricingLogic.PriceFields[caseData.field];
                } else {
                    field = CRM.PricingLogic.ProfileFields[caseData.field];
                }


                var optsObj = obj.find("select.FieldCaseOption");

                if (caseData.op == "in" || caseData.op == "not-in") {
                    optsObj.prop("multiple", "multiple");
                }


                //Set the options (if any)
                var newOpts = getValueOptions(field);
                if (newOpts) {
                    //TODO: fix: .FieldCaseOption
                    optsObj.append(newOpts);
                    optsObj.val( caseData.option );
                    optsObj.select2();
                    obj.find("div.FieldCaseOption").css("display", "inline-block");
                }

                //Populate and Set the operation type
                var op = obj.find(".op").show();
                var n = getOpOptions(field, op);
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
            var vals = obj.children(".FieldsList");
            for (var i in caseData.values) {
                //Create the structure from Template
                var valObj = $("#Templates .ValueAssignment").clone(true);

                //Set the Field
                valObj.find(".PriceFieldSelect").val( caseData.values[i].field );

                //Populate the Field Options
                if (CRM.PricingLogic.PriceFields[caseData.values[i].field].hasOwnProperty("values")) {
                    populatePriceFieldOption(caseData.values[i].field, valObj.find(".PriceFieldOptionSelect"));
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


    function populatePriceFieldOption(field, trgt) {
        for (var i in CRM.PricingLogic.PriceFields[field].values) {
            trgt.append("<option value='" + CRM.PricingLogic.PriceFields[field].values[i].id + "'>" + CRM.PricingLogic.PriceFields[field].values[i].label + "</option>")
        }
    }

    function getOpOptions(field, op) {
        var newOptions = $(false);
        var newClass = "";
        switch(field.html_type) {

            case 'phone':
            case 'email':
            case 'text':
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
                //console.log(field.html_type);
                alert(ts("Something has gone wrong, please contact the your administrator or the plugin author"));
        }
        return {'options': newOptions, 'class': newClass};
    }

    function getValueOptions(field) {
        if (field.html_type == "radio" && field.hasOwnProperty("data_type") && field.data_type == "binary") {
            return "<option value='1'>" + ts("Yes") + "</option><option value='0'>" + ts("No") + "</option>";
        } else if (field.html_type == "country") {
            return $("#Templates #CountryTemplate > option").clone();
        } else if (field.html_type == "state") {
            return $("#Templates .StateTemplate > optgroup").clone();
        } else if (field.hasOwnProperty("values")) {
            var vals = "";
            for (var i in field.values) {
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


    // bind click event to pricesetlogic_active checkbox
    $('#pricesetlogic_active').click(function () {
        PriceSetLogicSettingsBlock();
    });

    // hide settings if not enabled
    if (!$('#pricesetlogic_active').prop('checked')) {
        $('#PriceSetLogicSettings').hide();
    }



    //Load the fields and options
    //Load OptGroups for the Profiles Fields
    for(var i in CRM.PricingLogic.Profiles) {
        $("#Templates .FieldCase > .caseFields").append("<optgroup id='caseField_group_"+ i +"' label='" + CRM.PricingLogic.Profiles[i] + "'></optgroup>");
    }

    //Load Profile Fields into their corresponding optgroups
    for(var i in CRM.PricingLogic.ProfileFields) {
        $("#caseField_group_" + CRM.PricingLogic.ProfileFields[i].uf_group_id).append("<option value='" + CRM.PricingLogic.ProfileFields[i].field_name + "'>" + CRM.PricingLogic.ProfileFields[i].label + "</option>");
    }

    //Create an optgroup for the Price-Set Fields
    $("#Templates .FieldCase > .caseFields").append("<optgroup id='caseField_price' label='" + CRM.PricingLogic.PriceTitle + "'></optgroup>");

    //Load the Price-Set Fields into the select
    for(var i in CRM.PricingLogic.PriceFields) {
        $("#caseField_price").append("<option value='" + CRM.PricingLogic.PriceFields[i].id + "'>" + CRM.PricingLogic.PriceFields[i].label + "</option>");
    }

    //Add Javascript type
    $("#Templates .FieldCase > .caseFields").append("<option value='javascript'>" + ts("Custom JavaScript Function") + "</option>");


    //Create the select2 input for case options
    //$("#Templates .FieldCase > .FieldCaseOption").select2();

    //Populate the State Select Box
    for(var g in CRM.PricingLogic.States) {
        var sGroup = $("<optgroup id='state_group_"+ g +"' label='" + CRM.PricingLogic.States[g].value + "'></optgroup>");

        for(var s in CRM.PricingLogic.States[g].children) {
            sGroup.append("<option value='" + CRM.PricingLogic.States[g].children[s].key + "'>" + CRM.PricingLogic.States[g].children[s].value + "</option>");
        }

        $("#Templates .StateTemplate").append(sGroup);
    }


    //Setup the logic that will change the price_field_value select
    $("#Templates .PriceFieldSelect").change(function(e) {
        var t = $(this).parent().find(".PriceFieldOptionSelect");
        var pField = $(this).val();
        if (CRM.PricingLogic.PriceFields[pField].hasOwnProperty("values")) {
            if(t.is(":visible")) {
                t.hide({"slide": {direction: 'left'}, done: function() {
                    t.find("option,optgroup").remove();
                    populatePriceFieldOption(pField, t);
                    t.show({"slide": {direction: 'left'}});
                    t.change();
                }});
            } else {
                t.find("option,optgroup").remove();
                populatePriceFieldOption(pField, t);
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
        var pField = $(this).parent().find(".PriceFieldSelect").val();
        var newVal = CRM.PricingLogic.PriceFields[pField].values[ $(this).val() ].price;
        $(this).parent().find(".DefaultPrice").text( Number(newVal).toFixed(2) );
    });

    //Setup the logic for condition field changes
    $("#Templates .FieldCase .caseFields").change(function(e) {
        var caseObj = $(this).parent();
        var op = caseObj.find(".op");
        var valsObj = caseObj.find("select.FieldCaseOption");
        var valsDisplayObj = caseObj.find("div.FieldCaseOption");

        if ( $(this).val() == "javascript") {
            //JavaScript
            var fval = caseObj.find(".FieldCaseValue");
            op.removeClass().addClass("op").hide({slide: 'left'});
            if (valsDisplayObj && valsDisplayObj.is(":visible")) {
                valsDisplayObj.hide({
                    slide: 'left', done: function () {
                        valsObj.find("option,optgroup").remove();
                        valsObj.val(null).select2('destroy');
                    }
                });
            }
            var nWidth = (caseObj.find(".DeleteHandle").offset().left - ($(this).offset().left + $(this).outerWidth()) - 15);

            if (fval.is(":visible")) {
                fval.animate({width: nWidth});
            } else {
                fval.css({width: nWidth});
                fval.show({slide: 'left'});
            }

        } else {

            if ($.isNumeric($(this).val())) {
                //PriceSet Fields
                var field = CRM.PricingLogic.PriceFields[ $(this).val() ];
            } else {
                //Core Fields
                var field = CRM.PricingLogic.ProfileFields[ $(this).val() ];
            }

            var vals = getValueOptions(field);

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


            var n = getOpOptions(field, op);

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
    });

    //Setup the logic for conditional operation changes
    $("#Templates .FieldCase .op").change(function(e) {
        var caseObj = $(this).parent();
        var valObj = caseObj.find(".FieldCaseValue");
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
                var nWidth = (caseObj.find(".DeleteHandle").offset().left - ($(this).offset().left + $(this).outerWidth()) - 15);
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

                var optsObj = caseObj.find("select.FieldCaseOption");
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
                var optsObj = caseObj.find("select.FieldCaseOption");
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

    //Create the add functionality
    $(".AddButton").click(function(e) {
        $(this).parent().append( $("#Templates > .ValueAssignment").clone(true) );
        $(this).parent().append($(this));
        refreshSortables();
        refreshAssignmentList( $(this).closest(".Case") );
        return e.preventDefault();
    });

    //Add A Union to Cases
    $("#AddUnion").click(function(e) {
        var obj = $("#Templates > .UnionCase").clone(true);
        obj.attr("name", "cases[" + $("#Cases>.Case").size() + "]");
        $("#Cases").append( obj );

        makeCaseSortable( obj.add( obj.find(".Slot") ) );
        refreshSortables();
        rebuildNames();
        return e.preventDefault();
    });

    //Add a new field condition
    $("#AddCase").click(function(e) {
        //This makes it so a new field condition is added directly to thefirst empty slot in a union
        var obj = $("#Templates > .FieldCase").clone(true);

        if ($("#Cases .Slot:empty").size() > 0) {
            var trgt = $("#Cases .Slot:empty").first();
            obj.children(".FieldsList,.AdvancedList").hide();
        } else {
            var trgt = $("#Cases");
        }

        trgt.append( obj );
        makeCaseSortable( obj );
        refreshSortables();
        rebuildNames();
        obj.find(".caseFields").change();
        return e.preventDefault();
    });

    //Make the editor's width resizable
    $("#MinMax").click(function() {
        if($("#ValueEditor").hasClass("CVMax")) {
            //Minimize the editor
            $("#BottomButtons").hide().appendTo("#PriceSetLogicSettings");
            $("#ValueEditor h3").css({"position": "relative"});
            var pd = $("#ValueEditor").prop("originalSize");
            $("#ValueEditor").animate(pd, function() {
                $("#ValueEditor").removeClass("CVMax");
                $("#ValueEditor").appendTo("#ValueAnchor");
                $("#BottomButtons").fadeIn();
                $("#ValueEditor").css({position: 'relative', top: 0, left: 0, height: 'auto', width: 'auto'});
                $("#Cases").css("padding-top", "3px");
            });

            $("#MinMax span").switchClass( "ui-icon-arrowstop-1-s", "ui-icon-extlink" );
            $("#MinMax").attr("title", ts("Maximize the editor"));
        } else {
            //Maximize the window
            //store the original position height and width;
            var pd = $("#ValueEditor").offset();
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
            $("#MinMax span").switchClass( "ui-icon-extlink", "ui-icon-arrowstop-1-s" );
            $("#MinMax").attr("title", ts("Minimize the editor"));
        }
    });
    $("#Cases").resizable({handles: 'e',alsoResize: "#PriceSetLogicSettings h3.pricesetlogic-section"});
    //In case the editor is maximized when a submit button is clicked
    //This moves
    $("#PricingLogic").submit(function(e) {
        if ($("#Cases").hasClass("CVMax")) {
            $("#Cases").appendTo("#ValueAnchor");
        }
    });

    //Load the current cases and values
    for (var i in CRM.PricingLogic.Cases) {
        $("#Cases").append( buildCaseFromData(CRM.PricingLogic.Cases[i]) );
    }

    //Hide the values section for nested Cases
    $("#Cases > .Case .Case .FieldsList").hide();
    //Hide the advanced section for nested Cases
    $("#Cases > .Case .Case .AdvancedList").hide();

    $("#Cases .javascript,#Cases .regex").each(function() {
        var obj = $(this);
        setTimeout(function() {
            var b = obj.prevAll(":visible:first").offset().left + obj.prevAll(":visible:first").outerWidth();
            obj.css('width', obj.parent().find(".DeleteHandle").offset().left - b - 15);
        }, 200);
    });

    //Rebuild the name structure
    rebuildNames();

    //Create the initial Sortables
    makeCaseSortable("#Cases, #Cases .Slot");
});

// function to show/hide settings
function PriceSetLogicSettingsBlock() {
    var psm_status = 0;
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
            CRM.alert(result.error_message, "error");
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