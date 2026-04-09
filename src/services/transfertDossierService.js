import { supabase } from '../lib/supabase';
import documentUploadService from './documentUploadService';

/**
 * Service pour gérer les transferts de dossiers médicaux
 */
class TransfertDossierService {
  /**
   * Récupère les données médicales d'un patient selon la sélection
   * @param {number} patientId - ID du patient
   * @param {Object} donneesSelectionnees - Objet avec les types de données sélectionnées
   * @param {Array} consultationIds - IDs des consultations à inclure (optionnel)
   * @returns {Promise<Object>} Données médicales récupérées
   */
  async recupererDonneesMedicales(patientId, donneesSelectionnees, consultationIds = null) {
    const donnees = {};

    try {
      // Récupérer les IDs de toutes les consultations du patient si non spécifiés
      if (!consultationIds) {
        const { data: consultations } = await supabase
          .from('consultations')
          .select('id')
          .eq('patient_id', patientId);
        consultationIds = consultations?.map(c => c.id) || [];
      }

      // Consultations
      if (donneesSelectionnees.consultations) {
        const { data: consultations } = await supabase
          .from('consultations')
          .select(`
            *,
            medecin:users(nom, prenom, specialite)
          `)
          .eq('patient_id', patientId)
          .in('id', consultationIds.length > 0 ? consultationIds : [0])
          .order('date_consultation', { ascending: false });
        donnees.consultations = consultations || [];
      }

      // Documents patients
      if (donneesSelectionnees.documents) {
        const { data: documents } = await supabase
          .from('documents_patients')
          .select('*')
          .eq('patient_id', patientId)
          .eq('statut_validation', 'valide')
          .order('created_at', { ascending: false });
        donnees.documents = documents || [];

        // Documents patient_documents aussi
        const { data: patientDocuments } = await supabase
          .from('patient_documents')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });
        donnees.patientDocuments = patientDocuments || [];
      }

      // Antécédents
      if (donneesSelectionnees.antecedents) {
        const { data: antecedents } = await supabase
          .from('antecedents_patients')
          .select(`
            *,
            antecedents(*)
          `)
          .eq('patient_id', patientId)
          .eq('actif', true)
          .order('date_decouverte', { ascending: false });
        donnees.antecedents = antecedents || [];
      }

      // Constantes
      if (donneesSelectionnees.constantes) {
        const { data: constantes } = await supabase
          .from('constantes_consultation')
          .select(`
            *,
            constantes(*)
          `)
          .in('consultation_id', consultationIds.length > 0 ? consultationIds : [0])
          .order('created_at', { ascending: false });
        donnees.constantes = constantes || [];
      }

      // Diagnostics
      if (donneesSelectionnees.diagnostics) {
        const { data: diagnostics } = await supabase
          .from('diagnostics_consultation')
          .select(`
            *,
            diagnostics(*)
          `)
          .in('consultation_id', consultationIds.length > 0 ? consultationIds : [0])
          .order('created_at', { ascending: false });
        donnees.diagnostics = diagnostics || [];
      }

      // Ordonnances
      if (donneesSelectionnees.ordonnances) {
        const { data: ordonnances } = await supabase
          .from('ordonnances')
          .select(`
            *,
            lignes_ordonnance(
              *,
              medicaments(*)
            )
          `)
          .in('consultation_id', consultationIds.length > 0 ? consultationIds : [0])
          .order('date_prescription', { ascending: false });
        donnees.ordonnances = ordonnances || [];
      }

      // Certificats
      if (donneesSelectionnees.certificats) {
        const { data: certificats } = await supabase
          .from('certificats_medicaux')
          .select(`
            *,
            types_certificats (nom, duree_defaut)
          `)
          .in('consultation_id', consultationIds.length > 0 ? consultationIds : [0])
          .order('date_debut', { ascending: false });
        donnees.certificats = certificats || [];
      }

      // Actes
      if (donneesSelectionnees.actes) {
        const { data: actes } = await supabase
          .from('actes_consultation')
          .select(`
            *,
            types_actes(*)
          `)
          .in('consultation_id', consultationIds.length > 0 ? consultationIds : [0])
          .order('created_at', { ascending: false });
        donnees.actes = actes || [];
      }

      return donnees;
    } catch (error) {
      console.error('Erreur lors de la récupération des données médicales:', error);
      throw error;
    }
  }

  /**
   * Génère le contenu HTML du document de transfert
   * @param {Object} transfertData - Données du transfert
   * @param {Object} patientData - Données du patient
   * @param {Object} medecinData - Données du médecin
   * @param {Object} cabinetData - Données du cabinet
   * @param {Object} donneesMedicales - Données médicales sélectionnées
   * @returns {string} HTML du document
   */
  genererHTMLDocument(transfertData, patientData, medecinData, cabinetData, donneesMedicales) {
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('fr-FR');
    };

    const escapeHtml = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    let htmlContent = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n';
    htmlContent += '<title>Transfert de dossier médical - ' + escapeHtml(patientData.prenom) + ' ' + escapeHtml(patientData.nom) + '</title>\n';
    htmlContent += '<style>\n';
    htmlContent += 'body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }\n';
    htmlContent += '.header-info { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; }\n';
    htmlContent += '.medecin-info, .cabinet-info { flex: 1; }\n';
    htmlContent += '.medecin-info h3, .cabinet-info h4 { margin-top: 0; color: #2563eb; }\n';
    htmlContent += 'h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; text-align: center; }\n';
    htmlContent += 'h2 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px; margin-top: 30px; }\n';
    htmlContent += '.section { margin-bottom: 25px; }\n';
    htmlContent += '.info-box { background-color: #f1f5f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }\n';
    htmlContent += '.info-row { margin-bottom: 8px; }\n';
    htmlContent += '.info-label { font-weight: bold; display: inline-block; width: 150px; }\n';
    htmlContent += 'table { width: 100%; border-collapse: collapse; margin-top: 10px; }\n';
    htmlContent += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n';
    htmlContent += 'th { background-color: #2563eb; color: white; }\n';
    htmlContent += '.footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; }\n';
    htmlContent += '@media print { body { margin: 0; } .no-print { display: none; } }\n';
    htmlContent += '</style>\n</head>\n<body>\n';

    // Header info
    htmlContent += '<div class="header-info">\n';
    htmlContent += '<div class="medecin-info">\n';
    htmlContent += '<h3>Dr. ' + escapeHtml(medecinData.prenom || '') + ' ' + escapeHtml(medecinData.nom || '') + '</h3>\n';
    if (medecinData.specialite) {
      htmlContent += '<p>' + escapeHtml(medecinData.specialite) + '</p>\n';
    }
    if (medecinData.telephone) {
      htmlContent += '<p>Tél: ' + escapeHtml(medecinData.telephone) + '</p>\n';
    }
    if (medecinData.email) {
      htmlContent += '<p>Email: ' + escapeHtml(medecinData.email) + '</p>\n';
    }
    htmlContent += '</div>\n';
    htmlContent += '<div class="cabinet-info">\n';
    htmlContent += '<h4>' + escapeHtml(cabinetData.nom_cabinet || 'Cabinet Médical') + '</h4>\n';
    if (cabinetData.adresse) {
      htmlContent += '<p>' + escapeHtml(cabinetData.adresse) + '</p>\n';
    }
    if (cabinetData.ville || cabinetData.code_postal) {
      htmlContent += '<p>' + escapeHtml(cabinetData.ville || '') + ' ' + escapeHtml(cabinetData.code_postal || '') + '</p>\n';
    }
    if (cabinetData.telephone) {
      htmlContent += '<p>Tél: ' + escapeHtml(cabinetData.telephone) + '</p>\n';
    }
    if (cabinetData.email) {
      htmlContent += '<p>Email: ' + escapeHtml(cabinetData.email) + '</p>\n';
    }
    htmlContent += '</div>\n</div>\n';

    htmlContent += '<h1>TRANSFERT DE DOSSIER MÉDICAL</h1>\n';

    // Info box
    htmlContent += '<div class="info-box">\n';
    htmlContent += '<div class="info-row"><span class="info-label">Date du transfert:</span><span>' + formatDate(transfertData.date_transfert) + '</span></div>\n';
    htmlContent += '<div class="info-row"><span class="info-label">Destinataire:</span><span>' + escapeHtml(transfertData.nom_destinataire) + ' (' + escapeHtml(transfertData.type_destinataire) + ')</span></div>\n';
    if (transfertData.adresse_destinataire) {
      htmlContent += '<div class="info-row"><span class="info-label">Adresse:</span><span>' + escapeHtml(transfertData.adresse_destinataire) + '</span></div>\n';
    }
    if (transfertData.telephone_destinataire) {
      htmlContent += '<div class="info-row"><span class="info-label">Téléphone:</span><span>' + escapeHtml(transfertData.telephone_destinataire) + '</span></div>\n';
    }
    if (transfertData.email_destinataire) {
      htmlContent += '<div class="info-row"><span class="info-label">Email:</span><span>' + escapeHtml(transfertData.email_destinataire) + '</span></div>\n';
    }
    if (transfertData.medecin_destinataire) {
      htmlContent += '<div class="info-row"><span class="info-label">Médecin destinataire:</span><span>' + escapeHtml(transfertData.medecin_destinataire) + '</span></div>\n';
    }
    htmlContent += '<div class="info-row"><span class="info-label">Motif du transfert:</span><span>' + escapeHtml(transfertData.motif_transfert) + '</span></div>\n';
    htmlContent += '</div>\n';

    // Patient info
    htmlContent += '<div class="section">\n<h2>Informations du patient</h2>\n<div class="info-box">\n';
    htmlContent += '<div class="info-row"><span class="info-label">Nom:</span><span>' + escapeHtml(patientData.nom) + '</span></div>\n';
    htmlContent += '<div class="info-row"><span class="info-label">Prénom:</span><span>' + escapeHtml(patientData.prenom) + '</span></div>\n';
    htmlContent += '<div class="info-row"><span class="info-label">Date de naissance:</span><span>' + formatDate(patientData.date_naissance) + '</span></div>\n';
    if (patientData.sexe) {
      htmlContent += '<div class="info-row"><span class="info-label">Sexe:</span><span>' + (patientData.sexe === 'M' ? 'Masculin' : 'Féminin') + '</span></div>\n';
    }
    if (patientData.numero_dossier) {
      htmlContent += '<div class="info-row"><span class="info-label">N° Dossier:</span><span>' + escapeHtml(patientData.numero_dossier) + '</span></div>\n';
    }
    if (patientData.telephone) {
      htmlContent += '<div class="info-row"><span class="info-label">Téléphone:</span><span>' + escapeHtml(patientData.telephone) + '</span></div>\n';
    }
    if (patientData.adresse) {
      htmlContent += '<div class="info-row"><span class="info-label">Adresse:</span><span>' + escapeHtml(patientData.adresse) + '</span></div>\n';
    }
    htmlContent += '</div>\n</div>\n';

    // Consultations
    if (donneesMedicales.consultations && donneesMedicales.consultations.length > 0) {
      htmlContent += '<div class="section">\n<h2>Consultations (' + donneesMedicales.consultations.length + ')</h2>\n';
      htmlContent += '<table>\n<thead>\n<tr>\n<th>Date</th>\n<th>Médecin</th>\n<th>Motif</th>\n<th>Statut</th>\n</tr>\n</thead>\n<tbody>\n';
      donneesMedicales.consultations.forEach(consultation => {
        htmlContent += '<tr>\n';
        htmlContent += '<td>' + formatDate(consultation.date_consultation) + '</td>\n';
        htmlContent += '<td>Dr. ' + escapeHtml(consultation.medecin?.prenom || '') + ' ' + escapeHtml(consultation.medecin?.nom || '') + '</td>\n';
        htmlContent += '<td>' + escapeHtml(consultation.motif_consultation || 'N/A') + '</td>\n';
        htmlContent += '<td>' + escapeHtml(consultation.statut || 'N/A') + '</td>\n';
        htmlContent += '</tr>\n';
      });
      htmlContent += '</tbody>\n</table>\n</div>\n';
    }

    // Antécédents
    if (donneesMedicales.antecedents && donneesMedicales.antecedents.length > 0) {
      htmlContent += '<div class="section">\n<h2>Antécédents (' + donneesMedicales.antecedents.length + ')</h2>\n';
      htmlContent += '<table>\n<thead>\n<tr>\n<th>Antécédent</th>\n<th>Date de découverte</th>\n<th>Commentaires</th>\n</tr>\n</thead>\n<tbody>\n';
      donneesMedicales.antecedents.forEach(antecedent => {
        htmlContent += '<tr>\n';
        htmlContent += '<td>' + escapeHtml(antecedent.antecedents?.nom || 'N/A') + '</td>\n';
        htmlContent += '<td>' + formatDate(antecedent.date_decouverte) + '</td>\n';
        htmlContent += '<td>' + escapeHtml(antecedent.commentaires || '') + '</td>\n';
        htmlContent += '</tr>\n';
      });
      htmlContent += '</tbody>\n</table>\n</div>\n';
    }

    // Constantes
    if (donneesMedicales.constantes && donneesMedicales.constantes.length > 0) {
      htmlContent += '<div class="section">\n<h2>Constantes médicales (' + donneesMedicales.constantes.length + ')</h2>\n';
      htmlContent += '<table>\n<thead>\n<tr>\n<th>Constante</th>\n<th>Valeur</th>\n<th>Unité</th>\n<th>Date</th>\n</tr>\n</thead>\n<tbody>\n';
      donneesMedicales.constantes.forEach(constante => {
        htmlContent += '<tr>\n';
        htmlContent += '<td>' + escapeHtml(constante.constantes?.nom || 'N/A') + '</td>\n';
        htmlContent += '<td>' + escapeHtml(constante.valeur_mesuree || '') + '</td>\n';
        htmlContent += '<td>' + escapeHtml(constante.unite || '') + '</td>\n';
        htmlContent += '<td>' + formatDate(constante.created_at) + '</td>\n';
        htmlContent += '</tr>\n';
      });
      htmlContent += '</tbody>\n</table>\n</div>\n';
    }

    // Diagnostics
    if (donneesMedicales.diagnostics && donneesMedicales.diagnostics.length > 0) {
      htmlContent += '<div class="section">\n<h2>Diagnostics (' + donneesMedicales.diagnostics.length + ')</h2>\n';
      htmlContent += '<table>\n<thead>\n<tr>\n<th>Diagnostic</th>\n<th>Certitude</th>\n<th>Commentaires</th>\n</tr>\n</thead>\n<tbody>\n';
      donneesMedicales.diagnostics.forEach(diagnostic => {
        htmlContent += '<tr>\n';
        htmlContent += '<td>' + escapeHtml(diagnostic.diagnostics?.nom || 'N/A') + '</td>\n';
        htmlContent += '<td>' + escapeHtml(diagnostic.certitude || '') + '</td>\n';
        htmlContent += '<td>' + escapeHtml(diagnostic.commentaires || '') + '</td>\n';
        htmlContent += '</tr>\n';
      });
      htmlContent += '</tbody>\n</table>\n</div>\n';
    }

    // Ordonnances
    if (donneesMedicales.ordonnances && donneesMedicales.ordonnances.length > 0) {
      htmlContent += '<div class="section">\n<h2>Ordonnances (' + donneesMedicales.ordonnances.length + ')</h2>\n';
      donneesMedicales.ordonnances.forEach(ordonnance => {
        htmlContent += '<div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">\n';
        htmlContent += '<h3>Ordonnance ' + escapeHtml(ordonnance.numero_ordonnance || 'N/A') + ' - ' + formatDate(ordonnance.date_prescription) + '</h3>\n';
        if (ordonnance.instructions_generales) {
          htmlContent += '<p><strong>Instructions:</strong> ' + escapeHtml(ordonnance.instructions_generales) + '</p>\n';
        }
        if (ordonnance.lignes_ordonnance && ordonnance.lignes_ordonnance.length > 0) {
          htmlContent += '<table>\n<thead>\n<tr>\n<th>Médicament</th>\n<th>Posologie</th>\n<th>Quantité</th>\n<th>Durée</th>\n</tr>\n</thead>\n<tbody>\n';
          ordonnance.lignes_ordonnance.forEach(ligne => {
            htmlContent += '<tr>\n';
            htmlContent += '<td>' + escapeHtml(ligne.medicaments?.nom || 'N/A') + '</td>\n';
            htmlContent += '<td>' + escapeHtml(ligne.posologie || '') + '</td>\n';
            htmlContent += '<td>' + escapeHtml(ligne.quantite || '') + '</td>\n';
            htmlContent += '<td>' + escapeHtml(ligne.duree_traitement || '') + '</td>\n';
            htmlContent += '</tr>\n';
          });
          htmlContent += '</tbody>\n</table>\n';
        }
        htmlContent += '</div>\n';
      });
      htmlContent += '</div>\n';
    }

    // Certificats
    if (donneesMedicales.certificats && donneesMedicales.certificats.length > 0) {
      htmlContent += '<div class="section">\n<h2>Certificats médicaux (' + donneesMedicales.certificats.length + ')</h2>\n';
      htmlContent += '<table>\n<thead>\n<tr>\n<th>Type</th>\n<th>Date début</th>\n<th>Durée (jours)</th>\n<th>Motif</th>\n</tr>\n</thead>\n<tbody>\n';
      donneesMedicales.certificats.forEach(certificat => {
        htmlContent += '<tr>\n';
        htmlContent += '<td>' + escapeHtml(certificat.types_certificats?.nom || 'N/A') + '</td>\n';
        htmlContent += '<td>' + formatDate(certificat.date_debut) + '</td>\n';
        htmlContent += '<td>' + (certificat.duree_jours || '') + '</td>\n';
        htmlContent += '<td>' + escapeHtml(certificat.motif || '') + '</td>\n';
        htmlContent += '</tr>\n';
      });
      htmlContent += '</tbody>\n</table>\n</div>\n';
    }

    // Documents
    if ((donneesMedicales.documents && donneesMedicales.documents.length > 0) ||
        (donneesMedicales.patientDocuments && donneesMedicales.patientDocuments.length > 0)) {
      htmlContent += '<div class="section">\n<h2>Documents médicaux</h2>\n';
      htmlContent += '<table>\n<thead>\n<tr>\n<th>Type</th>\n<th>Nom du fichier</th>\n<th>Date</th>\n<th>Description</th>\n</tr>\n</thead>\n<tbody>\n';
      if (donneesMedicales.documents) {
        donneesMedicales.documents.forEach(doc => {
          htmlContent += '<tr>\n';
          htmlContent += '<td>' + escapeHtml(doc.type_document || 'N/A') + '</td>\n';
          htmlContent += '<td>' + escapeHtml(doc.nom_fichier || '') + '</td>\n';
          htmlContent += '<td>' + formatDate(doc.created_at) + '</td>\n';
          htmlContent += '<td>' + escapeHtml(doc.description || '') + '</td>\n';
          htmlContent += '</tr>\n';
        });
      }
      if (donneesMedicales.patientDocuments) {
        donneesMedicales.patientDocuments.forEach(doc => {
          htmlContent += '<tr>\n';
          htmlContent += '<td>' + escapeHtml(doc.type_document || 'N/A') + '</td>\n';
          htmlContent += '<td>' + escapeHtml(doc.nom_fichier || '') + '</td>\n';
          htmlContent += '<td>' + formatDate(doc.date_document) + '</td>\n';
          htmlContent += '<td>' + escapeHtml(doc.notes || '') + '</td>\n';
          htmlContent += '</tr>\n';
        });
      }
      htmlContent += '</tbody>\n</table>\n</div>\n';
    }

    // Notes
    if (transfertData.notes) {
      htmlContent += '<div class="section">\n<h2>Notes additionnelles</h2>\n';
      htmlContent += '<div class="info-box">\n<p>' + escapeHtml(transfertData.notes) + '</p>\n</div>\n</div>\n';
    }

    // Footer
    htmlContent += '<div class="footer">\n';
    htmlContent += '<p>Document généré automatiquement le ' + new Date().toLocaleString('fr-FR') + '</p>\n';
    htmlContent += '<p>Signature du médecin: _________________________</p>\n';
    htmlContent += '<p>Dr. ' + escapeHtml(medecinData.prenom || '') + ' ' + escapeHtml(medecinData.nom || '') + '</p>\n';
    htmlContent += '</div>\n</body>\n</html>';

    return htmlContent;
  }

  /**
   * Génère un PDF à partir du HTML et l'upload vers Supabase Storage
   * @param {string} htmlContent - Contenu HTML
   * @param {string} fileName - Nom du fichier
   * @returns {Promise<string>} URL publique du PDF
   */
  async genererEtUploaderPDF(htmlContent, fileName) {
    try {
      // Créer un blob HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      // Créer un objet File à partir du blob
      const file = new File([blob], fileName, { type: 'text/html' });
      
      // Upload vers Supabase Storage
      const result = await documentUploadService.uploadFile(
        'patient-documents',
        file,
        {
          folder: 'transferts',
          fileName: fileName
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'upload du document');
      }

      return result.data.publicUrl;
    } catch (error) {
      console.error('Erreur lors de la génération/upload du PDF:', error);
      throw error;
    }
  }

  /**
   * Génère le document de transfert complet
   * @param {number} transfertId - ID du transfert
   * @returns {Promise<string>} URL du document généré
   */
  async genererDocumentTransfert(transfertId) {
    try {
      // Récupérer les données du transfert
      const { data: transfert, error: transfertError } = await supabase
        .from('transferts_dossiers')
        .select('*')
        .eq('id', transfertId)
        .single();

      if (transfertError || !transfert) {
        throw new Error('Transfert non trouvé');
      }

      // Récupérer les données du patient
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', transfert.patient_id)
        .single();

      if (patientError || !patient) {
        throw new Error('Patient non trouvé');
      }

      // Récupérer les données du médecin
      const { data: medecin, error: medecinError } = await supabase
        .from('users')
        .select('*')
        .eq('id', transfert.medecin_origine_id)
        .single();

      if (medecinError || !medecin) {
        throw new Error('Médecin non trouvé');
      }

      // Récupérer les données du cabinet
      const { data: cabinet, error: cabinetError } = await supabase
        .from('parametres_cabinet')
        .select('*')
        .single();

      if (cabinetError) {
        console.warn('Cabinet non trouvé, utilisation des valeurs par défaut');
      }

      // Récupérer les données médicales selon la sélection
      const donneesSelectionnees = transfert.donnees_transferees || {};
      // Utiliser les IDs de consultations sélectionnées si disponibles, sinon toutes les consultations du patient
      let consultationIds = null;
      if (donneesSelectionnees.consultationIds && donneesSelectionnees.consultationIds.length > 0) {
        consultationIds = donneesSelectionnees.consultationIds;
      } else if (transfert.consultation_id) {
        consultationIds = [transfert.consultation_id];
      }
      
      const donneesMedicales = await this.recupererDonneesMedicales(
        transfert.patient_id,
        donneesSelectionnees,
        consultationIds
      );

      // Générer le HTML
      const htmlContent = this.genererHTMLDocument(
        transfert,
        patient,
        medecin,
        cabinet || {},
        donneesMedicales
      );

      // Générer le nom du fichier
      const fileName = `transfert_${patient.numero_dossier || patient.id}_${Date.now()}.html`;

      // Uploader le document
      const documentUrl = await this.genererEtUploaderPDF(htmlContent, fileName);

      // Mettre à jour le transfert avec l'URL du document
      const { error: updateError } = await supabase
        .from('transferts_dossiers')
        .update({ document_transfert_url: documentUrl })
        .eq('id', transfertId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du transfert:', updateError);
      }

      return documentUrl;
    } catch (error) {
      console.error('Erreur lors de la génération du document de transfert:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau transfert de dossier
   * @param {Object} transfertData - Données du transfert
   * @returns {Promise<Object>} Transfert créé
   */
  async creerTransfert(transfertData) {
    try {
      // Récupérer l'ID du médecin actuel
      const { data: { user } } = await supabase.auth.getUser();
      const { data: medecin } = await supabase
        .from('users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!medecin) {
        throw new Error('Médecin non trouvé');
      }

      // Créer le transfert
      const { data: transfert, error: error } = await supabase
        .from('transferts_dossiers')
        .insert({
          ...transfertData,
          medecin_origine_id: medecin.id,
          statut: 'en_preparation',
          date_transfert: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return transfert;
    } catch (error) {
      console.error('Erreur lors de la création du transfert:', error);
      throw error;
    }
  }
}

// Instance singleton
const transfertDossierService = new TransfertDossierService();
export default transfertDossierService;
