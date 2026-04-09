import { useState, useCallback, useRef } from 'react'
import {
  appointmentService,
  patientService,
  userService,
} from '../lib/services'
import { specialtyService } from '../lib/services/specialtyService'

export const useCalendarData = (currentUser) => {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [medecins, setMedecins] = useState([])
  const [specialites, setSpecialites] = useState([])
  const currentUserRef = useRef(currentUser)
  const initialLoadDone = useRef(false)
  currentUserRef.current = currentUser

  const loadData = useCallback(async () => {
    const user = currentUserRef.current
    if (!user) return

    try {
      // Afficher le spinner uniquement au premier chargement
      if (!initialLoadDone.current) {
        setLoading(true)
      }
      const ignoreSpecialityForSecretary = user?.role === 'secretary'
      const [appointmentsData, patientsData, medecinsData, specialitesData] =
        await Promise.all([
          appointmentService.getAll({
            ignoreSpecialityFilter: ignoreSpecialityForSecretary,
          }),
          patientService.getAll(),
          userService.getDoctors({
            ignoreSpecialityFilter: ignoreSpecialityForSecretary,
          }),
          specialtyService.getAll(),
        ])
      setAppointments(appointmentsData || [])
      setPatients(patientsData || [])
      setMedecins(medecinsData || [])
      setSpecialites(specialitesData || [])
      initialLoadDone.current = true
    } catch (error) {
      console.error('Erreur lors du chargement du calendrier:', error)
      setAppointments([])
      setPatients([])
      setMedecins([])
      setSpecialites([])
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    appointments,
    patients,
    medecins,
    specialites,
    loadData,
    setAppointments,
    setMedecins,
    setPatients,
    setSpecialites,
  }
}
