-- Migration: add_reason_to_blocks
-- Version: 004
-- Created at: 2024-12-20T10:00:00Z

-- Vérification que la migration n'a pas déjà été appliquée
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 4) THEN
        -- Ajout de la colonne reason à la table blocks
        ALTER TABLE blocks ADD COLUMN IF NOT EXISTS reason TEXT;

        -- Enregistre que cette migration a été appliquée
        INSERT INTO schema_migrations (version, name)
        VALUES (4, 'add_reason_to_blocks');

        RAISE NOTICE 'Migration 004: Reason column added to blocks table successfully';
    ELSE
        RAISE NOTICE 'Migration 004: Already applied, skipping...';
    END IF;
END $$;
