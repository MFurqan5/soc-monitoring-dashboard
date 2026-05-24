-- Attack logs written by honeypot, READ by your dashboard
CREATE TABLE IF NOT EXISTS attack_logs (
  id              SERIAL PRIMARY KEY,
  timestamp       TIMESTAMPTZ DEFAULT NOW(),
  source_ip       VARCHAR(45),
  source_port     INTEGER,
  method          VARCHAR(10),
  path            TEXT,
  payload         TEXT,
  attack_type     VARCHAR(50),   -- 'sqli', 'xss', 'bruteforce', 'traversal'
  severity        VARCHAR(20),   -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  user_agent      TEXT,
  tool_detected   VARCHAR(100),
  os_fingerprint  VARCHAR(100),
  session_id      VARCHAR(100),
  response_code   INTEGER
);

-- Attacker profiles enriched by honeypot GeoIP service
CREATE TABLE IF NOT EXISTS attacker_profiles (
  ip                VARCHAR(45) PRIMARY KEY,
  first_seen        TIMESTAMPTZ,
  last_seen         TIMESTAMPTZ,
  total_requests    INTEGER DEFAULT 0,
  threat_score      INTEGER DEFAULT 0,   -- 0 to 100
  country           VARCHAR(100),
  city              VARCHAR(100),
  isp               VARCHAR(200),
  os                VARCHAR(100),
  tool              VARCHAR(100),
  is_known_malicious BOOLEAN DEFAULT FALSE,
  sqli_count        INTEGER DEFAULT 0,
  xss_count         INTEGER DEFAULT 0,
  bruteforce_count  INTEGER DEFAULT 0,
  traversal_count   INTEGER DEFAULT 0
);

-- for creating these tables, you can run the following SQL commands in your PostgreSQL database:
-- psql -U postgres -d honeypot -f server/db/schema.sql



-- How to use psql after adding PostGreSql bin path to your system environment variables:
-- 1. Open Command Prompt (Windows) or Terminal (Mac/Linux).
-- 3. If you have set up a default database and user, you can connect by typing `psql -U your_username -d your_database_name` and pressing Enter.
-- 4. If you haven't set up a default database, you can connect to the default 'postgres' database by typing `psql -U your_username -d postgres` and pressing Enter.
-- 5. You should now be connected to the PostgreSQL database and can execute SQL commands.
-- Navigation \l List all databases
-- \c database_name Connect to a specific database 
-- \dt List all tables in the current database
-- \q Quit psql
-- Inspection \dt List all tables in the current database
-- \d table_name Describe the structure of a specific table
-- SELECT * FROM table_name; Retrieve all records from a specific table
-- INSERT INTO table_name (column1, column2) VALUES (value1, value2); Insert a new record into a specific table
-- UPDATE table_name SET column1 = value1 WHERE condition; Update existing records in a specific table
-- DELETE FROM table_name WHERE condition; Delete records from a specific table
-- CREATE TABLE table_name (column1 data_type, column2 data_type, ...); Create a new table with specified columns and data types
-- DROP TABLE table_name; Delete a specific table from the database
-- ALTER TABLE table_name ADD COLUMN column_name data_type; Add a new column to an existing table
-- ALTER TABLE table_name DROP COLUMN column_name; Remove a column from an existing table
-- ALTER TABLE table_name RENAME TO new_table_name; Rename an existing table
-- ALTER TABLE table_name RENAME COLUMN old_column_name TO new_column_name; Rename a column in an existing table

-- If you accidentally hit Enter on an SQL query without adding the semicolon, psql will move to a new line and show a postgres-# prompt. Simply type ; on the new line and press Enter to run it.
