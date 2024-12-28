# Guide des Migrations de Base de Données - Projet Matcha

## Vue d'ensemble

Ce document explique comment sont gérées les migrations de base de données dans notre projet Matcha. Les migrations permettent de versionner et suivre l'évolution de notre schéma de base de données de manière contrôlée et sécurisée.

## Structure du Projet

```
Server/
└── src/
    └── config/
        ├── init.sql                    # Point d'entrée principal
        ├── migrations/                 # Dossier des migrations
        │   ├── tables/                 # Définitions des tables
        │   ├── constraints/            # Contraintes et index
        │   └── XXX_description.sql     # Fichiers de migration
        └── seeds/                      # Données de test
```

## Commandes Disponibles

Pour gérer les migrations, nous disposons des scripts npm suivants :

```bash
# Réinitialise complètement la base de données (⚠️ Supprime toutes les données)
npm run db:reset

# Vérifie l'état des migrations appliquées
npm run db:status

# Crée une nouvelle migration
npm run db:create-migration <nom_migration>

# Applique les migrations en attente
npm run db:migrate

# Ajoute des données de test
npm run db:seed
```

## Guide des Migrations

### Règles Essentielles

1. **Numérotation Unique**: Chaque migration doit avoir un numéro séquentiel unique (001, 002, etc.)
2. **Idempotence**: Une migration doit pouvoir être exécutée plusieurs fois sans erreur
3. **Documentation**: Chaque changement doit être clairement documenté
4. **Atomicité**: Les modifications doivent être exécutées dans une seule transaction

### Création d'une Nouvelle Migration

1. Générez le fichier de migration :
```bash
npm run db:create-migration add_new_feature
```

2. Le fichier sera créé avec ce format :
```sql
-- XXX_add_new_feature.sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM schema_migrations 
        WHERE version = 'XXX'
    ) THEN
        -- Vos modifications ici
        
        -- Enregistrement de la migration
        INSERT INTO schema_migrations (version, name) 
        VALUES ('XXX', 'add_new_feature');
    END IF;
END $$;
```

### Bonnes Pratiques

1. **Vérification Avant Déploiement**:
   - Testez toujours vos migrations en local
   - Vérifiez que la migration s'exécute sans erreur
   - Assurez-vous que la migration peut être exécutée plusieurs fois

2. **Documentation**:
   - Ajoutez des commentaires expliquant le BUT de la migration
   - Documentez tout changement important ou comportement particulier
   - Incluez la date et l'auteur de la migration

3. **Sécurité**:
   - Ne jamais inclure de données sensibles
   - Vérifier les permissions nécessaires
   - Faites attention aux performances sur les grosses tables

## Environnements

### Développement
- Utilisez `db:reset` librement pour tester
- Les données de test sont disponibles via `db:seed`
- Vérifiez régulièrement l'état avec `db:status`

### Production
- Ne JAMAIS utiliser `db:reset`
- Utilisez uniquement `db:migrate`
- Testez toujours les migrations en staging d'abord

## Exemples

### 1. Ajout d'une Colonne
```sql
-- 002_add_verification_token.sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM schema_migrations WHERE version = 2
    ) THEN
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS verification_token VARCHAR;

        INSERT INTO schema_migrations (version, name) 
        VALUES (2, 'add_verification_token');
    END IF;
END $$;
```

### 2. Création d'une Nouvelle Table
```sql
-- 003_create_matches_table.sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM schema_migrations WHERE version = 3
    ) THEN
        CREATE TABLE IF NOT EXISTS matches (
            id SERIAL PRIMARY KEY,
            user1_id INTEGER REFERENCES users(id),
            user2_id INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW()
        );

        INSERT INTO schema_migrations (version, name) 
        VALUES (3, 'create_matches_table');
    END IF;
END $$;
```

## Résolution des Problèmes Courants

1. **La migration ne s'applique pas**:
   - Vérifiez que le numéro de version est unique
   - Vérifiez les permissions de l'utilisateur PostgreSQL
   - Consultez les logs avec `docker-compose logs database`

2. **Erreur de dépendance**:
   - Assurez-vous que les tables/colonnes référencées existent
   - Vérifiez l'ordre des migrations

3. **Perte de données**:
   - Faites toujours une sauvegarde avant les migrations
   - Utilisez des clauses IF NOT EXISTS appropriées

## Support et Maintenance

Pour toute question ou problème :
1. Consultez d'abord ce README
2. Vérifiez les logs de la base de données
3. Contactez l'équipe de développement

Dernière mise à jour : {date_actuelle}