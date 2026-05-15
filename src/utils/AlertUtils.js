import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';

// Utilitaire pour les alertes et notifications
const AlertUtils = {
  // Calculer la sévérité d'une alerte
  calculerSeverite: (retardJours, montant) => {
    if (retardJours >= 60 || montant >= 200000) return 'critique';
    if (retardJours >= 30 || montant >= 100000) return 'eleve';
    if (retardJours >= 15 || montant >= 50000) return 'moyen';
    return 'faible';
  },

  // Obtenir la couleur de sévérité
  getSeveriteColor: (severite) => {
    switch (severite) {
      case 'critique': return 'bg-red-100 text-red-800 border-red-200';
      case 'eleve': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moyen': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'faible': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  },

  // Obtenir l'icône de sévérité
  getSeveriteIcon: (severite) => {
    switch (severite) {
      case 'critique': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'eleve': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'moyen': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'faible': return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  },

  // Générer un message d'alerte
  genererMessageAlerte: (type, data) => {
    const messages = {
      impaye_critique: `Le patient ${data.patient} a une facture impayée de ${data.montant} depuis ${data.retard} jours. Action immédiate requise.`,
      impaye_eleve: `Le patient ${data.patient} a une facture impayée de ${data.montant} depuis ${data.retard} jours. Contact recommandé.`,
      rappel_auto: `Rappel automatique envoyé à ${data.patient} pour la facture ${data.facture}.`,
      paiement_recu: `Paiement de ${data.montant} reçu de ${data.patient}. Facture ${data.facture} mise à jour.`,
      seuil_depasse: `Le seuil d'impayés de ${data.seuil} FCFA a été dépassé. Total actuel: ${data.total}.`,
      performance_basse: `Le service ${data.service} a une performance de ${data.performance}% (objectif: ${data.objectif}%).`
    };

    return messages[type] || 'Message non défini';
  },

  // Créer une notification
  creerNotification: (type, titre, message, severite = 'normale') => {
    return {
      id: Date.now(),
      type,
      titre,
      message,
      severite,
      date: new Date().toISOString(),
      lue: false
    };
  },

  // Filtrer les alertes par priorité
  filtrerParPriorite: (alertes, prioriteMin = 'moyen') => {
    const niveaux = { 'faible': 1, 'moyen': 2, 'eleve': 3, 'critique': 4 };
    const niveauMin = niveaux[prioriteMin] || 2;
    
    return alertes.filter(alerte => 
      niveaux[alerte.severite] >= niveauMin
    );
  },

  // Calculer les tendances
  calculerTendance: (donneesActuelles, donneesPrecedentes) => {
    if (!donneesPrecedentes || donneesPrecedentes === 0) return 'stable';
    
    const variation = ((donneesActuelles - donneesPrecedentes) / donneesPrecedentes) * 100;
    
    if (variation > 5) return { tendance: 'hausse', variation, icone: <TrendingUp className="w-4 h-4 text-green-600" /> };
    if (variation < -5) return { tendance: 'baisse', variation, icone: <TrendingDown className="w-4 h-4 text-red-600" /> };
    return { tendance: 'stable', variation, icone: <Clock className="w-4 h-4 text-blue-600" /> };
  },

  // Obtenir les statistiques d'alertes
  getStatistiquesAlertes: (alertes) => {
    const stats = {
      total: alertes.length,
      actives: alertes.filter(a => a.statut === 'actif').length,
      resolues: alertes.filter(a => a.statut === 'resolu').length,
      parSeverite: {
        critique: alertes.filter(a => a.severite === 'critique').length,
        eleve: alertes.filter(a => a.severite === 'eleve').length,
        moyen: alertes.filter(a => a.severite === 'moyen').length,
        faible: alertes.filter(a => a.severite === 'faible').length
      },
      montantTotal: alertes.reduce((sum, a) => sum + (a.montant || 0), 0),
      montantCritique: alertes
        .filter(a => a.severite === 'critique' && a.statut === 'actif')
        .reduce((sum, a) => sum + (a.montant || 0), 0)
    };

    return stats;
  }
};

export default AlertUtils;
