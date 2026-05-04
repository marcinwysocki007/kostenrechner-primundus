/*
  # Add AG address and contract fields to leads table

  ## Changes
  - Adds `ag_street` (text) – street + number of the Auftraggeber
  - Adds `ag_zip` (text) – postal code of the Auftraggeber
  - Adds `ag_city` (text) – city of the Auftraggeber
  - Adds `vertrags_beginn` (date) – contract start date
  - Adds `vertrags_ende` (date) – contract end date (null = unbefristet)
  - Adds `ort_unterzeichnung` (text) – place of signature on contract
  - Adds `tagessatz_override` (numeric) – manual override for daily rate
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'ag_street'
  ) THEN
    ALTER TABLE leads ADD COLUMN ag_street text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'ag_zip'
  ) THEN
    ALTER TABLE leads ADD COLUMN ag_zip text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'ag_city'
  ) THEN
    ALTER TABLE leads ADD COLUMN ag_city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'vertrags_beginn'
  ) THEN
    ALTER TABLE leads ADD COLUMN vertrags_beginn date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'vertrags_ende'
  ) THEN
    ALTER TABLE leads ADD COLUMN vertrags_ende date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'ort_unterzeichnung'
  ) THEN
    ALTER TABLE leads ADD COLUMN ort_unterzeichnung text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'tagessatz_override'
  ) THEN
    ALTER TABLE leads ADD COLUMN tagessatz_override numeric;
  END IF;
END $$;
