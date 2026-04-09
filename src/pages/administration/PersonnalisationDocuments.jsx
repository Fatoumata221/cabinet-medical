import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePersonnalisation } from '../../contexts/PersonnalisationContext';
import { 
  CollapsibleSection, 
  SettingInput, 
  SettingColorPicker, 
  SettingSelect,
  StickyActions,
  SettingSwitch 
} from '../../components/personnalisation/SharedComponents';
import {
  FileCheck,
  FileText as FileTextIcon,
  Image as ImageIcon,
  Palette,
  Printer,
  Save,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const PersonnalisationDocuments = () => {
  const { settings, loading, saving, hasChanges, handleInputChange, handleSave } = usePersonnalisation();
  
  const [expandedSections, setExpandedSections] = useState({
    en_tete: true,
    couleurs: false,
    ordonnances: false,
    format: false,
    complementaires: false
  });

  // State for preview tab (Certificate vs Prescription)
  const [previewTab, setPreviewTab] = useState('certificat');

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
            <p className="text-gray-500 font-medium">Chargement des modèles...</p>
        </div>
      </div>
  );

  // --- Document Preview Component ---
  const DocumentPreview = () => (
      <div className="bg-gray-100 rounded-2xl p-8 sticky top-6 shadow-inner border border-gray-200 min-h-[700px] flex flex-col">
          <div className="flex justify-center mb-6">
              <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200 inline-flex">
                  <button 
                      onClick={() => setPreviewTab('certificat')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${previewTab === 'certificat' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                      Certificat
                  </button>
                  <button 
                      onClick={() => setPreviewTab('ordonnance')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${previewTab === 'ordonnance' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                      Ordonnance
                  </button>
              </div>
          </div>

          {/* Paper Mockup */}
          <div 
            className="bg-white shadow-2xl mx-auto w-full max-w-[450px] flex-1 flex flex-col relative transition-all duration-300"
            style={{ 
                fontFamily: settings.document_police || 'sans-serif',
                fontSize: `${settings.document_taille_police || 14}px`,
                color: '#1f2937'
            }}
          >
              {/* Header Info Section (Matches ordonnancePrint.js structure) */}
              <div className="p-6 border-b border-gray-100 flex gap-4 bg-gray-50/30">
                  {settings.document_afficher_logo && (
                      <div className="w-16 h-16 bg-white border border-gray-100 rounded-lg flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                          {settings.document_logo_url || settings.logo_url ? (
                              <img src={settings.document_logo_url || settings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                          ) : (
                              <div className="text-[8px] font-bold text-gray-300 text-center uppercase tracking-tighter">VOTRE<br/>LOGO</div>
                          )}
                      </div>
                  )}
                  <div className="flex-1 flex justify-between gap-4">
                      {/* Cabinet Info */}
                      <div className="space-y-0.5 min-w-0 flex-1">
                          <h4 className="font-bold text-gray-900 text-xs truncate uppercase tracking-tight" style={{ color: settings.document_couleur_principale }}>
                              {settings.nom_cabinet || 'Nom du Cabinet'}
                          </h4>
                          <p className="text-[9px] text-gray-500 leading-tight">{settings.adresse || 'Adresse du cabinet...'}</p>
                          <p className="text-[9px] text-gray-500">{settings.ville} {settings.code_postal}</p>
                          {(settings.document_afficher_telephone || settings.document_afficher_email) && (
                              <p className="text-[8px] text-gray-400 mt-1 flex flex-wrap gap-x-2">
                                  {settings.document_afficher_telephone && <span>Tél: {settings.telephone}</span>}
                                  {settings.document_afficher_email && <span>Email: {settings.email}</span>}
                              </p>
                          )}
                      </div>
                      
                      {/* Doctor Info (Simulated) */}
                      <div className="text-right space-y-0.5">
                          <h3 className="font-bold text-gray-900 text-xs uppercase">Dr. Prénom Nom</h3>
                          <p className="text-[9px] text-blue-600 font-medium">Spécialité Médicale</p>
                          <p className="text-[8px] text-gray-400">Tél: +227 XX XX XX</p>
                      </div>
                  </div>
              </div>

              {/* Document Body */}
              <div className="p-8 flex-1 flex flex-col">
                  {/* Title */}
                  <div className="text-center mb-6">
                      <h1 
                        className="font-black text-xl mb-1 uppercase tracking-widest inline-block px-4 py-1 border-y-2"
                        style={{ 
                            color: settings.document_couleur_principale || '#000',
                            borderColor: settings.document_couleur_bordure || '#eee'
                        }}
                      >
                          {previewTab === 'certificat' ? (settings.certificat_titre || 'CERTIFICAT') : (settings.ordonnance_titre || 'ORDONNANCE')}
                      </h1>
                      <div className="text-[9px] text-gray-400 mt-2 font-medium">
                          Fait à {settings.document_lieu_par_defaut || 'Niamey'}, le {new Date().toLocaleDateString('fr-FR')}
                      </div>
                  </div>

                  {/* Patient Section */}
                  <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100 mb-6 flex justify-between items-center">
                      <div className="space-y-1">
                          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Information Patient</div>
                          <div className="text-xs font-semibold text-gray-800">M. Jean DUPONT</div>
                          <div className="text-[10px] text-gray-500">Né le 01/01/1980</div>
                      </div>
                      <div className="text-right">
                          <div className="text-[9px] font-mono text-gray-400">Dossier: #12345</div>
                      </div>
                  </div>

                  {/* Prescription Section (Simulated Grid) */}
                  <div className="flex-1">
                      <h2 className="text-[11px] font-bold text-gray-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          {previewTab === 'certificat' ? 'Diagnostics & Certifications' : 'Prescription Médicale'}
                      </h2>
                      
                      <div className="space-y-4">
                          {[1, 2].map(i => (
                              <div key={i} className="flex gap-3">
                                  <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0 border border-gray-200">
                                      {i}
                                  </div>
                                  <div className="flex-1 space-y-1.5">
                                      <div className="h-2.5 bg-gray-200 rounded w-1/3"></div>
                                      <div className="h-2 bg-gray-100 rounded w-full"></div>
                                      <div className="h-2 bg-gray-50 rounded w-5/6"></div>
                                  </div>
                              </div>
                          ))}
                      </div>

                      {/* Recommandations simulated */}
                      <div className="mt-8 pt-4 border-t border-gray-100 italic text-[10px] text-gray-500">
                          <span className="font-bold not-italic text-gray-600 block mb-1">💡 Recommandations:</span>
                          Repos conseillé pendant 3 jours...
                      </div>
                  </div>
                  
                  {/* Signature Section */}
                  <div className="mt-6 flex justify-between items-end">
                      <div className="p-2 border border-gray-100 rounded text-[8px] text-gray-400 flex items-center gap-2">
                        <Printer size={10} /> {new Date().toLocaleDateString()}
                      </div>
                      <div className="text-center w-36">
                          <div className="text-[9px] font-semibold text-gray-600 mb-1 border-b border-gray-200 pb-1">Signature du médecin</div>
                          {settings.document_afficher_cachet && (
                              <div className="w-20 h-20 border-2 border-dashed border-blue-100 rounded-full mx-auto my-1 flex items-center justify-center text-[10px] text-blue-200 rotate-12 bg-blue-50/10">
                                  CACHET
                              </div>
                          )}
                          <div className="text-[10px] font-bold text-gray-800">Dr. Prénom Nom</div>
                      </div>
                  </div>
              </div>

              {/* Footer text */}
              <div 
                className="p-3 text-center border-t text-[8px] text-gray-400 tracking-tight"
                style={{ borderColor: settings.document_couleur_bordure || '#eee' }}
              >
                  {previewTab === 'certificat' ? settings.certificat_footer_texte : settings.ordonnance_footer_texte}
              </div>
          </div>

          <div className="mt-6 flex justify-between items-center px-4">
              <div className="text-xs text-gray-400 italic">Format A4 Portrait • {settings.document_police}</div>
              <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
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
                <FileCheck className="w-8 h-8 text-green-600" />
                Documents
              </h1>
              <p className="text-gray-500 mt-1">
                Personnalisez vos modèles d'impression.
              </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Settings */}
            <div className="lg:col-span-7 space-y-6">
                
                {/* En-tête */}
                <CollapsibleSection
                    id="en_tete"
                    title="En-tête & Identité"
                    icon={ImageIcon}
                    isExpanded={expandedSections.en_tete}
                    onToggle={() => toggleSection('en_tete')}
                    description="Logos et informations d'en-tête"
                >
                    <div className="grid gap-4">
                        <SettingSwitch 
                            label="Afficher le logo" 
                            checked={settings.document_afficher_logo} 
                            onChange={(val) => handleInputChange('document_afficher_logo', val)}
                        />
                         <SettingInput 
                            label="URL Logo Documents"
                            value={settings.document_logo_url}
                            onChange={(val) => handleInputChange('document_logo_url', val)}
                            placeholder="Laisser vide pour utiliser le logo principal"
                        />
                         <SettingInput 
                            label="Lieu par défaut"
                            value={settings.document_lieu_par_defaut}
                            onChange={(val) => handleInputChange('document_lieu_par_defaut', val)}
                            placeholder="Ex: Niamey"
                        />
                    </div>
                </CollapsibleSection>

                 {/* Couleurs */}
                 <CollapsibleSection
                    id="couleurs"
                    title="Style & Couleurs"
                    icon={Palette}
                    isExpanded={expandedSections.couleurs}
                    onToggle={() => toggleSection('couleurs')}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <SettingColorPicker 
                            label="Couleur Principale"
                            value={settings.document_couleur_principale}
                            onChange={(val) => handleInputChange('document_couleur_principale', val)}
                        />
                         <SettingColorPicker 
                            label="Bordures"
                            value={settings.document_couleur_bordure}
                            onChange={(val) => handleInputChange('document_couleur_bordure', val)}
                        />
                    </div>
                </CollapsibleSection>

                 {/* Certificat Config */}
                 <CollapsibleSection
                    id="certificat"
                    title="Configuration Certificats"
                    icon={FileCheck}
                    isExpanded={true}
                    onToggle={() => {}}
                    badge="Modèle"
                >
                     <div className="grid gap-4">
                        <SettingInput 
                            label="Titre du Certificat"
                            value={settings.certificat_titre}
                            onChange={(val) => handleInputChange('certificat_titre', val)}
                        />
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Texte d'introduction</label>
                            <textarea 
                                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                                rows={3}
                                value={settings.certificat_texte_introduction}
                                onChange={(e) => handleInputChange('certificat_texte_introduction', e.target.value)}
                            />
                        </div>
                         <SettingInput 
                            label="Pied de page"
                            value={settings.certificat_footer_texte}
                            onChange={(val) => handleInputChange('certificat_footer_texte', val)}
                        />
                     </div>
                </CollapsibleSection>

                 {/* Ordonnance Config */}
                 <CollapsibleSection
                    id="ordonnances"
                    title="Configuration Ordonnances"
                    icon={FileTextIcon}
                    isExpanded={expandedSections.ordonnances}
                    onToggle={() => toggleSection('ordonnances')}
                    badge="Modèle"
                >
                     <div className="grid gap-4">
                        <SettingInput 
                            label="Titre de l'Ordonnance"
                            value={settings.ordonnance_titre}
                            onChange={(val) => handleInputChange('ordonnance_titre', val)}
                        />
                        <SettingSwitch 
                            label="Afficher date de prescription" 
                            checked={settings.ordonnance_afficher_date_prescription} 
                            onChange={(val) => handleInputChange('ordonnance_afficher_date_prescription', val)}
                        />
                         <SettingInput 
                            label="Pied de page"
                            value={settings.ordonnance_footer_texte}
                            onChange={(val) => handleInputChange('ordonnance_footer_texte', val)}
                        />
                     </div>
                </CollapsibleSection>

                 {/* Format */}
                 <CollapsibleSection
                    id="format"
                    title="Format d'impression"
                    icon={Printer}
                    isExpanded={expandedSections.format}
                    onToggle={() => toggleSection('format')}
                >
                    <div className="grid grid-cols-2 gap-4">
                         <SettingSelect 
                            label="Police"
                            value={settings.document_police}
                            onChange={(val) => handleInputChange('document_police', val)}
                            options={[
                                { value: 'Arial', label: 'Arial' },
                                { value: 'Times New Roman', label: 'Times New Roman' },
                                { value: 'Verdana', label: 'Verdana' },
                            ]}
                        />
                         <SettingInput 
                            label="Taille Police (px)"
                            type="number"
                            value={settings.document_taille_police}
                            onChange={(val) => handleInputChange('document_taille_police', parseInt(val))}
                        />
                    </div>
                </CollapsibleSection>

            </div>

             {/* Right Column: Document Preview */}
             <div className="lg:col-span-5 hidden lg:block">
                <DocumentPreview />
            </div>
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
                    <span>Modèles Sauvegardés</span>
                </>
             )}
          </div>
          <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all transform active:scale-95 ${
                  hasChanges 
                  ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:shadow-green-500/25' 
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

export default PersonnalisationDocuments;
