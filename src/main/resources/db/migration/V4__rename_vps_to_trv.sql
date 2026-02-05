ALTER TABLE transactions RENAME COLUMN vps_amount_cents TO trv_amount_cents;

UPDATE wallets SET currency = 'TRV' WHERE currency = 'VPS';

UPDATE transactions SET type = 'CONVERT_USD_TO_TRV' WHERE type = 'CONVERT_USD_TO_VPS';
UPDATE transactions SET type = 'CONVERT_TRV_TO_USD' WHERE type = 'CONVERT_VPS_TO_USD';

