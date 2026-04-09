# Edge Function: Configuration de Spécialité

## Vue d'ensemble

L'edge function `configure-speciality` permet à la plateforme externe **iaitaskmanager** de configurer l'application en mode spécialité. Quand une spécialité est configurée (ex: "Dentiste"), seules les données liées à cette spécialité seront affichées dans l'application.

## Endpoints

### Base URL
```
https://[votre-projet].supabase.co/functions/v1/configure-speciality
```

### Authentification

Toutes les requêtes doivent inclure une API key dans les headers :
```
x-api-key: [dokhot-semgaq-Pyfzy5]
```

ou

```
Authorization: Bearer [dokhot-semgaq-Pyfzy5]
```

L'API key doit être configurée dans les **secrets de l'edge function** dans Supabase :
- `IATASKMANAGER_API_KEY` ou
- `SPECIALITY_CONFIG_API_KEY`

### Configuration de l'API key dans Supabase

Pour configurer l'API key dans Supabase :

1. Allez dans votre projet Supabase
2. Ouvrez **Edge Functions** dans le menu de gauche
3. Sélectionnez la fonction `configure-speciality`
4. Allez dans l'onglet **Settings** ou **Secrets**
5. Ajoutez une variable d'environnement :
   - Nom : `IATASKMANAGER_API_KEY` (ou `SPECIALITY_CONFIG_API_KEY`)
   - Valeur : `dokhot-semgaq-Pyfzy5` (votre API key)
6. Sauvegardez et redéployez la fonction si nécessaire

**Important** : L'API key doit être identique à celle utilisée dans votre application externe (`dokhot-semgaq-Pyfzy5`).

---

## Récupérer les spécialités disponibles

Avant de configurer une spécialité, vous devez connaître les `specialite_id` disponibles. Voici comment les récupérer :

### Via Supabase directement

Vous pouvez interroger directement la table `specialites` via l'API Supabase :

```http
GET https://[votre-projet].supabase.co/rest/v1/specialites?select=id,nom,description,color,actif&actif=eq.true&order=nom.asc
Headers:
  apikey: [VOTRE_SUPABASE_ANON_KEY]
  Authorization: Bearer [VOTRE_SUPABASE_ANON_KEY]
```

### Réponse
```json
[
  {
    "id": 1,
    "nom": "Dentiste",
    "description": "Spécialité dentaire",
    "color": "#3b82f6",
    "actif": true
  },
  {
    "id": 2,
    "nom": "Cardiologue",
    "description": "Spécialité cardiologie",
    "color": "#ef4444",
    "actif": true
  },
  {
    "id": 3,
    "nom": "Généraliste",
    "description": "Médecine générale",
    "color": "#10b981",
    "actif": true
  }
]
```

### Exemples de code

#### JavaScript/TypeScript
```javascript
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-anon-key';

async function getAvailableSpecialities() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/specialites?select=id,nom,description,color,actif&actif=eq.true&order=nom.asc`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );
  
  const specialities = await response.json();
  return specialities;
}

// Utilisation
const specialities = await getAvailableSpecialities();
console.log('Spécialités disponibles:', specialities);
// Affiche: [{id: 1, nom: "Dentiste", ...}, {id: 2, nom: "Cardiologue", ...}, ...]
```

#### Python
```python
import requests

SUPABASE_URL = 'https://votre-projet.supabase.co'
SUPABASE_ANON_KEY = 'votre-anon-key'

def get_available_specialities():
    response = requests.get(
        f'{SUPABASE_URL}/rest/v1/specialites',
        params={
            'select': 'id,nom,description,color,actif',
            'actif': 'eq.true',
            'order': 'nom.asc'
        },
        headers={
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
        }
    )
    return response.json()

# Utilisation
specialities = get_available_specialities()
print("Spécialités disponibles:", specialities)
```

#### cURL
```bash
curl -X GET \
  'https://votre-projet.supabase.co/rest/v1/specialites?select=id,nom,description,color,actif&actif=eq.true&order=nom.asc' \
  -H 'apikey: votre-anon-key' \
  -H 'Authorization: Bearer votre-anon-key'
```

### Notes importantes

- **Note** : Depuis la version mise à jour, vous pouvez récupérer la liste des spécialités directement via l'endpoint GET de l'edge function (voir section suivante). La liste est incluse dans la réponse `specialites_disponibles`.
- Seules les spécialités avec `actif = true` doivent être utilisées pour la configuration
- L'`id` retourné est le `specialite_id` à utiliser dans l'endpoint POST
- Si une spécialité n'existe pas ou n'est pas active, la configuration échouera avec une erreur 404 ou 400

---

## GET - Récupérer la configuration actuelle

Récupère la configuration actuelle du mode spécialité **ainsi que la liste complète des spécialités disponibles**. Vous n'avez plus besoin de faire un appel séparé à l'API Supabase pour récupérer les spécialités - elles sont incluses dans cette réponse.

### Requête
```http
GET /functions/v1/configure-speciality
Headers:
  x-api-key: [dokhot-semgaq-Pyfzy5]
```

### Réponse (Mode généraliste)
```json
{
  "mode_specialite_id": null,
  "mode": "generaliste",
  "specialite": null,
  "specialites_disponibles": [
    {
      "id": 1,
      "nom": "Dentiste",
      "description": "Spécialité dentaire",
      "color": "#3b82f6",
      "actif": true
    },
    {
      "id": 2,
      "nom": "Cardiologue",
      "description": "Spécialité cardiologie",
      "color": "#ef4444",
      "actif": true
    },
    {
      "id": 3,
      "nom": "Généraliste",
      "description": "Médecine générale",
      "color": "#10b981",
      "actif": true
    }
  ],
  "message": "Mode généraliste actif (toutes les spécialités)"
}
```

### Réponse (Mode spécialité)
```json
{
  "mode_specialite_id": 1,
  "mode": "specialite",
  "specialite": {
    "id": 1,
    "nom": "Dentiste",
    "description": "Spécialité dentaire",
    "color": "#3b82f6",
    "actif": true
  },
  "specialites_disponibles": [
    {
      "id": 1,
      "nom": "Dentiste",
      "description": "Spécialité dentaire",
      "color": "#3b82f6",
      "actif": true
    },
    {
      "id": 2,
      "nom": "Cardiologue",
      "description": "Spécialité cardiologie",
      "color": "#ef4444",
      "actif": true
    },
    {
      "id": 3,
      "nom": "Généraliste",
      "description": "Médecine générale",
      "color": "#10b981",
      "actif": true
    }
  ],
  "message": "Mode spécialité actif: Dentiste"
}
```

### Champ `specialites_disponibles`

Le champ `specialites_disponibles` contient la liste complète de toutes les spécialités actives disponibles dans le système. Vous pouvez utiliser les `id` de cette liste pour configurer une spécialité via l'endpoint POST.

### Codes de statut
- `200` - Succès
- `401` - API key invalide ou manquante
- `500` - Erreur serveur

---

## POST - Configurer une spécialité

Configure l'application en mode spécialité pour une spécialité donnée.

### Requête
```http
POST /functions/v1/configure-speciality
Headers:
  x-api-key: [dokhot-semgaq-Pyfzy5]
  Content-Type: application/json
Body:
{
  "specialite_id": 1
}
```

### Paramètres
- `specialite_id` (number, requis) - L'ID de la spécialité à configurer

### Réponse (Succès)
```json
{
  "success": true,
  "message": "Mode spécialité configuré: Dentiste",
  "mode_specialite_id": 1,
  "specialite": {
    "id": 1,
    "nom": "Dentiste"
  },
  "config_id": 1
}
```

### Codes de statut
- `200` - Configuration réussie
- `400` - Données invalides (specialite_id manquant ou invalide)
- `401` - API key invalide ou manquante
- `404` - Spécialité non trouvée
- `500` - Erreur serveur

### Erreurs possibles
```json
{
  "error": "specialite_id est requis et doit être un nombre"
}
```

```json
{
  "error": "Spécialité avec l'ID 999 non trouvée"
}
```

```json
{
  "error": "La spécialité \"Dentiste\" n'est pas active"
}
```

---

## DELETE - Réinitialiser en mode généraliste

Réinitialise l'application en mode généraliste (toutes les spécialités visibles).

### Requête
```http
DELETE /functions/v1/configure-speciality
Headers:
  x-api-key: [dokhot-semgaq-Pyfzy5]
```

### Réponse (Succès)
```json
{
  "success": true,
  "message": "Mode généraliste activé (toutes les spécialités)",
  "mode_specialite_id": null,
  "mode": "generaliste",
  "previous_specialite": "Dentiste"
}
```

### Codes de statut
- `200` - Réinitialisation réussie
- `401` - API key invalide ou manquante
- `500` - Erreur serveur

---

## Exemples d'utilisation depuis iaitaskmanager

### Workflow complet : Récupérer les spécialités puis configurer

#### JavaScript/TypeScript (Workflow complet)
```javascript
const API_KEY = 'dokhot-semgaq-Pyfzy5';
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-anon-key';

// 1. Récupérer les spécialités disponibles
async function getAvailableSpecialities() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/specialites?select=id,nom,description,color,actif&actif=eq.true&order=nom.asc`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );
  return await response.json();
}

// 2. Récupérer la configuration actuelle
async function getCurrentConfig() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/configure-speciality`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY
    }
  });
  return await response.json();
}

// 3. Configurer une spécialité
async function setSpeciality(specialiteId) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/configure-speciality`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      specialite_id: specialiteId
    })
  });
  return await response.json();
}

// 4. Réinitialiser en mode généraliste
async function resetToGeneralMode() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/configure-speciality`, {
    method: 'DELETE',
    headers: {
      'x-api-key': API_KEY
    }
  });
  return await response.json();
}

// Exemple d'utilisation complète : Configurer par nom de spécialité
async function configureSpecialityByName(specialityName) {
  try {
    // 1. Récupérer la configuration actuelle (qui inclut aussi la liste des spécialités)
    const config = await getCurrentConfig();
    console.log('Spécialités disponibles:', config.specialites_disponibles);
    
    // 2. Trouver la spécialité par nom dans la liste retournée
    const speciality = config.specialites_disponibles.find(s => s.nom === specialityName);
    if (!speciality) {
      throw new Error(`Spécialité "${specialityName}" non trouvée`);
    }
    
    // 3. Vérifier qu'elle est active
    if (!speciality.actif) {
      throw new Error(`La spécialité "${specialityName}" n'est pas active`);
    }
    
    // 4. Configurer la spécialité
    const result = await setSpeciality(speciality.id);
    console.log('Configuration réussie:', result.message);
    return result;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Utilisation
await configureSpecialityByName('Dentiste');
```

### JavaScript/TypeScript (Version simple)
```javascript
const API_KEY = 'dokhot-semgaq-Pyfzy5';
const SUPABASE_URL = 'https://votre-projet.supabase.co';

// Récupérer la configuration actuelle
async function getCurrentConfig() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/configure-speciality`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY
    }
  });
  
  const data = await response.json();
  return data;
}

// Configurer une spécialité
async function setSpeciality(specialiteId) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/configure-speciality`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      specialite_id: specialiteId
    })
  });
  
  const data = await response.json();
  return data;
}

// Réinitialiser en mode généraliste
async function resetToGeneralMode() {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/configure-speciality`, {
    method: 'DELETE',
    headers: {
      'x-api-key': API_KEY
    }
  });
  
  const data = await response.json();
  return data;
}

// Exemple d'utilisation
async function configureDentistMode() {
  try {
    // Configurer en mode dentiste (ID = 1)
    const result = await setSpeciality(1);
    console.log('Configuration réussie:', result.message);
  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

### Python (Workflow complet)
```python
import requests

API_KEY = 'dokhot-semgaq-Pyfzy5'
SUPABASE_URL = 'https://votre-projet.supabase.co'
SUPABASE_ANON_KEY = 'votre-anon-key'

# 1. Récupérer les spécialités disponibles
def get_available_specialities():
    response = requests.get(
        f'{SUPABASE_URL}/rest/v1/specialites',
        params={
            'select': 'id,nom,description,color,actif',
            'actif': 'eq.true',
            'order': 'nom.asc'
        },
        headers={
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
        }
    )
    return response.json()

# 2. Récupérer la configuration actuelle
def get_current_config():
    response = requests.get(
        f'{SUPABASE_URL}/functions/v1/configure-speciality',
        headers={'x-api-key': API_KEY}
    )
    return response.json()

# 3. Configurer une spécialité
def set_speciality(specialite_id):
    response = requests.post(
        f'{SUPABASE_URL}/functions/v1/configure-speciality',
        headers={
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
        },
        json={'specialite_id': specialite_id}
    )
    return response.json()

# 4. Réinitialiser en mode généraliste
def reset_to_general_mode():
    response = requests.delete(
        f'{SUPABASE_URL}/functions/v1/configure-speciality',
        headers={'x-api-key': API_KEY}
    )
    return response.json()

# Exemple d'utilisation complète : Configurer par nom de spécialité
def configure_speciality_by_name(speciality_name):
    try:
        # 1. Récupérer la configuration actuelle (qui inclut aussi la liste des spécialités)
        config = get_current_config()
        print(f"Spécialités disponibles: {config['specialites_disponibles']}")
        
        # 2. Trouver la spécialité par nom dans la liste retournée
        speciality = next((s for s in config['specialites_disponibles'] if s['nom'] == speciality_name), None)
        if not speciality:
            raise ValueError(f"Spécialité '{speciality_name}' non trouvée")
        
        # 3. Vérifier qu'elle est active
        if not speciality.get('actif'):
            raise ValueError(f"La spécialité '{speciality_name}' n'est pas active")
        
        # 4. Configurer la spécialité
        result = set_speciality(speciality['id'])
        print(f"Configuration réussie: {result['message']}")
        return result
    except Exception as error:
        print(f"Erreur: {error}")
        raise

# Utilisation
configure_speciality_by_name('Dentiste')
```

### Python (Version simple)
```python
import requests

API_KEY = 'dokhot-semgaq-Pyfzy5'
SUPABASE_URL = 'https://votre-projet.supabase.co'

def get_current_config():
    response = requests.get(
        f'{SUPABASE_URL}/functions/v1/configure-speciality',
        headers={'x-api-key': API_KEY}
    )
    return response.json()

def set_speciality(specialite_id):
    response = requests.post(
        f'{SUPABASE_URL}/functions/v1/configure-speciality',
        headers={
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
        },
        json={'specialite_id': specialite_id}
    )
    return response.json()

def reset_to_general_mode():
    response = requests.delete(
        f'{SUPABASE_URL}/functions/v1/configure-speciality',
        headers={'x-api-key': API_KEY}
    )
    return response.json()

# Exemple d'utilisation
result = set_speciality(1)
print(f"Configuration: {result['message']}")
```

### cURL
```bash
# Récupérer la configuration
curl -X GET \
  'https://votre-projet.supabase.co/functions/v1/configure-speciality' \
  -H 'x-api-key: votre-api-key'

# Configurer une spécialité
curl -X POST \
  'https://votre-projet.supabase.co/functions/v1/configure-speciality' \
  -H 'x-api-key: votre-api-key' \
  -H 'Content-Type: application/json' \
  -d '{"specialite_id": 1}'

# Réinitialiser en mode généraliste
curl -X DELETE \
  'https://votre-projet.supabase.co/functions/v1/configure-speciality' \
  -H 'x-api-key: votre-api-key'
```

---

## Effets du mode spécialité

Quand une spécialité est configurée, les données suivantes sont automatiquement filtrées :

### Tables filtrées directement (par `specialite_id`)
- `appareils` - Appareils médicaux
- `diagnostics` - Diagnostics médicaux
- `maladies` - Maladies
- `medicaments` - Médicaments
- `modeles_consultation` - Modèles de consultation
- `tarifs_actes` - Tarifs d'actes
- `types_actes` - Types d'actes
- `types_certificats` - Types de certificats
- `types_examens` - Types d'examens
- `users` (médecins) - Médecins

### Tables filtrées indirectement (via relations)
- `consultations` - Via `medecin_id` → `users.specialite_id`
- `appointments` - Via `medecin_id` → `users.specialite_id`
- `actes_consultation` - Via `type_acte_id` → `types_actes.specialite_id`
- `prescriptions_pharmacie` - Via `medicament_id` → `medicaments.specialite_id`
- `examens_prescrits` - Via relation avec `types_examens.specialite_id`
- `certificats_medicaux` - Via `type_certificat_id` → `types_certificats.specialite_id`
- `examens_appareils` - Via `appareil_id` → `appareils.specialite_id`
- `diagnostics_consultation` - Via `diagnostic_id` → `diagnostics.specialite_id`

---

## Gestion des erreurs

### Erreurs communes

1. **API key invalide**
   - Code: `401`
   - Message: `"API key invalide ou manquante"`
   - Solution: Vérifier que l'API key est correcte et présente dans les headers

2. **Spécialité non trouvée**
   - Code: `404`
   - Message: `"Spécialité avec l'ID X non trouvée"`
   - Solution: Vérifier que l'ID de spécialité existe dans la table `specialites`

3. **Spécialité inactive**
   - Code: `400`
   - Message: `"La spécialité \"X\" n'est pas active"`
   - Solution: Activer la spécialité dans la table `specialites` avant de la configurer

4. **Données invalides**
   - Code: `400`
   - Message: `"specialite_id est requis et doit être un nombre"`
   - Solution: Vérifier le format de la requête JSON

---

## Logging

L'edge function enregistre tous les changements de configuration dans les logs :
- Configuration d'une spécialité : `[timestamp] Configuration spécialité mise à jour: ID=X, Nom=Y`
- Réinitialisation : `[timestamp] Configuration spécialité réinitialisée: X → Mode généraliste`

---

## Sécurité

- L'API key doit être gardée secrète et ne jamais être exposée côté client
- Seule l'edge function avec la clé service_role peut modifier `mode_specialite_id`
- Les utilisateurs normaux peuvent lire la configuration mais ne peuvent pas la modifier
- Les politiques RLS garantissent que seul le service_role peut modifier `mode_specialite_id`

---

## Notes importantes

1. **Cache** : L'application met en cache la configuration pendant 5 minutes. Les changements peuvent prendre jusqu'à 5 minutes pour être visibles dans l'application.

2. **Mode généraliste** : Quand `mode_specialite_id` est `null`, toutes les spécialités sont visibles (comportement par défaut).

3. **Validation** : La spécialité doit exister et être active (`actif = true`) pour être configurée.

4. **Impact** : Le changement de configuration affecte immédiatement toutes les requêtes de données dans l'application.

