
<div id="help">
    <strong>{ts}Edit Settings{/ts}</strong>
</div>

<div id="id_pricesetlogic" class="crm-block crm-form-block crm-contribution-contributionpage-pricesetlogic-form-block">



    <!--//   [ Table for Enable disable checkbox ]    //-->
    <table class="form-layout-compressed">
        <tr class="crm-contribution-contributionpage-pricesetlogic-form-block-is_active">
            <td class="label">{$form.pricesetlogic_active.label}</td>
            <td class="html-adjust">{$form.pricesetlogic_active.html}<br/>
                <span class="description">{ts}Would you like to enabled PriceSet Custom Pricing Logic for this Online Contributions page?{/ts}</span>
            </td>
        </tr>
    </table>

    <!--//   [ Custom Pricing Logic interface ]    //-->
    <fieldset id="PriceSetLogicSettings">
        <legend>{ts}PriceSet: Custom Pricing Logic{/ts}</legend>

        <div class="crm-submit-buttons">{include file="CRM/common/formButtons.tpl" location="top"}</div>

        <br /><hr /><br />

        <!-- Display Current Custom Prices //-->
        <div id="ValueAnchor">
            <div id="ValueEditor" class="crm-container CVMin">
                <h3 class="pricesetlogic-section">{ts}Custom Values{/ts}:
                    <a class="crm-hover-button" id="MinMax" title="{ts}Maximize the editor{/ts}"><span class="icon ui-icon-extlink"></span></a>
                    <a class="crm-hover-button" id="AddUnion" href="#" title="{ts}Add a new set of conditions{/ts}"><span class="icon ui-icon-plus"></span>{ts}Add Set{/ts}</a>
                    <a class="crm-hover-button" id="AddCase" href="#" title="{ts}Add a new single field condition{/ts}"><span class="icon ui-icon-plus"></span>{ts}Add Condition{/ts}</a>
                    <div style="clear: both;"></div>
                </h3>
                <div id="Cases"></div>
            </div>
        </div>

        <br /><hr /><br />
        <div id="BottomButtons" class="crm-submit-buttons">{include file="CRM/common/formButtons.tpl" location="bottom"}</div>
    </fieldset>



</div>

<!--This is the Template for the cases-->
<div id="Templates" style="display:none;">

    <div class="FieldCase Case">
        <div class="GrabHandle CaseGrabHandle"><span class="icon ui-icon-grip-dotted-vertical"></span></div>
        <a class="DeleteHandle crm-hover-button" href="#" title="{ts}Remove this custom price from the list{/ts}"><span class="icon ui-icon-close"></span></a>
        <input type="hidden" class="CaseType" value="condition" />
        <!--// These are loaded at run-tim via js, because it's easier //-->
        <select class="caseFields"></select>
        <!--// These get loaded when a specific field is chosen //-->
        <select class="FieldCaseOption" style="display:none;"></select>
        <select class="op" style="display:none;"></select>
        <input class="FieldCaseValue" />
        <div style="clear: both;"></div>
        <div class="FieldsList">
            <a class="AddButton crm-hover-button" href="#" title="{ts}Add a new Value to this Condition{/ts}"><span class="icon ui-icon-plus"></span>{ts}Add Field{/ts}</a>
        </div>
        <div class="AdvancedList">
            <a class="AdvancedButton  crm-hover-button" href="#" title="{ts}Show Advanced Options{/ts}"><span class="icon ui-icon-triangle-1-s"></span>{ts}Advanced Options{/ts}</a>
            <div class="AdvancedOptions" style="display:none;">
                <hr />
                <p><label>{ts}Condition is TRUE{/ts}: </label>  <input class="TrueFunction" size="45" title="{ts}This is the name of a Javascript function to call if this condition evaluates to true{/ts}" /></p>
                <p><label>{ts}Condition is FALSE{/ts}: </label> <input class="FalseFunction" size="45" title="{ts}This is the name of a Javascript function to call if this condition evaluates to false{/ts}"/></p>
            </div>
        </div>
    </div>

    <div class="UnionCase Case">
        <div class="GrabHandle CaseGrabHandle"><span class="icon ui-icon-grip-dotted-vertical"></span></div>
        <a class="DeleteHandle crm-hover-button" href="#" title="{ts}Remove this custom price from the list{/ts}"><span class="icon ui-icon-close"></span></a>
        <input type="hidden" class="CaseType" value="union" />
        <div class="Slot Slot1"></div>
        <select class="UnionType">
            <option value="and">AND</option>
            <option value="or">OR</option>
        </select>
        <div class="Slot Slot2"></div>
        <div class="FieldsList">
            <a class="AddButton crm-hover-button" href="#" title="{ts}Add a new Value to this Condition{/ts}"><span class="icon ui-icon-plus"></span>{ts}Add Field{/ts}</a>
        </div>
        <div class="AdvancedList">
            <a class="AdvancedButton crm-hover-button" href="#" title="{ts}Show Advanced Options{/ts}"><span class="icon ui-icon-triangle-1-s"></span>{ts}Advanced Options{/ts}</a>
            <div class="AdvancedOptions" style="display:none;">
                <hr />
                <p><label>{ts}Condition is TRUE{/ts}: </label>  <input class="TrueFunction" size="45" title="{ts}This is the name of a Javascript function to call if this condition evaluates to true{/ts}" /></p>
                <p><label>{ts}Condition is FALSE{/ts}: </label> <input class="FalseFunction" size="45" title="{ts}This is the name of a Javascript function to call if this condition evaluates to false{/ts}"/></p>
            </div>
        </div>
    </div>

    <div class="ValueAssignment">
        <div class="GrabHandle ValueGrabHandle"><span class="icon ui-icon-grip-dotted-vertical"></span></div>

        <a class="DeleteHandle crm-hover-button" href="#" title="{ts}Remove this custom price from the list{/ts}"><span class="icon ui-icon-close"></span></a>


        {ts}Field{/ts}:
        <select class="PriceFieldSelect">
            <option> - {ts}SELECT A FIELD{/ts} - </option>
            {foreach from=$PriceFields item=Field}
                <option value="{$Field.id}">{$Field.label}</option>
            {/foreach}
        </select>
        <select class="PriceFieldOptionSelect" style="display: none;"></select>
        <label>{ts}Price{/ts}: {$currencySymbol} </label>
        <input class="ValueField" size="5" />
        <label>({ts}Default Price{/ts} {$currencySymbol}<span class="DefaultPrice"></span>)</label>

    </div>

    <select class="quantity-ops">
        <option value="="> = </option>
        <option value=">"> &gt; </option>
        <option value="<"> &lt; </option>
        <option value="<>"> &lt;&gt; </option>
    </select>

    <select class="text-ops">
        <option value="empty">{ts}Is Empty{/ts}</option>
        <option value="not-empty">{ts}Is NOT Empty{/ts}</option>
        <option value="regex">{ts}RegEx{/ts}</option>
    </select>

    <select class="checkbox-ops">
        <option value="checked">{ts}Is Checked{/ts}</option>
        <option value="not-checked">{ts}Is NOT Checked{/ts}</option>
    </select>

    <select class="radio-ops">
        <option value="selected">{ts}Is{/ts}</option>
        <option value="not-selected">{ts}Is NOT{/ts}</option>
        <option value="in">{ts}Is one of{/ts}</option>
        <option value="not-in">{ts}Is NOT one of{/ts}</option>
    </select>

    <select class="select-ops">
        <option value="selected">{ts}Is{/ts}</option>
        <option value="not-selected">{ts}Is not{/ts}</option>
        <option value="in">{ts}Is one of{/ts}</option>
        <option value="not-in">{ts}Is NOT one of{/ts}</option>
    </select>
    <select class="StateTemplate"></select>
    {$form.CountryTemplate.html}
</div>


<!--// [Include Custom CSS] //-->
{crmStyle ext=com.tobiaslounsbury.pricesetlogic file=PricingLogic_Form.css}

<!--// [Include Custom JS] //-->
{crmScript ext=com.tobiaslounsbury.pricesetlogic file=PricingLogic_Form.js}

<!--//
I'm including some css here because it needs to be wrapped in
a ts and this is the easiest way to do it. The same result could
be done with javascript instead but the overhead is murder
//-->
<style type="text/css">
    .Slot:empty:before {ldelim}
        content: '{ts}You must add a condition{/ts}';
    {rdelim}
</style>
