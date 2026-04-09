import { fetchParametres } from '../parametrageService.js';

export const printOrdonnances = async (supabase, ordonnances, patient, medecin, consultation) => {
    try {
      let medecinData = medecin;
      if (!medecinData || (!medecinData.nom && !medecinData.prenom)) {
        const medecinId = medecin?.id || consultation?.medecin_id || consultation?.users?.id;
        if (medecinId) {
          const { data: medecinDataFromDb } = await supabase
            .from('users')
            .select('nom, prenom, specialite, telephone, email, signature_url')
            .eq('id', medecinId)
            .single();
          if (medecinDataFromDb) {
            medecinData = medecinDataFromDb;
          }
        }
      }
      
      if (!medecinData) {
        throw new Error('Impossible de récupérer les informations du médecin');
      }

      // Utiliser le service centralisé
      const settings = await fetchParametres();
      
      // Préparation des styles dynamiques
      const fontFamily = settings.document_police || 'sans-serif';
      const primaryColor = settings.document_couleur_principale || '#000000';
      const borderColor = settings.document_couleur_bordure || '#e5e7eb';
      const fontSize = settings.document_taille_police || 14;

      let content = '';
      
      ordonnances.forEach((ordonnance, index) => {
        content += `
          <div class="ordonnance" style="page-break-after: ${index < ordonnances.length - 1 ? 'always' : 'auto'};">
            <div class="header-container">
              <div class="cabinet-info">
                ${settings.document_afficher_logo && (settings.document_logo_url || settings.logo_url) ? 
                  `<img src="${settings.document_logo_url || settings.logo_url}" alt="Logo" class="logo" />` : 
                  `<h1>${settings.nom_cabinet || 'Cabinet Médical'}</h1>`
                }
                ${settings.document_afficher_logo && (settings.document_logo_url || settings.logo_url) ? 
                  `<h1 style="margin-top: 10px;">${settings.nom_cabinet || ''}</h1>` : ''
                }
                <p>${settings.adresse || ''}</p>
                <p>${settings.code_postal || ''} ${settings.ville || ''}</p>
                <p>Tél: ${settings.telephone || ''} | Email: ${settings.email || ''}</p>
              </div>
              <div class="cabinet-info" style="text-align: right;">
                <p><strong>Médecin prescripteur</strong></p>
                <p>Dr. ${medecinData?.prenom || ''} ${medecinData?.nom || ''}</p>
                <p>${medecinData?.specialite || ''}</p>
                <p>Tél: ${medecinData?.telephone || ''}</p>
              </div>
            </div>

            <div class="header">
              <h1>${settings.ordonnance_titre || 'ORDONNANCE MÉDICALE'}</h1>
              <div class="ordonnance-meta">
                <div class="meta-item">
                  <span class="label">Date:</span>
                  <span class="value">${new Date(ordonnance.date_prescription || consultation.date_consultation).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>

            <div class="patient-section">
              <h3>Patient</h3>
              <div class="patient-details">
                <div><strong>Nom:</strong> ${patient?.prenom || ''} ${patient?.nom || ''}</div>
                ${(patient?.date_naissance) ? `<div><strong>Âge:</strong> ${new Date().getFullYear() - new Date(patient.date_naissance).getFullYear()} ans</div>` : ''}
              </div>
            </div>

            <div class="medicaments">
              ${ordonnance.lignes_ordonnance?.map((ligne, idx) => `
                <div class="medicament">
                  <div class="medicament-header">
                    <span class="medicament-numero">${idx + 1}</span>
                    <strong class="medicament-nom">${ligne.medicaments?.nom || 'Médicament'}</strong>
                  </div>
                  <div class="medicament-details">
                    <div class="detail-row"><span class="icon">💊</span> <strong>Posologie:</strong> ${ligne.posologie || 'N/A'}</div>
                    ${ligne.quantite ? `<div class="detail-row"><span class="icon">📦</span> <strong>Quantité:</strong> ${ligne.quantite}</div>` : ''}
                    ${ligne.duree_traitement ? `<div class="detail-row"><span class="icon">⏱️</span> <strong>Durée:</strong> ${ligne.duree_traitement} jours</div>` : ''}
                    ${ligne.instructions_particulieres ? `<div class="detail-row special"><span class="icon">ℹ️</span> <strong>Instructions:</strong> ${ligne.instructions_particulieres}</div>` : ''}
                  </div>
                </div>
              `).join('') || '<p>Aucun médicament prescrit</p>'}
            </div>

            ${ordonnance.instructions_generales ? `
              <div class="recommandations">
                <h3>💡 Recommandations</h3>
                <div class="recommandations-content">
                  <p>${ordonnance.instructions_generales}</p>
                </div>
              </div>
            ` : ''}

            <div class="signature-section">
              <div class="signature-box">
                <p>Date et signature du médecin</p>
                ${medecinData?.signature_url ? `
                  <img src="${medecinData.signature_url}" alt="Signature" class="signature-image" />
                  <p class="medecin-name-sig">Dr. ${medecinData?.prenom || ''} ${medecinData?.nom || ''}</p>
                ` : `
                  <div class="signature-line"></div>
                  <p class="signature-placeholder">Signature manuscrite</p>
                `}
              </div>
            </div>

            <div class="footer">
              <p>${settings.ordonnance_footer_texte || settings.document_footer_texte || `Document généré le ${new Date().toLocaleString('fr-FR')}`}</p>
              <p style="margin-top: 5px; font-size: 0.9em;">
                 ${settings.nom_cabinet} - ${settings.adresse}, ${settings.ville}
              </p>
            </div>
          </div>
        `;
      });

      const win = window.open('', '_blank');
      win.document.open();
      win.document.write(`
        <html>
          <head>
            <title>Ordonnances - ${patient?.prenom} ${patient?.nom}</title>
            <meta charset="UTF-8">
            <style>
              @page {
                size: A4;
                margin: 0;
              }
              body {
                font-family: "${fontFamily}", sans-serif;
                font-size: ${fontSize}px;
                color: #1f2937;
                line-height: 1.5;
                margin: 0;
                padding: 40px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .header-container {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid ${borderColor};
              }
              .logo {
                max-width: 150px;
                max-height: 80px;
                object-fit: contain;
              }
              .cabinet-info h1 {
                margin: 0;
                font-size: 1.2em;
                color: ${primaryColor};
                text-transform: uppercase;
              }
              .cabinet-info p {
                margin: 2px 0;
                font-size: 0.8em;
                color: #6b7280;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .header h1 {
                font-size: 1.8em;
                color: ${primaryColor};
                text-transform: uppercase;
                letter-spacing: 2px;
                margin: 0 0 10px 0;
              }
              .ordonnance-meta {
                display: flex;
                justify-content: center;
                gap: 20px;
                color: #6b7280;
              }
              .patient-section {
                background: #f9fafb;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid ${primaryColor};
              }
              .patient-section h3 {
                margin: 0 0 10px 0;
                color: ${primaryColor};
                font-size: 1em;
                text-transform: uppercase;
              }
              .patient-details {
                display: flex;
                gap: 30px;
              }
              .medicaments {
                margin-bottom: 40px;
              }
              .medicament {
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 1px dashed ${borderColor};
              }
              .medicament:last-child {
                border-bottom: none;
              }
              .medicament-header {
                display: flex;
                align-items: baseline;
                gap: 10px;
                margin-bottom: 8px;
              }
              .medicament-numero {
                background: ${primaryColor};
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8em;
                font-weight: bold;
              }
              .medicament-nom {
                font-size: 1.1em;
                color: #111827;
              }
              .medicament-details {
                margin-left: 34px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 8px;
              }
              .detail-row {
                font-size: 0.95em;
                color: #4b5563;
              }
              .detail-row.special {
                grid-column: 1 / -1;
                background: #fffbeb;
                padding: 8px;
                border-radius: 4px;
                color: #92400e;
                margin-top: 5px;
              }
              .icon {
                margin-right: 5px;
              }
              .recommandations {
                margin-top: 20px;
                padding: 15px;
                background-color: #f3f4f6;
                border-radius: 8px;
              }
              .recommandations h3 {
                margin-top: 0;
                font-size: 1em;
                color: ${primaryColor};
              }
              .signature-section {
                margin-top: 50px;
                display: flex;
                justify-content: flex-end;
              }
              .signature-box {
                text-align: center;
                width: 250px;
              }
              .signature-image {
                max-width: 100%;
                max-height: 100px;
                margin-top: 10px;
              }
              .signature-line {
                border-bottom: 1px solid #000;
                margin-top: 40px;
                margin-bottom: 10px;
              }
              .signature-placeholder {
                font-style: italic;
                color: #9ca3af;
              }
              .medecin-name-sig {
                font-weight: bold;
                margin-top: 5px;
              }
              .footer {
                position: fixed;
                bottom: 40px;
                left: 40px;
                right: 40px;
                text-align: center;
                font-size: 0.7em;
                color: #9ca3af;
                border-top: 1px solid ${borderColor};
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            ${content}
            <script>
              window.onload = function() {
                setTimeout(() => { window.print(); }, 500);
              }
            </script>
          </body>
        </html>
      `);
      win.document.close();
      return { success: true };
    } catch (err) {
      console.error('Erreur impression ordonnances:', err);
      return { success: false, error: err.message };
    }
};
