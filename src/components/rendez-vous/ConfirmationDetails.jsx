import React from 'react';
import PropTypes from 'prop-types';

const ConfirmationDetails = ({ formData, onChange }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de rendez-vous</label>
          <select
            value={formData.type_rdv}
            onChange={(e) => onChange({ ...formData, type_rdv: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
          >
            <option value="consultation">Consultation</option>
            <option value="suivi">Suivi</option>
            <option value="urgence">Urgence</option>
            <option value="preventif">Préventif</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
          <select
            value={formData.priorite}
            onChange={(e) => onChange({ ...formData, priorite: e.target.value })}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Motif du rendez-vous</label>
          <input
            type="text"
            value={formData.motif}
            onChange={(e) => onChange({ ...formData, motif: e.target.value })}
            placeholder="Ex: Consultation de suivi"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            value={formData.statut}
            onChange={(e) => onChange({ ...formData, statut: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
          >
            <option value="confirme">Confirmé</option>
            <option value="en_attente">En attente</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes additionnelles</label>
        <textarea
          value={formData.notes}
          onChange={(e) => onChange({ ...formData, notes: e.target.value })}
          rows={4}
          placeholder="Instructions particulières, informations utiles..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
        />
      </div>
    </>
  );
};

ConfirmationDetails.propTypes = {
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ConfirmationDetails;
