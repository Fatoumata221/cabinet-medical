import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Génère un PDF pour un devis (similaire à facture mais avec statut "Devis")
 * @param {Object} supabase - Client Supabase
 * @param {Object} devisData - Données du devis
 * @param {boolean} print - Si true, ouvre la boîte de dialogue d'impression
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const generateDevisPDF = async (supabase, devisData, print = false) => {
  try {
    // Récupérer les informations du cabinet si nécessaire
    const { data: cabinetInfo } = await supabase
      .from('parametres_cabinet')
      .select('*')
      .single();

    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.text('DEVIS', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Numéro: ${devisData.numero}`, 20, 35);
    doc.text(`Date: ${new Date(devisData.date).toLocaleDateString('fr-FR')}`, 20, 45);
    doc.text(`Patient: ${devisData.patient.prenom} ${devisData.patient.nom}`, 20, 55);
    doc.text(`Médecin: ${devisData.medecin}`, 20, 65);

    // Informations du devis
    doc.setFontSize(10);
    doc.text(`Statut: DEVIS`, 150, 35);
    doc.text(`Validité: 30 jours`, 150, 45);

    // Tableau des actes
    const tableData = devisData.actes.map(acte => [
      acte.acte.code || `ACT-${acte.acte.id}`,
      acte.acte.libelle,
      acte.quantite.toString(),
      `${acte.tarifUnitaire.toFixed(2)} FCFA`,
      `${(acte.quantite * acte.tarifUnitaire).toFixed(2)} FCFA`
    ]);

    autoTable(doc, {
      head: [['Code', 'Libellé', 'Qté', 'Tarif Unitaire', 'Total']],
      body: tableData,
      startY: 80,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Totaux
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.text(`Sous-total: ${devisData.sousTotal.toFixed(2)} FCFA`, 150, finalY);
    
    if (devisData.remise > 0) {
      doc.text(`Remise (${devisData.remise}%): -${((devisData.sousTotal * devisData.remise) / 100).toFixed(2)} FCFA`, 150, finalY + 10);
    }
    
    doc.setFontSize(12);
    doc.text(`Total: ${devisData.total.toFixed(2)} FCFA`, 150, finalY + 20);

    if (devisData.montantAssurance > 0) {
      doc.setFontSize(10);
      doc.text(`Part assurance (${devisData.patient.tauxCouverture}%): ${devisData.montantAssurance.toFixed(2)} FCFA`, 150, finalY + 30);
      doc.text(`Part patient: ${devisData.montantPatient.toFixed(2)} FCFA`, 150, finalY + 40);
    }

    // Pied de page
    doc.setFontSize(8);
    doc.text('Ce devis est valable pour une durée de 30 jours.', 105, 280, { align: 'center' });
    doc.text('En cas d\'acceptation, veuillez signer et retourner ce devis.', 105, 285, { align: 'center' });

    // Signature
    doc.text('Signature du patient:', 20, 250);
    doc.line(20, 255, 80, 255);
    doc.text('Date:', 20, 265);

    if (print) {
      // Ouvrir la boîte de dialogue d'impression
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    } else {
      // Téléchargement
      doc.save(`devis-${devisData.numero}.pdf`);
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la génération du PDF du devis:', error);
    return { success: false, error: error.message };
  }
};
