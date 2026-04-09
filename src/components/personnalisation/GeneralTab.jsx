import React from 'react';
import { Building2, Phone, FileText, Clock, Globe, HelpCircle, Info } from 'lucide-react';
import CollapsibleSection from '../common/CollapsibleSection';
import Tooltip from '../common/Tooltip';

// Composant pour l'onglet Général
const GeneralTab = ({ settings, handleInputChange, handleHoraireChange, expandedSections, toggleSection }) => {
    return (
      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* Informations de la structure */}
        <CollapsibleSection
          id="structure"
          title="Informations de la Structure"
          icon={Building2}
          isExpanded={expandedSections.structure}
          onToggle={() => toggleSection('structure')}
          description="Nom, adresse et informations de base du cabinet"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Nom du Cabinet *
                <Tooltip content="Le nom qui apparaîtra dans la sidebar, le header et sur tous les documents générés">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </Tooltip>
              </label>
              <input
                type="text"
                value={settings.nom_cabinet || ''}
                onChange={(e) => handleInputChange('nom_cabinet', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-300"
                placeholder="Ex: Cabinet Médical Central"
                required
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Ce nom sera affiché dans la sidebar et sur les documents
              </p>
            </div>
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={settings.adresse || ''}
                onChange={(e) => handleInputChange('adresse', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Rue, Avenue..."
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <input
                type="text"
                value={settings.ville || ''}
                onChange={(e) => handleInputChange('ville', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Postal
              </label>
              <input
                type="text"
                value={settings.code_postal || ''}
                onChange={(e) => handleInputChange('code_postal', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pays
              </label>
              <input
                type="text"
                value={settings.pays || 'Niger'}
                onChange={(e) => handleInputChange('pays', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </CollapsibleSection>
  
        {/* Coordonnées */}
        <CollapsibleSection
          id="coordonnees"
          title="Coordonnées"
          icon={Phone}
          isExpanded={expandedSections.coordonnees}
          onToggle={() => toggleSection('coordonnees')}
          description="Moyens de contact de votre structure"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                Téléphone
              </label>
              <input
                type="tel"
                value={settings.telephone || ''}
                onChange={(e) => handleInputChange('telephone', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-300"
                placeholder="+227 XX XX XX XX"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@cabinet.com"
              />
            </div>
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Web
              </label>
              <input
                type="url"
                value={settings.site_web || ''}
                onChange={(e) => handleInputChange('site_web', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://www.exemple.com"
              />
            </div>
          </div>
        </CollapsibleSection>
  
        {/* Informations légales */}
        <CollapsibleSection
          id="legales"
          title="Informations Légales"
          icon={FileText}
          isExpanded={expandedSections.legales}
          onToggle={() => toggleSection('legales')}
          description="Numéros officiels et documents légaux"
          badge="Optionnel"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro d'Agrément
              </label>
              <input
                type="text"
                value={settings.numero_agrement || ''}
                onChange={(e) => handleInputChange('numero_agrement', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-300"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NINEA
              </label>
              <input
                type="text"
                value={settings.ninea || ''}
                onChange={(e) => handleInputChange('ninea', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="9 chiffres"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registre de Commerce
              </label>
              <input
                type="text"
                value={settings.registre_commerce || ''}
                onChange={(e) => handleInputChange('registre_commerce', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </CollapsibleSection>
  
        {/* Horaires d'ouverture */}
        <CollapsibleSection
          id="horaires"
          title="Horaires d'Ouverture"
          icon={Clock}
          isExpanded={expandedSections.horaires}
          onToggle={() => toggleSection('horaires')}
          description="Configurez les horaires d'ouverture par jour de la semaine"
        >
          <div className="space-y-3 mt-4">
            {Object.entries(settings.horaires_ouverture || {}).map(([jour, horaire]) => (
              <div 
                key={jour} 
                className={`flex items-center space-x-4 p-3 rounded-lg transition-all ${
                  horaire?.ouvert 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="w-24">
                  <span className="font-medium text-gray-900 capitalize">{jour}</span>
                </div>
                
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={horaire?.ouvert || false}
                    onChange={(e) => handleHoraireChange(jour, 'ouvert', e.target.checked)}
                    className="mr-2 rounded w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Ouvert</span>
                </label>
  
                {horaire?.ouvert && (
                  <div className="flex items-center gap-2 animate-in slide-in-from-left duration-200">
                    <input
                      type="time"
                      value={horaire?.debut || ''}
                      onChange={(e) => handleHoraireChange(jour, 'debut', e.target.value)}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <span className="text-gray-600">à</span>
                    <input
                      type="time"
                      value={horaire?.fin || ''}
                      onChange={(e) => handleHoraireChange(jour, 'fin', e.target.value)}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
  
        {/* Localisation et Formats */}
        <CollapsibleSection
          id="localisation"
          title="Localisation et Formats"
          icon={Globe}
          isExpanded={expandedSections.localisation}
          onToggle={() => toggleSection('localisation')}
          description="Langue, fuseau horaire, formats de date et devise"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                Langue
                <Tooltip content="Langue principale de l'interface utilisateur">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </Tooltip>
              </label>
              <select
                value={settings.langue || 'fr'}
                onChange={(e) => handleInputChange('langue', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-300 cursor-pointer"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuseau Horaire
              </label>
              <select
                value={settings.fuseau_horaire || 'Africa/Niamey'}
                onChange={(e) => handleInputChange('fuseau_horaire', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Africa/Niamey">Africa/Niamey (UTC+1)</option>
                <option value="Africa/Abidjan">Africa/Abidjan (UTC+0)</option>
                <option value="Africa/Dakar">Africa/Dakar (UTC+0)</option>
                <option value="Africa/Bamako">Africa/Bamako (UTC+0)</option>
              </select>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format de Date
              </label>
              <select
                value={settings.format_date || 'DD/MM/YYYY'}
                onChange={(e) => handleInputChange('format_date', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format d'Heure
              </label>
              <select
                value={settings.format_heure || 'HH:mm'}
                onChange={(e) => handleInputChange('format_heure', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="HH:mm">24 heures (HH:mm)</option>
                <option value="hh:mm A">12 heures (hh:mm AM/PM)</option>
              </select>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Devise
              </label>
              <input
                type="text"
                value={settings.devise || 'FCFA'}
                onChange={(e) => handleInputChange('devise', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="FCFA"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbole Devise
              </label>
              <input
                type="text"
                value={settings.symbole_devise || 'FCFA'}
                onChange={(e) => handleInputChange('symbole_devise', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="FCFA"
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>
    );
  };

  export default GeneralTab;