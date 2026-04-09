import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from 'lucide-react';

const DoctorList = ({ availableDoctors, onSelectDoctor, selectedDoctorId, doctorLoadsById, restrictToCurrentDoctor }) => {
  return (
    <div className="space-y-3 h-full overflow-y-auto pr-1">
      {availableDoctors.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">Aucun médecin actif pour cette spécialité.</div>
      )}
      {availableDoctors.map((doctor) => {
        const isSelected = String(selectedDoctorId) === String(doctor.id);
        const doctorDailyLoad = doctorLoadsById[doctor.id] || 0;
        return (
          <button
            type="button"
            key={doctor.id}
            onClick={() => onSelectDoctor(doctor)}
            className={`w-full text-left border rounded-lg p-4 transition-colors ${
              isSelected
                ? 'border-medical-primary bg-medical-primary/5 shadow-sm'
                : 'border-gray-200 hover:border-medical-primary'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Dr. {doctor.prenom} {doctor.nom}</p>
                <p className="text-xs text-gray-500">{doctor.specialite || 'Médecin généraliste'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium border border-gray-200 bg-white text-gray-600">{doctorDailyLoad} RDV</span>
                {isSelected && <CheckCircle className="w-5 h-5 text-medical-primary" />}
              </div>
            </div>
            {doctor.telephone && <p className="text-xs text-gray-400 mt-3">Tél. {doctor.telephone}</p>}
          </button>
        );
      })}
    </div>
  );
};

DoctorList.propTypes = {
  availableDoctors: PropTypes.array.isRequired,
  onSelectDoctor: PropTypes.func.isRequired,
  selectedDoctorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  doctorLoadsById: PropTypes.object.isRequired,
  restrictToCurrentDoctor: PropTypes.bool
};

export default DoctorList;
