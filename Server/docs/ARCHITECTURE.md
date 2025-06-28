# Architecture du Serveur Matcha

## 📁 Structure des dossiers

```
src/
├── config/          # Configuration et variables d'environnement
│   ├── config.ts    # Configuration centralisée
│   ├── database.ts  # Configuration de la base de données
│   ├── swagger.ts   # Configuration Swagger
│   └── migrations/  # Scripts de migration de la DB
├── controllers/     # Contrôleurs (logique de présentation)
│   └── authController.ts
├── middlewares/     # Middlewares Express
│   ├── auth.ts      # Authentification JWT
│   ├── validation.ts # Validation des données
│   └── errorHandler.ts # Gestion globale des erreurs
├── repositories/    # Couche d'accès aux données
│   └── UserRepository.ts
├── routes/          # Définition des routes
│   └── auth.ts
├── services/        # Logique métier
│   └── AuthService.ts
├── types/           # Définitions TypeScript
│   ├── index.ts     # Export centralisé
│   ├── user.ts      # Types utilisateur
│   └── express.d.ts # Extension des types Express
├── utils/           # Utilitaires
│   ├── AppError.ts  # Classes d'erreurs personnalisées
├── app.ts           # Configuration de l'application Express
└── server.ts        # Point d'entrée du serveur
```

## 🏗️ Architecture en couches

### 1. **Présentation Layer (Controllers)**
- Gestion des requêtes HTTP
- Validation des entrées
- Formatage des réponses
- Délégation vers les services

### 2. **Business Logic Layer (Services)**
- Logique métier de l'application
- Orchestration des opérations
- Validation des règles business
- Communication avec les repositories

### 3. **Data Access Layer (Repositories)**
- Accès aux données de la base
- Requêtes SQL optimisées
- Abstraction de la persistance
- Gestion des transactions

### 4. **Infrastructure Layer**
- Configuration
- Middlewares
- Gestion d'erreurs
- Utilitaires

## 🔄 Flux de données

```
Request → Routes → Middleware → Controller → Service → Repository → Database
                     ↓
Response ← Error Handler ← Controller ← Service ← Repository ← Database
```

## 🛡️ Gestion des erreurs

- **AppError**: Classe d'erreur personnalisée avec code de statut
- **Async Handler**: Wrapper pour capturer les erreurs asynchrones
- **Global Error Handler**: Middleware centralisé pour toutes les erreurs

## 🔐 Sécurité

- Validation stricte des entrées
- Hachage des mots de passe avec bcrypt
- JWT pour l'authentification
- Middleware de protection des routes
- Configuration CORS sécurisée

## 📊 Base de données

- PostgreSQL avec requêtes SQL natives
- Migrations versionnées
- Pool de connexions optimisé
- Requêtes préparées pour éviter les injections SQL

## 🧪 Développement

- TypeScript strict pour la sécurité des types
- ESLint et Prettier pour la qualité du code
- Hot reload avec tsx
- Documentation API avec Swagger
- Variables d'environnement typées

## 📈 Monitoring et Logs

- Health check endpoint
- Logs structurés avec timestamp
- Gestion gracieuse des arrêts
- Capture des exceptions non gérées
