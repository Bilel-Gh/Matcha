-- Migration: add_location_fields
-- Version: 003
-- Created at: 2024-06-17T16:35:00Z

-- Vérification que la migration n'a pas déjà été appliquée
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 3) THEN
        -- Ajout des colonnes de géolocalisation à la table users
        ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS location_source VARCHAR(20) DEFAULT 'unknown';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP;

        -- Index pour les requêtes géographiques
        CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);
        CREATE INDEX IF NOT EXISTS idx_users_location_source ON users(location_source);

        -- Enregistre que cette migration a été appliquée
        INSERT INTO schema_migrations (version, name)
        VALUES (3, 'add_location_fields');

        RAISE NOTICE 'Migration 003: Location fields added successfully';
    ELSE
        RAISE NOTICE 'Migration 003: Already applied, skipping...';
    END IF;
END $$;
