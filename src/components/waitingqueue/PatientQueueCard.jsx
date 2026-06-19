import React from 'react';
import { PhoneIcon, CalendarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const PatientQueueCard = ({ patient, doctor, isFromAppointment, isCalled, isLate, onMarkPresent, onCancel }) => {
  const getPriorityBadge = (priorite) => {
    const priorityClasses = {
      normale: 'bg-gray-100 text-gray-800',
      urgente: 'bg-orange-100 text-orange-800',
      tres_urgente: 'bg-red-100 text-red-800'
    };

    const priorityLabels = {
      normale: 'Normale',
      urgente: 'Urgente',
      tres_urgente: 'Très urgente'
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityClasses[priorite] || priorityClasses.normale}`}>
        {priorityLabels[priorite] || priorite}
      </span>
    );
  };

  let cardClass = 'border-gray-200';
  let avatarClass = 'bg-gradient-to-br from-medical-primary to-medical-secondary';

  if (isLate) {
    cardClass = 'border-red-300 bg-red-50 animate-pulse';
    avatarClass = 'bg-gradient-to-br from-red-500 to-red-600';
  } else if (isFromAppointment) {
    cardClass = 'border-green-200 bg-green-50';
    avatarClass = 'bg-gradient-to-br from-green-500 to-green-600';
  } else if (isCalled) {
    cardClass = 'border-orange-200 bg-orange-50';
    avatarClass = 'bg-gradient-to-br from-orange-500 to-orange-600';
  }

  return (
    <div className={`border rounded-lg p-3 hover:shadow-md transition-shadow ${cardClass} ${isCalled ? 'animate-pulse' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-xs ${avatarClass}`}>
            {patient.prenom[0]}{patient.nom[0]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-gray-900 text-sm truncate">
                {patient.prenom} {patient.nom}
              </p>
              {doctor && (
                <p className="text-xs text-gray-500 truncate">Dr. {doctor.prenom} {doctor.nom}</p>
              )}
              {isFromAppointment && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <CalendarIcon className="w-2.5 h-2.5" />
                  RDV
                </span>
              )}
              {isLate && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                  ⚠️ En retard
                </span>
              )}
              {isCalled && (
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <PhoneIcon className="w-2.5 h-2.5" />
                  Appelé
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{patient.motif}</p>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {getPriorityBadge(patient.priorite)}
            <span className="text-xs text-gray-500">
              {patient.tempsAttente} min
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {patient.heureArrivee}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-0.5">
            <PhoneIcon className="w-3 h-3" />
            <span className="truncate">{patient.telephone || 'N/R'}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <CalendarIcon className="w-3 h-3" />
            {patient.heureArrivee}
          </div>
        </div>
        
        <div className="flex gap-1.5">
          <button 
            onClick={() => onMarkPresent(patient.id)}
            className="flex items-center gap-1 px-2 py-1 text-white bg-green-600 hover:bg-green-700 rounded transition-colors text-xs"
            title="Marquer présent"
          >
            <CheckCircleIcon className="w-3 h-3" />
            Présent
          </button>
          <button 
            onClick={() => onCancel(patient.id)}
            className="flex items-center gap-1 px-2 py-1 text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors text-xs"
            title="Marquer absent"
          >
            <XCircleIcon className="w-3 h-3" />
            Absent
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientQueueCard;
