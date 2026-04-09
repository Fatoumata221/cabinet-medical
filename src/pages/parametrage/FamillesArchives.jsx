import React, { useState, useEffect } from 'react';
import ParametrageLayout from '../../components/ParametrageLayout';
import ParametrageList from '../../components/ParametrageList';
import { supabase } from '../../lib/supabase';

const FamillesArchives = () => {
  const [familles, setFamilles] = useState([]);
  const [newFamille, setNewFamille] = useState({ 
    nom: '', 
    description: '', 
    couleur: '#3B82F6',
    duree_conservation: 0,
    actif: true 
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchFamilles();
  }, []);

  const fetchFamilles = async () => {
    try {
      const { data, error } = await supabase
        .from('familles_archives')
        .select('*')
        .order('nom');
      
      if (error) throw error;
      setFamilles(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des familles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('familles_archives')
          .update(newFamille)
          .eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('familles_archives')
          .insert([newFamille]);
        if (error) throw error;
      }
      
      setNewFamille({ nom: '', description: '', couleur: '#3B82F6', duree_conservation: 0, actif: true });
      fetchFamilles();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (famille) => {
    setEditingId(famille.id);
    setNewFamille({
      nom: famille.nom,
      description: famille.description,
      couleur: famille.couleur,
      duree_conservation: famille.duree_conservation,
      actif: famille.actif
    });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setNewFamille({ nom: '', description: '', couleur: '#3B82F6', duree_conservation: 0, actif: true });
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewFamille({ nom: '', description: '', couleur: '#3B82F6', duree_conservation: 0, actif: true });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette famille d\'archives ?')) {
      try {
        const { error } = await supabase
          .from('familles_archives')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchFamilles();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <div>
      <ParametrageLayout
        title="Familles d'Archives"
        addButtonText={editingId ? 'Modifier famille' : 'Ajouter famille'}
        showForm={showForm}
        onAddClick={handleAddNew}
        onCancelClick={handleCancel}
      >
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  type="text"
                  value={newFamille.nom}
                  onChange={(e) => setNewFamille({...newFamille, nom: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Couleur</label>
                <input
                  type="color"
                  value={newFamille.couleur}
                  onChange={(e) => setNewFamille({...newFamille, couleur: e.target.value})}
                  className="mt-1 block w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newFamille.description}
                onChange={(e) => setNewFamille({...newFamille, description: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows="3"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Durée de conservation (années)</label>
                <input
                  type="number"
                  value={newFamille.duree_conservation}
                  onChange={(e) => setNewFamille({...newFamille, duree_conservation: parseInt(e.target.value) || 0})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <select
                  value={newFamille.actif}
                  onChange={(e) => setNewFamille({...newFamille, actif: e.target.value === 'true'})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value={true}>Actif</option>
                  <option value={false}>Inactif</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
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
      </ParametrageLayout>

      <ParametrageList
        title="Liste des familles d'archives"
        itemCount={familles.length}
        itemName="familles"
        emptyMessage="Aucune famille d'archives enregistrée. Cliquez sur 'Ajouter famille' pour commencer."
      >
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Famille
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conservation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Couleur
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
              {familles.map((famille) => (
                <tr key={famille.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{famille.nom}</td>
                  <td className="px-6 py-4">{famille.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {famille.duree_conservation > 0 ? `${famille.duree_conservation} ans` : 'Illimitée'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: famille.couleur }}
                      ></div>
                      <span className="text-sm text-gray-600">{famille.couleur}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      famille.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {famille.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(famille)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(famille.id)}
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
      </ParametrageList>
    </div>
  );
};

export default FamillesArchives;
