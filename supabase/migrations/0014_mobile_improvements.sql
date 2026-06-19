-- 0014_mobile_improvements.sql
-- Adds: task priority + recurrence + description, meal_item meal_type

-- tasks: new columns
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS description   text,
  ADD COLUMN IF NOT EXISTS priority      text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS recurrence    text;   -- null | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'custom:1,3,5'

-- meal_items: meal type (breakfast/lunch/dinner/snack/other)
ALTER TABLE meal_items
  ADD COLUMN IF NOT EXISTS meal_type text NOT NULL DEFAULT 'other'
    CHECK (meal_type IN ('breakfast','lunch','dinner','snack','other'));
