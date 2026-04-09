# Liste des Données Filtrées par Spécialité

Ce document liste toutes les tables et services qui doivent être filtrés selon la configuration de spécialité (`mode_specialite_id` dans `parametres_cabinet`).

## 📋 Vue d'ensemble

Quand l'application est configurée en mode spécialité (via l'Edge Function `configure-speciality`), seules les données liées à la spécialité configurée sont affichées. En mode généraliste (valeur `NULL`), toutes les données sont affichées.

---

## ✅ Tables avec `specialite_id` direct (Filtrage direct)

Ces tables ont une colonne `specialite_id` et peuvent être filtrées directement avec `.eq('specialite_id', specialiteId)`.

### 1. **users** (Médecins)
- **Colonne**: `specialite_id`
- **Service**: `userService.getDoctors()`
- **Statut**: ✅ **Implémenté**
- **Fichier**: `src/lib/services.js` ligne 59-75
- **Logs**: `[SPECIALITY_CONFIG] userService.getDoctors() appelé`

### 2. **types_actes** (Types d'actes médicaux)
- **Colonne**: `specialite_id`
- **Service**: `typesActesService.getAll()`
- **Statut**: ✅ **Implémenté**
- **Fichier**: `src/lib/services.js` ligne 964-1007
- **Pages utilisatrices**:
  - `src/pages/ActesPage.jsx` (`/actes`)
  - `src/pages/consultation/ConsultationDetail.jsx` (`/consultation/:id`)
- **Logs**: `[SPECIALITY_CONFIG] typesActesService.getAll() appelé`

### 3. **appareils** (Appareils médicaux)
- **Colonne**: `specialite_id`
- **Service**: ❌ **À implémenter** (`appareilsService.getAll()`)
- **Fichier**: `src/lib/services.js` (à créer)
- **Pages utilisatrices**: `src/pages/consultation/ConsultationDetail.jsx`

### 4. **diagnostics** (Diagnostics médicaux)
- **Colonne**: `specialite_id`
- **Service**: ❌ **À implémenter** (`diagnosticsService.getAll()`)
- **Fichier**: `src/lib/services.js` (à créer)
- **Pages utilisatrices**: `src/pages/consultation/ConsultationDetail.jsx`

### 5. **maladies** (Maladies)
- **Colonne**: `specialite_id`
- **Service**: ❌ **À implémenter** (`maladiesService.getAll()`)
- **Fichier**: `src/lib/services.js` (à créer)

### 6. **medicaments** (Médicaments)
- **Colonne**: `specialite_id`
- **Service**: ❌ **À implémenter** (`medicamentsService.getAll()`)
- **Fichier**: `src/lib/services.js` ligne 463-507 (existe mais sans filtre)
- **Pages utilisatrices**: `src/pages/consultation/ConsultationDetail.jsx`

### 7. **modeles_consultation** (Modèles de consultation)
- **Colonne**: `specialite_id`
- **Service**: ❌ **À implémenter** (`modelesConsultationService.getAll()`)
- **Fichier**: `src/lib/services.js` (à créer)

### 8. **tarifs_actes** (Tarifs des actes)
- **Colonne**: `specialite_id`
- **Service**: ❌ **À implémenter** (`tarifsActesService.getAll()`)
- **Fichier**: `src/lib/services.js` (à créer)

### 9. **types_certificats** (Types de certificats)
- **Colonne**: `specialite_id`
- **Service**: ❌ **À implémenter** (`typesCertificatsService.getAll()`)
- **Fichier**: `src/lib/services.js` (à créer)
- **Pages utilisatrices**: `src/pages/consultation/ConsultationDetail.jsx`

### 10. **types_examens** (Types d'examens)
- **Colonne**: `specialite_id`
- **Service**: ❌ **À implémenter** (`typesExamensService.getAll()`)
- **Fichier**: `src/lib/services.js` (à créer)

---

## 🔗 Tables filtrées via relation (Filtrage indirect)

Ces tables n'ont pas de `specialite_id` direct mais sont liées à des médecins qui ont une `specialite_id`. Le filtrage se fait via la relation `medecin.specialite_id`.

### 1. **appointments** (Rendez-vous)
- **Relation**: `appointments.medecin_id` → `users.specialite_id`
- **Service**: `appointmentService.getAll()` et `appointmentService.getToday()`
- **Statut**: ✅ **Implémenté** (filtrage côté client)
- **Fichier**: `src/lib/services.js` ligne 173-238
- **Méthode**: Filtrage après récupération avec `.filter(appointment => appointment.medecin?.specialite_id === specialiteId)`
- **Logs**: `[SPECIALITY_CONFIG] appointmentService.getAll() appelé`

### 2. **consultations** (Consultations)
- **Relation**: `consultations.medecin_id` → `users.specialite_id`
- **Service**: `consultationService.getAll()`
- **Statut**: ✅ **Implémenté** (filtrage côté client)
- **Fichier**: `src/lib/services.js` ligne 316-345
- **Méthode**: Filtrage après récupération avec `.filter(consultation => consultation.medecin?.specialite_id === specialiteId)`
- **Logs**: `[SPECIALITY_CONFIG] consultationService.getAll() appelé`

---

## 📊 Résumé de l'implémentation

| Table | Colonne | Service | Statut | Fichier |
|-------|---------|---------|--------|----------|
| **users** | `specialite_id` | `userService.getDoctors()` | ✅ Implémenté | `services.js:59` |
| **types_actes** | `specialite_id` | `typesActesService.getAll()` | ✅ Implémenté | `services.js:964` |
| **appareils** | `specialite_id` | `appareilsService.getAll()` | ❌ À faire | - |
| **diagnostics** | `specialite_id` | `diagnosticsService.getAll()` | ❌ À faire | - |
| **maladies** | `specialite_id` | `maladiesService.getAll()` | ❌ À faire | - |
| **medicaments** | `specialite_id` | `medicamentsService.getAll()` | ❌ À faire | `services.js:463` (existe sans filtre) |
| **modeles_consultation** | `specialite_id` | `modelesConsultationService.getAll()` | ❌ À faire | - |
| **tarifs_actes** | `specialite_id` | `tarifsActesService.getAll()` | ❌ À faire | - |
| **types_certificats** | `specialite_id` | `typesCertificatsService.getAll()` | ❌ À faire | - |
| **types_examens** | `specialite_id` | `typesExamensService.getAll()` | ❌ À faire | - |
| **appointments** | Via `medecin.specialite_id` | `appointmentService.getAll()` | ✅ Implémenté | `services.js:173` |
| **consultations** | Via `medecin.specialite_id` | `consultationService.getAll()` | ✅ Implémenté | `services.js:316` |

---

## 🔧 Comment ajouter le filtre pour une nouvelle table

### Pour une table avec `specialite_id` direct :

```javascript
// Dans src/lib/services.js
import { getSpecialityFilter } from './specialityConfigService.js'

export const nomService = {
  async getAll() {
    console.log(`[SPECIALITY_CONFIG] nomService.getAll() appelé`)
    const specialiteId = await getSpecialityFilter()
    let query = supabase
      .from('nom_table')
      .select('*')
      .eq('actif', true) // si applicable
      .order('nom', { ascending: true })
    
    // Appliquer le filtre de spécialité si en mode spécialité
    if (specialiteId !== null) {
      console.log(`[SPECIALITY_CONFIG] Filtre spécialité appliqué`, {
        specialite_id: specialiteId,
        service: 'nomService.getAll()'
      })
      query = query.eq('specialite_id', specialiteId)
    } else {
      console.log(`[SPECIALITY_CONFIG] Mode généraliste - Toutes les données retournées`)
    }
    
    const { data, error } = await query
    if (error) throw error
    
    console.log(`[SPECIALITY_CONFIG] Données récupérées`, {
      count: data?.length || 0,
      specialite_id: specialiteId,
      mode: specialiteId !== null ? 'Spécialité' : 'Généraliste'
    })
    
    return data
  }
}
```

### Pour une table filtrée via relation :

```javascript
export const nomService = {
  async getAll() {
    console.log(`[SPECIALITY_CONFIG] nomService.getAll() appelé`)
    const specialiteId = await getSpecialityFilter()
    const { data, error } = await supabase
      .from('nom_table')
      .select(`
        *,
        medecin:users!nom_table_medecin_id_fkey(nom, prenom, specialite_id)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Filtrer par spécialité côté client si nécessaire
    if (specialiteId !== null && data) {
      const filteredData = data.filter(item => item.medecin?.specialite_id === specialiteId)
      console.log(`[SPECIALITY_CONFIG] Données filtrées par spécialité`, {
        total_avant_filtre: data.length,
        total_apres_filtre: filteredData.length,
        specialite_id: specialiteId,
        service: 'nomService.getAll()'
      })
      return filteredData
    }
    
    console.log(`[SPECIALITY_CONFIG] Mode généraliste - Toutes les données retournées`, {
      count: data?.length || 0
    })
    
    return data
  }
}
```

---

## 📝 Notes importantes

1. **Cache**: La configuration de spécialité est mise en cache pendant 5 minutes dans `specialityConfigService.js` pour éviter les requêtes multiples.

2. **Mode généraliste**: Quand `mode_specialite_id` est `NULL`, aucun filtre n'est appliqué et toutes les données sont retournées.

3. **Logs**: Tous les services doivent inclure des logs avec le préfixe `[SPECIALITY_CONFIG]` pour faciliter le débogage.

4. **Performance**: Pour les tables avec `specialite_id` direct, le filtrage se fait côté base de données (plus efficace). Pour les relations, le filtrage se fait côté client après récupération.

5. **Pages à mettre à jour**: Après avoir ajouté un service filtré, vérifier que toutes les pages qui utilisent cette table utilisent bien le service et non une requête Supabase directe.

---

## 🎯 Prochaines étapes

1. ✅ Implémenter les services manquants pour les tables avec `specialite_id` direct
2. ✅ Mettre à jour `medicamentsService.getAll()` pour ajouter le filtre
3. ✅ Vérifier toutes les pages qui chargent directement depuis Supabase et les remplacer par les services
4. ✅ Ajouter des tests pour vérifier que le filtrage fonctionne correctement

---

**Dernière mise à jour**: 2025-12-09
**Version**: 1.0











