import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePersonnalisation } from '../../contexts/PersonnalisationContext';
import { 
  CollapsibleSection, 
  SettingInput, 
  SettingColorPicker, 
  SettingSelect,
  StickyActions,
  SettingImageUpload
} from '../../components/personnalisation/SharedComponents';
import {
  Palette,
  Image as ImageIcon,
  Layout,
  Type,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Save,
  Menu,
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Bell
} from 'lucide-react';

import ConfirmDialog from '../../components/common/ConfirmDialog';

const PersonnalisationApparence = () => {
  const { settings, loading, saving, hasChanges, handleInputChange, handleSave, resetSettings } = usePersonnalisation();
  
  const [expandedSections, setExpandedSections] = useState({
    identite: true,
    couleurs_principales: true,
    ui_elements: false,
    typographie: false
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = async () => {
    await resetSettings();
    setShowResetConfirm(false);
  };

  if (loading) return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
            <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Chargement des préférences...</p>
        </div>
      </div>
  );

  // Live Preview Component matching Sidebar.jsx
  const LivePreview = () => (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 sticky top-6">
        <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-800">
            <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs text-gray-400 font-medium tracking-wide">APERÇU EN DIRECT</span>
        </div>
        
        {/* Mock Cabin Layout */}
        <div className="flex h-[600px] overflow-hidden bg-gray-50">
            
            {/* Sidebar Mockup - Based on Sidebar.jsx */}
            <div 
                className="w-48 flex flex-col transition-all duration-300 relative z-10"
                style={{ 
                    // Use selected color if available, otherwise fallback to default gradient
                    background: settings.couleur_sidebar_fond 
                        ? settings.couleur_sidebar_fond 
                        : `linear-gradient(to bottom, #1e293b, #0f172a)`,
                    borderRight: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                {/* Sidebar Header */}
                <div className="p-4 flex items-center gap-3 border-b border-white/10">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                        CM
                    </div>
                    <span 
                        className="font-bold text-sm"
                        style={{ color: settings.couleur_sidebar_texte || '#ffffff' }}
                    >
                        Cabinet Médical
                    </span>
                </div>

                {/* Sidebar Nav */}
                <div className="flex-1 p-3 space-y-1">
                     {[
                        { icon: LayoutDashboard, label: 'Tableau de bord', active: true },
                        { icon: Users, label: 'Patients', active: false },
                        { icon: Calendar, label: 'Rendez-vous', active: false },
                        { icon: Settings, label: 'Paramètres', active: false },
                     ].map((item, idx) => (
                        <div 
                            key={idx}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                item.active ? 'bg-gradient-to-r text-white shadow-sm' : 'hover:bg-white/5'
                            }`}
                            style={item.active ? {
                                backgroundImage: `linear-gradient(to right, ${settings.couleur_principale || '#3b82f6'}, ${settings.couleur_secondaire || '#4f46e5'})`,
                                color: '#ffffff'
                            } : {
                                color: settings.couleur_sidebar_texte ? `${settings.couleur_sidebar_texte}b3` : '#94a3b8' // opacity 0.7 for inactive
                            }}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </div>
                     ))}
                </div>

                {/* Sidebar Footer / User Profile */}
                <div className="p-4 border-t border-white/10 mt-auto">
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 border-2 border-white/20"></div>
                         <div className="text-xs">
                             <div 
                                className="font-medium"
                                style={{ color: settings.couleur_sidebar_texte || '#ffffff' }}
                             >
                                 Dr. A. Smith
                             </div>
                             <div className="opacity-60 text-[10px]" style={{ color: settings.couleur_sidebar_texte || '#ffffff' }}>Médecin</div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
                {/* Header */}
                <header 
                    className="h-16 px-6 flex items-center justify-between border-b shadow-sm sticky top-0 z-20"
                    style={{ 
                        backgroundColor: settings.couleur_header_fond || '#ffffff',
                        borderColor: settings.couleur_bordure || '#e5e7eb'
                    }}
                >
                    <div className="flex items-center gap-4">
                        <Menu className="w-5 h-5 text-gray-500" />
                        <h2 
                            className="text-lg font-semibold"
                            style={{ 
                                color: settings.couleur_header_texte || '#111827',
                                fontFamily: settings.police_famille 
                            }}
                        >
                           {settings.nom_cabinet || 'Tableau de bord'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                         <button className="relative p-2 rounded-full hover:bg-black/5 transition-colors">
                            <Bell className="w-5 h-5 text-gray-500" />
                            <span 
                                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                                style={{ backgroundColor: settings.couleur_accent || '#ef4444' }}
                            ></span>
                         </button>
                    </div>
                </header>

                {/* Body Content */}
                <div className="flex-1 p-6 overflow-y-auto" style={{ fontFamily: settings.police_famille }}>
                     <div className="grid grid-cols-2 gap-4 mb-6">
                         {[1, 2].map((i) => (
                             <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2">
                                 <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Statistique {i}</span>
                                 <span className="text-2xl font-bold text-gray-900">1,234</span>
                             </div>
                         ))}
                     </div>

                     <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                         <h3 className="text-lg font-bold text-gray-900 mb-4">Aperçu des Boutons</h3>
                         <div className="flex flex-wrap gap-3">
                             <button 
                                className="px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-all active:scale-95"
                                style={{ backgroundColor: settings.couleur_principale || '#3b82f6' }}
                             >
                                 Action Principale
                             </button>
                             <button 
                                className="px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-all active:scale-95"
                                style={{ backgroundColor: settings.couleur_secondaire || '#4f46e5' }}
                             >
                                 Action Secondaire
                             </button>
                             <button 
                                className="px-4 py-2 rounded-lg border text-sm font-medium bg-white hover:bg-gray-50"
                                style={{ borderColor: settings.couleur_bordure || '#e5e7eb', color: settings.couleur_texte || '#374151' }}
                             >
                                 Annuler
                             </button>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/administration/personnalisation"
              className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Palette className="w-8 h-8 text-purple-600" />
                Apparence
              </h1>
              <p className="text-gray-500 mt-1">
                Personnalisez les couleurs, logos et typographies de votre espace.
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex">
             {/* Desktop generic status or badges could go here */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Settings Form */}
            <div className="lg:col-span-5 space-y-6">
                
                {/* Section Identité */}
                <CollapsibleSection
                    id="identite"
                    title="Identité Visuelle"
                    icon={ImageIcon}
                    isExpanded={expandedSections.identite}
                    onToggle={() => toggleSection('identite')}
                    description="Logos, icônes et présentation"
                >
                    <div className="grid gap-5">
                       <SettingImageUpload 
                            label="Logo Principal"
                            value={settings.logo_url}
                            onChange={(val) => handleInputChange('logo_url', val)}
                            tooltip="Format recommandé: PNG transparent, min 200px"
                       />
                       <div className="grid grid-cols-2 gap-4">
                            <SettingImageUpload 
                                label="Favicon"
                                value={settings.favicon_url}
                                onChange={(val) => handleInputChange('favicon_url', val)}
                                tooltip="Icône de l'onglet navigateur (32x32px)"
                            />
                             <SettingInput 
                                label="Titre de la Page"
                                value={settings.titre_page}
                                onChange={(val) => handleInputChange('titre_page', val)}
                                placeholder="Cabinet Médical..."
                            />
                       </div>
                    </div>
                </CollapsibleSection>

                 {/* Section Couleurs Principales */}
                 <CollapsibleSection
                    id="couleurs_principales"
                    title="Charte Graphique"
                    icon={Palette}
                    isExpanded={expandedSections.couleurs_principales}
                    onToggle={() => toggleSection('couleurs_principales')}
                    description="Les couleurs dominantes de votre interface"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SettingColorPicker 
                            label="Primaire" 
                            value={settings.couleur_principale}
                            onChange={(val) => handleInputChange('couleur_principale', val)}
                            tooltip="Couleur principale (boutons, liens, header)"
                        />
                         <SettingColorPicker 
                            label="Secondaire" 
                            value={settings.couleur_secondaire}
                            onChange={(val) => handleInputChange('couleur_secondaire', val)}
                            tooltip="Couleur secondaire (éléments actifs, gradients)"
                        />
                         <SettingColorPicker 
                            label="Accent" 
                            value={settings.couleur_accent}
                            onChange={(val) => handleInputChange('couleur_accent', val)}
                            tooltip="Pour attirer l'attention (badges, notifs)"
                        />
                         <SettingColorPicker 
                            label="Succès" 
                            value={settings.couleur_success}
                            onChange={(val) => handleInputChange('couleur_success', val)}
                        />
                    </div>
                </CollapsibleSection>

                 {/* Section Interface */}
                 <CollapsibleSection
                    id="ui_elements"
                    title="Interface & Header"
                    icon={Layout}
                    isExpanded={expandedSections.ui_elements}
                    onToggle={() => toggleSection('ui_elements')}
                    description="Couleurs de fond et structure"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SettingColorPicker 
                            label="Fond Header" 
                            value={settings.couleur_header_fond}
                            onChange={(val) => handleInputChange('couleur_header_fond', val)}
                        />
                         <SettingColorPicker 
                            label="Texte Header" 
                            value={settings.couleur_header_texte}
                            onChange={(val) => handleInputChange('couleur_header_texte', val)}
                        />
                         <SettingColorPicker 
                            label="Fond Sidebar" 
                            value={settings.couleur_sidebar_fond}
                            onChange={(val) => handleInputChange('couleur_sidebar_fond', val)}
                        />
                         <SettingColorPicker 
                            label="Texte Sidebar" 
                            value={settings.couleur_sidebar_texte}
                            onChange={(val) => handleInputChange('couleur_sidebar_texte', val)}
                        />
                    </div>
                </CollapsibleSection>

                 {/* Section Typographie */}
                 <CollapsibleSection
                    id="typographie"
                    title="Typographie"
                    icon={Type}
                    isExpanded={expandedSections.typographie}
                    onToggle={() => toggleSection('typographie')}
                    description="Style du texte"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <SettingSelect 
                            label="Famille de Police"
                            value={settings.police_famille}
                            onChange={(val) => handleInputChange('police_famille', val)}
                            options={[
                                { value: 'Inter', label: 'Inter (Moderne)' },
                                { value: 'Roboto', label: 'Roboto (Standard)' },
                                { value: 'Open Sans', label: 'Open Sans (Lisible)' },
                                { value: 'Lato', label: 'Lato (Élégant)' },
                                { value: 'Montserrat', label: 'Montserrat (Géométrique)' },
                                { value: 'Poppins', label: 'Poppins (Arrondi)' },
                            ]}
                        />
                         <SettingInput 
                            type="number"
                            label="Taille de base (px)"
                            value={settings.taille_police_base}
                            onChange={(val) => handleInputChange('taille_police_base', parseInt(val))}
                        />
                    </div>
                </CollapsibleSection>

            </div>

            {/* Right Column: Live Preview */}
            <div className="lg:col-span-7 hidden lg:block">
                <LivePreview />
            </div>

        </div>

      </div>

      {/* Sticky Save Bar */}
      <StickyActions>
          <div className="flex items-center gap-3 text-sm text-gray-600">
             {hasChanges ? (
                 <>
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <span>Modifications non enregistrées</span>
                 </>
             ) : (
                <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Tous les changements sont sauvegardés</span>
                </>
             )}
          </div>
          <div className="flex items-center gap-3">
                <button
                    onClick={handleResetClick}
                    disabled={!hasChanges || saving}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm border ${
                        hasChanges && !saving
                            ? 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50' 
                            : 'text-gray-400 bg-gray-50 border-gray-100 cursor-not-allowed'
                    }`}
                >
                    Réinitialiser
                </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all transform active:scale-95 ${
                  hasChanges 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
      </StickyActions>

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmReset}
        title="Réinitialiser les modifications"
        message="Êtes-vous sûr de vouloir annuler toutes les modifications non sauvegardées ? Les valeurs reviendront à leur dernier état enregistré."
        confirmText="Réinitialiser"
        cancelText="Annuler"
        isDestructive={true}
      />
    </div>
  );
};

export default PersonnalisationApparence;
