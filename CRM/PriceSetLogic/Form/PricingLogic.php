<?php

require_once 'CRM/Core/Form.php';

/**
 * Form controller class
 *
 * @see http://wiki.civicrm.org/confluence/display/CRMDOC43/QuickForm+Reference
 */
class CRM_PriceSetLogic_Form_PricingLogic extends CRM_Contribute_Form_ContributionPage {
  function buildQuickForm() {

    $this->addElement(
      'checkbox',
      'pricesetlogic_active',
      ts('Enable Custom Values?')
    );

    $this->addCountry("CountryTemplate", "CountryTemplate");

    //Get the country and states
    $Countries = CRM_Core_PseudoConstant::country();
    $States = CRM_Core_BAO_Location::getChainSelectValues(array_keys($Countries), 'country');

    //Is case we only have one enabled country
    if(count($Countries) == 1) {
      $States = array(array("value" => array_shift($Countries), "children" => $States));
    }

    //Get the Profiles
    $profiles = array();
    $ufJoinParams = array(
      'module' => 'CiviContribute',
      'entity_table' => 'civicrm_contribution_page',
      'entity_id' => $this->_id,
    );
    list($profiles[], $second) = CRM_Core_BAO_UFJoin::getUFGroupIds($ufJoinParams);
    if ($second) {
      $profiles[] = array_shift($second);
    }

    $profileFields = CRM_PriceSetLogic_BAO_PriceSetLogic::getProfileFields($profiles);


    //Load the Profile names so they can be loaded into the interface
    $PageProfiles = array();
    foreach($profiles as $pid) {
      $result = civicrm_api3('UFGroup', 'get', array(
        'sequential' => 1,
        'return' => "title",
        'id' => $pid,
      ));
      if ($result['is_error'] == 0 && $result['count'] > 0) {
        $PageProfiles[$pid] = $result['values'][0]['title'];
      }
    }

    //Get the Price-Set Fields and values
    $priceSetId = CRM_Price_BAO_PriceSet::getFor('civicrm_contribution_page', $this->_id, 3, 1);
    if (!$priceSetId) {
      $priceSetId = CRM_Price_BAO_PriceSet::getFor('civicrm_contribution_page', $this->_id, 2, 1);
    }

    list($fields, $priceSetTitle) = CRM_PriceSetLogic_BAO_PriceSetLogic::getPriceSetFields($priceSetId);

    //Get the Cases we already have
    $result = civicrm_api3("PriceSetLogic", "get", array(
      "page_id" => $this->_id,
      "page_type" => "contribution",
    ));
    $details = $result['values'];
    if(!array_key_exists("cases", $details)) {
      $details['cases'] = array();
    }



    //Handle Different Currencies
    $result = civicrm_api3('ContributionPage', 'get', array(
      'sequential' => 1,
      'return' => "currency",
      'id' => $this->_id,
    ));
    // Hack to get currency info to the js layer. CRM-11440.
    CRM_Utils_Money::format(1);
    $this->assign('currencySymbol', CRM_Utils_Array::value($result['values'][0]['currency'], CRM_Utils_Money::$_currencySymbols));

    //Add JavaScript Vars
    CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('States' => $States)));
    CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('PageID' => $this->_id)));
    CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('PageType' => "contribution")));
    CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('Profiles' => $PageProfiles)));
    CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('ProfileFields' => $profileFields)));
    CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('PriceTitle' => $priceSetTitle)));
    CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('PriceFields' => $fields)));
    $this->assign('PriceFields', $fields);
    CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('Cases' => $details['cases'])));

    // export form elements
    $this->assign('elementNames', $this->getRenderableElementNames());
    parent::buildQuickForm();
  }

  function setDefaultValues() {
    $origID = null;
    $defaults = array();


    $Set = CRM_PriceSetLogic_BAO_PriceSetLogic::getSet("contribution", $this->_id);

    if ($Set && array_key_exists("is_active", $Set)) {
      $defaults['pricesetlogic_active'] = CRM_Utils_Array::value('is_active', $Set);
    } else {
      $defaults['pricesetlogic_active'] = 0;
    }

    return $defaults;
  }

  function postProcess() {
    $values = $_POST['cases'];


    //So save the data
    $result = civicrm_api3('PriceSetLogic', 'Create', array(
      'page_id' => $this->_id,
      'page_type' => "contribution",
      'cases' => $values,
      'is_active' => $_POST['pricesetlogic_active']
    ));

    parent::postProcess();
  }


  /**
   * Get the fields/elements defined in this form.
   *
   * @return array (string)
   */
  function getRenderableElementNames() {
    // The _elements list includes some items which should not be
    // auto-rendered in the loop -- such as "qfKey" and "buttons".  These
    // items don't have labels.  We'll identify renderable by filtering on
    // the 'label'.
    $elementNames = array();
    foreach ($this->_elements as $element) {
      $label = $element->getLabel();
      if (!empty($label)) {
        $elementNames[] = $element->getName();
      }
    }
    return $elementNames;
  }
}
