import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { unifiedNotificationService } from '../../services/unifiedNotificationService';
import ParametrageLayout from '../../components/ParametrageLayout';
import ParametrageList from '../../components/ParametrageList';

const Medecins = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [medecins, setMedecins] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [newMedecin, setNewMedecin] = useState({ 
    nom: '', 
    prenom: '', 
    email: '', 
    telephone: '', 
    specialite: '',
    role: 'doctor',
    actif: true 
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchMedecins();
      fetchSpecialites();
    }
  }, [authLoading]);

  const fetchMedecins = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'doctor')
        .order('nom');
      
      if (error) throw error;
      setMedecins(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des médecins:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialites = async () => {
    try {
      const { data, error } = await supabase
        .from('specialites')
        .select('*')
        .order('nom');
      
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
          .from('users')
          .update(newMedecin)
          .eq('id', editingId);
        if (error) throw error;
        unifiedNotificationService.success('Médecin modifié avec succès');
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('users')
          .insert([newMedecin]);
        if (error) throw error;
        unifiedNotificationService.success('Médecin ajouté avec succès');
      }
      
      setNewMedecin({ nom: '', prenom: '', email: '', telephone: '', specialite: '', role: 'doctor', actif: true });
      setShowForm(false);
      fetchMedecins();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      unifiedNotificationService.error('Erreur lors de la sauvegarde: ' + error.message);
    }
  };

  const handleEdit = (medecin) => {
    navigate(`/parametrage/medecins/form?id=${medecin.id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchMedecins();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleAddNew = () => {
    navigate('/parametrage/medecins/form');
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewMedecin({ nom: '', prenom: '', email: '', telephone: '', specialite: '', role: 'doctor', actif: true });
    setShowForm(false);
  };

  if (authLoading) return <div className="p-4">Chargement de l'authentification...</div>;
  if (!isAuthenticated) return <div className="p-4">Veuillez vous connecter pour accéder à cette page.</div>;
  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <div>
      <ParametrageLayout
        title="Médecins"
        addButtonText={editingId ? 'Modifier le médecin' : 'Ajouter un médecin'}
        showForm={showForm}
        onAddClick={handleAddNew}
        onCancelClick={handleCancel}
      >
      {/* Formulaire supprimé - redirection vers page dédiée */}
    </ParametrageLayout>

    {/* Liste des médecins */}
    <ParametrageList
      title="Liste des médecins"
      itemCount={medecins.length}
      itemName="médecins"
      emptyMessage="Aucun médecin enregistré. Cliquez sur 'Ajouter un médecin' pour commencer."
    >
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Médecin
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Spécialité
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Téléphone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
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
          {medecins.map((medecin) => (
            <tr key={medecin.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-medium">
                {medecin.prenom} {medecin.nom}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {medecin.specialite || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{medecin.telephone}</td>
              <td className="px-6 py-4 whitespace-nowrap">{medecin.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  medecin.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {medecin.actif ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleEdit(medecin)}
                  className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(medecin.id)}
                  className="text-red-600 hover:text-red-900 transition-colors"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ParametrageList>
  </div>
  );
};

export default Medecins;
