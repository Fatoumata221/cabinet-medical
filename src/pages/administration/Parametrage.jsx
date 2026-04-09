import React, { useState } from 'react';
import { useParametrage } from '../../hooks/useParametrage';
import {
  Building2,
  Palette,
  Sparkles,
  Save,
  RefreshCw,
  AlertCircle,
  FileCheck
} from 'lucide-react';

import GeneralTab from '../../components/personnalisation/GeneralTab';
import ApparenceTab from '../../components/personnalisation/ApparenceTab';
import DocumentsTab from '../../components/personnalisation/DocumentsTab';
import CollapsibleSection from '../../components/common/CollapsibleSection';
import Tooltip from '../../components/common/Tooltip';
import PreviewPanel from '../../components/personnalisation/PreviewPanel';


const Personnalisation = () => {
  const {
    settings,
    loading,
    saving,
    hasChanges,
    handleInputChange,
    handleHoraireChange,
    handleSave,
    setSettings
  } = useParametrage();

  const [activeTab, setActiveTab] = useState('general');
  const [expandedSections, setExpandedSections] = useState({
        general: { structure: true, coordonnees: true, legales: true, horaires: true, localisation: true },
        apparence: { identite: true, couleurs_principales: true, couleurs_interface: true, sidebar: true, header: true, login: true, typographie: true, theme: true },
        documents: { en_tete: true, couleurs: true, certificats: true, ordonnances: true, format: true, complementaires: true }
    });
    
  const toggleSection = (tab, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [section]: !prev[tab][section]
      }
    }));
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Building2 },
    { id: 'apparence', label: 'Apparence', icon: Palette },
    { id: 'documents', label: 'Documents', icon: FileCheck }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Sparkles className="w-8 h-8 mr-3 text-blue-600" />
              Personnalisation de l'Application
            </h1>
            <p className="text-gray-600 mt-2">
              Personnalisez l'apparence et les informations de votre structure pour adapter l'application à votre identité
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <div className="flex items-center px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                Modifications non enregistrées
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`flex items-center px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                hasChanges 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Options de personnalisation */}
            <div className="lg:col-span-2">
              {activeTab === 'general' && (
                <GeneralTab 
                  settings={settings} 
                  handleInputChange={handleInputChange} 
                  handleHoraireChange={handleHoraireChange}
                  expandedSections={expandedSections.general}
                  toggleSection={(section) => toggleSection('general', section)}
                />
              )}
              {activeTab === 'apparence' && (
                <ApparenceTab 
                  settings={settings} 
                  handleInputChange={handleInputChange}
                  expandedSections={expandedSections.apparence}
                  toggleSection={(section) => toggleSection('apparence', section)}
                />
              )}
              {activeTab === 'documents' && (
                <DocumentsTab 
                  settings={settings} 
                  handleInputChange={handleInputChange}
                  expandedSections={expandedSections.documents}
                  toggleSection={(section) => toggleSection('documents', section)}
                />
              )}
            </div>
            
            {/* Aperçu en temps réel */}
            <div className="lg:col-span-1">
              {/* <PreviewPanel settings={settings} activeTab={activeTab} /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};





export default Personnalisation;
