-- Migration initiale : Création du schéma complet de la base de données
-- Version: 1.0

-- Vérifie si cette migration a déjà été appliquée
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = 1) THEN
        RAISE NOTICE 'Migration 001 already applied, skipping...';
        RETURN;
    END IF;
END $$;

-- Création des tables dans l'ordre pour éviter les problèmes de dépendances
\i /docker-entrypoint-initdb.d/migrations/tables/users.sql
\i /docker-entrypoint-initdb.d/migrations/tables/photos.sql
\i /docker-entrypoint-initdb.d/migrations/tables/interests.sql
\i /docker-entrypoint-initdb.d/migrations/tables/likes.sql
\i /docker-entrypoint-initdb.d/migrations/tables/visits.sql
\i /docker-entrypoint-initdb.d/migrations/tables/blocks.sql
\i /docker-entrypoint-initdb.d/migrations/tables/reports.sql
\i /docker-entrypoint-initdb.d/migrations/tables/messages.sql
\i /docker-entrypoint-initdb.d/migrations/tables/notifications.sql

-- Ajout des contraintes et index après la création de toutes les tables
\i /docker-entrypoint-initdb.d/migrations/constraints/foreign_keys.sql
\i /docker-entrypoint-initdb.d/migrations/constraints/indexes.sql

-- Enregistrement de la migration
INSERT INTO schema_migrations (version, name) VALUES (1, 'initial_schema');