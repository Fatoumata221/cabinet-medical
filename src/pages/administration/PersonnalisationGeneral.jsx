import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePersonnalisation } from '../../contexts/PersonnalisationContext';
import { 
  CollapsibleSection, 
  SettingInput, 
  SettingSelect,
  StickyActions,
  SettingSwitch,
  SettingImageUpload
} from '../../components/personnalisation/SharedComponents';
import {
  Building2,
  Image as ImageIcon,
  Phone,
  Clock,
  Globe,
  Save,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const PersonnalisationGeneral = () => {
  const { settings, loading, saving, hasChanges, handleInputChange, handleHoraireChange, handleSave } = usePersonnalisation();
  
  const [expandedSections, setExpandedSections] = useState({
    logo: true,
    structure: false,
    coordonnees: true,
    horaires: false,
    localisation: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
            <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Chargement...</p>
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <Link
              to="/administration/personnalisation"
              className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                Paramètres Généraux
              </h1>
              <p className="text-gray-500 mt-1">
                Informations administratives de votre établissement.
              </p>
            </div>
        </div>

        <div className="space-y-6">
            
            {/* Section Logo */}
            <CollapsibleSection
                id="logo"
                title="Logo et Identité Visuelle"
                icon={ImageIcon}
                isExpanded={expandedSections.logo}
                onToggle={() => toggleSection('logo')}
                description="Logo principal de votre cabinet"
            >
                <SettingImageUpload 
                    label="Logo du Cabinet"
                    value={settings.logo_url}
                    onChange={(val) => handleInputChange('logo_url', val)}
                    tooltip="Format recommandé: PNG transparent. Ce logo sera utilisé sur les documents et l'interface."
                    placeholder="URL du logo (ex: https://...)"
                />
            </CollapsibleSection>

            {/* Structure */}
            <CollapsibleSection
                id="structure"
                title="Identité de la Structure"
                icon={Building2}
                isExpanded={expandedSections.structure}
                onToggle={() => toggleSection('structure')}
                description="Nom officiel, adresse et localisation"
            >
                <div className="grid gap-5">
                    <SettingInput
                        label="Nom du Cabinet"
                        value={settings.nom_cabinet}
                        onChange={(val) => handleInputChange('nom_cabinet', val)}
                        required
                        placeholder="Ex: Centre Médical de Garde"
                        tooltip="Nom affiché sur tous les documents officiels"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <SettingInput 
                            label="Adresse"
                            value={settings.adresse}
                            onChange={(val) => handleInputChange('adresse', val)}
                            placeholder="Adresse complète"
                        />
                         <SettingInput 
                            label="Ville"
                            value={settings.ville}
                            onChange={(val) => handleInputChange('ville', val)}
                            placeholder="Ville"
                        />
                         <SettingInput 
                            label="Code Postal"
                            value={settings.code_postal}
                            onChange={(val) => handleInputChange('code_postal', val)}
                            placeholder="BP / CP"
                        />
                         <SettingInput 
                            label="Pays"
                            value={settings.pays}
                            onChange={(val) => handleInputChange('pays', val)}
                            placeholder="Pays"
                        />
                    </div>
                </div>
            </CollapsibleSection>

            {/* Coordonnées */}
            <CollapsibleSection
                id="coordonnees"
                title="Contact & Communication"
                icon={Phone}
                isExpanded={expandedSections.coordonnees}
                onToggle={() => toggleSection('coordonnees')}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingInput 
                        label="Téléphone"
                        type="tel"
                        value={settings.telephone}
                        onChange={(val) => handleInputChange('telephone', val)}
                        icon={Phone}
                        placeholder="+227 ..."
                    />
                    <SettingInput 
                        label="Email de Contact"
                        type="email"
                        value={settings.email}
                        onChange={(val) => handleInputChange('email', val)}
                        placeholder="contact@cabinet.com"
                    />
                    <div className="md:col-span-2">
                        <SettingInput 
                            label="Site Web"
                            type="url"
                            value={settings.site_web}
                            onChange={(val) => handleInputChange('site_web', val)}
                            placeholder="https://..."
                            icon={Globe}
                        />
                    </div>
                </div>
            </CollapsibleSection>

            {/* Horaires */}
            <CollapsibleSection
                id="horaires"
                title="Horaires d'Ouverture"
                icon={Clock}
                isExpanded={expandedSections.horaires}
                onToggle={() => toggleSection('horaires')}
            >
                <div className="space-y-3">
                    {(() => {
                        const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
                        return Object.entries(settings.horaires_ouverture || {})
                            .sort(([a], [b]) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
                            .map(([jour, horaire]) => (
                                <div 
                                    key={jour} 
                                    className={`flex items-center justify-between p-3.5 rounded-xl transition-all border ${
                                        horaire?.ouvert 
                                            ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                                            : 'bg-gray-50 border-gray-100 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={horaire?.ouvert || false}
                                                onChange={(e) => handleHoraireChange(jour, 'ouvert', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </div>
                                        <span className="font-bold text-gray-700 capitalize w-24 select-none">{jour}</span>
                                    </div>
                                    
                                    {horaire?.ouvert ? (
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={horaire?.debut || ''}
                                                    onChange={(e) => handleHoraireChange(jour, 'debut', e.target.value)}
                                                    className="p-2 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                                                />
                                            </div>
                                            <span className="text-gray-400 font-bold">-</span>
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={horaire?.fin || ''}
                                                    onChange={(e) => handleHoraireChange(jour, 'fin', e.target.value)}
                                                    className="p-2 border border-blue-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-4 py-1 rounded-full bg-gray-100 border border-gray-200">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fermé</span>
                                        </div>
                                    )}
                                </div>
                            ));
                    })()}
                </div>
            </CollapsibleSection>

             {/* Localisation */}
             <CollapsibleSection
                id="localisation"
                title="Régionalisation"
                icon={Globe}
                isExpanded={expandedSections.localisation}
                onToggle={() => toggleSection('localisation')}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingSelect 
                        label="Langue"
                        value={settings.langue}
                        onChange={(val) => handleInputChange('langue', val)}
                        options={[
                            { value: 'fr', label: 'Français' },
                            { value: 'en', label: 'English' },
                            { value: 'ar', label: 'العربية' },
                        ]}
                    />
                     <SettingSelect 
                        label="Fuseau Horaire"
                        value={settings.fuseau_horaire}
                        onChange={(val) => handleInputChange('fuseau_horaire', val)}
                         options={[
                            { value: 'Africa/Niamey', label: 'Niamey (UTC+1)' },
                            { value: 'Africa/Dakar', label: 'Dakar (UTC+0)' },
                            { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
                        ]}
                    />
                     <SettingInput 
                        label="Devise"
                        value={settings.devise}
                        onChange={(val) => handleInputChange('devise', val)}
                        placeholder="FCFA"
                        rightAddon={<span className="text-xs font-bold text-gray-500">SYMBOLE</span>}
                    />
                </div>
            </CollapsibleSection>
        </div>
      </div>

      <StickyActions>
          <div className="flex items-center gap-3 text-sm text-gray-600">
             {hasChanges ? (
                 <>
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <span>Modifications en attente</span>
                 </>
             ) : (
                <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>Synchronisé</span>
                </>
             )}
          </div>
          <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all transform active:scale-95 ${
                  hasChanges 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25' 
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
      </StickyActions>
    </div>
  );
};

export default PersonnalisationGeneral;
