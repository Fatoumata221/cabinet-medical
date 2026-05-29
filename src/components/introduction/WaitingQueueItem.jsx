import React from 'react';
import { Clock, CheckCircle, UserCheck, Activity, Phone, CheckSquare } from 'lucide-react';

const WaitingQueueItem = ({ item, index, onAuthorize, isLoading }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'waiting':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' };
      case 'present':
        return { color: 'bg-blue-100 text-blue-800', label: 'Présent' };
      case 'called':
        return { color: 'bg-orange-100 text-orange-800', label: 'Appelé' };
      case 'medecin_pret':
        return { color: 'bg-cyan-100 text-cyan-800', label: 'Médecin prêt' };
      case 'en_route':
        return { color: 'bg-purple-100 text-purple-800', label: 'En route' };
      case 'in_consultation':
        return { color: 'bg-purple-100 text-purple-800', label: 'En consultation' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status };
    }
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case 'arrive':
        return { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'En attente du médecin' };
      case 'medecin_pret':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Médecin prêt' };
      case 'en_route':
        return { color: 'bg-blue-100 text-blue-800', icon: UserCheck, label: 'Patient en route' };
      case 'in_consultation':
        return { color: 'bg-purple-100 text-purple-800', icon: Activity, label: 'En consultation' };
      case 'appele':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Phone, label: 'Patient appelé' };
      case 'authorized':
        return { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle, label: 'Médecin va recevoir' };
      default:
        return { color: 'bg-gray-100 text-gray-600', icon: Clock, label: status };
    }
  };

  const statusConfig = getStatusConfig(item.status);
  const statusIndicator = getStatusIndicator(item.status);
  const StatusIcon = statusIndicator.icon;
  const isDisabled = ['en_route', 'in_consultation'].includes(item.status);
  const isReady = ['medecin_pret', 'authorized'].includes(item.status);

  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-medical-primary text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <p className="font-medium text-gray-900 text-sm truncate">
                {item.patient?.prenom} {item.patient?.nom}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">
              Dr. {item.medecin?.prenom} {item.medecin?.nom}
            </p>
          </div>
        </div>
        {item.created_at && (
          <p className="text-xs text-gray-400 flex-shrink-0">
            {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className={`px-2 py-1 rounded text-xs flex items-center gap-1.5 ${statusIndicator.color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusIndicator.label}
        </div>
        
        <button
          onClick={() => onAuthorize(item.id)}
          disabled={isLoading.actions || isDisabled}
          className={`px-3 py-1.5 rounded text-white text-xs transition-colors flex items-center gap-1.5 ${
            isReady
              ? 'bg-green-600 hover:bg-green-700' 
              : isDisabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600'
          } ${isLoading.actions ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={
            item.status === 'medecin_pret' 
              ? "Introduire patient" 
              : item.status === 'authorized'
              ? "Médecin va recevoir - Autoriser maintenant"
              : item.status === 'en_route'
              ? "Patient déjà en route"
              : item.status === 'in_consultation'
              ? "Patient déjà en consultation"
              : "Le médecin doit d'abord se rendre disponible"
          }
        >
          <CheckSquare className="w-3 h-3" />
          {item.status === 'en_route' ? 'En route' : 
           item.status === 'in_consultation' ? 'En consultation' :
           'Introduire'}
        </button>
      </div>
    </div>
  );
};

export default WaitingQueueItem;
