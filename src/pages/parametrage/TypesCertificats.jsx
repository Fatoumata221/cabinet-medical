import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const TypesCertificats = () => {
  const [certificats, setCertificats] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [newCertificat, setNewCertificat] = useState({ 
    nom: '', 
    description: '', 
    duree_defaut: 0,
    specialite_id: '',
    ordre_affichage: 0,
    actif: true 
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialite, setFilterSpecialite] = useState('');

  useEffect(() => {
    fetchCertificats();
    fetchSpecialites();
  }, []);

  const fetchCertificats = async () => {
    try {
      const { data, error } = await supabase
        .from('types_certificats')
        .select(`
          *,
          specialites:specialite_id (nom)
        `)
        .order('ordre_affichage', { ascending: true });

      if (error) throw error;
      setCertificats(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des types de certificats:', error);
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
          .from('types_certificats')
          .update(newCertificat)
          .eq('id', editingId);
        
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('types_certificats')
          .insert([newCertificat]);
        
        if (error) throw error;
      }

      setNewCertificat({ 
        nom: '', 
        description: '', 
        duree_defaut: 0,
        specialite_id: '',
        ordre_affichage: 0,
        actif: true 
      });
      fetchCertificats();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleEdit = (certificat) => {
    setEditingId(certificat.id);
    setNewCertificat(certificat);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce type de certificat ?')) {
      try {
        const { error } = await supabase
          .from('types_certificats')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchCertificats();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const filteredCertificats = certificats.filter(certificat => {
    const matchesSearch = certificat.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificat.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialite = !filterSpecialite || certificat.specialite_id === filterSpecialite;
    
    return matchesSearch && matchesSpecialite;
  });

  const formatDuree = (jours) => {
    if (jours === 1) return '1 jour';
    if (jours < 7) return `${jours} jours`;
    if (jours === 7) return '1 semaine';
    if (jours < 30) return `${Math.floor(jours / 7)} semaines`;
    if (jours === 30) return '1 mois';
    if (jours < 365) return `${Math.floor(jours / 30)} mois`;
    if (jours === 365) return '1 an';
    return `${Math.floor(jours / 365)} ans`;
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Types de Certificats</h1>
        <p className="text-gray-600">Gérez les types de certificats médicaux avec leurs durées par défaut</p>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Modifier le type de certificat' : 'Ajouter un type de certificat'}
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
                value={newCertificat.nom}
                onChange={(e) => setNewCertificat({...newCertificat, nom: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nom du certificat"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée par défaut (jours)
              </label>
              <input
                type="number"
                min="0"
                value={newCertificat.duree_defaut}
                onChange={(e) => setNewCertificat({...newCertificat, duree_defaut: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spécialité
              </label>
              <select
                value={newCertificat.specialite_id}
                onChange={(e) => setNewCertificat({...newCertificat, specialite_id: e.target.value})}
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
                value={newCertificat.ordre_affichage}
                onChange={(e) => setNewCertificat({...newCertificat, ordre_affichage: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="actif"
                checked={newCertificat.actif}
                onChange={(e) => setNewCertificat({...newCertificat, actif: e.target.checked})}
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
              value={newCertificat.description}
              onChange={(e) => setNewCertificat({...newCertificat, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description du type de certificat"
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
                  setNewCertificat({ 
                    nom: '', 
                    description: '', 
                    duree_defaut: 0,
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
            Liste des Types de Certificats ({filteredCertificats.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
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
              {filteredCertificats.map((certificat) => (
                <tr key={certificat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{certificat.nom}</div>
                      {certificat.description && (
                        <div className="text-sm text-gray-500">{certificat.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{formatDuree(certificat.duree_defaut)}</span>
                      <div className="text-xs text-gray-500">({certificat.duree_defaut} jours)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {certificat.specialites?.nom || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {certificat.ordre_affichage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${certificat.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {certificat.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(certificat)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(certificat.id)}
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

export default TypesCertificats;
