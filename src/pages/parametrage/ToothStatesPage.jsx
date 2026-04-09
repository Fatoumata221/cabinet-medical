import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, RotateCcw } from 'lucide-react';
import { useToothStates } from '../../hooks/useToothStates';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

const ToothStatesPage = () => {
  const { states, loading, error, createState, updateState, deleteState, refresh } = useToothStates();
  const { dialogState, showConfirm, closeDialog } = useConfirmDialog();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingState, setEditingState] = useState(null);
  
  const initialFormState = {
    code: '',
    name: '',
    color: '#ffffff',
    border_color: '#000000',
    is_system: false,
    order_index: 0
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleEdit = (state) => {
    setEditingState(state);
    setFormData({ ...state });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setEditingState(null);
    setFormData(initialFormState);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    showConfirm({
      title: 'Supprimer cet état ?',
      message: 'Êtes-vous sûr de vouloir supprimer cet état dentaire ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger',
      onConfirm: async () => {
        await deleteState(id);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingState) {
      await updateState(editingState.id, formData);
    } else {
      await createState(formData);
    }
    setIsEditing(false);
    setFormData(initialFormState);
    setEditingState(null);
  };

  if (loading && !states.length) return <div className="p-6">Chargement...</div>;
  if (error) return <div className="p-6 text-red-500">Erreur: {error.message}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">États Dentaires</h1>
          <p className="text-gray-600">Gérez les états possibles pour le schéma dentaire</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvel État
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aperçu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Couleurs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {states.map((state) => (
              <tr key={state.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div 
                    className="w-8 h-8 rounded-full border-2"
                    style={{ backgroundColor: state.color, borderColor: state.border_color }}
                  ></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{state.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{state.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100">Fond: {state.color}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100">Bord: {state.border_color}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {state.is_system ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Système
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Personnalisé
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(state)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!state.is_system && (
                    <button
                      onClick={() => handleDelete(state.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Edition/Creation */}
      {isEditing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingState ? 'Modifier l\'état' : 'Nouvel état dentaire'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Code (Unique) *</label>
                <input
                  type="text"
                  required
                  disabled={editingState} // Code modification disabled for simplicity/integrity
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '')})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  placeholder="EX: IMPLANT_GOLD"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Couleur de fond</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="h-9 w-16 p-0 border border-gray-300 rounded md"
                    />
                    <span className="text-xs text-gray-500">{formData.color}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Couleur de bordure</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.border_color || '#000000'}
                      onChange={(e) => setFormData({...formData, border_color: e.target.value})}
                      className="h-9 w-16 p-0 border border-gray-300 rounded md"
                    />
                    <span className="text-xs text-gray-500">{formData.border_color}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Ordre d'affichage</label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center border border-gray-200">
                <div className="text-center">
                   <p className="text-sm text-gray-500 mb-2">Aperçu</p>
                   <div 
                      className="w-16 h-16 rounded-full border-4 mx-auto"
                      style={{ backgroundColor: formData.color, borderColor: formData.border_color }}
                   ></div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
      />
    </div>
  );
};

export default ToothStatesPage;
