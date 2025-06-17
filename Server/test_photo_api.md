# Test de l'API Photos - Matcha

## 🚀 Configuration de base

**Base URL:** `http://localhost:3001`

### 1. Obtenir un token d'authentification

```bash
# Login pour obtenir un token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Copier le token retourné et l'utiliser dans les tests suivants**

---

## 📸 Tests de l'API Photos

### 2. Récupérer les photos de l'utilisateur

```bash
curl -X GET http://localhost:3001/api/profile/photos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Réponse attendue:**
```json
{
  "status": "success",
  "data": {
    "photos": [],
    "count": 0,
    "max_photos": 5,
    "has_profile_picture": false
  }
}
```

### 3. Upload d'une photo

```bash
# Créer une image de test (si besoin)
curl -o test_image.jpg "https://via.placeholder.com/600x400/0066cc/ffffff?text=Test+Photo"

# Upload de la photo
curl -X POST http://localhost:3001/api/profile/photos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "photo=@test_image.jpg"
```

**Réponse attendue:**
```json
{
  "status": "success",
  "data": {
    "success": true,
    "photo": {
      "id": 1,
      "filename": "1_1704123456_abc123.jpg",
      "url": "/uploads/photos/1_1704123456_abc123.jpg",
      "is_profile": false,
      "created_at": "2024-01-01T12:00:00Z"
    },
    "count": 1
  }
}
```

### 4. Définir une photo comme photo de profil

```bash
# Remplacer 1 par l'ID de la photo uploadée
curl -X PUT http://localhost:3001/api/profile/photos/1/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Réponse attendue:**
```json
{
  "status": "success",
  "data": {
    "photo": {
      "id": 1,
      "filename": "1_1704123456_abc123.jpg",
      "url": "/uploads/photos/1_1704123456_abc123.jpg",
      "is_profile": true,
      "created_at": "2024-01-01T12:00:00Z"
    },
    "message": "Profile photo updated successfully"
  }
}
```

### 5. Vérifier que le profil inclut les informations photo

```bash
curl -X GET http://localhost:3001/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Réponse attendue (avec nouvelles données photos):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "has_profile_picture": true,
    "profile_picture_url": "/uploads/photos/1_1704123456_abc123.jpg",
    "photos_count": 1,
    // ... autres champs du profil
  }
}
```

### 6. Supprimer une photo

```bash
# Remplacer 1 par l'ID de la photo à supprimer
curl -X DELETE http://localhost:3001/api/profile/photos/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Réponse attendue:**
```json
{
  "status": "success",
  "message": "Photo deleted successfully"
}
```

---

## 🧪 Tests de validation

### Test de limite de photos (5 max)

```bash
# Uploader 5 photos pour tester la limite
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/profile/photos \
    -H "Authorization: Bearer YOUR_TOKEN_HERE" \
    -F "photo=@test_image.jpg"
  echo "Photo $i uploaded"
  sleep 1
done
```

**La 6e photo devrait retourner une erreur 400:**
```json
{
  "status": "error",
  "message": "Maximum 5 photos allowed"
}
```

### Test de validation de fichier

```bash
# Créer un fichier texte pour tester
echo "This is not an image" > test.txt

# Tenter d'uploader un fichier non-image
curl -X POST http://localhost:3001/api/profile/photos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "photo=@test.txt"
```

**Réponse attendue (erreur 400):**
```json
{
  "status": "error",
  "message": "Only JPEG and PNG files are allowed"
}
```

### Test de fichier trop volumineux

```bash
# Créer un fichier de plus de 5MB pour le test
dd if=/dev/zero of=large_file.jpg bs=1M count=6

# Tenter l'upload
curl -X POST http://localhost:3001/api/profile/photos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "photo=@large_file.jpg"
```

**Réponse attendue (erreur 400):**
```json
{
  "status": "error",
  "message": "File size must be under 5MB"
}
```

---

## 🔍 Vérification des fichiers

### Accès aux images via URL

```bash
# Une fois une photo uploadée, vérifier qu'elle est accessible
curl -I http://localhost:3001/uploads/photos/FILENAME_FROM_RESPONSE
```

**Réponse attendue:** Status 200 avec headers d'image

---

## 📊 Documentation Swagger

L'API est documentée dans Swagger : `http://localhost:3001/api/docs`

Rechercher la section **Photos** pour tester interactivement.

---

## ✅ Checklist de validation

- [ ] ✅ Authentification requise pour tous les endpoints
- [ ] ✅ Upload de photo JPEG/PNG fonctionne
- [ ] ✅ Validation de type de fichier
- [ ] ✅ Validation de taille de fichier (5MB max)
- [ ] ✅ Limite de 5 photos par utilisateur
- [ ] ✅ Définition de photo de profil
- [ ] ✅ Suppression de photo
- [ ] ✅ Mise à jour du profil utilisateur avec infos photos
- [ ] ✅ Accès aux fichiers via URLs
- [ ] ✅ Gestion des erreurs appropriée
- [ ] ✅ Nettoyage automatique des fichiers lors de suppression

---

## 🛠️ Dépannage

### Base de données
```bash
# Vérifier que la table photos existe
docker compose exec database psql -U postgres -d matcha -c "\dt"
```

### Répertoire uploads
```bash
# Vérifier que le répertoire existe
ls -la Server/uploads/photos/
```

### Logs du serveur
```bash
# Surveiller les logs pour les erreurs
cd Server && npm run dev
```
