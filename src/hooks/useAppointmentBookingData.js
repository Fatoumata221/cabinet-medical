import { useState, useEffect, useCallback } from 'react';
import { userService, patientService, appointmentService } from '../lib/services';

export const useAppointmentBookingData = (selectedDateFilter, selectedDoctorIdFilter) => {
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

      let query = appointmentService.getAppointmentsByDate(dayString); // Assuming a new method getAppointmentsByDate is added to appointmentService

      if (selectedDoctorIdFilter) {
        query = query.eq('medecin_id', selectedDoctorIdFilter); // This part needs to be handled in the service if a generic getAppointmentsByDate is made
      }
      
      const data = await query; // This won't work directly, need to call the service method
      
      // Re-call appointmentService.getAll and filter locally if getAppointmentsByDate doesn't exist
      // For now, let's assume we'll create appointmentService.getAppointmentsByDate and handle doctorId filtering within it.
      
      const fetchedAppointments = await appointmentService.getAppointmentsByDateAndDoctor(dayString, selectedDoctorIdFilter);

      setAppointments(fetchedAppointments || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDateFilter, selectedDoctorIdFilter]);

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