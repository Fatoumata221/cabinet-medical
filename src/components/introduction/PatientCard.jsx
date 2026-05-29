import React from 'react';
import { User, Eye, Edit, Calendar } from 'lucide-react';

const PatientCard = ({ patient, selectedPatient, onSelect, onView, onEdit, onAppointment }) => {
  const isSelected = selectedPatient?.id === patient.id;

  return (
    <div className={`p-3 border border-gray-200 rounded-lg transition-colors ${
      isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
    }`}>
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 flex-1 cursor-pointer"
          onClick={() => onSelect(patient)}
        >
          <div className="h-10 w-10 rounded-full bg-medical-primary flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{patient.prenom} {patient.nom}</p>
            <p className="text-xs text-gray-500 truncate">
              {patient.date_naissance && new Date(patient.date_naissance).toLocaleDateString('fr-FR')} • 
              {patient.telephone || 'Pas de téléphone'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onView(patient); }}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(patient); }}
            className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAppointment(patient); }}
            className="p-1.5 text-purple-600 hover:bg-purple-100 rounded transition-colors"
            title="Prendre rendez-vous"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex space-x-2">
          <button
            onClick={() => onView(patient)}
            className="flex-1 flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            Voir détails
          </button>
          <button
            onClick={() => onEdit(patient)}
            className="flex-1 flex items-center justify-center px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
          >
            <Edit className="w-3 h-3 mr-1" />
            Modifier
          </button>
          <button
            onClick={() => onAppointment(patient)}
            className="flex-1 flex items-center justify-center px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-xs"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Prendre RDV
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientCard;
