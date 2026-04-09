import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const PosologieProduits = () => {
  const [posologies, setPosologies] = useState([]);
  const [produits, setProduits] = useState([]);
  const [newPosologie, setNewPosologie] = useState({ 
    produit_id: '',
    posologie: '', 
    dosage: '',
    frequence: '',
    duree: '',
    instructions: '',
    actif: true 
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchPosologies();
    fetchProduits();
  }, []);

  const fetchPosologies = async () => {
    try {
      const { data, error } = await supabase
        .from('posologie_produits')
        .select(`
          *,
          produits:produit_id(nom, code_atc)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPosologies(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des posologies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProduits = async () => {
    try {
      const { data, error } = await supabase
        .from('liste_produits')
        .select('id, nom, code_atc')
        .eq('actif', true)
        .order('nom');
      
      if (error) throw error;
      setProduits(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('posologie_produits')
          .update(newPosologie)
          .eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('posologie_produits')
          .insert([newPosologie]);
        if (error) throw error;
      }
      
      setNewPosologie({ 
        produit_id: '', 
        posologie: '', 
        dosage: '',
        frequence: '',
        duree: '',
        instructions: '',
        actif: true 
      });
      fetchPosologies();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (posologie) => {
    setEditingId(posologie.id);
    setNewPosologie({
      produit_id: posologie.produit_id,
      posologie: posologie.posologie,
      dosage: posologie.dosage,
      frequence: posologie.frequence,
      duree: posologie.duree,
      instructions: posologie.instructions,
      actif: posologie.actif
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette posologie ?')) {
      try {
        const { error } = await supabase
          .from('posologie_produits')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchPosologies();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Posologie des Produits</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? 'Modifier la posologie' : 'Ajouter une nouvelle posologie'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Produit</label>
            <select
              value={newPosologie.produit_id}
              onChange={(e) => setNewPosologie({...newPosologie, produit_id: e.target.value})}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Sélectionner un produit</option>
              {produits.map((produit) => (
                <option key={produit.id} value={produit.id}>
                  {produit.nom} ({produit.code_atc})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Posologie</label>
            <input
              type="text"
              value={newPosologie.posologie}
              onChange={(e) => setNewPosologie({...newPosologie, posologie: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="ex: 1 comprimé"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Dosage</label>
            <input
              type="text"
              value={newPosologie.dosage}
              onChange={(e) => setNewPosologie({...newPosologie, dosage: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="ex: 500mg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Fréquence</label>
            <input
              type="text"
              value={newPosologie.frequence}
              onChange={(e) => setNewPosologie({...newPosologie, frequence: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="ex: 2 fois par jour"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Durée</label>
            <input
              type="text"
              value={newPosologie.duree}
              onChange={(e) => setNewPosologie({...newPosologie, duree: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="ex: 7 jours"
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newPosologie.actif}
                onChange={(e) => setNewPosologie({...newPosologie, actif: e.target.checked})}
                className="mr-2"
              />
              Actif
            </label>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Instructions spéciales</label>
          <textarea
            value={newPosologie.instructions}
            onChange={(e) => setNewPosologie({...newPosologie, instructions: e.target.value})}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Instructions particulières (à jeun, avec repas, etc.)..."
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
                setNewPosologie({ 
                  produit_id: '', 
                  posologie: '', 
                  dosage: '',
                  frequence: '',
                  duree: '',
                  instructions: '',
                  actif: true 
                });
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
                Produit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posologie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dosage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fréquence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durée
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
            {posologies.map((posologie) => (
              <tr key={posologie.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium">{posologie.produits?.nom}</div>
                    <div className="text-sm text-gray-500">{posologie.produits?.code_atc}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{posologie.posologie}</td>
                <td className="px-6 py-4 whitespace-nowrap">{posologie.dosage}</td>
                <td className="px-6 py-4 whitespace-nowrap">{posologie.frequence}</td>
                <td className="px-6 py-4 whitespace-nowrap">{posologie.duree}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    posologie.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {posologie.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(posologie)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(posologie.id)}
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

export default PosologieProduits;
