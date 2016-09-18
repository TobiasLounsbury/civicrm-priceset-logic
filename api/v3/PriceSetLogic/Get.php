<?php

/**
 * PriceSetLogic.Get API specification (optional)
 * This is used for documentation and validation.
 *
 * @param array $spec description of fields supported by this API call
 * @return void
 * @see http://wiki.civicrm.org/confluence/display/CRM/API+Architecture+Standards
 */
function _civicrm_api3_price_set_logic_get_spec(&$spec) {
    $spec['page_id']['api.required'] = 1;
    $spec['page_type']['api.required'] = 1;
}

/**
 * PriceSetLogic.Get API
 *
 * @param array $params
 * @return array API result descriptor
 * @see civicrm_api3_create_success
 * @see civicrm_api3_create_error
 * @throws API_Exception
 */
function civicrm_api3_price_set_logic_get($params) {
    if (array_key_exists('page_id', $params) && $params['page_id'] &&
      array_key_exists('page_type', $params) && $params['page_type']) {

        if($params['page_type'] == "contribution") {
            $result = civicrm_api3('ContributionPage', 'get', array(
              'sequential' => 1,
              'id' => $params['page_id'],
              'return' => "id"
            ));
        }
        if($params['page_type'] == "event") {
            $result = civicrm_api3('Event', 'get', array(
              'sequential' => 1,
              'id' => $params['page_id'],
              'return' => "id"
            ));
        }

        if (!$result || $result['is_error'] || $result['count'] < 1) {
            throw new API_Exception('ERROR: Page cannot be found', 14);
        }

        $vals = array(
          array($params['page_id'], 'Int'),
          array($params['page_type'], 'String'));
        $dao =& CRM_Core_DAO::executeQuery("SELECT * FROM `civicrm_pricesetlogic` WHERE `page_id` = %0 AND `page_type` = %1", $vals);
        if ($dao->fetch()) {
            $returnValues = $dao->toArray();
        } else {
            $returnValues = array();
        }

        if(!empty($returnValues)) {
            if (array_key_exists("cases", $returnValues) && !is_array($returnValues['cases'])) {
                $returnValues['cases'] = unserialize($returnValues['cases']);
            }

            if (!array_key_exists("cases", $returnValues)) {
                $returnValues['cases'] = array();
            }
        }


        return civicrm_api3_create_success($returnValues, $params, 'PriceSetLogic', 'Get');
    } else {
        throw new API_Exception('ERROR: Missing required param "page_id"', 12);
    }
}

