import React from 'react';
import { 
  Phone, 
  CheckCircle, 
  SkipForward, 
  UserCheck,
  Clock,
  AlertTriangle,
  ThumbsUp,
  Play
} from 'lucide-react';

const ActionButtons = ({ patient, onAction, isHighlighted = false, showFinish = false }) => {
  const getButtonConfig = (status, medecin_disponible) => {
    switch (status) {
      case 'arrive':
        if (medecin_disponible) {
          return {
            primary: {
              text: 'Appeler patient',
              icon: Phone,
              color: 'bg-blue-600 hover:bg-blue-700',
              action: 'call'
            }
          };
        } else {
          return {
            primary: {
              text: 'Disponible pour recevoir',
              icon: ThumbsUp,
              color: 'bg-green-600 hover:bg-green-700',
              action: 'available'
            }
          };
        }
      
      case 'appele':
        return {
          primary: {
            text: 'Commencer consultation',
            icon: Play,
            color: 'bg-purple-600 hover:bg-purple-700',
            action: 'start'
          },
          secondary: {
            text: 'Rappeler',
            icon: Phone,
            color: 'bg-orange-600 hover:bg-orange-700',
            action: 'call'
          }
        };
      
      case 'entre':
        return {
          primary: {
            text: 'Commencer consultation',
            icon: Play,
            color: 'bg-purple-600 hover:bg-purple-700',
            action: 'start'
          }
        };
      
      case 'en_consultation':
        return {
          primary: {
            text: 'Terminer consultation',
            icon: CheckCircle,
            color: 'bg-green-600 hover:bg-green-700',
            action: 'finish'
          }
        };
      
      default:
        return {};
    }
  };

  const handleAction = (action) => {
    if (onAction) {
      onAction(patient.id, action);
    }
  };

  const buttonConfig = getButtonConfig(patient.status, patient.medecin_disponible);

  // Si le patient est terminé, ne pas afficher de boutons
  if (patient.status === 'termine') {
    return (
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <span className="text-sm text-green-600 font-medium">Consultation terminée</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 w-full">
      {/* Bouton principal */}
      {buttonConfig.primary && (
        <button
          onClick={() => handleAction(buttonConfig.primary.action)}
          className={`
            flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-white font-medium
            transition-all duration-200 transform hover:scale-105
            ${buttonConfig.primary.color}
            ${isHighlighted ? 'shadow-lg' : 'shadow-md'}
          `}
        >
          <buttonConfig.primary.icon className="w-5 h-5" />
          <span>{buttonConfig.primary.text}</span>
        </button>
      )}

      {/* Bouton secondaire */}
      {buttonConfig.secondary && (
        <button
          onClick={() => handleAction(buttonConfig.secondary.action)}
          className={`
            flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white font-medium
            transition-all duration-200 transform hover:scale-105
            ${buttonConfig.secondary.color}
            ${isHighlighted ? 'shadow-md' : 'shadow-sm'}
          `}
        >
          <buttonConfig.secondary.icon className="w-4 h-4" />
          <span>{buttonConfig.secondary.text}</span>
        </button>
      )}

      {/* Bouton "Suivant" pour les patients terminés */}
      {showFinish && patient.status === 'termine' && (
        <button
          onClick={() => handleAction('next')}
          className="
            flex items-center justify-center space-x-2 px-4 py-2 rounded-lg
            bg-medical-primary hover:bg-medical-primary-dark text-white font-medium
            transition-all duration-200 transform hover:scale-105 shadow-md
          "
        >
          <SkipForward className="w-4 h-4" />
          <span>Suivant</span>
        </button>
      )}

      {/* Indicateur d'urgence */}
      {patient.priority === 'urgente' || patient.priority === 'tres_urgente' ? (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800 font-medium">
              {patient.priority === 'tres_urgente' ? 'Très urgent' : 'Urgent'}
            </span>
          </div>
        </div>
      ) : null}

      {/* Indicateur de temps d'attente critique */}
      {(() => {
        const waitTime = patient.arrived_at ? 
          Math.floor((new Date() - new Date(patient.arrived_at)) / (1000 * 60)) : 0;
        
        if (waitTime > 30) {
          return (
            <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-800 font-medium">
                  En attente depuis {waitTime} min
                </span>
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
};

export default ActionButtons;

