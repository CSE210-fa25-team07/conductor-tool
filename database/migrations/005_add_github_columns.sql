-- Migration: Add GitHub integration columns
-- Date: 2025-12-02

\c conductor_tool

-- Add github_access_token to users table for storing OAuth tokens
ALTER TABLE users
ADD COLUMN IF NOT EXISTS github_access_token TEXT;

-- Add github_activities to standup table for storing linked GitHub activities
ALTER TABLE standup
ADD COLUMN IF NOT EXISTS github_activities JSONB;
