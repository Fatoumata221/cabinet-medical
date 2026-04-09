import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const CanalProvenance = () => {
  const [canaux, setCanaux] = useState([]);
  const [newCanal, setNewCanal] = useState({ 
    nom: '', 
    description: '', 
    couleur: '#3B82F6',
    actif: true 
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCanaux();
  }, []);

  const fetchCanaux = async () => {
    try {
      const { data, error } = await supabase
        .from('canal_provenance')
        .select('*')
        .order('nom');
      
      if (error) throw error;
      setCanaux(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des canaux:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('canal_provenance')
          .update(newCanal)
          .eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('canal_provenance')
          .insert([newCanal]);
        if (error) throw error;
      }
      
      setNewCanal({ nom: '', description: '', couleur: '#3B82F6', actif: true });
      fetchCanaux();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (canal) => {
    setEditingId(canal.id);
    setNewCanal({
      nom: canal.nom,
      description: canal.description,
      couleur: canal.couleur,
      actif: canal.actif
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce canal de provenance ?')) {
      try {
        const { error } = await supabase
          .from('canal_provenance')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchCanaux();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Canaux de Provenance</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? 'Modifier le canal' : 'Ajouter un nouveau canal'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom du canal</label>
            <input
              type="text"
              value={newCanal.nom}
              onChange={(e) => setNewCanal({...newCanal, nom: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Couleur</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newCanal.couleur}
                onChange={(e) => setNewCanal({...newCanal, couleur: e.target.value})}
                className="w-12 h-10 border rounded"
              />
              <input
                type="text"
                value={newCanal.couleur}
                onChange={(e) => setNewCanal({...newCanal, couleur: e.target.value})}
                className="flex-1 p-2 border rounded"
                placeholder="#3B82F6"
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newCanal.actif}
                onChange={(e) => setNewCanal({...newCanal, actif: e.target.checked})}
                className="mr-2"
              />
              Actif
            </label>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={newCanal.description}
            onChange={(e) => setNewCanal({...newCanal, description: e.target.value})}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Description du canal de provenance..."
          />
        </div>
        
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {editingId ? 'Modifier' : 'Ajouter'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNewCanal({ nom: '', description: '', couleur: '#3B82F6', actif: true });
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Canal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
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
            {canaux.map((canal) => (
              <tr key={canal.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{canal.nom}</td>
                <td className="px-6 py-4">{canal.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: canal.couleur }}
                    ></div>
                    <span className="text-sm text-gray-600">{canal.couleur}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    canal.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {canal.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(canal)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(canal.id)}
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
  );
};

export default CanalProvenance;
