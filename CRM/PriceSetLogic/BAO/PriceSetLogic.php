<?php

class CRM_PriceSetLogic_BAO_PriceSetLogic {

  static $_nullObject = NULL;

  /**
   * This function returns a set of cases
   *
   * @param $PageType
   * @param $PageID
   * @return bool
   * @throws CiviCRM_API3_Exception
   */
  static function getSet($PageType, $PageID) {
    if (!$PageID) {
      return false;
    }

    $result = civicrm_api3('PriceSetLogic', 'Get', array(
      'page_type' => $PageType,
      'page_id' => $PageID
    ));

    if ($result['is_error'] || $result['count'] == 0) {
      return false;
    }

    return $result['values'];
  }


  /**
   * This function returns all the fields in a price set
   *
   * @param $priceSetId
   * @return array
   * @throws CiviCRM_API3_Exception
   */
  static function getPriceSetFields($priceSetId) {
    $fields = array();

    if($priceSetId) {
      $result = civicrm_api3("PriceSet", "get", array(
        'sequential' => 1,
        'id' => $priceSetId,
        'api.PriceField.get' => array(
          'options' => array('limit' => 0),
          'api.Price$fieldValue.get' => array('sequential' => 1, 'options' => array('limit' => 0)),
        ),
      ));

      $priceSetTitle = $result['values'][0]['title'];

      foreach ($result['values'][0]['api.PriceField.get']['values'] as $field) {
        $fields[$field['id']] = array(
          "label" => $field['label'],
          "is_enter_qty" => $field['is_enter_qty'],
          "name" => $field['name'],
          "id" => $field['id'],
          "html_type" => strtolower($field['html_type']),
          "type" => "price",
        );


        if ($field['is_enter_qty'] == 0) {
          $values = array();
          foreach ($field['api.Price$fieldValue.get']['values'] as $value) {
            $values[$value['id']] = array(
              'label' => $value['label'],
              'id' => $value['id'],
              'price' => $value['amount'],

            );
          }
          $fields[$field['id']]['values'] = $values;
        } else {
          $fields[$field['id']]['price'] = $field['api.Price$fieldValue.get']['values'][0]['amount'];
        }
      }
    }
    return array($fields, $priceSetTitle);
  }


  /**
   * This function takes a list of profiles and returns
   * an array of all the fields those profiles contain.
   *
   * @param $profiles
   * @throws CiviCRM_API3_Exception
   */
  static function getProfileFields($profiles) {
    $ProfileFields = array();
    $customFields = array();
    $optionsToFetch = array();
    $importableFields = array();

    if (!empty($profiles) && !is_null($profiles[0])) {
      //gender_id, communication_style_id, CRM_Core_PseudoConstant::get('CRM_Contact_DAO_Contact', $fieldName);
      //checkbox: preferred_communication_method
      //select: preferred_mail_format, preferred_language
      //CRM_Contact_BAO_Contact::buildOptions('preferred_language'));
      //contains(date) = date

      $result = civicrm_api3('UFField', 'get', array(
        'sequential' => 1,
        'return' => "field_name,label,location_type_id,phone_type_id,uf_group_id,html_type",
        'uf_group_id' => array('IN' => $profiles),
        'field_type' => array('!=' => "Formatting"),
        'options' => array('sort' => "uf_group_id"),
        'is_active' => 1,
      ));

      foreach ($result['values'] as $field) {
        $ProfileFields[$field['field_name']] = $field;
        if (substr($field['field_name'], 0, 6) == "custom") {
          $customFields[] = str_replace("custom_", "", $field['field_name']);
          $ProfileFields[$field['field_name']]['type'] = "custom";
        } elseif (substr($field['field_name'], 0, 7) == "country") {
          unset($ProfileFields[$field['field_name']]);
          $fieldLocation = CRM_Utils_Array::value("location_type_id", $field, "Primary");
          $field['field_name'] = $field['field_name'] ."-". $fieldLocation;
          $ProfileFields[$field['field_name']] = $field;
          $ProfileFields[$field['field_name']]['html_type'] = "country";
          $ProfileFields[$field['field_name']]['type'] = "country";
        } elseif (substr($field['field_name'], 0, 5) == "state") {
          unset($ProfileFields[$field['field_name']]);
          $fieldLocation = CRM_Utils_Array::value("location_type_id", $field, "Primary");
          $field['field_name'] = $field['field_name'] ."-". $fieldLocation;
          $ProfileFields[$field['field_name']] = $field;
          $ProfileFields[$field['field_name']]['html_type'] = "state";
          $ProfileFields[$field['field_name']]['type'] = "state";
        } elseif (substr($field['field_name'], 0, 5) == "phone") {
          //todo: Handle location and phone types
          $ProfileFields[$field['field_name']]['html_type'] = "phone";
          $ProfileFields[$field['field_name']]['type'] = "phone";
        } elseif (substr($field['field_name'], 0, 5) == "email") {
          //todo: Handle location type
          $ProfileFields[$field['field_name']]['html_type'] = "email";
          $ProfileFields[$field['field_name']]['type'] = "email";
        } else {


          //Get some field metadata if we don't have it.
          if(empty($importableFields)) {
            $importableFields = CRM_Contact_BAO_Contact::importableFields('All', FALSE, TRUE, FALSE, TRUE, TRUE);
          }

          $ProfileFields[$field['field_name']]['html_type'] = strtolower($importableFields[$field['field_name']]["html"]["type"]);
          $ProfileFields[$field['field_name']]['type'] = "core";

          if (array_key_exists("pseudoconstant", $importableFields[$field['field_name']])) {
            $result = civicrm_api3('OptionValue', 'get', array(
                'sequential' => 1,
                'return' => array("id", "label", "value", "name", "weight"),
                'option_group_id' => $importableFields[$field['field_name']]['pseudoconstant']['optionGroupName'],
                'is_active' => 1,
            ));
            $ProfileFields[$field['field_name']]['values'] = $result['values'];
          }

        }
      }

      //Get the field types for the Custom Fields
      if (!empty($customFields)) {
        $result = civicrm_api3('CustomField', 'get', array(
          'id' => array('IN' => $customFields),
          'return' => "html_type,option_group_id,data_type",
        ));

        //And attach them to their corresponding entry

        foreach ($result['values'] as $id => $field) {
          $ProfileFields['custom_' . $id]['html_type'] = strtolower($field['html_type']);
          $ProfileFields['custom_' . $id]['data_type'] = strtolower($field['data_type']);
          if (array_key_exists("option_group_id", $field)) {
            $optionsToFetch[$field['option_group_id']][] = 'custom_' . $id;
            $ProfileFields['custom_' . $id]['values'] = array();
          }
        }
      }
    }


    //Now Do all that again for the Core Fields
    //todo: figure out if core are any different

    //Fetch the multiple choice options
    if (!empty($optionsToFetch)) {
      //Fetch the Options
      $result = civicrm_api3('OptionValue', 'get', array(
        'sequential' => 1,
        'return' => "id,label,value,option_group_id",
        'option_group_id' => array('IN' => array_keys($optionsToFetch)),
      ));

      //Shove the options into their respective fields
      foreach ($result['values'] as $option) {
        foreach ($optionsToFetch[$option['option_group_id']] as $key)
          $ProfileFields[$key]['values'][$option['id']] = $option;
          //$ProfileFields[$key]['values'][] = $option;
      }
    }

    return $ProfileFields;
  }

  /**
   * This function recursively evaluates a case
   *
   * @param $case
   * @param $form
   * @param $pageType
   * @param $set
   * @return boolean
   */
  static function evaluateCase($case, &$form, $pageType, &$set) {
    if($case['type'] == 'union') {
      if ($case['op'] == 'and') {
        $result = true;
        foreach($case['slot'] as $slot) {
          if(!$result) {
            return false;
          }
          $result = $result && CRM_PriceSetLogic_BAO_PriceSetLogic::evaluateCondition($slot, $form, $pageType, $set);
        }
        return $result;
      } elseif ($case['op'] == 'or') {
        $result = false;
        foreach($case['slot'] as $slot) {
          if($result) {
            return true;
          }
          $result = $result || CRM_PriceSetLogic_BAO_PriceSetLogic::evaluateCondition($slot, $form, $pageType, $set);
        }
        return $result;
      }
    } elseif ($case['type'] == 'condition') {
      return CRM_PriceSetLogic_BAO_PriceSetLogic::evaluateCondition($case, $form, $pageType, $set);
    }
    return false;
  }

  /**
   * This function evaluates a single condition to determine
   * if we should modify the prices
   *
   * @param $condition
   * @param $form
   * @param $pageType
   * @param $set
   * @return boolean
   */
  static function evaluateCondition($condition, &$form, $pageType, &$set) {

    //Short circuit the evaluation for civiDiscount codes.
    //They are always true because they aren't really part of Pricing Logic
    //but a pseudo-condition used to help the two projects play nice.
    if($condition['field'] == "cividiscount") {
      return true;
    }

    //Call the backend evaluation function for a javascript condition
    if($condition['field'] == "javascript") {
      return CRM_PriceSetLogic_BAO_PriceSetLogic::javascriptCondition($condition['value'], $form, $pageType);
    }


    $fieldName = (is_numeric($condition['field'])) ? "price_".$condition['field'] : $condition['field'];
    $fieldVal = $form->_submitValues[$fieldName];

    switch( $condition['op'] ) {
      case '=':
        return ($fieldVal == $condition['value']);
      case '<':
        return ($fieldVal < $condition['value']);
      case '>':
        return ($fieldVal > $condition['value']);
      case '<>':
        return ($fieldVal != $condition['value']);
      case 'regex':
        if($fieldVal) {
          return (preg_match($condition['value'], $fieldVal));
        } else {
          return false;
        }
      case 'empty':
        return empty($fieldVal);
      case 'not-empty':
        return !empty($fieldVal);
      case 'checked':
        if(is_array($condition['option'])) {
          $condition['option'] = $condition['option'][0];
        }

        if(!is_numeric($condition['field'])) {
          $key = $set['profileFields'][$fieldName]['values'][$condition['option']]['value'];
        } else {
          $key = $condition['option'];
        }


        return (array_key_exists($key, $fieldVal) && $fieldVal[$key] == 1);
      case 'not-checked':
        if(is_array($condition['option'])) {
          $condition['option'] = $condition['option'][0];
        }
        return (!array_key_exists($condition['option'], $fieldVal) || !($fieldVal[$condition['option']] == 1));
      case 'selected':
        if (is_array($condition['option'])) {
          return ($fieldVal == $condition['option'][0]);
        } else {
          return ($fieldVal == $condition['option']);
        }
      case 'not-selected':
        if (is_array($condition['option'])) {
          return !($fieldVal == $condition['option'][0]);
        } else {
          return !($fieldVal == $condition['option']);
        }
      case 'in':
        if (is_array($condition['option'])) {
          return in_array($fieldVal, $condition['option']);
        } else {
          return ($fieldVal == $condition['option']);
        }
      case 'not-in':
        if (is_array($condition['option'])) {
          return !(in_array($fieldVal, $condition['option']));
        } else {
          return !($fieldVal == $condition['option']);
        }
      default:
        return false;
    }
  }


  /**
   * This function spawns a hook that corresponds to the
   * custom javascript condition
   *
   * @param $javascript
   * @param $form
   * @param $pageType
   */
  static function javascriptCondition($javascript, $form, $pageType) {
    return CRM_Utils_Hook::singleton()->invoke(3, $javascript, $form, $pageType,
      self::$_nullObject, self::$_nullObject, self::$_nullObject,
      'pricinglogic_javascript_backend'
    );
  }
}
