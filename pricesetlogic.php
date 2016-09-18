<?php

require_once 'pricesetlogic.civix.php';

/**
 * Implementation of hook_civicrm_config
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_config
 */
function pricesetlogic_civicrm_config(&$config) {
  _pricesetlogic_civix_civicrm_config($config);
}

/**
 * Implementation of hook_civicrm_xmlMenu
 *
 * @param $files array(string)
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_xmlMenu
 */
function pricesetlogic_civicrm_xmlMenu(&$files) {
  _pricesetlogic_civix_civicrm_xmlMenu($files);
}

/**
 * Implementation of hook_civicrm_install
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_install
 */
function pricesetlogic_civicrm_install() {
  return _pricesetlogic_civix_civicrm_install();
}

/**
 * Implementation of hook_civicrm_uninstall
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_uninstall
 */
function pricesetlogic_civicrm_uninstall() {
  return _pricesetlogic_civix_civicrm_uninstall();
}

/**
 * Implementation of hook_civicrm_enable
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_enable
 */
function pricesetlogic_civicrm_enable() {
  return _pricesetlogic_civix_civicrm_enable();
}

/**
 * Implementation of hook_civicrm_disable
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_disable
 */
function pricesetlogic_civicrm_disable() {
  return _pricesetlogic_civix_civicrm_disable();
}

/**
 * Implementation of hook_civicrm_upgrade
 *
 * @param $op string, the type of operation being performed; 'check' or 'enqueue'
 * @param $queue CRM_Queue_Queue, (for 'enqueue') the modifiable list of pending up upgrade tasks
 *
 * @return mixed  based on op. for 'check', returns array(boolean) (TRUE if upgrades are pending)
 *                for 'enqueue', returns void
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_upgrade
 */
function pricesetlogic_civicrm_upgrade($op, CRM_Queue_Queue $queue = NULL) {
  return _pricesetlogic_civix_civicrm_upgrade($op, $queue);
}

/**
 * Implementation of hook_civicrm_managed
 *
 * Generate a list of entities to create/deactivate/delete when this module
 * is installed, disabled, uninstalled.
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_managed
 */
function pricesetlogic_civicrm_managed(&$entities) {
  return _pricesetlogic_civix_civicrm_managed($entities);
}

/**
 * Implementation of hook_civicrm_caseTypes
 *
 * Generate a list of case-types
 *
 * Note: This hook only runs in CiviCRM 4.4+.
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_caseTypes
 */
function pricesetlogic_civicrm_caseTypes(&$caseTypes) {
  _pricesetlogic_civix_civicrm_caseTypes($caseTypes);
}

/**
 * Implementation of hook_civicrm_alterSettingsFolders
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_alterSettingsFolders
 */
function pricesetlogic_civicrm_alterSettingsFolders(&$metaDataFolders = NULL) {
  _pricesetlogic_civix_civicrm_alterSettingsFolders($metaDataFolders);
}

function pricesetlogic_civicrm_buildForm( $formName, &$form ) {
  //TODO: make the tab show up no matter how we snap into a contribution page
  $PagesToTrap = array(
    "CRM_Contribute_Form_ContributionPage_Settings",
    "CRM_Contribute_Form_ContributionPage_Amount",
    "CRM_Member_Form_MembershipBlock",
    "CRM_Contribute_Form_ContributionPage_ThankYou",
    "CRM_Friend_Form_Contribute",
    "CRM_Contribute_Form_ContributionPage_Custom",
    "CRM_Contribute_Form_ContributionPage_Premium",
    "CRM_Contribute_Form_ContributionPage_Widget",
    "CRM_PCP_Form_Contribute",
    "CRM_Pricesetmap_Form_PriceSetMap",
    "CRM_PriceSetLogic_Form_PricingLogic",
  );
  if (in_array($formName, $PagesToTrap)) {
    $tabs = $form->get('tabHeader');
    $formId = $form->get('id');
    if($tabs) {
      $qfKey = $form->get('qfKey');
      $PriceSetID = $form->getVar('_priceSetID');
      $valid = ($PriceSetID);
      if ($formName == "CRM_PriceSetLogic_Form_PricingLogic") {
        $current = true;
        CRM_Core_Resources::singleton()->addSetting(array('tabSettings' => array('active' => 'pricing_logic')));
      } else {
        $current = false;
        $qfKey = null;
      }
      $tabs['pricing_logic'] = array(
        "title" => "PriceSet Custom Pricing Logic",
        "link" => CRM_Utils_System::url("civicrm/admin/contribute/pricing/logic", "action=update&id={$formId}"),
        "valid" => true,
        //"valid" => $valid,
        "active" => true,
        "current" => $current,
        "qfKey" => $qfKey
      );
      $form->set('tabHeader', $tabs);
      $form->assign_by_ref('tabHeader', $tabs);
    }
  }


  /***************[ Inject the new Javascript into the page ]***************/
  if ($formName == "CRM_Contribute_Form_Contribution_Main" || $formName == "CRM_Event_Form_Registration_Register") {
    $Set = $priceSetId = false;
    //Check to see if we have a custom set for this page
    if ($formName == "CRM_Contribute_Form_Contribution_Main") {
      $formId = $form->get("id");
      $Set = CRM_PriceSetLogic_BAO_PriceSetLogic::getSet("contribution", $formId);

      //Get the Price-Set Fields and values
      $priceSetId = CRM_Price_BAO_PriceSet::getFor('civicrm_contribution_page', $formId, 3, 1);
      if (!$priceSetId) {
        $priceSetId = CRM_Price_BAO_PriceSet::getFor('civicrm_contribution_page', $formId, 2, 1);
      }
      $ufJoinParams = array("entity_id" => $formId, "entity_table" => "civicrm_contribution_page", "module" => "CiviContribute");
      $formHtmlId = "Main";
    }

    if ($formName == "CRM_Event_Form_Registration_Register") {
      $Set = CRM_PriceSetLogic_BAO_PriceSetLogic::getSet("event", $formId);
      //Get the price set for registration page
      //todo: Rework this to function properly
      //$priceSetId = CRM_Price_BAO_PriceSet::getFor('civicrm_event', $form->get('id'), 3, 1);
      //$ufJoinParams = array("entity_id" => $form->get('id'), "entity_table" => "civicrm_event", "module" => "CiviEvent");
      $formHtmlId = "Register";
    }


    if ($Set && $Set['is_active'] == 1) {


      //Create a list of all unique price fields that could have their price changed.
      list($allPriceFields, $priceSetTitle) = CRM_PriceSetLogic_BAO_PriceSetLogic::getPriceSetFields($priceSetId);
      $priceFields = pricesetlogic_pricefields($Set['cases']);

      //Create a list of all unique fields that can affect when a price changes(trigger fields)
      $profiles = array();

      if($ufJoinParams) {
        list($profiles[], $second) = CRM_Core_BAO_UFJoin::getUFGroupIds($ufJoinParams);
        if ($second) {
          $profiles[] = array_shift($second);
        }
      }
      $profileFields = CRM_PriceSetLogic_BAO_PriceSetLogic::getProfileFields($profiles);
      $triggerFields = pricesetlogic_trigger_fields($Set['cases']);


      //Load the Run-Time Javascript
      CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('Cases' => $Set['cases'])));
      CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('AllPriceFields' => $allPriceFields)));
      CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('PriceFields' => $priceFields)));
      CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('ProfileFields' => $profileFields)));
      CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('TriggerFields' => $triggerFields)));
      CRM_Core_Resources::singleton()->addSetting(array('PricingLogic' => array('FormId' => $formHtmlId)));

      //Add the appropriate javascript functions based on version
      $version = substr(CRM_Utils_System::version(), 0, 3);
      if($version <= 4.6) {
        CRM_Core_Resources::singleton()->addScriptFile('com.tobiaslounsbury.pricesetlogic', 'pricesetlogic_46.js', 19, 'page-footer');
      } else {
        CRM_Core_Resources::singleton()->addScriptFile('com.tobiaslounsbury.pricesetlogic', 'pricesetlogic_47.js', 19, 'page-footer');
      }

      CRM_Core_Resources::singleton()->addScriptFile('com.tobiaslounsbury.pricesetlogic', 'pricesetlogic.js', 20, 'page-footer');
    }
  }
}




/**
 * This function takes a list of cases and returns a list
 * Of all the price set fields that COULD be modified
 * so that we can replace their calculate price functions
 *
 * @param $cases
 */
function pricesetlogic_pricefields($cases) {
  $fields = array();
  foreach($cases as $case) {
    foreach($case['values'] as $field) {
      if(array_key_exists("option", $field)) {
        $fields[$field['field']."_".$field['option']] = $field;
      } else {
        $fields[$field['field']] = $field;
      }
    }
  }

  return $fields;
}

/**
 * This function takes a list of cases and returns a unique
 * list of all "trigger fields"
 *
 * @param $cases
 */
function pricesetlogic_trigger_fields($cases, $caseIndex = null) {
  $fields = array();

  foreach($cases as $id => $case) {
    if($caseIndex) {
      $caseToTrigger = $caseIndex;
    } else {
      $caseToTrigger = $id;
    }
    if($case['type'] == "union") {
     $fields = array_merge_recursive($fields, pricesetlogic_trigger_fields($case['slot'], $caseToTrigger));
    } else {
      if ($case['field'] != 'javascript') {
        $field = (is_numeric($case['field'])) ? "price_".$case['field'] : $case['field'];
        $fields = array_merge_recursive($fields, array($field => array($caseToTrigger)));
      }
    }
  }

  return $fields;
}

function pricesetlogic_civicrm_buildAmount( $pageType, &$form, &$amount ) {
  if (!empty($form->_submitValues)) {
    $Set = false;

    if ($pageType == "contribution" || $pageType =="membership") {
      $Set = CRM_PriceSetLogic_BAO_PriceSetLogic::getSet("contribution", $form->get('id'));
    }

    //todo: Make this work properly
    if ($pageType == "event") {
      $Set = CRM_PriceSetLogic_BAO_PriceSetLogic::getSet("event", $form->get('id'));
    }

    if($Set && $Set['is_active'] == 1) {
      //Evaluate the Cases and Adjust prices as required.
      foreach($Set['cases'] as $case) {
        if (CRM_PriceSetLogic_BAO_PriceSetLogic::evaluateCase($case, $form, $pageType)){
          foreach($case['values'] as $field) {
            if ($amount[$field['field']]['is_enter_qty']) {
              $keys = array_keys($amount[$field['field']]['options']);
              $field['option'] = $keys[0];
            }
            $amount[$field['field']]['options'][$field['option']]['amount'] = $field['price'];

          }
        }
      }
    }
  }
}

/**
 * Implementation of hook_civicrm_tabset
 *
 * @param $tabsetName
 * @param $tabs
 * @param $context
 */
function pricesetlogic_civicrm_tabset($tabsetName, &$tabs, $context) {

  if ($tabsetName == 'civicrm/event/manage') {

  }

}

/**
 * @param $op
 * @param $objectName
 * @param $objectId
 * @param $links
 * @param $mask
 * @param $values
 */
function pricesetlogic_civicrm_links( $op, $objectName, $objectId, &$links, &$mask, &$values ) {
  if ($op == "contributionpage.configure.actions") {
    $bit = 2 ^ (sizeof($links));
    $new = array(
      "name" => "PriceSet Pricing Logic",
      "title" => "PriceSet: Pricing Logic",
      "url" => "civicrm/admin/contribute/pricing/logic",
      "qs" => "reset=1&id=".$objectId,
      "uniqueName" => "cvals",
      //"bit" => $bit
      "bit" => 10000
    );
    $links[] = $new;
  }
}