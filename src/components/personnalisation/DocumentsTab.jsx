import React from 'react';
import { ImageIcon, Palette, Zap, FileCheck, FileTextIcon, Printer, FileText, HelpCircle } from 'lucide-react';
import CollapsibleSection from '../common/CollapsibleSection';
import Tooltip from '../common/Tooltip';
import ColorPicker from '../common/ColorPicker';

// Composant pour l'onglet Documents
const DocumentsTab = ({ settings, handleInputChange, expandedSections, toggleSection }) => {
  
    return (
      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* En-tête et Identité */}
        <CollapsibleSection
          id="en_tete"
          title="En-tête et Identité des Documents"
          icon={ImageIcon}
          isExpanded={expandedSections.en_tete}
          onToggle={() => toggleSection('en_tete')}
          description="Logo, cachet et lieu par défaut pour les documents"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo pour les Documents (URL)
              </label>
              <input
                type="url"
                value={settings.document_logo_url || ''}
                onChange={(e) => handleInputChange('document_logo_url', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500 mt-1">Logo affiché en haut des documents (certificats, ordonnances). Si vide, utilise le logo principal.</p>
            </div>
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cachet du Cabinet (URL)
              </label>
              <input
                type="url"
                value={settings.document_cachet_url || ''}
                onChange={(e) => handleInputChange('document_cachet_url', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500 mt-1">Cachet officiel du cabinet à afficher sur les documents (recommandé: image transparente PNG)</p>
            </div>
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lieu par Défaut
              </label>
              <input
                type="text"
                value={settings.document_lieu_par_defaut || ''}
                onChange={(e) => handleInputChange('document_lieu_par_defaut', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Niamey, Niger"
              />
              <p className="text-xs text-gray-500 mt-1">Lieu utilisé dans "Fait à [LIEU]" sur les documents. Si vide, utilise la ville du cabinet.</p>
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.document_afficher_logo !== false}
                  onChange={(e) => handleInputChange('document_afficher_logo', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher le logo sur les documents</span>
              </label>
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.document_afficher_cachet !== false}
                  onChange={(e) => handleInputChange('document_afficher_cachet', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher le cachet sur les documents</span>
              </label>
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.document_afficher_adresse_complete !== false}
                  onChange={(e) => handleInputChange('document_afficher_adresse_complete', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher l'adresse complète du cabinet</span>
              </label>
            </div>
          </div>
        </CollapsibleSection>
  
        {/* Couleurs des Documents */}
        <CollapsibleSection
          id="couleurs"
          title="Couleurs des Documents"
          icon={Palette}
          isExpanded={expandedSections.couleurs}
          onToggle={() => toggleSection('couleurs')}
          description="Palette de couleurs pour les documents médicaux"
          badge="Important"
        >
          <p className="text-sm text-gray-600 mb-4 mt-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Personnalisez les couleurs utilisées dans les certificats et ordonnances
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorPicker 
              label="Couleur Principale" 
              field="document_couleur_principale" 
              value={settings.document_couleur_principale}
              handleInputChange={handleInputChange}
              description="Couleur principale des titres, bordures et éléments importants"
            />
            <ColorPicker 
              label="Couleur Secondaire" 
              field="document_couleur_secondaire" 
              value={settings.document_couleur_secondaire}
              handleInputChange={handleInputChange}
              description="Couleur utilisée pour les gradients et effets"
            />
            <ColorPicker 
              label="Couleur des Bordures" 
              field="document_couleur_bordure" 
              value={settings.document_couleur_bordure}
              handleInputChange={handleInputChange}
              description="Couleur des bordures et séparateurs"
            />
          </div>
        </CollapsibleSection>
  
        {/* Personnalisation des Certificats */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileCheck className="w-5 h-5 mr-2 text-blue-600" />
            Personnalisation des Certificats
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre du Certificat
              </label>
              <input
                type="text"
                value={settings.certificat_titre || 'CERTIFICAT MÉDICAL'}
                onChange={(e) => handleInputChange('certificat_titre', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="CERTIFICAT MÉDICAL"
              />
              <p className="text-xs text-gray-500 mt-1">Titre principal affiché en haut du certificat</p>
            </div>
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texte d'Introduction
              </label>
              <textarea
                value={settings.certificat_texte_introduction || ''}
                onChange={(e) => handleInputChange('certificat_texte_introduction', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Je soussigné, Docteur [NOM_MEDECIN], certifie avoir examiné ce jour :"
              />
              <p className="text-xs text-gray-500 mt-1">Utilisez [NOM_MEDECIN] pour insérer automatiquement le nom du médecin</p>
            </div>
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mention Légale
              </label>
              <textarea
                value={settings.certificat_texte_mention || ''}
                onChange={(e) => handleInputChange('certificat_texte_mention', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                placeholder="Certificat établi à la demande de l'intéressé(e) et remis en main propre pour faire valoir ce que de droit."
              />
            </div>
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texte du Pied de Page
              </label>
              <input
                type="text"
                value={settings.certificat_footer_texte || ''}
                onChange={(e) => handleInputChange('certificat_footer_texte', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ce document est un certificat médical officiel."
              />
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.certificat_afficher_numero_dossier !== false}
                  onChange={(e) => handleInputChange('certificat_afficher_numero_dossier', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher le numéro de dossier</span>
              </label>
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.certificat_afficher_date_emission !== false}
                  onChange={(e) => handleInputChange('certificat_afficher_date_emission', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher la date d'émission</span>
              </label>
            </div>
          </div>
        </div>
  
        {/* Personnalisation des Ordonnances */}
        <CollapsibleSection
          id="ordonnances"
          title="Personnalisation des Ordonnances"
          icon={FileTextIcon}
          isExpanded={expandedSections.ordonnances}
          onToggle={() => toggleSection('ordonnances')}
          description="Textes et options d'affichage pour les ordonnances médicales"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de l'Ordonnance
              </label>
              <input
                type="text"
                value={settings.ordonnance_titre || 'ORDONNANCE MÉDICALE'}
                onChange={(e) => handleInputChange('ordonnance_titre', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ORDONNANCE MÉDICALE"
              />
              <p className="text-xs text-gray-500 mt-1">Titre principal affiché en haut de l'ordonnance</p>
            </div>
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texte du Pied de Page
              </label>
              <input
                type="text"
                value={settings.ordonnance_footer_texte || ''}
                onChange={(e) => handleInputChange('ordonnance_footer_texte', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ce document est une ordonnance médicale - À conserver"
              />
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.ordonnance_afficher_numero !== false}
                  onChange={(e) => handleInputChange('ordonnance_afficher_numero', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher le numéro d'ordonnance</span>
              </label>
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.ordonnance_afficher_date_prescription !== false}
                  onChange={(e) => handleInputChange('ordonnance_afficher_date_prescription', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher la date de prescription</span>
              </label>
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.ordonnance_afficher_prochain_rdv !== false}
                  onChange={(e) => handleInputChange('ordonnance_afficher_prochain_rdv', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher le prochain rendez-vous</span>
              </label>
            </div>
          </div>
        </CollapsibleSection>
  
        {/* Format et Style */}
        <CollapsibleSection
          id="format"
          title="Format et Style des Documents"
          icon={Printer}
          isExpanded={expandedSections.format}
          onToggle={() => toggleSection('format')}
          description="Police, taille, marges et formatage des documents"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Police de Caractère
              </label>
              <select
                value={settings.document_police || 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'}
                onChange={(e) => handleInputChange('document_police', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Segoe UI, Tahoma, Geneva, Verdana, sans-serif">Segoe UI (Par défaut)</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="'Courier New', monospace">Courier New</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Verdana, sans-serif">Verdana</option>
              </select>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille de Police de Base (px)
              </label>
              <input
                type="number"
                value={settings.document_taille_police || 14}
                onChange={(e) => handleInputChange('document_taille_police', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="10"
                max="18"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marge Haut (px)
              </label>
              <input
                type="number"
                value={settings.document_marge_haut || 40}
                onChange={(e) => handleInputChange('document_marge_haut', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="20"
                max="100"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marge Bas (px)
              </label>
              <input
                type="number"
                value={settings.document_marge_bas || 40}
                onChange={(e) => handleInputChange('document_marge_bas', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="20"
                max="100"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marge Gauche (px)
              </label>
              <input
                type="number"
                value={settings.document_marge_gauche || 60}
                onChange={(e) => handleInputChange('document_marge_gauche', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="30"
                max="150"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marge Droite (px)
              </label>
              <input
                type="number"
                value={settings.document_marge_droite || 60}
                onChange={(e) => handleInputChange('document_marge_droite', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="30"
                max="150"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Largeur Maximale (px)
              </label>
              <input
                type="number"
                value={settings.document_largeur_max || 900}
                onChange={(e) => handleInputChange('document_largeur_max', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="600"
                max="1200"
              />
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.document_afficher_fond !== false}
                  onChange={(e) => handleInputChange('document_afficher_fond', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher le fond blanc</span>
              </label>
            </div>
  
            <div>
              <ColorPicker 
                label="Couleur de Fond" 
                field="document_couleur_fond" 
                value={settings.document_couleur_fond}
                handleInputChange={handleInputChange}
                description="Couleur de fond du document (généralement blanc)"
              />
            </div>
          </div>
        </CollapsibleSection>
  
        {/* Informations Complémentaires */}
        <CollapsibleSection
          id="complementaires"
          title="Informations Complémentaires"
          icon={FileText}
          isExpanded={expandedSections.complementaires}
          onToggle={() => toggleSection('complementaires')}
          description="Options d'affichage des coordonnées et informations du cabinet"
        >
          <p className="text-sm text-gray-600 mb-4 mt-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            Choisissez quelles informations du cabinet afficher sur les documents
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texte Général du Pied de Page
              </label>
              <input
                type="text"
                value={settings.document_texte_footer_general || ''}
                onChange={(e) => handleInputChange('document_texte_footer_general', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Document généré le [DATE]"
              />
              <p className="text-xs text-gray-500 mt-1">Utilisez [DATE] pour insérer automatiquement la date</p>
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.document_afficher_telephone !== false}
                  onChange={(e) => handleInputChange('document_afficher_telephone', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher le numéro de téléphone</span>
              </label>
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.document_afficher_email !== false}
                  onChange={(e) => handleInputChange('document_afficher_email', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher l'adresse email</span>
              </label>
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.document_afficher_site_web || false}
                  onChange={(e) => handleInputChange('document_afficher_site_web', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher le site web</span>
              </label>
            </div>
  
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.document_afficher_numero_agrement || false}
                  onChange={(e) => handleInputChange('document_afficher_numero_agrement', e.target.checked)}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Afficher le numéro d'agrément</span>
              </label>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    );
  };

  export default DocumentsTab;
