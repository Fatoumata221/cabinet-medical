import React, { useEffect, useState } from 'react';
import motifsConsultationService from '../../services/motifsConsultationService';

const TYPE_RDV_OPTIONS = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'suivi', label: 'Suivi' },
  { value: 'urgence', label: 'Urgence' },
  { value: 'preventif', label: 'Contrôle / préventif' },
];

export function resolveAppointmentMotif(motif, motifAutre = '') {
  if (motif === 'Autre') {
    return motifAutre?.trim() || 'Autre';
  }
  return motif || 'Consultation générale';
}

/**
 * Champs type de RDV + motif (liste cabinet) réutilisables dans tous les formulaires.
 */
const AppointmentTypeMotifFields = ({
  typeRdv = 'consultation',
  motif = '',
  motifAutre = '',
  priorite = 'normale',
  onChange,
  showPriorite = false,
  required = false,
  inputClassName = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-medical-primary focus:border-transparent',
}) => {
  const [motifs, setMotifs] = useState([]);

  useEffect(() => {
    let cancelled = false;
    motifsConsultationService.getMotifsForCurrentCabinet().then((data) => {
      if (cancelled) return;
      setMotifs(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = (fields) => onChange?.(fields);

  return (
    <div className="space-y-4">
      <div className={showPriorite ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de rendez-vous {required && '*'}
          </label>
          <select
            value={typeRdv}
            onChange={(e) => patch({ type_rdv: e.target.value })}
            required={required}
            className={inputClassName}
          >
            {TYPE_RDV_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {showPriorite && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
            <select
              value={priorite}
              onChange={(e) => patch({ priorite: e.target.value })}
              className={inputClassName}
            >
              <option value="normale">Normale</option>
              <option value="urgente">Urgente</option>
              <option value="tres_urgente">Très urgente</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Motif du rendez-vous {required && '*'}
        </label>
        <select
          value={motif}
          onChange={(e) => {
            const value = e.target.value;
            patch({
              motif: value,
              motif_autre: value === 'Autre' ? motifAutre : '',
            });
          }}
          required={required}
          className={inputClassName}
        >
          <option value="">Sélectionner un motif...</option>
          {motifs.map((m) => (
            <option key={m.id} value={m.label}>
              {m.label}
            </option>
          ))}
          <option value="Autre">Autre (personnalisé)</option>
        </select>

        {motif === 'Autre' && (
          <input
            type="text"
            value={motifAutre}
            onChange={(e) => patch({ motif_autre: e.target.value })}
            placeholder="Précisez le motif..."
            required={required}
            className={`${inputClassName} mt-2`}
          />
        )}
      </div>
    </div>
  );
};

export default AppointmentTypeMotifFields;
