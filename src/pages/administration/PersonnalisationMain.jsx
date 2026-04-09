import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Palette, FileCheck, Sparkles, ArrowRight, Settings2 } from 'lucide-react';

const PersonnalisationMain = () => {
  const sections = [
    {
      id: 'general',
      title: 'Paramètres Généraux',
      description: 'Gérez informations de l\'établissement, coordonnées, horaires d\'ouverture et régionalisation.',
      icon: Building2,
      path: '/administration/personnalisation/general',
      color: 'blue',
      badge: 'Essentiel'
    },
    {
      id: 'apparence',
      title: 'Apparence & Marque',
      description: 'Définissez votre identité visuelle : logo, couleurs, typographie et thèmes de l\'interface.',
      icon: Palette,
      path: '/administration/personnalisation/apparence',
      color: 'purple',
      badge: 'Visuel'
    },
    {
      id: 'documents',
      title: 'Documents & Impressions',
      description: 'Personnalisez vos ordonnances, certificats et autres documents générés.',
      icon: FileCheck,
      path: '/administration/personnalisation/documents',
      color: 'green',
      badge: 'PDF'
    }
  ];

  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      icon: 'text-blue-600',
      border: 'hover:border-blue-200',
      ring: 'group-hover:ring-blue-100',
      arrow: 'text-blue-500'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      icon: 'text-purple-600',
      border: 'hover:border-purple-200',
      ring: 'group-hover:ring-purple-100',
      arrow: 'text-purple-500'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      icon: 'text-green-600',
      border: 'hover:border-green-200',
      ring: 'group-hover:ring-green-100',
      arrow: 'text-green-500'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm p-8 md:p-12">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-60"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start md:justify-between gap-6">
                <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        Administration
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                        Personnalisation du Cabinet
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                        Configurez chaque aspect de votre application pour qu'elle reflète l'identité unique de votre cabinet médical. 
                        Les changements sont appliqués en temps réel.
                    </p>
                </div>
                <div className="hidden md:flex items-center justify-center bg-gray-50 rounded-full p-6 ring-8 ring-gray-100">
                    <Settings2 className="w-16 h-16 text-gray-400" strokeWidth={1.5} />
                </div>
            </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const theme = colorConfig[section.color];
            
            return (
              <Link
                key={section.id}
                to={section.path}
                className={`group relative flex flex-col bg-white rounded-2xl p-6 border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${theme.border}`}
              >
                <div className={`absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity`}>
                   <Icon className={`w-32 h-32 ${theme.icon}`} />
                </div>

                <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className={`p-3.5 rounded-xl ${theme.iconBg} ${theme.icon} ring-4 ring-transparent ${theme.ring} transition-all duration-300`}>
                        <Icon className="w-7 h-7" />
                    </div>
                    {section.badge && (
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 group-hover:bg-white group-hover:shadow-sm transition-all`}>
                            {section.badge}
                        </span>
                    )}
                </div>

                <div className="flex-1 relative z-10">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {section.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        {section.description}
                    </p>
                </div>
                
                <div className={`mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-sm font-semibold ${theme.arrow} relative z-10`}>
                    <span>Configurer</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PersonnalisationMain;
