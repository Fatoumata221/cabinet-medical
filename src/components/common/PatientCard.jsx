import React from 'react';
import { Phone, Calendar, User, Clock, AlertTriangle } from 'lucide-react';

const PatientCard = ({ 
  patient, 
  status, 
  priority, 
  arrivalTime, 
  waitingTime, 
  doctor,
  onAction,
  isHighlighted = false,
  className = ''
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'appele': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'entre': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_consultation': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'termine': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'normale': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'urgente': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'tres_urgente': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'appele': return 'Appelé';
      case 'entre': return 'Entré';
      case 'en_consultation': return 'En consultation';
      case 'termine': return 'Terminé';
      case 'absent': return 'Absent';
      case 'present': return 'Présent';
      default: return status;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'normale': return 'Normale';
      case 'urgente': return 'Urgente';
      case 'tres_urgente': return 'Très urgente';
      default: return priority;
    }
  };

  const getWaitingTimeColor = (minutes) => {
    if (minutes < 15) return 'text-green-600';
    if (minutes < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWaitingTimeIcon = (minutes) => {
    if (minutes < 15) return null;
    if (minutes < 30) return <Clock className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div className={`
      bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 
      hover:shadow-lg transition-all duration-200
      ${isHighlighted ? 'ring-2 ring-medical-primary ring-opacity-50 shadow-xl' : ''}
      ${className}
    `}>
      <div className="flex items-start justify-between">
        {/* Informations du patient */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-medical-primary to-medical-secondary rounded-xl flex items-center justify-center text-white font-bold text-lg">
            {patient?.prenom?.[0]}{patient?.nom?.[0]}
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {patient?.prenom} {patient?.nom}
            </h3>
            
            {patient?.numero_dossier && (
              <p className="text-gray-600 text-sm mb-2">
                Dossier: {patient.numero_dossier}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {patient?.telephone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {patient.telephone}
                </div>
              )}
              
              {arrivalTime && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(arrivalTime).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Statut et actions */}
        <div className="text-right flex flex-col items-end gap-3">
          {/* Badges de statut et priorité */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
              {getStatusLabel(status)}
            </span>
            
            {priority && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(priority)}`}>
                {getPriorityLabel(priority)}
              </span>
            )}
          </div>
          
          {/* Temps d'attente */}
          {waitingTime !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${getWaitingTimeColor(waitingTime)}`}>
              {getWaitingTimeIcon(waitingTime)}
              <span>{waitingTime} min</span>
            </div>
          )}
          
          {/* Médecin assigné */}
          {doctor && (
            <div className="text-sm text-gray-600 text-right">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {doctor.prenom} {doctor.nom}
              </div>
              {doctor.specialite && (
                <div className="text-xs text-gray-500">{doctor.specialite}</div>
              )}
            </div>
          )}
          
          {/* Actions */}
          {onAction && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onAction(patient?.id || patient?.id, 'call')}
                className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                title="Appeler le patient"
              >
                <Phone className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onAction(patient?.id || patient?.id, 'receive')}
                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                title="Patient entré"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientCard;

