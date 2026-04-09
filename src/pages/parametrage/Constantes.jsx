import React, { useState, useEffect } from 'react';
import ParametrageLayout from '../../components/ParametrageLayout';
import ParametrageList from '../../components/ParametrageList';
import { supabase } from '../../lib/supabase';

const Constantes = () => {
  const LOCAL_STORAGE_KEY = 'newConstanteForm';

  const logSupabaseQuery = (operation, table, data, conditions = {}) => {
    if (import.meta.env.MODE === 'development') { // Only log in development mode
      console.log(`[Supabase Query Log] Operation: ${operation}`);
      console.log(`[Supabase Query Log] Table: ${table}`);
      if (data) console.log('[Supabase Query Log] Data:', data);
      if (Object.keys(conditions).length > 0) console.log('[Supabase Query Log] Conditions:', conditions);
      console.log('---');
    }
  };

  const [constantes, setConstantes] = useState([]);
  const [newConstante, setNewConstante] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Error parsing localStorage 'newConstanteForm':", error);
    }
    return { 
      nom: '', 
      description: '', 
      unite: '',
      valeur_min: '',
      valeur_max: '',
      valeur_normale_min: '',
      valeur_normale_max: '',
      categorie: 'generale',
      ordre_affichage: 0,
      actif: true 
    };
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const categories = [
    { value: 'generale', label: 'Générale' },
    { value: 'cardiovasculaire', label: 'Cardiovasculaire' },
    { value: 'respiratoire', label: 'Respiratoire' },
    { value: 'metabolique', label: 'Métabolique' },
    { value: 'neurologique', label: 'Neurologique' },
    { value: 'dermatologique', label: 'Dermatologique' },
    { value: 'orthopedique', label: 'Orthopédique' }
  ];

  useEffect(() => {
    fetchConstantes();
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newConstante));
  }, [newConstante]);

  const fetchConstantes = async () => {
    try {
      const { data, error } = await supabase
        .from('constantes')
        .select('*')
        .order('ordre_affichage', { ascending: true })
        .order('nom');
      
      if (error) throw error;
      setConstantes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des constantes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de validation du formulaire
  const validateForm = () => {
    const errors = {};
    setValidationErrors({});
    setSubmitError('');

    // Validation du nom (obligatoire)
    if (!newConstante.nom || newConstante.nom.trim() === '') {
      errors.nom = 'Le nom est obligatoire';
    } else {
      // Vérifier l'unicité du nom (sauf si on est en mode édition de cette constante)
      const nomExists = constantes.some(c => 
        c.nom.toLowerCase().trim() === newConstante.nom.toLowerCase().trim() && 
        c.id !== editingId
      );
      if (nomExists) {
        errors.nom = 'Ce nom de constante existe déjà';
      }
    }

    // Validation des valeurs numériques
    const valeurMin = newConstante.valeur_min ? parseFloat(newConstante.valeur_min) : null;
    const valeurMax = newConstante.valeur_max ? parseFloat(newConstante.valeur_max) : null;
    const valeurNormaleMin = newConstante.valeur_normale_min ? parseFloat(newConstante.valeur_normale_min) : null;
    const valeurNormaleMax = newConstante.valeur_normale_max ? parseFloat(newConstante.valeur_normale_max) : null;

    // Vérifier que valeur_min < valeur_max si les deux sont définies
    if (valeurMin !== null && valeurMax !== null && valeurMin >= valeurMax) {
      errors.valeur_max = 'La valeur maximale doit être supérieure à la valeur minimale';
    }

    // Vérifier que valeur_normale_min < valeur_normale_max si les deux sont définies
    if (valeurNormaleMin !== null && valeurNormaleMax !== null && valeurNormaleMin >= valeurNormaleMax) {
      errors.valeur_normale_max = 'La valeur normale maximale doit être supérieure à la valeur normale minimale';
    }

    // Vérifier que les valeurs normales sont dans la plage min/max si définies
    if (valeurMin !== null && valeurNormaleMin !== null && valeurNormaleMin < valeurMin) {
      errors.valeur_normale_min = 'La valeur normale minimale doit être supérieure ou égale à la valeur minimale';
    }
    if (valeurMax !== null && valeurNormaleMax !== null && valeurNormaleMax > valeurMax) {
      errors.valeur_normale_max = 'La valeur normale maximale doit être inférieure ou égale à la valeur maximale';
    }
    if (valeurMin !== null && valeurNormaleMax !== null && valeurNormaleMax < valeurMin) {
      errors.valeur_normale_max = 'La valeur normale maximale doit être supérieure ou égale à la valeur minimale';
    }
    if (valeurMax !== null && valeurNormaleMin !== null && valeurNormaleMin > valeurMax) {
      errors.valeur_normale_min = 'La valeur normale minimale doit être inférieure ou égale à la valeur maximale';
    }

    // Valider que si une valeur normale est définie, l'autre doit aussi l'être
    if ((valeurNormaleMin !== null && valeurNormaleMax === null) || 
        (valeurNormaleMin === null && valeurNormaleMax !== null)) {
      errors.valeur_normale = 'Si vous définissez une valeur normale, vous devez définir les deux valeurs (min et max)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Valider le formulaire avant la soumission
    if (!validateForm()) {
      setSubmitError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      setSubmitError('');
      const constanteData = {
        nom: newConstante.nom.trim(),
        description: newConstante.description?.trim() || null,
        unite: newConstante.unite?.trim() || null,
        valeur_min: newConstante.valeur_min ? parseFloat(newConstante.valeur_min) : null,
        valeur_max: newConstante.valeur_max ? parseFloat(newConstante.valeur_max) : null,
        valeur_normale_min: newConstante.valeur_normale_min ? parseFloat(newConstante.valeur_normale_min) : null,
        valeur_normale_max: newConstante.valeur_normale_max ? parseFloat(newConstante.valeur_normale_max) : null,
        categorie: newConstante.categorie || 'generale',
        ordre_affichage: parseInt(newConstante.ordre_affichage) || 0,
        actif: newConstante.actif !== undefined ? newConstante.actif : true
      };

      if (editingId) {
        logSupabaseQuery('Update', 'constantes', constanteData, { id: editingId }); // Log update query
        const { error } = await supabase
          .from('constantes')
          .update(constanteData)
          .eq('id', editingId);
        if (error) {
          if (error.code === '23505') { // Violation de contrainte unique
            setSubmitError('Ce nom de constante existe déjà');
            setValidationErrors({ nom: 'Ce nom de constante existe déjà' });
          } else {
            throw error;
          }
          return;
        }
        console.log(`Constante mise à jour: ID=${editingId}, Nom=${constanteData.nom}`); // Log update
        setEditingId(null);
      } else {
        logSupabaseQuery('Insert', 'constantes', constanteData); // Log insert query
        const { error } = await supabase
          .from('constantes')
          .insert([constanteData]);
        if (error) {
          if (error.code === '23505') { // Violation de contrainte unique
            setSubmitError('Ce nom de constante existe déjà');
            setValidationErrors({ nom: 'Ce nom de constante existe déjà' });
          } else {
            throw error;
          }
          return;
        }
        console.log(`Nouvelle constante ajoutée: Nom=${constanteData.nom}`); // Log creation
      }
            setNewConstante({ 
        nom: '', 
        description: '', 
        unite: '',
        valeur_min: '',
        valeur_max: '',
        valeur_normale_min: '',
        valeur_normale_max: '',
        categorie: 'generale',
        ordre_affichage: 0,
        actif: true 
      });
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear localStorage on successful submit
      setValidationErrors({});
      setSubmitError('');
      fetchConstantes();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSubmitError(error.message || 'Erreur lors de la sauvegarde de la constante');
    }
  };

  const handleEdit = (constante) => {
    setEditingId(constante.id);
    setNewConstante({
      nom: constante.nom,
      description: constante.description || '',
      unite: constante.unite || '',
      valeur_min: constante.valeur_min?.toString() || '',
      valeur_max: constante.valeur_max?.toString() || '',
      valeur_normale_min: constante.valeur_normale_min?.toString() || '',
      valeur_normale_max: constante.valeur_normale_max?.toString() || '',
      categorie: constante.categorie || 'generale',
      ordre_affichage: constante.ordre_affichage || 0,
      actif: constante.actif
    });
    // Don't remove from localStorage here, as editing means the form is still active
  };

  const handleAddNew = () => {
    setEditingId(null);
    setNewConstante({ 
      nom: '', 
      description: '', 
      unite: '',
      valeur_min: '',
      valeur_max: '',
      valeur_normale_min: '',
      valeur_normale_max: '',
      categorie: 'generale',
      ordre_affichage: 0,
      actif: true 
    });
    // Don't remove from localStorage here, as we might be starting a new form
    setValidationErrors({});
    setSubmitError('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewConstante({ 
      nom: '', 
      description: '', 
      unite: '',
      valeur_min: '',
      valeur_max: '',
      valeur_normale_min: '',
      valeur_normale_max: '',
      categorie: 'generale',
      ordre_affichage: 0,
      actif: true 
    });
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear localStorage on cancel
    setValidationErrors({});
    setSubmitError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette constante ?')) {
      try {
        logSupabaseQuery('Delete', 'constantes', null, { id: id }); // Log delete query
        const { error } = await supabase
          .from('constantes')
          .delete()
          .eq('id', id);
        if (error) throw error;
        console.log(`Constante supprimée: ID=${id}`); // Log deletion
        fetchConstantes();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const filteredConstantes = constantes.filter(constante => {
    const matchesSearch = constante.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         constante.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategorie = !filterCategorie || constante.categorie === filterCategorie;
    return matchesSearch && matchesCategorie;
  });

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <div>
      <ParametrageLayout
        title="Constantes"
        addButtonText={editingId ? 'Modifier constante' : 'Ajouter constante'}
        showForm={showForm}
        onAddClick={handleAddNew}
        onCancelClick={handleCancel}
      >
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {submitError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newConstante.nom}
                  onChange={(e) => {
                    setNewConstante({...newConstante, nom: e.target.value});
                    if (validationErrors.nom) {
                      setValidationErrors({...validationErrors, nom: ''});
                    }
                  }}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                    validationErrors.nom ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.nom && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.nom}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unité</label>
                <input
                  type="text"
                  value={newConstante.unite}
                  onChange={(e) => setNewConstante({...newConstante, unite: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newConstante.description}
                onChange={(e) => setNewConstante({...newConstante, description: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows="3"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Valeur minimale</label>
                <input
                  type="number"
                  step="0.01"
                  value={newConstante.valeur_min}
                  onChange={(e) => {
                    setNewConstante({...newConstante, valeur_min: e.target.value});
                    if (validationErrors.valeur_min || validationErrors.valeur_max || validationErrors.valeur_normale_min || validationErrors.valeur_normale_max) {
                      setValidationErrors({
                        ...validationErrors,
                        valeur_min: '',
                        valeur_max: '',
                        valeur_normale_min: '',
                        valeur_normale_max: ''
                      });
                    }
                  }}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                    validationErrors.valeur_min ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.valeur_min && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.valeur_min}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Valeur maximale</label>
                <input
                  type="number"
                  step="0.01"
                  value={newConstante.valeur_max}
                  onChange={(e) => {
                    setNewConstante({...newConstante, valeur_max: e.target.value});
                    if (validationErrors.valeur_max || validationErrors.valeur_min || validationErrors.valeur_normale_min || validationErrors.valeur_normale_max) {
                      setValidationErrors({
                        ...validationErrors,
                        valeur_min: '',
                        valeur_max: '',
                        valeur_normale_min: '',
                        valeur_normale_max: ''
                      });
                    }
                  }}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                    validationErrors.valeur_max ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.valeur_max && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.valeur_max}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Valeur normale minimale</label>
                <input
                  type="number"
                  step="0.01"
                  value={newConstante.valeur_normale_min}
                  onChange={(e) => {
                    setNewConstante({...newConstante, valeur_normale_min: e.target.value});
                    if (validationErrors.valeur_normale_min || validationErrors.valeur_normale_max || validationErrors.valeur_normale || validationErrors.valeur_min || validationErrors.valeur_max) {
                      setValidationErrors({
                        ...validationErrors,
                        valeur_normale_min: '',
                        valeur_normale_max: '',
                        valeur_normale: '',
                        valeur_min: '',
                        valeur_max: ''
                      });
                    }
                  }}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                    validationErrors.valeur_normale_min || validationErrors.valeur_normale ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.valeur_normale_min && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.valeur_normale_min}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Valeur normale maximale</label>
                <input
                  type="number"
                  step="0.01"
                  value={newConstante.valeur_normale_max}
                  onChange={(e) => {
                    setNewConstante({...newConstante, valeur_normale_max: e.target.value});
                    if (validationErrors.valeur_normale_max || validationErrors.valeur_normale_min || validationErrors.valeur_normale || validationErrors.valeur_min || validationErrors.valeur_max) {
                      setValidationErrors({
                        ...validationErrors,
                        valeur_normale_min: '',
                        valeur_normale_max: '',
                        valeur_normale: '',
                        valeur_min: '',
                        valeur_max: ''
                      });
                    }
                  }}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                    validationErrors.valeur_normale_max || validationErrors.valeur_normale ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.valeur_normale_max && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.valeur_normale_max}</p>
                )}
                {validationErrors.valeur_normale && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.valeur_normale}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                <select
                  value={newConstante.categorie}
                  onChange={(e) => setNewConstante({...newConstante, categorie: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ordre d'affichage</label>
                <input
                  type="number"
                  value={newConstante.ordre_affichage}
                  onChange={(e) => setNewConstante({...newConstante, ordre_affichage: parseInt(e.target.value) || 0})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <select
                  value={newConstante.actif}
                  onChange={(e) => setNewConstante({...newConstante, actif: e.target.value === 'true'})}
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
        title="Liste des constantes"
        itemCount={filteredConstantes.length}
        itemName="constantes"
        emptyMessage="Aucune constante enregistrée. Cliquez sur 'Ajouter constante' pour commencer."
      >
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher par nom ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <select
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Constante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valeurs Normales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
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
              {filteredConstantes.map((constante) => (
                <tr key={constante.id}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{constante.nom}</div>
                      {constante.description && (
                        <div className="text-sm text-gray-500">{constante.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{constante.unite || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {constante.valeur_normale_min && constante.valeur_normale_max ? 
                      `${constante.valeur_normale_min} - ${constante.valeur_normale_max}` : 
                      '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {categories.find(cat => cat.value === constante.categorie)?.label || constante.categorie}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{constante.ordre_affichage}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      constante.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {constante.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(constante)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(constante.id)}
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

export default Constantes;
