-- Ce fichier est le point d'entrée principal de votre base de données
-- Il est exécuté automatiquement par PostgreSQL au démarrage du conteneur

CREATE TABLE IF NOT EXISTS schema_migrations (
    version INT PRIMARY KEY,           -- Numéro unique de la migration
    name VARCHAR(255) NOT NULL,        -- Description de la migration
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Quand la migration a été appliquée
);
-- init.sql
-- Création de la table de suivi des migrations si elle n'existe pas encore
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exécution des migrations
\i /docker-entrypoint-initdb.d/migrations/001_initial_schema.sql
\i /docker-entrypoint-initdb.d/migrations/002_add_photos_table.sql
\i /docker-entrypoint-initdb.d/migrations/003_add_location_fields.sql
\i /docker-entrypoint-initdb.d/migrations/004_add_reason_to_blocks.sql

-- !!!! Exécution des seeds de dev qui crée des utilisateurs de test (à supprimer en prod) !!!!
\i /docker-entrypoint-initdb.d/seeds/development_seeds.sql
\i /docker-entrypoint-initdb.d/seeds/browsing_test_seeds.sql
\i /docker-entrypoint-initdb.d/seeds/chat_test_seeds.sql
