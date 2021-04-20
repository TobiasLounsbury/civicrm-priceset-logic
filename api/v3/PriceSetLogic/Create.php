<?php

/**
 * PriceSetLogic.Create API specification (optional)
 * This is used for documentation and validation.
 *
 * @param array $spec description of fields supported by this API call
 * @return void
 * @see http://wiki.civicrm.org/confluence/display/CRM/API+Architecture+Standards
 */
function _civicrm_api3_price_set_logic_create_spec(&$spec) {
  $spec['page_id']['api.required'] = 1;
  $spec['page_type']['api.required'] = 1;
  $spec['cases']['api.required'] = 1;
}

/**
 * PriceSetLogic.Create API
 *
 * @param array $params
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_price_set_logic_create($params) {
  //Make sure we are getting data
  if (!array_key_exists('cases', $params) || !is_array($params['cases'])) {
    throw new API_Exception("Invalid input: 'cases' is a required field and must be an array", 789);
  }

  //Make sure we have a page to associate this set with.
  if (!array_key_exists('page_id', $params) ||  !$params['page_id']) {
    throw new API_Exception("Invalid or missing required field page_id", 790);
  }

  //Make sure it is a valid page.
  //This needs to be expanded to take into account event registration pages with price-sets
  //$p = array();
  //$page = civicrm_api("Page", "Get", $p);
  //if ($page['is_error'] == 1 || $page['count'] == 0) {
  //throw new API_Exception("That does not seem to be a valid contribution page", 791);
  //}

  //Should we validate that all items in the cases and value set are
  // Actually part of the price-set and/or included profiles?
  //validate_data($params['page_id'], $params['cases']);

  $cases = (array_key_exists('cases', $params)) ? $params['cases'] : array();

  if (is_array($cases)) {
    $cases = serialize($cases);
  }

  $active = (array_key_exists("is_active", $params)) ? $params['is_active'] : 0;
  $vals = array(
      0 => array($params['page_id'], "Int"),
      1 => array($active, "Int"),
      2 => array($cases, "String"),
      3 => array($params['page_type'], "String")
  );
  $dao =& CRM_Core_DAO::executeQuery("INSERT INTO  `civicrm_pricesetlogic` (`page_id`, `is_active`, `cases`, `page_type`) VALUES (%0, %1, %2, %3) ON DUPLICATE KEY UPDATE `is_active` = %1, `cases` = %2", $vals);

  if ($dao) {
    $returnValues = array(true);
  } else {
    $returnValues = array(false);
  }

  return civicrm_api3_create_success($returnValues, $params, 'PriceSetLogic', 'Create');
}

