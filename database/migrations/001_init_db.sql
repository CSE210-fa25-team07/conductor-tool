-- Create database if it doesn't exist (this runs on the default 'postgres' database)
SELECT 'CREATE DATABASE conductor_tool'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'conductor_tool')\gexec

-- Enable pgcrypto extension
\c conductor_tool
CREATE EXTENSION IF NOT EXISTS pgcrypto;