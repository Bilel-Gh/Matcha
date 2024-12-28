const fs = require('fs');
const path = require('path');

// Obtient le numéro de la prochaine migration
const getNextMigrationNumber = () => {
    const migrationsPath = path.join(__dirname, '../src/config/migrations');
    const files = fs.readdirSync(migrationsPath);
    const numbers = files
        .map(file => parseInt(file.split('_')[0]))
        .filter(num => !isNaN(num));

    return (Math.max(...numbers, 0) + 1).toString().padStart(3, '0');
};

// Obtient le nom de la migration depuis les arguments
const migrationName = process.argv[2];
if (!migrationName) {
    console.error('Usage: npm run db:create-migration <migration_name>');
    process.exit(1);
}

// Crée le nouveau fichier de migration
const nextNumber = getNextMigrationNumber();
const fileName = `${nextNumber}_${migrationName}.sql`;
const filePath = path.join(__dirname, '../src/config/migrations', fileName);

const template = `-- Migration: ${migrationName}
-- Version: ${nextNumber}
-- Created at: ${new Date().toISOString()}

-- Vérification que la migration n'a pas déjà été appliquée
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = ${nextNumber}) THEN
        -- Ajoutez vos modifications de schéma ici
        -- Exemple :
        -- CREATE TABLE nouvelle_table (
        --     id SERIAL PRIMARY KEY,
        --     name VARCHAR NOT NULL
        -- );

        -- Enregistre que cette migration a été appliquée
        INSERT INTO schema_migrations (version, name) 
        VALUES (${nextNumber}, '${migrationName}');
    END IF;
END $$;
`;

fs.writeFileSync(filePath, template);
console.log(`Created new migration: ${fileName}`);