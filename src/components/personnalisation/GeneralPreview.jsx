import React from 'react';
import { MapPin, Phone } from 'lucide-react';

// Aperçu pour l'onglet Général
const GeneralPreview = ({ settings }) => {
  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold mb-3" style={{ color: settings.couleur_texte || '#111827' }}>
        Informations du Cabinet
      </div>
      
      {/* Carte du cabinet */}
      <div 
        className="rounded-lg p-4 border-2"
        style={{ 
          backgroundColor: settings.couleur_surface || '#FFFFFF',
          borderColor: settings.couleur_bordure || '#E5E7EB'
        }}
      >
        {settings.logo_url && (
          <div className="mb-3 flex justify-center">
            <img 
              src={settings.logo_url} 
              alt="Logo" 
              className="h-16 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}
        
        <h4 className="font-bold text-lg mb-2" style={{ color: settings.couleur_principale || '#3B82F6' }}>
          {settings.nom_cabinet || 'Nom du Cabinet'}
        </h4>
        
        {(settings.adresse || settings.ville) && (
          <div className="text-sm mb-2" style={{ color: settings.couleur_texte_secondaire || '#6B7280' }}>
            <MapPin className="w-4 h-4 inline mr-1" />
            {[settings.adresse, settings.ville, settings.code_postal, settings.pays].filter(Boolean).join(', ')}
          </div>
        )}
        
        {settings.telephone && (
          <div className="text-sm mb-1" style={{ color: settings.couleur_texte_secondaire || '#6B7280' }}>
            <Phone className="w-4 h-4 inline mr-1" />
            {settings.telephone}
          </div>
        )}
        
        {settings.email && (
          <div className="text-sm" style={{ color: settings.couleur_texte_secondaire || '#6B7280' }}>
            {settings.email}
          </div>
        )}
      </div>

      {/* Horaires */}
      {settings.horaires_ouverture && (
        <div 
          className="rounded-lg p-3 border"
          style={{ 
            backgroundColor: settings.couleur_surface || '#FFFFFF',
            borderColor: settings.couleur_bordure || '#E5E7EB'
          }}
        >
          <div className="text-xs font-semibold mb-2" style={{ color: settings.couleur_texte || '#111827' }}>
            Horaires d'ouverture
          </div>
          <div className="space-y-1 text-xs" style={{ color: settings.couleur_texte_secondaire || '#6B7280' }}>
            {Object.entries(settings.horaires_ouverture).slice(0, 3).map(([jour, horaire]) => (
              horaire?.ouvert && (
                <div key={jour} className="flex justify-between">
                  <span className="capitalize">{jour}</span>
                  <span>{horaire.debut} - {horaire.fin}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralPreview;