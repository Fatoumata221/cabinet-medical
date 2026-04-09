import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const ListePeriodes = () => {
  const [periodes, setPeriodes] = useState([]);
  const [newPeriode, setNewPeriode] = useState({ 
    nom: '', 
    description: '', 
    date_debut: '',
    date_fin: '',
    actif: true 
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchPeriodes();
  }, []);

  const fetchPeriodes = async () => {
    try {
      const { data, error } = await supabase
        .from('liste_periodes')
        .select('*')
        .order('date_debut', { ascending: false });
      
      if (error) throw error;
      setPeriodes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des périodes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('liste_periodes')
          .update(newPeriode)
          .eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('liste_periodes')
          .insert([newPeriode]);
        if (error) throw error;
      }
      
      setNewPeriode({ nom: '', description: '', date_debut: '', date_fin: '', actif: true });
      fetchPeriodes();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (periode) => {
    setEditingId(periode.id);
    setNewPeriode({
      nom: periode.nom,
      description: periode.description,
      date_debut: periode.date_debut,
      date_fin: periode.date_fin,
      actif: periode.actif
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette période ?')) {
      try {
        const { error } = await supabase
          .from('liste_periodes')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchPeriodes();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Liste des Périodes</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? 'Modifier la période' : 'Ajouter une nouvelle période'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de la période</label>
            <input
              type="text"
              value={newPeriode.nom}
              onChange={(e) => setNewPeriode({...newPeriode, nom: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Date de début</label>
            <input
              type="date"
              value={newPeriode.date_debut}
              onChange={(e) => setNewPeriode({...newPeriode, date_debut: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Date de fin</label>
            <input
              type="date"
              value={newPeriode.date_fin}
              onChange={(e) => setNewPeriode({...newPeriode, date_fin: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newPeriode.actif}
                onChange={(e) => setNewPeriode({...newPeriode, actif: e.target.checked})}
                className="mr-2"
              />
              Actif
            </label>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={newPeriode.description}
            onChange={(e) => setNewPeriode({...newPeriode, description: e.target.value})}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Description de la période..."
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
                setNewPeriode({ nom: '', description: '', date_debut: '', date_fin: '', actif: true });
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
                Période
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date de début
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date de fin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
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
            {periodes.map((periode) => (
              <tr key={periode.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{periode.nom}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(periode.date_debut)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(periode.date_fin)}</td>
                <td className="px-6 py-4">
                  <div className="max-w-xs truncate" title={periode.description}>
                    {periode.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    periode.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {periode.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(periode)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(periode.id)}
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

export default ListePeriodes;
