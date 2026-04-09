# Configuration de l'API Key pour l'Edge Function configure-speciality

## Problème : Erreur 401 (Unauthorized)

Si vous rencontrez l'erreur `401 (Unauthorized)` lors de l'appel à l'edge function, c'est que l'API ke y n'est pas configurée dans les secrets Supabase.

## Solution : Configurer l'API Key dans Supabase

### Méthode 1 : Via l'interface Supabase Dashboard

1. **Connectez-vous à votre projet Supabase**
   - Allez sur https://supabase.com
   - Sélectionnez votre projet

2. **Accédez aux Edge Functions**
   - Dans le menu de gauche, cliquez sur **Edge Functions**
   - Ou allez directement à : `https://supabase.com/dashboard/project/[votre-projet-id]/functions`

3. **Sélectionnez la fonction `configure-speciality`**
   - Cliquez sur la fonction dans la liste

4. **Configurez les secrets**
   - Allez dans l'onglet **Settings** ou **Secrets**
   - Cliquez sur **Add Secret** ou **New Secret**
   - Nom du secret : `IATASKMANAGER_API_KEY`
   - Valeur du secret : `dokhot-semgaq-Pyfzy5`
   - Cliquez sur **Save** ou **Add**

5. **Redéployez la fonction** (si nécessaire)
   - Allez dans l'onglet **Deployments**
   - Cliquez sur **Redeploy** ou **Deploy**

### Méthode 2 : Via la CLI Supabase

```bash
# Installer la CLI Supabase si ce n'est pas déjà fait
npm install -g supabase

# Se connecter à votre projet
supabase login

# Lier votre projet local au projet Supabase
supabase link --project-ref zddaandjckkbidudduum

# Configurer le secret
supabase secrets set IATASKMANAGER_API_KEY=dokhot-semgaq-Pyfzy5

# Redéployer la fonction
supabase functions deploy configure-speciality
```

### Méthode 3 : Via l'API Supabase Management

```bash
# Récupérer votre access token depuis Supabase Dashboard
# Settings > Access Tokens > Generate new token

curl -X POST \
  'https://api.supabase.com/v1/projects/zddaandjckkbidudduum/secrets' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "IATASKMANAGER_API_KEY",
    "value": "dokhot-semgaq-Pyfzy5"
  }'
```

## Vérification

Après avoir configuré l'API key, testez l'endpoint :

```bash
curl -X GET \
  'https://zddaandjckkbidudduum.supabase.co/functions/v1/configure-speciality' \
  -H 'x-api-key: dokhot-semgaq-Pyfzy5'
```

Vous devriez recevoir une réponse `200` avec la configuration actuelle.

## Dépannage

### Erreur 500 "Configuration serveur manquante"
- **Cause** : Le secret `IATASKMANAGER_API_KEY` n'est pas configuré dans Supabase
- **Solution** : Suivez les étapes ci-dessus pour configurer le secret

### Erreur 401 "API key invalide"
- **Cause** : L'API key dans votre application ne correspond pas à celle configurée dans Supabase
- **Solution** : 
  1. Vérifiez que l'API key dans votre code est exactement : `dokhot-semgaq-Pyfzy5`
  2. Vérifiez qu'il n'y a pas d'espaces avant/après
  3. Vérifiez que le secret dans Supabase est identique

### Vérifier les secrets configurés

Via CLI :
```bash
supabase secrets list
```

Vous devriez voir :
```
IATASKMANAGER_API_KEY: dokhot-semgaq-Pyfzy5
```

## Notes importantes

- ⚠️ **Ne partagez jamais votre API key publiquement**
- 🔒 Gardez l'API key secrète et ne l'exposez pas côté client
- 🔄 Après avoir modifié les secrets, redéployez la fonction si nécessaire
- ✅ L'API key doit être identique dans votre application et dans les secrets Supabase











