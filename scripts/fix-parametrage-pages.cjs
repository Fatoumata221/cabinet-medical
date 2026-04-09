const fs = require('fs');
const path = require('path');

// Liste des fichiers à corriger
const filesToFix = [
  'ExamensDiagnostic.jsx',
  'ListeMaladies.jsx',
  'ListeEtiologies.jsx',
  'PlaintesPrincipales.jsx',
  'ListeVaccins.jsx',
  'CategoriesAntecedents.jsx',
  'TypesSymptomes.jsx',
  'TypesAntecedents.jsx',
  'Employeurs.jsx',
  'TiersPayant.jsx',
  'TypeCouvertureMedicale.jsx',
  'TypesArchives.jsx',
  'ListeArchives.jsx',
  'SignesCliniques.jsx'
];

// Template de base pour un fichier de paramétrage
const createParametrageTemplate = (componentName, tableName, fields, title) => {
  const fieldNames = Object.keys(fields);
  const fieldTypes = Object.values(fields);
  
  const initialState = fieldNames.map(name => `${name}: ${fieldTypes[name]}`).join(', ');
  const formFields = fieldNames.map(name => {
    const fieldType = fieldTypes[name];
    if (fieldType === 'string') {
      return `
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ${name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')}
                </label>
                <input
                  type="text"
                  value={newItem.${name}}
                  onChange={(e) => setNewItem({...newItem, ${name}: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>`;
    } else if (fieldType === 'number') {
      return `
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ${name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')}
                </label>
                <input
                  type="number"
                  value={newItem.${name}}
                  onChange={(e) => setNewItem({...newItem, ${name}: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>`;
    } else if (fieldType === 'boolean') {
      return `
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newItem.${name}}
                    onChange={(e) => setNewItem({...newItem, ${name}: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">${name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')}</span>
                </label>
              </div>`;
    } else if (fieldType === 'textarea') {
      return `
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ${name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')}
                </label>
                <textarea
                  value={newItem.${name}}
                  onChange={(e) => setNewItem({...newItem, ${name}: e.target.value})}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>`;
    }
  }).join('');

  const tableHeaders = fieldNames.map(name => 
    `<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      ${name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')}
    </th>`
  ).join('\n                ');

  const tableCells = fieldNames.map(name => {
    const fieldType = fieldTypes[name];
    if (fieldType === 'boolean') {
      return `<td className="px-6 py-4 whitespace-nowrap">
                    <span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${item.${name} ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}\`}>
                      {item.${name} ? 'Actif' : 'Inactif'}
                    </span>
                  </td>`;
    } else {
      return `<td className="px-6 py-4 whitespace-nowrap">{item.${name}}</td>`;
    }
  }).join('\n                  ');

  return `import React, { useState, useEffect } from 'react';
import ParametrageLayout from '../../components/ParametrageLayout';
import { supabase } from '../../lib/supabase';

const ${componentName} = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ 
    ${initialState}
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('${tableName}')
        .select('*')
        .order('nom');
      
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des ${title.toLowerCase()}:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('${tableName}')
          .update(newItem)
          .eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('${tableName}')
          .insert([newItem]);
        if (error) throw error;
      }
      
      setNewItem({ ${initialState} });
      setShowForm(false);
      fetchItems();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setNewItem({
      ${fieldNames.map(name => `${name}: item.${name}`).join(',\n      ')}
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setNewItem({ ${initialState} });
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewItem({ ${initialState} });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      try {
        const { error } = await supabase
          .from('${tableName}')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchItems();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const filteredItems = items.filter(item =>
    item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <div>
      <ParametrageLayout
        title="${title}"
        addButtonText={editingId ? 'Modifier' : 'Ajouter'}
        showForm={showForm}
        onAddClick={handleAddNew}
        onCancelClick={handleCancel}
      >
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">${formFields}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingId ? 'Modifier' : 'Ajouter'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher par nom ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 p-2 border rounded"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                ${tableHeaders}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  ${tableCells}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ParametrageLayout>
    </div>
  );
};

export default ${componentName};`;
};

// Configuration des fichiers
const fileConfigs = {
  'ExamensDiagnostic.jsx': {
    componentName: 'ExamensDiagnostic',
    tableName: 'examens_diagnostic',
    title: 'Examens de Diagnostic',
    fields: {
      nom: 'string',
      description: 'textarea',
      preparation: 'textarea',
      actif: 'boolean'
    }
  },
  'ListeMaladies.jsx': {
    componentName: 'ListeMaladies',
    tableName: 'liste_maladies',
    title: 'Liste des Maladies',
    fields: {
      nom: 'string',
      code_cim: 'string',
      description: 'textarea',
      actif: 'boolean'
    }
  },
  'ListeEtiologies.jsx': {
    componentName: 'ListeEtiologies',
    tableName: 'liste_etiologies',
    title: 'Liste des Étiologies',
    fields: {
      nom: 'string',
      categorie: 'string',
      description: 'textarea',
      actif: 'boolean'
    }
  },
  'PlaintesPrincipales.jsx': {
    componentName: 'PlaintesPrincipales',
    tableName: 'plaintes_principales',
    title: 'Plaintes Principales',
    fields: {
      nom: 'string',
      categorie: 'string',
      description: 'textarea',
      actif: 'boolean'
    }
  },
  'ListeVaccins.jsx': {
    componentName: 'ListeVaccins',
    tableName: 'liste_vaccins',
    title: 'Liste des Vaccins',
    fields: {
      nom: 'string',
      fabricant: 'string',
      code_atc: 'string',
      description: 'textarea',
      actif: 'boolean'
    }
  },
  'CategoriesAntecedents.jsx': {
    componentName: 'CategoriesAntecedents',
    tableName: 'categories_antecedents',
    title: 'Catégories d\'Antécédents',
    fields: {
      nom: 'string',
      description: 'textarea',
      ordre_affichage: 'number',
      actif: 'boolean'
    }
  },
  'TypesSymptomes.jsx': {
    componentName: 'TypesSymptomes',
    tableName: 'types_symptomes',
    title: 'Types de Symptômes',
    fields: {
      nom: 'string',
      categorie: 'string',
      description: 'textarea',
      actif: 'boolean'
    }
  },
  'TypesAntecedents.jsx': {
    componentName: 'TypesAntecedents',
    tableName: 'types_antecedents',
    title: 'Types d\'Antécédents',
    fields: {
      nom: 'string',
      categorie: 'string',
      description: 'textarea',
      actif: 'boolean'
    }
  },
  'Employeurs.jsx': {
    componentName: 'Employeurs',
    tableName: 'employeurs',
    title: 'Employeurs',
    fields: {
      nom: 'string',
      adresse: 'textarea',
      telephone: 'string',
      email: 'string',
      actif: 'boolean'
    }
  },
  'TiersPayant.jsx': {
    componentName: 'TiersPayant',
    tableName: 'tiers_payant',
    title: 'Tiers Payant',
    fields: {
      nom: 'string',
      description: 'textarea',
      actif: 'boolean'
    }
  },
  'TypeCouvertureMedicale.jsx': {
    componentName: 'TypeCouvertureMedicale',
    tableName: 'type_couverture_medicale',
    title: 'Types de Couverture Médicale',
    fields: {
      nom: 'string',
      description: 'textarea',
      actif: 'boolean'
    }
  },
  'TypesArchives.jsx': {
    componentName: 'TypesArchives',
    tableName: 'types_archives',
    title: 'Types d\'Archives',
    fields: {
      nom: 'string',
      description: 'textarea',
      couleur: 'string',
      actif: 'boolean'
    }
  },
  'ListeArchives.jsx': {
    componentName: 'ListeArchives',
    tableName: 'liste_archives',
    title: 'Liste des Archives',
    fields: {
      nom: 'string',
      reference: 'string',
      famille: 'string',
      description: 'textarea',
      actif: 'boolean'
    }
  },
  'SignesCliniques.jsx': {
    componentName: 'SignesCliniques',
    tableName: 'signes_cliniques',
    title: 'Signes Cliniques',
    fields: {
      nom: 'string',
      description: 'textarea',
      categorie: 'string',
      actif: 'boolean'
    }
  }
};

// Fonction pour corriger un fichier
function fixFile(filename) {
  const config = fileConfigs[filename];
  if (!config) {
    console.log(`Configuration manquante pour ${filename}`);
    return;
  }

  const filePath = path.join(__dirname, '..', 'src', 'pages', 'parametrage', filename);
  const template = createParametrageTemplate(
    config.componentName,
    config.tableName,
    config.fields,
    config.title
  );

  try {
    fs.writeFileSync(filePath, template);
    console.log(`✅ ${filename} corrigé`);
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${filename}:`, error.message);
  }
}

// Corriger tous les fichiers
console.log('🔧 Correction des fichiers de paramétrage...\n');

filesToFix.forEach(filename => {
  fixFile(filename);
});

console.log('\n✨ Correction terminée !');
