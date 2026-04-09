import React from 'react';
import { ImageIcon, Palette, Zap, Layout, Type, Sun, Moon, Monitor, CheckCircle2, HelpCircle, Info } from 'lucide-react';
import CollapsibleSection from '../common/CollapsibleSection';
import Tooltip from '../common/Tooltip';
import ColorPicker from '../common/ColorPicker';

// Composant pour l'onglet Apparence
const ApparenceTab = ({ settings, handleInputChange, expandedSections, toggleSection }) => {
  
    return (
      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* Identité Visuelle */}
        <CollapsibleSection
          id="identite"
          title="Identité Visuelle"
          icon={ImageIcon}
          isExpanded={expandedSections.identite}
          onToggle={() => toggleSection('identite')}
          description="Logo, favicon et titre de la page"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Logo Principal (URL)
                <Tooltip content="URL complète de votre logo. Format recommandé: PNG avec fond transparent, 200x200px minimum">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </Tooltip>
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={settings.logo_url || ''}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-300"
                  placeholder="https://..."
                />
                {settings.logo_url && (
                  <div className="w-16 h-16 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img 
                      src={settings.logo_url} 
                      alt="Logo preview" 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <ImageIcon className="w-6 h-6 text-gray-400 hidden" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                URL du logo de votre structure. Sera affiché dans le header et la sidebar
              </p>
            </div>
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favicon (URL)
              </label>
              <input
                type="url"
                value={settings.favicon_url || ''}
                onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500 mt-1">Icône affichée dans l'onglet du navigateur (16x16 ou 32x32 px recommandé)</p>
            </div>
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de la Page
              </label>
              <input
                type="text"
                value={settings.titre_page || 'Cabinet Médical'}
                onChange={(e) => handleInputChange('titre_page', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Cabinet Médical"
              />
              <p className="text-xs text-gray-500 mt-1">Titre affiché dans l'onglet du navigateur</p>
            </div>
          </div>
        </CollapsibleSection>
  
        {/* Couleurs Principales */}
        <CollapsibleSection
          id="couleurs_principales"
          title="Couleurs Principales"
          icon={Palette}
          isExpanded={expandedSections.couleurs_principales}
          onToggle={() => toggleSection('couleurs_principales')}
          description="Palette de couleurs utilisée dans toute l'application"
          badge="Important"
        >
          <p className="text-sm text-gray-600 mb-4 mt-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Ces couleurs sont utilisées dans toute l'application (boutons, liens, éléments actifs)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorPicker 
              label="Couleur Principale" 
              field="couleur_principale" 
              value={settings.couleur_principale}
              handleInputChange={handleInputChange}
              description="Utilisée pour les boutons principaux, liens, éléments actifs"
              tooltip="Couleur principale de votre identité visuelle (medical-primary)"
            />
            <ColorPicker 
              label="Couleur Secondaire" 
              field="couleur_secondaire" 
              value={settings.couleur_secondaire}
              handleInputChange={handleInputChange}
              description="Utilisée pour les gradients et éléments secondaires"
              tooltip="Couleur secondaire pour les effets visuels (medical-secondary)"
            />
            <ColorPicker 
              label="Couleur Accent" 
              field="couleur_accent" 
              value={settings.couleur_accent}
              handleInputChange={handleInputChange}
              description="Couleur d'accentuation"
              tooltip="Couleur pour les points d'accentuation (medical-accent)"
            />
            <ColorPicker 
              label="Couleur Succès" 
              field="couleur_success" 
              value={settings.couleur_success}
              handleInputChange={handleInputChange}
              description="Pour les messages de succès et validations"
              tooltip="Couleur pour les actions réussies (medical-success)"
            />
            <ColorPicker 
              label="Couleur Avertissement" 
              field="couleur_warning" 
              value={settings.couleur_warning}
              handleInputChange={handleInputChange}
              description="Pour les avertissements"
              tooltip="Couleur pour les alertes et avertissements (medical-warning)"
            />
            <ColorPicker 
              label="Couleur Danger" 
              field="couleur_danger" 
              value={settings.couleur_danger}
              handleInputChange={handleInputChange}
              description="Pour les erreurs et actions dangereuses"
              tooltip="Couleur pour les erreurs et actions destructives (medical-danger)"
            />
            <ColorPicker 
              label="Couleur Info" 
              field="couleur_info" 
              value={settings.couleur_info}
              handleInputChange={handleInputChange}
              description="Pour les informations"
              tooltip="Couleur pour les notifications et informations (medical-purple)"
            />
          </div>
        </CollapsibleSection>
  
        {/* Couleurs de l'Interface */}
        <CollapsibleSection
          id="couleurs_interface"
          title="Couleurs de l'Interface"
          icon={Layout}
          isExpanded={expandedSections.couleurs_interface}
          onToggle={() => toggleSection('couleurs_interface')}
          description="Couleurs pour les éléments de l'interface utilisateur"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <ColorPicker 
              label="Couleur de Fond" 
              field="couleur_background" 
              value={settings.couleur_background}
              handleInputChange={handleInputChange}
              description="Couleur de fond générale de l'application"
            />
            <ColorPicker 
              label="Couleur de Surface" 
              field="couleur_surface" 
              value={settings.couleur_surface}
              handleInputChange={handleInputChange}
              description="Couleur des cartes et surfaces (bg-white)"
            />
            <ColorPicker 
              label="Couleur de Texte Principal" 
              field="couleur_texte" 
              value={settings.couleur_texte}
              handleInputChange={handleInputChange}
              description="Couleur du texte principal (text-gray-900)"
            />
            <ColorPicker 
              label="Couleur de Texte Secondaire" 
              field="couleur_texte_secondaire" 
              value={settings.couleur_texte_secondaire}
              handleInputChange={handleInputChange}
              description="Couleur du texte secondaire (text-gray-600)"
            />
            <ColorPicker 
              label="Couleur de Bordure" 
              field="couleur_bordure" 
              value={settings.couleur_bordure}
              handleInputChange={handleInputChange}
              description="Couleur des bordures (border-gray-200)"
            />
          </div>
        </CollapsibleSection>
  
        {/* Sidebar */}
        <CollapsibleSection
          id="sidebar"
          title="Personnalisation de la Sidebar"
          icon={Layout}
          isExpanded={expandedSections.sidebar}
          onToggle={() => toggleSection('sidebar')}
          description="Couleurs et titre de la barre latérale"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de la Sidebar
              </label>
              <input
                type="text"
                value={settings.titre_sidebar || 'Cabinet Médical'}
                onChange={(e) => handleInputChange('titre_sidebar', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Cabinet Médical"
              />
              <p className="text-xs text-gray-500 mt-1">Titre affiché en haut de la sidebar</p>
            </div>
  
            <ColorPicker 
              label="Couleur de Fond Sidebar" 
              field="couleur_sidebar_fond" 
              value={settings.couleur_sidebar_fond}
              handleInputChange={handleInputChange}
              description="Couleur de fond de la sidebar (medical-dark / slate-900)"
            />
            <ColorPicker 
              label="Couleur de Texte Sidebar" 
              field="couleur_sidebar_texte" 
              value={settings.couleur_sidebar_texte}
              handleInputChange={handleInputChange}
              description="Couleur du texte dans la sidebar (slate-100)"
            />
          </div>
        </CollapsibleSection>
  
        {/* Header */}
        <CollapsibleSection
          id="header"
          title="Personnalisation du Header"
          icon={Layout}
          isExpanded={expandedSections.header}
          onToggle={() => toggleSection('header')}
          description="Couleurs et options d'affichage du header"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <ColorPicker 
              label="Couleur de Fond Header" 
              field="couleur_header_fond" 
              value={settings.couleur_header_fond}
              handleInputChange={handleInputChange}
              description="Couleur de fond du header (bg-white)"
            />
            <ColorPicker 
              label="Couleur de Texte Header" 
              field="couleur_header_texte" 
              value={settings.couleur_header_texte}
              handleInputChange={handleInputChange}
              description="Couleur du texte dans le header (text-gray-900)"
            />
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.afficher_logo_header !== false}
                  onChange={(e) => handleInputChange('afficher_logo_header', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher le logo dans le header</span>
              </label>
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.afficher_nom_cabinet_header !== false}
                  onChange={(e) => handleInputChange('afficher_nom_cabinet_header', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher le nom du cabinet dans le header</span>
              </label>
            </div>
          </div>
        </CollapsibleSection>
  
        {/* Page de Connexion */}
        <CollapsibleSection
          id="login"
          title="Page de Connexion"
          icon={Palette}
          isExpanded={expandedSections.login}
          onToggle={() => toggleSection('login')}
          description="Gradient de fond de la page de connexion"
        >
          <p className="text-sm text-gray-600 mb-4 mt-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Couleurs du gradient de fond de la page de connexion
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ColorPicker 
              label="Début du Gradient" 
              field="couleur_login_gradient_debut" 
              value={settings.couleur_login_gradient_debut}
              handleInputChange={handleInputChange}
              description="Couleur de début (medical-primary)"
            />
            <ColorPicker 
              label="Milieu du Gradient" 
              field="couleur_login_gradient_milieu" 
              value={settings.couleur_login_gradient_milieu}
              handleInputChange={handleInputChange}
              description="Couleur du milieu (medical-secondary)"
            />
            <ColorPicker 
              label="Fin du Gradient" 
              field="couleur_login_gradient_fin" 
              value={settings.couleur_login_gradient_fin}
              handleInputChange={handleInputChange}
              description="Couleur de fin (medical-accent)"
            />
          </div>
        </CollapsibleSection>
  
        {/* Typographie */}
        <CollapsibleSection
          id="typographie"
          title="Typographie"
          icon={Type}
          isExpanded={expandedSections.typographie}
          onToggle={() => toggleSection('typographie')}
          description="Police et taille de caractères"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Famille de Police
              </label>
              <select
                value={settings.police_famille || 'Inter'}
                onChange={(e) => handleInputChange('police_famille', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Poppins">Poppins</option>
                <option value="Nunito">Nunito</option>
                <option value="Raleway">Raleway</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Police utilisée dans toute l'application</p>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille de Police de Base (px)
              </label>
              <input
                type="number"
                value={settings.taille_police_base || 16}
                onChange={(e) => handleInputChange('taille_police_base', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="12"
                max="24"
              />
              <p className="text-xs text-gray-500 mt-1">Taille de base pour le texte (16px = 1rem)</p>
            </div>
          </div>
        </CollapsibleSection>
  
        {/* Thème */}
        <CollapsibleSection
          id="theme"
          title="Thème"
          icon={Sun}
          isExpanded={expandedSections.theme}
          onToggle={() => toggleSection('theme')}
          description="Thème d'affichage de l'application"
          badge="À venir"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <button
              onClick={() => handleInputChange('theme', 'light')}
              className={`p-4 border-2 rounded-lg transition-all transform hover:scale-105 ${
                settings.theme === 'light'
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="font-medium">Clair</p>
              {settings.theme === 'light' && (
                <CheckCircle2 className="w-5 h-5 mx-auto mt-2 text-blue-600" />
              )}
            </button>
            <button
              onClick={() => handleInputChange('theme', 'dark')}
              className={`p-4 border-2 rounded-lg transition-all transform hover:scale-105 ${
                settings.theme === 'dark'
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <Moon className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
              <p className="font-medium">Sombre</p>
              {settings.theme === 'dark' && (
                <CheckCircle2 className="w-5 h-5 mx-auto mt-2 text-blue-600" />
              )}
            </button>
            <button
              onClick={() => handleInputChange('theme', 'auto')}
              className={`p-4 border-2 rounded-lg transition-all transform hover:scale-105 ${
                settings.theme === 'auto'
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-500" />
              <p className="font-medium">Automatique</p>
              {settings.theme === 'auto' && (
                <CheckCircle2 className="w-5 h-5 mx-auto mt-2 text-blue-600" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Le thème automatique suit les préférences du système
          </p>
        </CollapsibleSection>
      </div>
    );
  };
  
  export default ApparenceTab;