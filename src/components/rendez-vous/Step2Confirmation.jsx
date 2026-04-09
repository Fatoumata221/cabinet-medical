import React from 'react';
import { Calendar } from 'lucide-react';

export const Step2Confirmation = ({
  formData, setFormData,
  quickBooking,
  selectedPatientData,
  selectedDoctorData,
  hasCurrentSelectionConflict
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Patient</h4>
          {quickBooking.create_patient ? (
            <div className="text-sm text-gray-700">
              {quickBooking.patient_prenom} {quickBooking.patient_nom}
              <span className="block text-xs text-gray-500 mt-1">
                Nouveau patient à créer
              </span>
              {quickBooking.patient_telephone && (
                <span className="block text-xs text-gray-500">
                  Tél. {quickBooking.patient_telephone}
                </span>
              )}
            </div>
          ) : selectedPatientData ? (
            <div className="text-sm text-gray-700">
              {selectedPatientData.prenom} {selectedPatientData.nom}
              {selectedPatientData.telephone && (
                <span className="block text-xs text-gray-500">
                  Tél. {selectedPatientData.telephone}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-600">Aucun patient sélectionné.</p>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Médecin</h4>
          {selectedDoctorData ? (
            <div className="text-sm text-gray-700">
              Dr. {selectedDoctorData.prenom} {selectedDoctorData.nom}
              {selectedDoctorData.specialite && (
                <span className="block text-xs text-gray-500">
                  {selectedDoctorData.specialite}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-600">Aucun médecin sélectionné.</p>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Créneau retenu</h4>
        {formData.date_heure ? (
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-medical-primary" />
            <span className="text-sm font-medium text-gray-900">
              {new Date(formData.date_heure).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}{' '}
              à{' '}
              {new Date(formData.date_heure).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            <span className="text-xs text-gray-500">Durée {formData.duree} min</span>
          </div>
        ) : (
          <p className="text-sm text-red-600">Aucun créneau sélectionné.</p>
        )}
        {hasCurrentSelectionConflict && (
          <p className="text-xs text-red-600 mt-2">
            ⚠️ Ce créneau est en conflit avec un autre rendez-vous. Revenez à l’étape
            précédente pour choisir une autre heure.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de rendez-vous
          </label>
          <select
            value={formData.type_rdv}
            onChange={(e) =>
              setFormData({
                ...formData,
                type_rdv: e.target.value
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
          >
            <option value="consultation">Consultation</option>
            <option value="suivi">Suivi</option>
            <option value="urgence">Urgence</option>
            <option value="preventif">Préventif</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priorité
          </label>
          <select
            value={formData.priorite}
            onChange={(e) =>
              setFormData({
                ...formData,
                priorite: e.target.value
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
          >
            <option value="normale">Normale</option>
            <option value="urgente">Urgente</option>
            <option value="tres_urgente">Très urgente</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motif du rendez-vous
          </label>
          <input
            type="text"
            value={formData.motif}
            onChange={(e) =>
              setFormData({
                ...formData,
                motif: e.target.value
              })
            }
            placeholder="Ex: Consultation de suivi"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            value={formData.statut}
            onChange={(e) =>
              setFormData({
                ...formData,
                statut: e.target.value
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
          >
            <option value="confirme">Confirmé</option>
            <option value="en_attente">En attente</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes additionnelles
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) =>
            setFormData({
              ...formData,
              notes: e.target.value
            })
          }
          rows={4}
          placeholder="Instructions particulières, informations utiles..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
        />
      </div>
    </div>
  );
};