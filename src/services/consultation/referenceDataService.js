import { supabase } from '../../lib/supabase';
import {
  typesActesService,
  appareilsService,
  diagnosticsService,
  medicamentsService,
  typesCertificatsService,
  constantesService
} from '../../lib/services';


/**
 * Filtre côté JS un tableau d'entités selon une table de correspondance.
 * Conserve :
 *  - les entités liées à la spécialité demandée
 *  - les entités sans aucune liaison (visibles par tous)
 *
 * @param {Array} items              - tableau d'entités (avec .id)
 * @param {Array} liaisons           - [{element_id, specialite_id}]
 * @param {string} elementIdKey      - nom de la colonne id dans la table de liaison (ex: 'appareil_id')
 * @param {number} specialiteId      - spécialité à retenir
 */
const filterBySpecialite = (items, liaisons, elementIdKey, specialiteId) => {
  // Ensemble des IDs ayant au moins une liaison
  const idsAvecLiaison = new Set(liaisons.map(l => l[elementIdKey]));
  // IDs liés à CETTE spécialité
  const idsSpecialite = new Set(
    liaisons.filter(l => l.specialite_id === specialiteId).map(l => l[elementIdKey])
  );

  return items.filter(item =>
    // Visible si lié à la spécialité du médecin OU sans aucune liaison (générique)
    idsSpecialite.has(item.id) || !idsAvecLiaison.has(item.id)
  );
};

/**
 * Retourne les données de référence utilisées dans la consultation.
 * Si specialiteId est fourni, filtre les référentiels pour ne retourner que les
 * données liées à cette spécialité (ou sans spécialité définie = visibles par tous).
 *
 * @param {number|null} specialiteId - ID de la spécialité du médecin connecté
 */
export const getReferenceData = async (specialiteId = null) => {
  try {
    // ─── Actes ─────────────────────────────────────────────────────────────
    let actesData = [];
    try {
      const actesFromService = await typesActesService.getAll();
      let actes = (actesFromService || []).map(acte => ({
        id: acte.id,
        nom: acte.nom,
        description: acte.description,
        tarif_defaut: acte.tarif_defaut,
        actif: acte.actif,
        specialite_id: acte.specialite_id
      }));
      if (specialiteId) {
        actes = actes.filter(a => !a.specialite_id || a.specialite_id === specialiteId);
      }
      actesData = actes;
    } catch (error) {
      console.error("Erreur lors du chargement des types d'actes:", error);
    }

    // ─── Chargement parallèle des listes brutes + tables de correspondance ─
    let allAppareils = [];
    let allDiagnostics = [];
    let medicamentsData = [];
    let certificatsData = [];
    let constantesData = [];
    let antecedentsData = [];
    let synthesesData = [];

    const [
      appResult,
      diagResult,
      medResult,
      certResult,
      constResult,
      antResult,
      synthResult,
      signesResult,
      // Liaisons de spécialité
      appLiaisonsResult,
      diagLiaisonsResult,
      antLiaisonsResult,
      signesLiaisonsResult,
    ] = await Promise.allSettled([
      supabase.from('appareils').select('*').eq('actif', true).order('ordre_affichage').order('nom'),
      supabase.from('diagnostics').select('*').eq('actif', true).order('ordre_affichage').order('nom'),
      supabase.from('medicaments').select('*').eq('actif', true).order('nom'),
      supabase.from('types_certificats').select('*').eq('actif', true).order('nom'),
      // constantes = constantes vitales (tension, pouls...) utilisées ailleurs dans la consultation
      constantesService.getAll(),
      supabase.from('antecedents').select('*').eq('actif', true).order('nom'),
      supabase.from('elements_synthese').select('*').order('nom'),
      // signes_cliniques = la vraie table pour le modal "Ajouter des signes cliniques"
      supabase.from('signes_cliniques').select('*').eq('actif', true).order('categorie').order('nom'),
      // Liaisons — toujours chargées pour permettre le filtrage
      supabase.from('appareils_specialites').select('appareil_id, specialite_id'),
      supabase.from('diagnostics_specialites').select('diagnostic_id, specialite_id'),
      supabase.from('antecedents_specialites').select('antecedent_id, specialite_id'),
      supabase.from('signes_cliniques_specialites').select('signe_clinique_id, specialite_id'),
    ]);

    allAppareils = appResult.status === 'fulfilled' ? (appResult.value.data || []) : [];
    allDiagnostics = diagResult.status === 'fulfilled' ? (diagResult.value.data || []) : [];
    antecedentsData = antResult.status === 'fulfilled' ? (antResult.value.data || []) : [];
    synthesesData = synthResult.status === 'fulfilled' ? (synthResult.value.data || []) : [];
    constantesData = constResult.status === 'fulfilled' ? (constResult.value || []) : [];
    let allSignesCliniques = signesResult.status === 'fulfilled' ? (signesResult.value.data || []) : [];

    // Médicaments — filtrage par specialite_id direct (null = général)
    const allMedicaments = medResult.status === 'fulfilled' ? (medResult.value.data || []) : [];
    if (specialiteId) {
      medicamentsData = allMedicaments.filter(m => !m.specialite_id || m.specialite_id === specialiteId);
    } else {
      medicamentsData = allMedicaments;
    }

    // Certificats — filtrage par specialite_id direct (null = général)
    const allCertificats = certResult.status === 'fulfilled' ? (certResult.value.data || []) : [];
    if (specialiteId) {
      certificatsData = allCertificats.filter(c => !c.specialite_id || c.specialite_id === specialiteId);
    } else {
      certificatsData = allCertificats;
    }

    // ─── Application du filtre spécialité via tables de correspondance ─────
    const appLiaisons   = appLiaisonsResult.status === 'fulfilled'    ? (appLiaisonsResult.value.data || [])    : [];
    const diagLiaisons  = diagLiaisonsResult.status === 'fulfilled'   ? (diagLiaisonsResult.value.data || [])   : [];
    const antLiaisons   = antLiaisonsResult.status === 'fulfilled'    ? (antLiaisonsResult.value.data || [])    : [];
    const signesLiaisons= signesLiaisonsResult.status === 'fulfilled' ? (signesLiaisonsResult.value.data || []) : [];

    if (specialiteId) {
      allAppareils       = filterBySpecialite(allAppareils, appLiaisons, 'appareil_id', specialiteId);
      allDiagnostics     = filterBySpecialite(allDiagnostics, diagLiaisons, 'diagnostic_id', specialiteId);
      antecedentsData    = filterBySpecialite(antecedentsData, antLiaisons, 'antecedent_id', specialiteId);
      allSignesCliniques = filterBySpecialite(allSignesCliniques, signesLiaisons, 'signe_clinique_id', specialiteId);
    }

    return {
      antecedentsRef: antecedentsData,
      // signesCliniquesRef = signes cliniques (modal "Ajouter des signes cliniques")
      signesCliniquesRef: allSignesCliniques,
      // constantesRef = constantes vitales (tension, pouls...) pour la section constantes
      constantesRef: constantesData,
      appareilsRef: allAppareils,
      elementsSyntheseRef: synthesesData,
      diagnosticsRef: allDiagnostics,
      actesRef: actesData,
      medicamentsRef: medicamentsData,
      typesCertificatsRef: certificatsData,
    };
  } catch (error) {
    console.error('Erreur lors du chargement des données de référence:', error);
    throw error;
  }
};

export const getModelesConsultation = async () => {
  const { data, error } = await supabase
    .from('modeles_consultation')
    .select('*')
    .eq('actif', true)
    .order('nom');
  if (error) throw error;
  return data || [];
};

export const createConsultationFromModele = async (patientId, modeleId, userId) => {
  const modele = await supabase.from('modeles_consultation').select('*').eq('id', modeleId).single();
  if (modele.error) throw modele.error;

  const { data, error } = await supabase
    .from('consultations')
    .insert({
      patient_id: patientId,
      medecin_id: userId,
      motif_consultation: `Consultation ${modele.data.nom}`,
      niveau_urgence: 'normale',
      type_consultation: modele.data.type_consultation || 'standard',
      statut: 'en_cours',
      date_consultation: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
};
