# Instructions pour créer le bucket `cabinet-assets`

## Méthode recommandée : Via l'interface Supabase

### Étape 1 : Créer le bucket

1. Allez sur https://supabase.com et connectez-vous
2. Ouvrez votre projet
3. Dans le menu de gauche, cliquez sur **"Storage"**
4. Cliquez sur le bouton **"New bucket"** (en haut à droite)
5. Configurez le bucket avec les paramètres suivants :
   - **Name**: `cabinet-assets`
   - **Public bucket**: ✅ **Activé** (très important - cochez cette case)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/gif`
     - `image/webp`
     - `image/svg+xml`
6. Cliquez sur **"Create bucket"**

### Étape 2 : Configurer les politiques RLS

Après avoir créé le bucket, vous devez configurer les politiques de sécurité :

1. Dans la page Storage, cliquez sur le bucket **`cabinet-assets`**
2. Allez dans l'onglet **"Policies"**
3. Cliquez sur **"New Policy"**

#### Politique 1 : Lecture publique

- **Policy name**: `Public Access for cabinet-assets`
- **Allowed operation**: `SELECT`
- **Policy definition**: 
  ```sql
  bucket_id = 'cabinet-assets'
  ```
- Cliquez sur **"Review"** puis **"Save policy"**

#### Politique 2 : Upload pour utilisateurs authentifiés

- **Policy name**: `Authenticated users can upload to cabinet-assets`
- **Allowed operation**: `INSERT`
- **Policy definition**:
  ```sql
  bucket_id = 'cabinet-assets' AND auth.role() = 'authenticated'
  ```
- Cliquez sur **"Review"** puis **"Save policy"**

#### Politique 3 : Mise à jour pour utilisateurs authentifiés

- **Policy name**: `Authenticated users can update cabinet-assets`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
  ```sql
  bucket_id = 'cabinet-assets' AND auth.role() = 'authenticated'
  ```
- Cliquez sur **"Review"** puis **"Save policy"**

#### Politique 4 : Suppression pour utilisateurs authentifiés

- **Policy name**: `Authenticated users can delete cabinet-assets`
- **Allowed operation**: `DELETE`
- **Policy definition**:
  ```sql
  bucket_id = 'cabinet-assets' AND auth.role() = 'authenticated'
  ```
- Cliquez sur **"Review"** puis **"Save policy"**

## Vérification

Pour vérifier que tout fonctionne :

1. Allez dans **Storage** > **cabinet-assets**
2. Essayez d'uploader un fichier image via l'interface
3. Si l'upload réussit, le bucket est correctement configuré !

## Alternative : Script SQL (si vous avez les permissions)

Si vous avez les permissions nécessaires, vous pouvez exécuter le script `create_cabinet_assets_bucket.sql` dans l'éditeur SQL de Supabase.

## Note importante

Si le bucket n'existe pas lors d'un upload depuis l'application, l'image sera automatiquement compressée et stockée en base64 dans la table `parametres_cabinet` comme solution de secours.











