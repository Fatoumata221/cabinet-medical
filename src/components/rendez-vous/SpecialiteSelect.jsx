import React from 'react';
import PropTypes from 'prop-types';

const SpecialiteSelect = ({ value, onChange, options }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité *</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent"
      >
        <option value="">Sélectionner une spécialité</option>
        {options.map((specialite) => (
          <option key={specialite} value={specialite}>{specialite}</option>
        ))}
      </select>
    </div>
  );
};

SpecialiteSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.array.isRequired
};

export default SpecialiteSelect;
