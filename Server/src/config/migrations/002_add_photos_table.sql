-- Migration: add_photos_table
-- Version: 002
-- Created at: 2024-01-01T12:00:00Z

-- Vérification que la migration n'a pas déjà été appliquée
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = 2) THEN
        -- Création de la table photos
        CREATE TABLE IF NOT EXISTS photos (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            filename VARCHAR(255) NOT NULL,
            url VARCHAR(500) NOT NULL,
            is_profile BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW(),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Index pour optimiser les requêtes par user_id
        CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);

        -- Index pour optimiser la recherche de la photo de profil
        CREATE INDEX IF NOT EXISTS idx_photos_profile ON photos(user_id, is_profile);

        -- Ajout d'une colonne profile_picture_url à la table users
        ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);

        -- Enregistre que cette migration a été appliquée
        INSERT INTO schema_migrations (version, name)
        VALUES (2, 'add_photos_table');

        RAISE NOTICE 'Migration 002: Photos table created successfully';
    ELSE
        RAISE NOTICE 'Migration 002: Already applied, skipping...';
    END IF;
END $$;
