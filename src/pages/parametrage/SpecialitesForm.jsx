import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { unifiedNotificationService } from '../../services/unifiedNotificationService';
import { ArrowLeft, Save } from 'lucide-react';

const SpecialitesForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const specialiteId = searchParams.get('id');
  const isEditMode = !!specialiteId;

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    parent_id: null,
    actif: true
  });
  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllSpecialites();
    if (specialiteId) {
      loadSpecialite();
    }
  }, [specialiteId]);

  const loadAllSpecialites = async () => {
    try {
      const { data, error } = await supabase
        .from('specialites')
        .select('id, nom')
        .order('nom');
      
      if (error) throw error;
      setSpecialites(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
    }
  };

  const loadSpecialite = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('specialites')
        .select('*')
        .eq('id', specialiteId)
        .single();

      if (error) throw error;
      if (data) setFormData(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      unifiedNotificationService.error('Erreur lors du chargement de la spécialité');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        parent_id: formData.parent_id === '' ? null : formData.parent_id
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('specialites')
          .update(dataToSave)
          .eq('id', specialiteId);

        if (error) throw error;
        unifiedNotificationService.success('Spécialité modifiée avec succès');
      } else {
        const { error } = await supabase
          .from('specialites')
          .insert([dataToSave]);

        if (error) throw error;
        unifiedNotificationService.success('Spécialité ajoutée avec succès');
      }

      navigate('/parametrage/specialites');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      unifiedNotificationService.error('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/parametrage/specialites');
  };

  if (loading && isEditMode) {
    return <div className="p-4">Chargement...</div>;
  }

  // Filter out the current specialty from the parent dropdown to avoid cycles
  const availableParents = specialites.filter(s => s.id !== parseInt(specialiteId));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à la liste
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Modifier la spécialité' : 'Nouvelle spécialité'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom *</label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData({...formData, nom: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Spécialité Parente</label>
            <select
              value={formData.parent_id || ''}
              onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Aucune (Spécialité principale)</option>
              {availableParents.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.actif}
                onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                className="mr-2 rounded"
              />
              <span className="text-sm font-medium">Actif</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Enregistrement...' : (isEditMode ? 'Modifier' : 'Enregistrer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SpecialitesForm;
