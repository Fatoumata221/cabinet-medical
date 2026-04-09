import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const Assurances = () => {
  const [assurances, setAssurances] = useState([]);
  const [newAssurance, setNewAssurance] = useState({ 
    nom: '', 
    description: '', 
    type_assurance: 'mutuelle',
    taux_remboursement: 0,
    ordre_affichage: 0,
    actif: true 
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  const typesAssurance = [
    { value: 'mutuelle', label: 'IPM / Mutuelle', color: 'bg-blue-100 text-blue-800' },
    { value: 'securite_sociale', label: 'FNR', color: 'bg-green-100 text-green-800' },
    { value: 'privee', label: 'Privée', color: 'bg-purple-100 text-purple-800' },
    { value: 'autre', label: 'Autre', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    fetchAssurances();
  }, []);

  const fetchAssurances = async () => {
    try {
      const { data, error } = await supabase
        .from('assurances')
        .select('*')
        .order('ordre_affichage', { ascending: true });

      if (error) throw error;
      setAssurances(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des assurances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('assurances')
          .update(newAssurance)
          .eq('id', editingId);
        
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('assurances')
          .insert([newAssurance]);
        
        if (error) throw error;
      }

      setNewAssurance({ 
        nom: '', 
        description: '', 
        type_assurance: 'mutuelle',
        taux_remboursement: 0,
        ordre_affichage: 0,
        actif: true 
      });
      fetchAssurances();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (assurance) => {
    setEditingId(assurance.id);
    setNewAssurance(assurance);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette assurance ?')) {
      try {
        const { error } = await supabase
          .from('assurances')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchAssurances();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const filteredAssurances = assurances.filter(assurance => {
    const matchesSearch = assurance.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assurance.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || assurance.type_assurance === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Assurances</h1>
        <p className="text-gray-600">Gérez les assurances acceptées par le cabinet médical</p>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Modifier l\'assurance' : 'Ajouter une assurance'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                required
                value={newAssurance.nom}
                onChange={(e) => setNewAssurance({...newAssurance, nom: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom de l'assurance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'assurance
              </label>
              <select
                value={newAssurance.type_assurance}
                onChange={(e) => setNewAssurance({...newAssurance, type_assurance: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {typesAssurance.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taux de remboursement (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={newAssurance.taux_remboursement}
                onChange={(e) => setNewAssurance({...newAssurance, taux_remboursement: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordre d'affichage
              </label>
              <input
                type="number"
                value={newAssurance.ordre_affichage}
                onChange={(e) => setNewAssurance({...newAssurance, ordre_affichage: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="actif"
                checked={newAssurance.actif}
                onChange={(e) => setNewAssurance({...newAssurance, actif: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="actif" className="ml-2 block text-sm text-gray-900">
                Actif
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newAssurance.description}
              onChange={(e) => setNewAssurance({...newAssurance, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description de l'assurance"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {editingId ? 'Modifier' : 'Ajouter'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setNewAssurance({ 
                    nom: '', 
                    description: '', 
                    type_assurance: 'mutuelle',
                    taux_remboursement: 0,
                    ordre_affichage: 0,
                    actif: true 
                  });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rechercher par nom ou description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les types</option>
              {typesAssurance.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            Liste des Assurances ({filteredAssurances.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assurance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taux de remboursement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssurances.map((assurance) => (
                <tr key={assurance.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{assurance.nom}</div>
                      {assurance.description && (
                        <div className="text-sm text-gray-500">{assurance.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typesAssurance.find(t => t.value === assurance.type_assurance)?.color || 'bg-gray-100 text-gray-800'}`}>
                      {typesAssurance.find(t => t.value === assurance.type_assurance)?.label || assurance.type_assurance}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {assurance.taux_remboursement > 0 ? (
                        <span className="font-medium text-blue-600">{assurance.taux_remboursement.toFixed(2)}%</span>
                      ) : (
                        <span className="text-gray-500">Non défini</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assurance.ordre_affichage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${assurance.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {assurance.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(assurance)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(assurance.id)}
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
      </div>
    </div>
  );
};

export default Assurances;
