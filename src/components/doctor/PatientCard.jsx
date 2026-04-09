import React from 'react';
import { 
  User, 
  Clock, 
  Phone, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Activity
} from 'lucide-react';
import ActionButtons from './ActionButtons';

const PatientCard = ({ patient, isHighlighted = false, onAction }) => {
  const calculateWaitTime = (heureArrivee) => {
    if (!heureArrivee) return 0;
    const arrivalTime = new Date(heureArrivee);
    const now = new Date();
    const diffMs = now - arrivalTime;
    return Math.floor(diffMs / (1000 * 60));
  };

  const getUrgencyColor = (priority) => {
    switch (priority) {
      case 'urgente': return 'text-red-600 bg-red-100 border-red-200';
      case 'tres_urgente': return 'text-red-800 bg-red-200 border-red-300';
      case 'normale': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_consultation': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'entre': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'appele': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'en_attente': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'termine': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'en_consultation': return 'En consultation';
      case 'entre': return 'Entré';
      case 'appele': return 'Appelé';
      case 'en_attente': return 'En attente';
      case 'termine': return 'Terminé';
      default: return status;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const waitTime = calculateWaitTime(patient.arrived_at);

  return (
    <div className={`
      border-2 rounded-xl p-6 transition-all duration-300 hover-lift
      ${isHighlighted 
        ? 'border-medical-primary bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-105 glow' 
        : 'border-gray-200 bg-white hover:shadow-md'
      }
      ${patient.status === 'appele' ? 'patient-called' : ''}
      ${patient.status === 'entre' || patient.status === 'en_consultation' ? 'consultation-active' : ''}
      ${patient.priority === 'urgente' || patient.priority === 'tres_urgente' ? 'urgent-pulse' : ''}
    `}>
      {/* En-tête avec avatar et informations principales */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg
            ${isHighlighted 
              ? 'bg-gradient-to-br from-medical-primary to-medical-secondary shadow-lg' 
              : 'bg-gradient-to-br from-gray-400 to-gray-600'
            }
          `}>
            {patient.patient?.prenom?.[0]}{patient.patient?.nom?.[0]}
          </div>
          <div>
            <h3 className={`
              font-bold text-lg
              ${isHighlighted ? 'text-gray-900' : 'text-gray-800'}
            `}>
              {patient.patient?.prenom} {patient.patient?.nom}
            </h3>
            <p className="text-sm text-gray-500">
              Dossier: {patient.patient?.numero_dossier}
            </p>
            {patient.appointment?.motif && (
              <p className="text-sm text-gray-600 mt-1">
                Motif: {patient.appointment.motif}
              </p>
            )}
          </div>
        </div>
        
        {/* Badges de statut et priorité */}
        <div className="flex flex-col items-end space-y-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(patient.status)}`}>
            {getStatusLabel(patient.status)}
          </span>
          {patient.priority && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getUrgencyColor(patient.priority)}`}>
              {patient.priority === 'urgente' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {patient.priority === 'tres_urgente' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {patient.priority === 'normale' && <CheckCircle className="w-3 h-3 mr-1" />}
              {patient.priority}
            </span>
          )}
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{patient.patient?.telephone || 'Non renseigné'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Arrivé à {formatTime(patient.arrived_at)}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Activity className="w-4 h-4" />
            <span>Temps d'attente: {waitTime} min</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {patient.appointment?.duree && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Durée prévue: {patient.appointment.duree} min</span>
            </div>
          )}
          {patient.notes && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Notes:</span> {patient.notes}
            </div>
          )}
        </div>
      </div>

      {/* Indicateur visuel pour le patient en évidence */}
      {isHighlighted && (
        <div className="mb-4 p-3 bg-medical-primary bg-opacity-10 border border-medical-primary border-opacity-30 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-medical-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-medical-primary">
              Patient suivant à traiter
            </span>
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-center">
        <ActionButtons 
          patient={patient} 
          onAction={onAction}
          isHighlighted={isHighlighted}
        />
      </div>

      {/* Indicateur de temps d'attente critique */}
      {waitTime > 30 && (
        <div className="mt-4 p-2 bg-orange-100 border border-orange-300 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-800">
              Patient en attente depuis {waitTime} minutes
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientCard;
