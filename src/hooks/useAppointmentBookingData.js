import { useState, useEffect, useCallback } from 'react';
import { userService, patientService, appointmentService } from '../lib/services';

export const useAppointmentBookingData = (selectedDateFilter, selectedDoctorIdFilter, selectedSpecialiteFilter) => {
  const [specialites, setSpecialites] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all unique doctor specialties
  const fetchSpecialites = useCallback(async () => {
    try {
      const data = await userService.getUniqueDoctorSpecialties();
      setSpecialites(data);
    } catch (err) {
      console.error('Error fetching unique specialties:', err);
      setError(err);
    }
  }, []);

  // Fetch all active patients
  const fetchAllPatients = useCallback(async () => {
    try {
      const data = await patientService.getAll();
      setAllPatients(data || []);
    } catch (err) {
      console.error('Error fetching all patients:', err);
      setError(err);
    }
  }, []);

  // Fetch all active doctors
  const fetchAllDoctors = useCallback(async () => {
    try {
      // Pass ignoreSpecialityFilter=true to get all doctors regardless of user's specialite filter
      const data = await userService.getDoctors({ ignoreSpecialityFilter: true }); 
      setAllDoctors(data || []);
    } catch (err) {
      console.error('Error fetching all doctors:', err);
      setError(err);
    }
  }, []);

  // Fetch appointments for a specific date and optional doctor
  const fetchAppointments = useCallback(async () => {
    console.log("=== Début du filtrage ===");
    console.log("Date :", selectedDateFilter);
    console.log("Médecin sélectionné :", selectedDoctorIdFilter);
    console.log("Type du médecin :", typeof selectedDoctorIdFilter);
    console.log("Spécialité :", selectedSpecialiteFilter);

    if (!selectedDateFilter) {
      setAppointments([]);
      return;
    }

    try {
      setLoading(true);
      const targetDate = selectedDateFilter instanceof Date ? selectedDateFilter : new Date(selectedDateFilter);
      if (Number.isNaN(targetDate.getTime())) {
        console.warn('Invalid date provided to fetchAppointments:', selectedDateFilter);
        setAppointments([]);
        setLoading(false);
        return;
      }

      const dayString = targetDate.toISOString().split('T')[0];

      console.log("Construction de la requête...");
      console.log('📅 [useAppointmentBookingData] Date convertie:', {
        targetDate,
        dayString,
        isValid: !Number.isNaN(targetDate.getTime())
      });

      const fetchedAppointments = await appointmentService.getAppointmentsByDateAndDoctor(dayString, selectedDoctorIdFilter, selectedSpecialiteFilter);

      console.log("Nombre de rendez-vous récupérés :", fetchedAppointments?.length || 0);
      console.table(fetchedAppointments);

      console.log("Avant d'appliquer le filtre par médecin dans le hook:");
      if (fetchedAppointments) {
        fetchedAppointments.forEach(rdv => {
          console.log({
            rendezVousId: rdv.id,
            doctor_id: rdv.doctor_id,
            medecin_id: rdv.medecin_id,
            medecin: rdv.medecin,
            filtre: selectedDoctorIdFilter
          });
        });
      }

      console.log("Nombre de rendez-vous après filtrage :", fetchedAppointments?.length || 0);
      console.table(fetchedAppointments);

      setAppointments(fetchedAppointments || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDateFilter, selectedDoctorIdFilter, selectedSpecialiteFilter]);

  // Initial data load for specialties, patients, and doctors
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAllPatients(),
      fetchAllDoctors(),
      fetchSpecialites()
    ]).then(() => {
      setLoading(false);
    }).catch(err => {
      setError(err);
      setLoading(false);
    });
  }, [fetchAllPatients, fetchAllDoctors, fetchSpecialites]);

  // Refetch appointments when filters change
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    specialites,
    allPatients,
    allDoctors,
    appointments,
    loading,
    error,
    refreshAppointments: fetchAppointments, // Expose refresh function
  };
};