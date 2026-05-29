import React from 'react';
import { CheckCircle, Phone, Calendar, User } from 'lucide-react';

const AppointmentCard = ({ appointment, selectedDoctor, isPresent }) => {
  return (
    <div className={`rounded-lg p-3 border transition-colors ${
      isPresent 
        ? 'bg-green-50 border-green-200 hover:bg-green-100' 
        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
          isPresent ? 'bg-green-500' : 'bg-medical-primary'
        }`}>
          {appointment.patient_prenom[0]}{appointment.patient_nom[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {appointment.patient_prenom} {appointment.patient_nom}
            </h3>
            {isPresent && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0">
                <CheckCircle className="w-2.5 h-2.5" />
                Présent
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 truncate">Tél: {appointment.patient?.telephone || 'N/R'}</p>
        </div>
      </div>
    
      <div className="space-y-1">
        <p className="text-xs text-gray-500 truncate">{appointment.motif}</p>
        
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-0.5">
            <Phone className="w-2.5 h-2.5" />
            <span className="truncate">{appointment.patient?.telephone || 'N/R'}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Calendar className="w-2.5 h-2.5" />
            {new Date(appointment.date_heure).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Programmé
          </span>
        </div>
        
        <div className="text-xs text-gray-600">
          <div className="flex items-center gap-0.5">
            <User className="w-2.5 h-2.5" />
            {selectedDoctor.prenom} {selectedDoctor.nom}
          </div>
          <div className="text-gray-500">{selectedDoctor.specialite}</div>
        </div>
        
        <div className="pt-1.5 border-t border-gray-200">
          {isPresent ? (
            <div className="w-full bg-green-100 text-green-800 text-xs font-medium py-1.5 px-2 rounded flex items-center justify-center gap-1">
              <CheckCircle className="w-2.5 h-2.5" />
              Déjà présent
            </div>
          ) : (
            <div className="w-full bg-blue-50 text-blue-800 text-xs font-medium py-1.5 px-2 rounded flex items-center justify-center gap-1">
              Ajout automatique activé
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
