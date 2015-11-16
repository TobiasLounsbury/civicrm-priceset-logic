<?php

/**
 * PriceSetLogic.ToggleSet API specification (optional)
 * This is used for documentation and validation.
 *
 * @param array $spec description of fields supported by this API call
 * @return void
 * @see http://wiki.civicrm.org/confluence/display/CRM/API+Architecture+Standards
 */
function _civicrm_api3_price_set_logic_toggleset_spec(&$spec) {
    $spec['status']['api.required'] = 1;
    $spec['page_id']['api.required'] = 1;
    $spec['page_type']['api.required'] = 1;
}

/**
 * PriceSetLogic.ToggleSet API
 *
 * @param array $params
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_price_set_logic_toggleset($params) {
    if (array_key_exists('page_id', $params) && $params['page_id']) {
        if (array_key_exists('status', $params) && !is_null($params['status'])) {


            $values = array(
              0 => array($params['status'], "Int"),
              1 => array($params['page_id'], "Int"),
              2 => array(serialize(array()), "String"),
              3 => array($params['page_type'], "String")
            );
            $sql = "INSERT INTO `civicrm_pricesetlogic` (`is_active`, `page_id`, `cases`, `page_type`) VALUES(%0, %1, %2, %3) ON DUPLICATE KEY UPDATE `is_active` = %0";
            $dao =& CRM_Core_DAO::executeQuery($sql, $values);

            if ($dao) {
                $returnValues = array(true);
            } else {
                $returnValues = array(false);
            }


            return civicrm_api3_create_success($returnValues, $params, 'PriceSetLogic', 'ToggleSet');
        } else {
            throw new API_Exception("ERROR: Missing Required Field 'status'", 13);
        }
    } else {
        throw new API_Exception("ERROR: Missing Required Field 'page_id'", 12);
    }
}

