-- Add patient_data JSONB column to leads table
-- Stores structured patient information from the admin edit form

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS patient_data JSONB DEFAULT NULL;
