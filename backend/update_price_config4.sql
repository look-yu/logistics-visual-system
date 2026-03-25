SET NAMES utf8mb4;
UPDATE price_config SET goods_type_multiplier = '{"normal":1,"fresh":1.5,"electronics":1.3,"dangerous":2,"valuable":2.5,"large":1.8}' WHERE id = 1;
