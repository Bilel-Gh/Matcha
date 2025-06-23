-- Migration: Add data column to notifications table
-- This adds support for storing structured data (user info, etc.) with notifications

ALTER TABLE notifications
ADD COLUMN data JSONB DEFAULT '{}';

-- Create an index on the data column for better performance when querying
CREATE INDEX idx_notifications_data_gin ON notifications USING GIN (data);

-- Create indexes for common data queries (with proper casting)
CREATE INDEX idx_notifications_data_visitor_id ON notifications ((data->'visitor'->>'id'));
CREATE INDEX idx_notifications_data_from_user_id ON notifications ((data->'from_user'->>'id'));
CREATE INDEX idx_notifications_data_match_user_id ON notifications ((data->'match_user'->>'id'));
