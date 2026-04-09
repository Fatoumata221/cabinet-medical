export const printConsultationReport = (patient, consultation, antecedents, constantes, signesCliniques, examensAppareils, syntheses, diagnostics, ordonnances, certificats) => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
        // Consider showing an error to the user that popup was blocked
        return { success: false, error: 'Popup bloqué' };
    }
    const title = `Rapport Consultation - ${patient?.prenom || ''} ${patient?.nom || ''}`.trim();
    const sections = [
      { title: 'Antécédents', data: antecedents?.map(a => a.antecedents?.nom || a.antecedent || '')?.filter(Boolean) },
      { title: 'Constantes', data: constantes?.map(c => `${c.constantes?.nom || ''}: ${c.valeur_mesuree ?? ''} ${c.unite || c.constantes?.unite || ''}`)?.filter(Boolean) },
      { title: 'Signes cliniques', data: signesCliniques?.map(s => s.signes_cliniques?.nom || '')?.filter(Boolean) },
      { title: 'Examens / Appareils', data: examensAppareils?.map(e => e.appareils?.nom || '')?.filter(Boolean) },
      { title: 'Synthèse', data: syntheses?.map(sy => sy.elements_synthese?.nom || '')?.filter(Boolean) },
      { title: 'Diagnostics', data: diagnostics?.map(d => d.diagnostics?.nom || '')?.filter(Boolean) },
      { title: 'Ordonnances', data: ordonnances?.map(o => `N° ${o.numero_ordonnance} • ${new Date(o.date_prescription).toLocaleDateString('fr-FR')}`) },
      { title: 'Certificats', data: certificats?.map(c => `${c.types_certificats?.nom || 'Certificat'} • ${new Date(c.date_debut).toLocaleDateString('fr-FR')}`) }
    ];
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            h2 { margin: 24px 0 8px; font-size: 16px; }
            .badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:12px; background:#E5F4EB; color:#166534; }
            .meta { color:#6B7280; font-size: 12px; margin-bottom: 16px; }
            ul { margin: 8px 0 0 18px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">
            Dossier: ${patient?.numero_dossier || ''} • ${patient?.date_naissance ? `${new Date(patient.date_naissance).toLocaleDateString('fr-FR')}` : ''}<br/>
            Date consultation: ${consultation?.date_consultation ? new Date(consultation.date_consultation).toLocaleString('fr-FR') : ''}
          </div>
          <div class="badge">${consultation?.statut?.replace('_',' ') || 'en cours'}</div>
          ${sections.map(sec => sec.data && sec.data.length ? `<h2>${sec.title}</h2><ul>${sec.data.map(item => `<li>${item}</li>`).join('')}</ul>` : '').join('')}
          <script>window.print(); setTimeout(()=>window.close(), 300);</script>
        </body>
      </html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
    return { success: true };
};
