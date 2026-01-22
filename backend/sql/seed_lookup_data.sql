INSERT INTO `lookup_categories` (`label`)
VALUES
  ('유입소스'),
  ('제품라인'),
  ('지역'),
  ('세그먼트'),
  ('파이프라인 단계')
ON DUPLICATE KEY UPDATE
  `label` = VALUES(`label`);

INSERT INTO `lookup_values` (`category_id`, `label`, `probability`, `sort_order`)
SELECT c.id, v.label, v.probability, v.sort_order
FROM (
  SELECT '유입소스' AS category_label, '문의(웹/매일)' AS label, NULL AS probability, 1 AS sort_order
  UNION ALL SELECT '유입소스', '소개', NULL, 2
  UNION ALL SELECT '유입소스', '전시/세미나', NULL, 3
  UNION ALL SELECT '유입소스', '재접촉', NULL, 4
  UNION ALL SELECT '유입소스', '콜드', NULL, 5
  UNION ALL SELECT '유입소스', '파트너', NULL, 6
  UNION ALL SELECT '제품라인', 'SI(프로젝트)', NULL, 1
  UNION ALL SELECT '제품라인', '유지보수', NULL, 2
  UNION ALL SELECT '제품라인', 'PoC/데모', NULL, 3
  UNION ALL SELECT '제품라인', '구독/라이센스', NULL, 4
  UNION ALL SELECT '제품라인', 'HW+SW', NULL, 5
  UNION ALL SELECT '지역', '수도권', NULL, 1
  UNION ALL SELECT '지역', '영남', NULL, 2
  UNION ALL SELECT '지역', '호남', NULL, 3
  UNION ALL SELECT '지역', '충청', NULL, 4
  UNION ALL SELECT '지역', '강원', NULL, 5
  UNION ALL SELECT '지역', '제주', NULL, 6
  UNION ALL SELECT '지역', '해외', NULL, 7
  UNION ALL SELECT '세그먼트', 'Enterprise', NULL, 1
  UNION ALL SELECT '세그먼트', 'SMB', NULL, 2
  UNION ALL SELECT '세그먼트', '공공', NULL, 3
  UNION ALL SELECT '세그먼트', '제조', NULL, 4
  UNION ALL SELECT '세그먼트', '에너지', NULL, 5
  UNION ALL SELECT '세그먼트', '조선/해양', NULL, 6
  UNION ALL SELECT '세그먼트', '건설', NULL, 7
  UNION ALL SELECT '파이프라인 단계', '자격확인(가능성판단)', 0.10, 1
  UNION ALL SELECT '파이프라인 단계', '요구사항/기술검토', 0.25, 2
  UNION ALL SELECT '파이프라인 단계', '제안/견적', 0.50, 3
  UNION ALL SELECT '파이프라인 단계', '협상/계약', 0.75, 4
  UNION ALL SELECT '파이프라인 단계', '수주', 1.00, 5
  UNION ALL SELECT '파이프라인 단계', '실주', 0.00, 6
) v
JOIN `lookup_categories` c ON c.label = v.category_label
ON DUPLICATE KEY UPDATE
  `label` = VALUES(`label`),
  `probability` = VALUES(`probability`),
  `sort_order` = VALUES(`sort_order`);
