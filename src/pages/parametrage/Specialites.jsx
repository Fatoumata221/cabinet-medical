import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ParametrageLayout from '../../components/ParametrageLayout';
import ParametrageList from '../../components/ParametrageList';
import { ChevronRight, ArrowLeft, FolderOpen, Files } from 'lucide-react';

const Specialites = () => {
  const navigate = useNavigate();
  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Filters & Hierarchy
  const [filterType, setFilterType] = useState('all'); // all, parents, children
  const [selectedParentId, setSelectedParentId] = useState(null);

  useEffect(() => {
    fetchSpecialites();
  }, []);

  const fetchSpecialites = async () => {
    try {
      const { data, error } = await supabase
        .from('specialites')
        .select(`
          *,
          parent:parent_id (nom)
        `)
        .order('nom');
      
      if (error) throw error;
      setSpecialites(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (specialite) => {
    navigate(`/parametrage/specialites/form?id=${specialite.id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette spécialité ?')) {
      try {
        const { error } = await supabase
          .from('specialites')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchSpecialites();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleAddNew = () => {
    navigate('/parametrage/specialites/form');
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowForm(false);
  };

  const handleRowClick = (specialite) => {
    // If it's a parent (no parent_id), drill down
    if (!specialite.parent_id) {
        setSelectedParentId(specialite.id);
        setFilterType('children_of_selected'); 
    }
  };

  const handleBackToParents = () => {
      setSelectedParentId(null);
      setFilterType('all');
  };

  const filteredSpecialites = specialites.filter(specialite => {
    const matchesSearch = specialite.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (specialite.description && specialite.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (selectedParentId) {
        return specialite.parent_id === selectedParentId;
    }

    if (filterType === 'parents') return !specialite.parent_id;
    if (filterType === 'children') return specialite.parent_id;
    
    return true;
  });

  const selectedParentName = selectedParentId ? specialites.find(s => s.id === selectedParentId)?.nom : '';

  if (loading) return <div className="p-4">Chargement...</div>;

  return (
    <div>
      <ParametrageLayout
        title="Spécialités"
        addButtonText={editingId ? 'Modifier la spécialité' : 'Ajouter une spécialité'}
        showForm={showForm}
        onAddClick={handleAddNew}
        onCancelClick={handleCancel}
      >
        {/* Formulaire supprimé - redirection vers page dédiée */}
      </ParametrageLayout>

      {/* Liste des spécialités */}
      <ParametrageList
        title="Liste des spécialités"
        itemCount={specialites.length}
        itemName="spécialités"
        emptyMessage="Aucune spécialité enregistrée. Cliquez sur 'Ajouter une spécialité' pour commencer."
      >
        {/* Barre de recherche et filtres */}
        <div className="px-6 py-4 border-b border-gray-200 space-y-4">
          
          {/* Breadcrumb / Navigation */}
          {selectedParentId && (
            <div className="flex items-center space-x-2 mb-2 text-sm text-gray-600 animate-fade-in">
                <button onClick={handleBackToParents} className="hover:text-blue-600 flex items-center font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1"/> Retour
                </button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-900">{selectedParentName}</span>
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    {filteredSpecialites.length}
                </span>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="relative flex-1">
                <input
                    type="text"
                    placeholder="Rechercher une spécialité..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
             </div>

             {!selectedParentId && (
                 <div className="flex bg-gray-100 p-1 rounded-lg self-start md:self-auto">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Tout
                    </button>
                    <button
                        onClick={() => setFilterType('parents')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'parents' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Principales
                    </button>
                    <button
                        onClick={() => setFilterType('children')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'children' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Sous-spécialités
                    </button>
                 </div>
             )}
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              {!selectedParentId && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spécialité Parente
                  </th>
              )}
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
            {filteredSpecialites.map((specialite) => (
              <tr 
                key={specialite.id} 
                className={`transition-colors ${!specialite.parent_id && !selectedParentId ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50'}`}
                onClick={() => !specialite.parent_id && !selectedParentId && handleRowClick(specialite)}
              >
                <td className="px-6 py-4 whitespace-nowrap font-medium flex items-center">
                   {!specialite.parent_id ? (
                       <FolderOpen className="w-5 h-5 text-blue-500 mr-3" />
                   ) : (
                       <Files className="w-4 h-4 text-gray-400 mr-3 ml-1" /> 
                   )}
                   <span className={!specialite.parent_id ? 'text-blue-900 font-semibold text-sm' : 'text-gray-900 text-sm'}>
                       {specialite.nom}
                   </span>
                   {!specialite.parent_id && !selectedParentId && (
                        <ChevronRight className="w-4 h-4 text-blue-300 ml-auto opacity-0 group-hover:opacity-100" />
                   )}
                </td>
                
                {!selectedParentId && (
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {specialite.parent?.nom ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            {specialite.parent.nom}
                        </span>
                    ) : (
                        <span className="text-gray-300">-</span>
                    )}
                    </td>
                )}

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {specialite.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    specialite.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {specialite.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEdit(specialite)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(specialite.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {filteredSpecialites.length === 0 && (
                <tr>
                    <td colSpan={selectedParentId ? 5 : 5} className="px-6 py-8 text-center text-gray-500">
                        Aucune spécialité trouvée.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </ParametrageList>
    </div>
  );
};
export default Specialites;
