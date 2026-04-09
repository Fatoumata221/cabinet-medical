import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const Professions = () => {
  const [professions, setProfessions] = useState([]);
  const [newProfession, setNewProfession] = useState({ 
    nom: '', 
    description: '', 
    code: '',
    actif: true 
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfessions();
  }, []);

  const fetchProfessions = async () => {
    try {
      const { data, error } = await supabase
        .from('professions')
        .select('*')
        .order('nom');
      
      if (error) throw error;
      setProfessions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des professions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('professions')
          .update(newProfession)
          .eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('professions')
          .insert([newProfession]);
        if (error) throw error;
      }
      
      setNewProfession({ nom: '', description: '', code: '', actif: true });
      fetchProfessions();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (profession) => {
    setEditingId(profession.id);
    setNewProfession({
      nom: profession.nom,
      description: profession.description,
      code: profession.code,
      actif: profession.actif
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette profession ?')) {
      try {
        const { error } = await supabase
          .from('professions')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchProfessions();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const filteredProfessions = professions.filter(profession =>
    profession.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profession.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Professions</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? 'Modifier la profession' : 'Ajouter une nouvelle profession'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de la profession</label>
            <input
              type="text"
              value={newProfession.nom}
              onChange={(e) => setNewProfession({...newProfession, nom: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Code</label>
            <input
              type="text"
              value={newProfession.code}
              onChange={(e) => setNewProfession({...newProfession, code: e.target.value})}
              className="w-full p-2 border rounded"
              placeholder="P001"
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newProfession.actif}
                onChange={(e) => setNewProfession({...newProfession, actif: e.target.checked})}
                className="mr-2"
              />
              Actif
            </label>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={newProfession.description}
            onChange={(e) => setNewProfession({...newProfession, description: e.target.value})}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Description de la profession..."
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
                setNewProfession({ nom: '', description: '', code: '', actif: true });
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par nom ou code..."
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
                Profession
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
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
            {filteredProfessions.map((profession) => (
              <tr key={profession.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{profession.nom}</td>
                <td className="px-6 py-4 whitespace-nowrap font-mono">{profession.code}</td>
                <td className="px-6 py-4">
                  <div className="max-w-xs truncate" title={profession.description}>
                    {profession.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    profession.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {profession.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(profession)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(profession.id)}
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

export default Professions;
