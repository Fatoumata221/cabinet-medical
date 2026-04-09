import React, { useState, useEffect } from 'react';
import ParametrageLayout from '../../components/ParametrageLayout';
import { supabase } from '../../lib/supabase';

const ListeEtiologies = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ 
    nom: undefined, categorie: undefined, description: undefined, actif: undefined
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
        .from('liste_etiologies')
        .select('*')
        .order('nom');
      
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des liste des étiologies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('liste_etiologies')
          .update(newItem)
          .eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('liste_etiologies')
          .insert([newItem]);
        if (error) throw error;
      }
      
      setNewItem({ nom: undefined, categorie: undefined, description: undefined, actif: undefined });
      setShowForm(false);
      fetchItems();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setNewItem({
      nom: item.nom,
      categorie: item.categorie,
      description: item.description,
      actif: item.actif
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setNewItem({ nom: undefined, categorie: undefined, description: undefined, actif: undefined });
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewItem({ nom: undefined, categorie: undefined, description: undefined, actif: undefined });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      try {
        const { error } = await supabase
          .from('liste_etiologies')
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
        title="Liste des Étiologies"
        addButtonText={editingId ? 'Modifier' : 'Ajouter'}
        showForm={showForm}
        onAddClick={handleAddNew}
        onCancelClick={handleCancel}
      >
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Nom
    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Categorie
    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Description
    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Actif
    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{item.nom}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.categorie}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.actif}</td>
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

export default ListeEtiologies;