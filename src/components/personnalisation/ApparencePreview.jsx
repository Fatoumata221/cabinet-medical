import React from 'react';

// Aperçu pour l'onglet Apparence
const ApparencePreview = ({ settings }) => {
  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold mb-3" style={{ color: settings.couleur_texte || '#111827' }}>
        Aperçu de l'Interface
      </div>

      {/* Aperçu Header */}
      <div 
        className="rounded-lg p-3 border-2"
        style={{ 
          backgroundColor: settings.couleur_header_fond || '#FFFFFF',
          borderColor: settings.couleur_bordure || '#E5E7EB'
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {settings.logo_url && settings.afficher_logo_header !== false && (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="h-8 w-auto mr-2"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            {settings.afficher_nom_cabinet_header !== false && (
              <span className="font-semibold text-sm" style={{ color: settings.couleur_header_texte || '#111827' }}>
                {settings.nom_cabinet || 'Cabinet Médical'}
              </span>
            )}
          </div>
        </div>
        <div className="text-xs" style={{ color: settings.couleur_texte_secondaire || '#6B7280' }}>
          Header
        </div>
      </div>

      {/* Aperçu Sidebar */}
      <div 
        className="rounded-lg p-3 border-2"
        style={{ 
          backgroundColor: settings.couleur_sidebar_fond || '#1E293B',
          borderColor: settings.couleur_bordure || '#E5E7EB'
        }}
      >
        <div className="mb-2">
          <div className="font-semibold text-sm mb-3" style={{ color: settings.couleur_sidebar_texte || '#F1F5F9' }}>
            {settings.titre_sidebar || 'Cabinet Médical'}
          </div>
          <div className="space-y-1">
            <div className="text-xs py-1 px-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: settings.couleur_sidebar_texte || '#F1F5F9' }}>
              Menu 1
            </div>
            <div className="text-xs py-1 px-2" style={{ color: settings.couleur_sidebar_texte || '#F1F5F9' }}>
              Menu 2
            </div>
            <div className="text-xs py-1 px-2" style={{ color: settings.couleur_sidebar_texte || '#F1F5F9' }}>
              Menu 3
            </div>
          </div>
        </div>
        <div className="text-xs opacity-70" style={{ color: settings.couleur_sidebar_texte || '#F1F5F9' }}>
          Sidebar
        </div>
      </div>

      {/* Aperçu Boutons */}
      <div className="space-y-2">
        <div className="text-xs font-semibold" style={{ color: settings.couleur_texte || '#111827' }}>
          Boutons
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            className="px-3 py-1.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: settings.couleur_principale || '#3B82F6' }}
          >
            Principal
          </button>
          <button 
            className="px-3 py-1.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: settings.couleur_success || '#10B981' }}
          >
            Succès
          </button>
          <button 
            className="px-3 py-1.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: settings.couleur_warning || '#F59E0B' }}
          >
            Avertissement
          </button>
          <button 
            className="px-3 py-1.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: settings.couleur_danger || '#EF4444' }}
          >
            Danger
          </button>
        </div>
      </div>

      {/* Aperçu Page Login */}
      <div className="rounded-lg overflow-hidden border-2" style={{ borderColor: settings.couleur_bordure || '#E5E7EB' }}>
        <div 
          className="p-4 text-center"
          style={{ 
            background: `linear-gradient(135deg, ${settings.couleur_login_gradient_debut || '#3B82F6'} 0%, ${settings.couleur_login_gradient_milieu || '#6366F1'} 50%, ${settings.couleur_login_gradient_fin || '#10B981'} 100%)`
          }}
        >
          <div className="text-white text-xs font-semibold">Page de Connexion</div>
        </div>
      </div>
    </div>
  );
};

export default ApparencePreview;
