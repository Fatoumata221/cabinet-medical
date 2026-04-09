# Liste des RPCs (Remote Procedure Calls) Supabase

Ce document recense les fonctions RPC personnalisées créées dans Supabase pour l'application.

## 1. get_types_actes_by_specialite

### Description
Récupère la liste des types d'actes associés à une spécialité donnée via la table de jointure M:N `types_actes_specialites`.

### Signature
```sql
get_types_actes_by_specialite(p_specialite_id BIGINT) RETURNS SETOF types_actes
```

### Paramètres
| Paramètre | Type | Description |
| :--- | :--- | :--- |
| `p_specialite_id` | `BIGINT` | L'ID de la spécialité pour laquelle filtrer les coûts. |

### Retour
Retourne un ensemble d'enregistrements (SETOF) de la table `types_actes`.
Ne retourne que les actes actifs (`actif = true`).

### Exemple d'utilisation (JS)
```javascript
const { data, error } = await supabase
  .rpc('get_types_actes_by_specialite', { p_specialite_id: 12 });
```

### Script de migration associé
`migration_rpc_get_actes.sql`
