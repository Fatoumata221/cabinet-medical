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
          .from('certificats_consultation')
          .select(`
            *,
            types_certificats(*)
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

    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Transfert de dossier médical - ${patientData.prenom} ${patientData.nom}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.6;
              color: #333;
            }
            .header-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding: 20px;
              background-color: #f8fafc;
              border-radius: 8px;
            }
            .medecin-info, .cabinet-info {
              flex: 1;
            }
            .medecin-info h3, .cabinet-info h4 {
              margin-top: 0;
              color: #2563eb;
            }
            h1 {
              color: #2563eb;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 10px;
              text-align: center;
            }
            h2 {
              color: #1e40af;
              border-bottom: 2px solid #1e40af;
              padding-bottom: 5px;
              margin-top: 30px;
            }
            .section {
              margin-bottom: 25px;
            }
            .info-box {
              background-color: #f1f5f9;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .info-row {
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              display: inline-block;
              width: 150px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #2563eb;
              color: white;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div class="medecin-info">
              <h3>Dr. ${medecinData.prenom || ''} ${medecinData.nom || ''}</h3>
              ${medecinData.specialite ? `<p>${medecinData.specialite}</p>` : ''}
              ${medecinData.telephone ? `<p>Tél: ${medecinData.telephone}</p>` : ''}
              ${medecinData.email ? `<p>Email: ${medecinData.email}</p>` : ''}
            </div>
            <div class="cabinet-info">
              <h4>${cabinetData.nom_cabinet || 'Cabinet Médical'}</h4>
              ${cabinetData.adresse ? `<p>${cabinetData.adresse}</p>` : ''}
              ${cabinetData.ville || cabinetData.code_postal ? `<p>${cabinetData.ville || ''} ${cabinetData.code_postal || ''}</p>` : ''}
              ${cabinetData.telephone ? `<p>Tél: ${cabinetData.telephone}</p>` : ''}
              ${cabinetData.email ? `<p>Email: ${cabinetData.email}</p>` : ''}
            </div>
          </div>

          <h1>TRANSFERT DE DOSSIER MÉDICAL</h1>

          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Date du transfert:</span>
              <span>${formatDate(transfertData.date_transfert)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Destinataire:</span>
              <span>${transfertData.nom_destinataire} (${transfertData.type_destinataire})</span>
            </div>
            ${transfertData.adresse_destinataire ? `
            <div class="info-row">
              <span class="info-label">Adresse:</span>
              <span>${transfertData.adresse_destinataire}</span>
            </div>
            ` : ''}
            ${transfertData.telephone_destinataire ? `
            <div class="info-row">
              <span class="info-label">Téléphone:</span>
              <span>${transfertData.telephone_destinataire}</span>
            </div>
            ` : ''}
            ${transfertData.email_destinataire ? `
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span>${transfertData.email_destinataire}</span>
            </div>
            ` : ''}
            ${transfertData.medecin_destinataire ? `
            <div class="info-row">
              <span class="info-label">Médecin destinataire:</span>
              <span>${transfertData.medecin_destinataire}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Motif du transfert:</span>
              <span>${transfertData.motif_transfert}</span>
            </div>
          </div>

          <div class="section">
            <h2>Informations du patient</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Nom:</span>
                <span>${patientData.nom}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Prénom:</span>
                <span>${patientData.prenom}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date de naissance:</span>
                <span>${formatDate(patientData.date_naissance)}</span>
              </div>
              ${patientData.sexe ? `
              <div class="info-row">
                <span class="info-label">Sexe:</span>
                <span>${patientData.sexe === 'M' ? 'Masculin' : 'Féminin'}</span>
              </div>
              ` : ''}
              ${patientData.numero_dossier ? `
              <div class="info-row">
                <span class="info-label">N° Dossier:</span>
                <span>${patientData.numero_dossier}</span>
              </div>
              ` : ''}
              ${patientData.telephone ? `
              <div class="info-row">
                <span class="info-label">Téléphone:</span>
                <span>${patientData.telephone}</span>
              </div>
              ` : ''}
              ${patientData.adresse ? `
              <div class="info-row">
                <span class="info-label">Adresse:</span>
                <span>${patientData.adresse}</span>
              </div>
              ` : ''}
            </div>
          </div>
    `;

    // Consultations
    if (donneesMedicales.consultations && donneesMedicales.consultations.length > 0) {
      htmlContent += `
          <div class="section">
            <h2>Consultations (${donneesMedicales.consultations.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Médecin</th>
                  <th>Motif</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
      `;
      donneesMedicales.consultations.forEach(consultation => {
        htmlContent += `
                <tr>
                  <td>${formatDate(consultation.date_consultation)}</td>
                  <td>Dr. ${consultation.medecin?.prenom || ''} ${consultation.medecin?.nom || ''}</td>
                  <td>${consultation.motif_consultation || 'N/A'}</td>
                  <td>${consultation.statut || 'N/A'}</td>
                </tr>
        `;
      });
      htmlContent += `
              </tbody>
            </table>
          </div>
      `;
    }

    // Antécédents
    if (donneesMedicales.antecedents && donneesMedicales.antecedents.length > 0) {
      htmlContent += `
          <div class="section">
            <h2>Antécédents (${donneesMedicales.antecedents.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Antécédent</th>
                  <th>Date de découverte</th>
                  <th>Commentaires</th>
                </tr>
              </thead>
              <tbody>
      `;
      donneesMedicales.antecedents.forEach(antecedent => {
        htmlContent += `
                <tr>
                  <td>${antecedent.antecedents?.nom || 'N/A'}</td>
                  <td>${formatDate(antecedent.date_decouverte)}</td>
                  <td>${antecedent.commentaires || ''}</td>
                </tr>
        `;
      });
      htmlContent += `
              </tbody>
            </table>
          </div>
      `;
    }

    // Constantes
    if (donneesMedicales.constantes && donneesMedicales.constantes.length > 0) {
      htmlContent += `
          <div class="section">
            <h2>Constantes médicales (${donneesMedicales.constantes.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Constante</th>
                  <th>Valeur</th>
                  <th>Unité</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
      `;
      donneesMedicales.constantes.forEach(constante => {
        htmlContent += `
                <tr>
                  <td>${constante.constantes?.nom || 'N/A'}</td>
                  <td>${constante.valeur_mesuree || ''}</td>
                  <td>${constante.unite || ''}</td>
                  <td>${formatDate(constante.created_at)}</td>
                </tr>
        `;
      });
      htmlContent += `
              </tbody>
            </table>
          </div>
      `;
    }

    // Diagnostics
    if (donneesMedicales.diagnostics && donneesMedicales.diagnostics.length > 0) {
      htmlContent += `
          <div class="section">
            <h2>Diagnostics (${donneesMedicales.diagnostics.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Diagnostic</th>
                  <th>Certitude</th>
                  <th>Commentaires</th>
                </tr>
              </thead>
              <tbody>
      `;
      donneesMedicales.diagnostics.forEach(diagnostic => {
        htmlContent += `
                <tr>
                  <td>${diagnostic.diagnostics?.nom || 'N/A'}</td>
                  <td>${diagnostic.certitude || ''}</td>
                  <td>${diagnostic.commentaires || ''}</td>
                </tr>
        `;
      });
      htmlContent += `
              </tbody>
            </table>
          </div>
      `;
    }

    // Ordonnances
    if (donneesMedicales.ordonnances && donneesMedicales.ordonnances.length > 0) {
      htmlContent += `
          <div class="section">
            <h2>Ordonnances (${donneesMedicales.ordonnances.length})</h2>
      `;
      donneesMedicales.ordonnances.forEach(ordonnance => {
        htmlContent += `
            <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
              <h3>Ordonnance ${ordonnance.numero_ordonnance || 'N/A'} - ${formatDate(ordonnance.date_prescription)}</h3>
              ${ordonnance.instructions_generales ? `<p><strong>Instructions:</strong> ${ordonnance.instructions_generales}</p>` : ''}
              ${ordonnance.lignes_ordonnance && ordonnance.lignes_ordonnance.length > 0 ? `
                <table>
                  <thead>
                    <tr>
                      <th>Médicament</th>
                      <th>Posologie</th>
                      <th>Quantité</th>
                      <th>Durée</th>
                    </tr>
                  </thead>
                  <tbody>
              ` : ''}
        `;
        if (ordonnance.lignes_ordonnance) {
          ordonnance.lignes_ordonnance.forEach(ligne => {
            htmlContent += `
                    <tr>
                      <td>${ligne.medicaments?.nom || 'N/A'}</td>
                      <td>${ligne.posologie || ''}</td>
                      <td>${ligne.quantite || ''}</td>
                      <td>${ligne.duree_traitement || ''}</td>
                    </tr>
            `;
          });
        }
        htmlContent += `
                  </tbody>
                </table>
              ` : ''}
            </div>
        `;
      });
      htmlContent += `
          </div>
      `;
    }

    // Certificats
    if (donneesMedicales.certificats && donneesMedicales.certificats.length > 0) {
      htmlContent += `
          <div class="section">
            <h2>Certificats médicaux (${donneesMedicales.certificats.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date début</th>
                  <th>Durée (jours)</th>
                  <th>Motif</th>
                </tr>
              </thead>
              <tbody>
      `;
      donneesMedicales.certificats.forEach(certificat => {
        htmlContent += `
                <tr>
                  <td>${certificat.types_certificats?.nom || 'N/A'}</td>
                  <td>${formatDate(certificat.date_debut)}</td>
                  <td>${certificat.duree_jours || ''}</td>
                  <td>${certificat.motif || ''}</td>
                </tr>
        `;
      });
      htmlContent += `
              </tbody>
            </table>
          </div>
      `;
    }

    // Documents
    if ((donneesMedicales.documents && donneesMedicales.documents.length > 0) ||
        (donneesMedicales.patientDocuments && donneesMedicales.patientDocuments.length > 0)) {
      htmlContent += `
          <div class="section">
            <h2>Documents médicaux</h2>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Nom du fichier</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
      `;
      if (donneesMedicales.documents) {
        donneesMedicales.documents.forEach(doc => {
          htmlContent += `
                <tr>
                  <td>${doc.type_document || 'N/A'}</td>
                  <td>${doc.nom_fichier || ''}</td>
                  <td>${formatDate(doc.created_at)}</td>
                  <td>${doc.description || ''}</td>
                </tr>
          `;
        });
      }
      if (donneesMedicales.patientDocuments) {
        donneesMedicales.patientDocuments.forEach(doc => {
          htmlContent += `
                <tr>
                  <td>${doc.type_document || 'N/A'}</td>
                  <td>${doc.nom_fichier || ''}</td>
                  <td>${formatDate(doc.date_document)}</td>
                  <td>${doc.notes || ''}</td>
                </tr>
          `;
        });
      }
      htmlContent += `
              </tbody>
            </table>
          </div>
      `;
    }

    // Notes additionnelles
    if (transfertData.notes) {
      htmlContent += `
          <div class="section">
            <h2>Notes additionnelles</h2>
            <div class="info-box">
              <p>${transfertData.notes}</p>
            </div>
          </div>
      `;
    }

    htmlContent += `
          <div class="footer">
            <p>Document généré automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
            <p>Signature du médecin: _________________________</p>
            <p>Dr. ${medecinData.prenom || ''} ${medecinData.nom || ''}</p>
          </div>
        </body>
      </html>
    `;

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
      
      // Pour l'instant, on va stocker le HTML et laisser le navigateur l'imprimer
      // Dans une version future, on pourrait utiliser une bibliothèque comme jsPDF ou html2pdf
      // Pour l'instant, on va créer un fichier HTML téléchargeable
      
      // Créer un objet File à partir du blob
      const file = new File([blob], fileName, { type: 'text/html' });
      
      // Upload vers Supabase Storage
      const result = await documentUploadService.uploadFile(
        'patient-documents', // ou créer un bucket 'transferts-dossiers'
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

