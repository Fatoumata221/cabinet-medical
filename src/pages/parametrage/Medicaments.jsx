import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const Medicaments = () => {
  const [medicaments, setMedicaments] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [newMedicament, setNewMedicament] = useState({ 
    nom: '', 
    description: '', 
    forme_pharmaceutique: '',
    dosage: '',
    posologie_defaut: '',
    contre_indications: '',
    interactions: '',
    specialite_id: '',
    ordre_affichage: 0,
    actif: true 
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterForme, setFilterForme] = useState('');
  const [filterSpecialite, setFilterSpecialite] = useState('');

  const formesPharmaceutiques = [
    'Comprimé', 'Gélule', 'Sirop', 'Ampoule', 'Flacon', 'Pommade', 'Crème', 'Gel', 'Suppositoire', 'Collyre', 'Spray', 'Patch'
  ];

  useEffect(() => {
    fetchMedicaments();
    fetchSpecialites();
  }, []);

  const fetchMedicaments = async () => {
    try {
      const { data, error } = await supabase
        .from('medicaments')
        .select(`
          *,
          specialites:specialite_id (nom)
        `)
        .order('ordre_affichage', { ascending: true });

      if (error) throw error;
      setMedicaments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des médicaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialites = async () => {
    try {
      const { data, error } = await supabase
        .from('specialites')
        .select('id, nom')
        .order('nom', { ascending: true });

      if (error) throw error;
      setSpecialites(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('medicaments')
          .update(newMedicament)
          .eq('id', editingId);
        
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('medicaments')
          .insert([newMedicament]);
        
        if (error) throw error;
      }

      setNewMedicament({ 
        nom: '', 
        description: '', 
        forme_pharmaceutique: '',
        dosage: '',
        posologie_defaut: '',
        contre_indications: '',
        interactions: '',
        specialite_id: '',
        ordre_affichage: 0,
        actif: true 
      });
      fetchMedicaments();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (medicament) => {
    setEditingId(medicament.id);
    setNewMedicament(medicament);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce médicament ?')) {
      try {
        const { error } = await supabase
          .from('medicaments')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchMedicaments();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const filteredMedicaments = medicaments.filter(medicament => {
    const matchesSearch = medicament.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicament.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicament.dosage?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesForme = !filterForme || medicament.forme_pharmaceutique === filterForme;
    const matchesSpecialite = !filterSpecialite || medicament.specialite_id === filterSpecialite;
    
    return matchesSearch && matchesForme && matchesSpecialite;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Médicaments</h1>
        <p className="text-gray-600">Gérez les médicaments pouvant être prescrits aux patients</p>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Modifier le médicament' : 'Ajouter un médicament'}
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
                value={newMedicament.nom}
                onChange={(e) => setNewMedicament({...newMedicament, nom: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom du médicament"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forme pharmaceutique
              </label>
              <select
                value={newMedicament.forme_pharmaceutique}
                onChange={(e) => setNewMedicament({...newMedicament, forme_pharmaceutique: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une forme</option>
                {formesPharmaceutiques.map(forme => (
                  <option key={forme} value={forme}>{forme}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosage
              </label>
              <input
                type="text"
                value={newMedicament.dosage}
                onChange={(e) => setNewMedicament({...newMedicament, dosage: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ex: 500mg, 20mg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spécialité
              </label>
              <select
                value={newMedicament.specialite_id}
                onChange={(e) => setNewMedicament({...newMedicament, specialite_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les spécialités</option>
                {specialites.map(specialite => (
                  <option key={specialite.id} value={specialite.id}>{specialite.nom}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordre d'affichage
              </label>
              <input
                type="number"
                value={newMedicament.ordre_affichage}
                onChange={(e) => setNewMedicament({...newMedicament, ordre_affichage: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="actif"
                checked={newMedicament.actif}
                onChange={(e) => setNewMedicament({...newMedicament, actif: e.target.checked})}
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
              value={newMedicament.description}
              onChange={(e) => setNewMedicament({...newMedicament, description: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description du médicament"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Posologie par défaut
            </label>
            <textarea
              value={newMedicament.posologie_defaut}
              onChange={(e) => setNewMedicament({...newMedicament, posologie_defaut: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: 1 comprimé 3 fois par jour"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contre-indications
              </label>
              <textarea
                value={newMedicament.contre_indications}
                onChange={(e) => setNewMedicament({...newMedicament, contre_indications: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contre-indications principales"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interactions
              </label>
              <textarea
                value={newMedicament.interactions}
                onChange={(e) => setNewMedicament({...newMedicament, interactions: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Interactions médicamenteuses principales"
              />
            </div>
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
                  setNewMedicament({ 
                    nom: '', 
                    description: '', 
                    forme_pharmaceutique: '',
                    dosage: '',
                    posologie_defaut: '',
                    contre_indications: '',
                    interactions: '',
                    specialite_id: '',
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rechercher par nom, description ou dosage..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forme pharmaceutique</label>
            <select
              value={filterForme}
              onChange={(e) => setFilterForme(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les formes</option>
              {formesPharmaceutiques.map(forme => (
                <option key={forme} value={forme}>{forme}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
            <select
              value={filterSpecialite}
              onChange={(e) => setFilterSpecialite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les spécialités</option>
              {specialites.map(specialite => (
                <option key={specialite.id} value={specialite.id}>{specialite.nom}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            Liste des Médicaments ({filteredMedicaments.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Médicament
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forme/Dosage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posologie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spécialité
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
              {filteredMedicaments.map((medicament) => (
                <tr key={medicament.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{medicament.nom}</div>
                      {medicament.description && (
                        <div className="text-sm text-gray-500">{medicament.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {medicament.forme_pharmaceutique && <div>{medicament.forme_pharmaceutique}</div>}
                      {medicament.dosage && <div className="text-gray-500">{medicament.dosage}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {medicament.posologie_defaut || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {medicament.specialites?.nom || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {medicament.ordre_affichage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${medicament.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {medicament.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(medicament)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(medicament.id)}
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

export default Medicaments;
