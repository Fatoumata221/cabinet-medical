import React from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Clock as ClockIcon, User } from 'lucide-react';
import AppointmentTypeMotifFields from '../common/AppointmentTypeMotifFields';

const AppointmentModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  handleDelete,
  submitting,
  predefinedColors,
  patientSearchTerm,
  setPatientSearchTerm,
  handlePatientSearchFocus,
  showPatientDropdown,
  filteredPatients,
  handlePatientSelect,
  medecinSearchTerm,
  setMedecinSearchTerm,
  handleMedecinSearchFocus,
  showMedecinDropdown,
  filteredMedecins,
  handleMedecinSelect,
  selectedTimeSlot
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{formData.id ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</h2>
            <p className="text-sm text-gray-600 mt-1">Remplissez les informations pour planifier la consultation.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={20} className="text-gray-600" /></button>
        </div>

        {selectedTimeSlot && (
          <div className="mx-8 mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              <ClockIcon className="inline mr-2" size={16} />
              Horaire: {selectedTimeSlot.start.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </p>
            {selectedTimeSlot.resource && <p className="text-sm text-blue-700 mt-2"><User className="inline mr-2" size={16} />Médecin : {selectedTimeSlot.resource.title}</p>}
          </div>
        )}

        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="patient-search-container relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
                <input type="text" value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} onFocus={handlePatientSearchFocus} placeholder="Rechercher patient..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl" required />
                {showPatientDropdown && (
                  <div className="absolute top-full w-full bg-white border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                    {filteredPatients.length > 0 ? filteredPatients.map(p => <div key={p.id} onClick={() => handlePatientSelect(p)} className="p-3 hover:bg-gray-50 cursor-pointer">{p.prenom} {p.nom}</div>) : <div className="p-3 text-gray-500">Aucun patient</div>}
                  </div>
                )}
              </div>
              <div className="medecin-search-container relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Médecin *</label>
                <input type="text" value={medecinSearchTerm} onChange={(e) => setMedecinSearchTerm(e.target.value)} onFocus={handleMedecinSearchFocus} placeholder="Rechercher médecin..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl" required />
                {showMedecinDropdown && (
                  <div className="absolute top-full w-full bg-white border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                    {filteredMedecins.length > 0 ? filteredMedecins.map(m => <div key={m.id} onClick={() => handleMedecinSelect(m)} className="p-3 hover:bg-gray-50 cursor-pointer">Dr. {m.prenom} {m.nom}</div>) : <div className="p-3 text-gray-500">Aucun médecin</div>}
                  </div>
                )}
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Date et heure *</label><input type="datetime-local" value={formData.date_heure ? formData.date_heure.slice(0, 16) : ''} onChange={(e) => setFormData({...formData, date_heure: e.target.value})} min={new Date().toISOString().slice(0, 16)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl" required /></div>
            <AppointmentTypeMotifFields
              typeRdv={formData.type_rdv || 'consultation'}
              motif={formData.motif || ''}
              motifAutre={formData.motif_autre || ''}
              priorite={formData.priorite || 'normale'}
              showPriorite
              onChange={(fields) => setFormData({ ...formData, ...fields })}
              inputClassName="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Durée (min)</label><select value={formData.duree} onChange={(e) => setFormData({...formData, duree: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl"><option value="15">15</option><option value="30">30</option><option value="45">45</option><option value="60">60</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label><select value={formData.priorite} onChange={(e) => setFormData({...formData, priorite: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl"><option value="normale">Normale</option><option value="urgente">Urgente</option><option value="tres_urgente">Très urgente</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Statut</label><select value={formData.statut} onChange={(e) => setFormData({...formData, statut: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl"><option value="confirme">Confirmé</option><option value="en_attente">En attente</option><option value="annule">Annulé</option><option value="termine">Terminé</option></select></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
              <div className="flex gap-2">{predefinedColors.map(c => <button type="button" key={c.value} onClick={() => setFormData({...formData, couleur: c.value})} className={`w-10 h-10 rounded-2xl border-2 transition-all ${formData.couleur === c.value ? 'border-blue-500 scale-110' : 'border-transparent'}`} style={{backgroundColor: c.value}}/>)}</div>
            </div>
          </form>
        </div>
        <div className="px-8 py-6 border-t border-gray-100 flex justify-end items-center gap-4">
            {formData.id && <button type="button" onClick={() => handleDelete(formData.id)} className="px-4 py-2 text-red-700 bg-red-100 hover:bg-red-200 rounded-2xl"><Trash2 size={16} /></button>}
            <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-medium">Annuler</button>
            <button type="submit" onClick={handleSubmit} disabled={submitting} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-medium disabled:bg-gray-400">{formData.id ? 'Modifier' : 'Créer'}</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AppointmentModal;
