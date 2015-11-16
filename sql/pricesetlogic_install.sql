DROP TABLE IF EXISTS `civicrm_pricesetlogic`;
-- /*******************************************************
-- *
-- * pricesetlogic
-- *
-- * A custom table for building price changes based on the
-- * relationship between various price fields
-- *
-- *******************************************************/
CREATE TABLE `civicrm_pricesetlogic` (
  `page_id` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'Contribution Page ID',
  `is_active` tinyint(4) DEFAULT NULL COMMENT 'Is this Set active?',
  `cases` blob COMMENT 'The cases and corresponding values to be used in modifying prices',
  `page_type` varchar(45) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'contribution',
  PRIMARY KEY (`page_id`,`page_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
