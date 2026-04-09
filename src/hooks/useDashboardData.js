import { useState, useEffect, useCallback } from 'react';
import { userService, patientService, appointmentService } from '../lib/services'; // Assuming these are correctly exported

export const useDashboardData = () => {
  const [specialites, setSpecialites] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSpecialites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getUniqueDoctorSpecialties();
      setSpecialites(data);
    } catch (err) {
      setError(err);
      console.error('Error fetching specialties:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patientService.getAll();
      // Assuming 'actif' filtering is handled by the service or can be added here if needed
      setPatients(data.filter(p => p.actif));
    } catch (err) {
      setError(err);
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMedecins = useCallback(async (selectedSpecialite) => {
    try {
      setLoading(true);
      const data = await userService.getDoctors({ specialite: selectedSpecialite }); // Assuming getDoctors can take a specialty filter
      setMedecins(data);
    } catch (err) {
      setError(err);
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAppointments = useCallback(async (selectedSpecialite, selectedMonth) => {
    try {
      setLoading(true);
      const data = await appointmentService.getByMonthAndSpeciality(selectedSpecialite, selectedMonth);
      setAppointments(data);
    } catch (err) {
      setError(err);
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load for specialties and patients
  useEffect(() => {
    fetchSpecialites();
    fetchPatients();
  }, [fetchSpecialites, fetchPatients]);

  return {
    specialites,
    patients,
    medecins,
    appointments,
    loading,
    error,
    fetchSpecialites,
    fetchPatients,
    fetchMedecins,
    fetchAppointments,
  };
};