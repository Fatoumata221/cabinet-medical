import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { appointmentService } from '../lib/services'
import { useAuth } from '../contexts/AuthContext'
import { getIsoString, clampDuration } from '../utils/date'
import { hashSpecialtyToColor, darkenHexColor } from '../utils/colors'
import { useCalendarData } from './useCalendarData'
import { useCalendarSearch } from './useCalendarSearch'

const DEFAULT_APPOINTMENT_DURATION = 30
const MAX_SELECTION_MINUTES = 120
const RESOURCE_COLUMN_MIN_WIDTH = 260
const RESOURCE_AREA_WIDTH = 220

const getEventColor = (
  statut,
  priorite,
  specialiteNom,
  specialtyColorMap = {},
) => {
  const normalizedSpecialty = specialiteNom?.trim() ?? ''
  const specialtyColor =
    (normalizedSpecialty && specialtyColorMap[normalizedSpecialty]) ||
    (normalizedSpecialty ? hashSpecialtyToColor(normalizedSpecialty) : null)

  if (statut === 'annule') return '#6b7280'
  if (statut === 'termine') return '#10b981'
  if (priorite === 'tres_urgente') return '#dc2626'

  const baseColor = specialtyColor ?? '#3b82f6'
  if (priorite === 'urgente') return darkenHexColor(baseColor, 0.25)

  return baseColor
}

const getEventClassNames = (duree, statut, priorite) => {
  const classes = []

  if (duree <= 20) {
    classes.push('fc-event-short')
  } else if (duree >= 60) {
    classes.push('fc-event-long')
  } else {
    classes.push('fc-event-medium')
  }

  return classes
}

const buildStats = (appointments) => {
  const today = new Date().toISOString().split('T')[0]
  const total = appointments.length
  const todayCount = appointments.filter((apt) =>
    apt.date_heure?.startsWith(today),
  ).length
  const urgentCount = appointments.filter(
    (apt) => apt.priorite === 'urgente' || apt.priorite === 'tres_urgente',
  ).length

  return [
    {
      label: 'Total RDV',
      value: total,
      icon: null, // Placeholder for now
      color: 'from-blue-500 to-cyan-400',
    },
    {
      label: "Aujourd'hui",
      value: todayCount,
      icon: null, // Placeholder for now
      color: 'from-violet-500 to-purple-400',
    },
    {
      label: 'Urgences',
      value: urgentCount,
      icon: null, // Placeholder for now
      color: 'from-red-500 to-rose-500',
    },
  ]
}

export const useNewCalendar = ({
  initialView = 'timeGridWeek',
  selectedDoctorFilter = 'all',
  disableDoctorFilter = false,
}) => {
  const { currentUser } = useAuth()
  const {
    loading,
    appointments,
    patients,
    medecins,
    specialites,
    loadData,
    setAppointments,
  } = useCalendarData(currentUser)
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    setSearchResults,
    showSearchDropdown,
    setShowSearchDropdown,
    selectedSearchResult,
    setSelectedSearchResult,
    searchPatientsAndMotifs,
    clearSearch,
  } = useCalendarSearch(appointments, patients)

  const calendarRef = useRef(null)
  const audioRef = useRef(null)

  const [calendarView, setCalendarView] = useState(initialView)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [modalInitialDate, setModalInitialDate] = useState(new Date())
  const [modalInitialDuration, setModalInitialDuration] = useState(
    DEFAULT_APPOINTMENT_DURATION,
  )
  const [modalInitialDoctorId, setModalInitialDoctorId] = useState('')
  const [modalInitialPatientId, setModalInitialPatientId] = useState('')
  const [modalInitialSpecialty, setModalInitialSpecialty] = useState('')
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [animatedStats, setAnimatedStats] = useState(false)
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [localDoctorFilter, setLocalDoctorFilter] = useState(
    selectedDoctorFilter,
  )
  const [showDragDemo, setShowDragDemo] = useState(true)

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setLocalDoctorFilter(selectedDoctorFilter)
  }, [selectedDoctorFilter])

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedStats(true), 100)
    return () => clearTimeout(timeout)
  }, [])

  const medecinsById = useMemo(() => {
    const map = new Map()
    medecins.forEach((medecin) => {
      map.set(String(medecin.id), medecin)
    })
    return map
  }, [medecins])

  const availableSpecialties = useMemo(() => {
    const fromSpecialites = specialites
      .map((spec) => spec.nom?.trim())
      .filter(Boolean)

    if (fromSpecialites.length > 0) {
      return Array.from(new Set(fromSpecialites)).sort((a, b) =>
        a.localeCompare(b, 'fr', { sensitivity: 'accent' }),
      )
    }

    const specialties = new Set()
    medecins.forEach((medecin) => {
      const value = medecin.specialite?.trim()
      if (value) {
        specialties.add(value)
      }
    })
    return Array.from(specialties).sort((a, b) =>
      a.localeCompare(b, 'fr', { sensitivity: 'accent' }),
    )
  }, [medecins, specialites])

  const specialtyColorMap = useMemo(() => {
    const map = {}

    availableSpecialties.forEach((specialite, index) => {
      const trimmed = specialite?.trim()
      if (!trimmed) return

      const specData =
        specialites.find(
          (spec) => spec.nom?.trim()?.toLowerCase() === trimmed.toLowerCase(),
        ) ?? null

      const rawColor = specData?.color ?? null

      if (rawColor) {
        map[trimmed] = rawColor
      } else if (!map[trimmed]) {
        map[trimmed] = hashSpecialtyToColor(`${trimmed}-${index}`)
      }
    })

    return map
  }, [availableSpecialties, specialites])

  useEffect(() => {
    if (
      selectedSpecialty !== 'all' &&
      !availableSpecialties.includes(selectedSpecialty)
    ) {
      setSelectedSpecialty('all')
    }
  }, [availableSpecialties, selectedSpecialty])

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesDoctor =
        localDoctorFilter === 'all' ||
        String(apt.medecin_id) === String(localDoctorFilter)

      if (!matchesDoctor) return false

      if (selectedSpecialty !== 'all') {
        const medecin =
          apt.medecin ?? medecinsById.get(String(apt.medecin_id)) ?? null
        const medecinSpecialty = medecin?.specialite?.trim() ?? ''
        if (medecinSpecialty !== selectedSpecialty) {
          return false
        }
      }

      if (selectedSearchResult) {
        if (selectedSearchResult.type === 'patient') {
          return apt.patient_id === selectedSearchResult.id
        }

        if (
          selectedSearchResult.type === 'appointment' &&
          apt.id === selectedSearchResult.id
        ) {
          return true
        }
      }

      if (!searchTerm.trim()) return true

      const term = searchTerm.trim().toLowerCase()
      const patientName = `${apt.patient?.prenom ?? ''} ${
        apt.patient?.nom ?? ''
      }`.toLowerCase()
      const motif = (apt.motif ?? '').toLowerCase()

      return (
        patientName.includes(term) ||
        motif.includes(term) ||
        (apt.patient?.telephone ?? '').toLowerCase().includes(term)
      )
    })
  }, [
    appointments,
    localDoctorFilter,
    medecinsById,
    searchTerm,
    selectedSearchResult,
    selectedSpecialty,
  ])

  useEffect(() => {
    if (filteredAppointments.length > 0) {
      setShowDragDemo(false)
    }
  }, [filteredAppointments.length])

  const calendarEvents = useMemo(() => {
    return filteredAppointments.map((apt) => {
      const startDate = new Date(apt.date_heure)
      const durationMinutes = clampDuration(
        Number(apt.duree ?? DEFAULT_APPOINTMENT_DURATION),
      )
      const endDate =
        apt.heure_fin && apt.heure_fin !== ''
          ? new Date(apt.heure_fin)
          : new Date(startDate.getTime() + durationMinutes * 60000)

      const medecin =
        apt.medecin ?? medecinsById.get(String(apt.medecin_id)) ?? null
      const specialtyName = medecin?.specialite?.trim() ?? ''
      const color = getEventColor(
        apt.statut,
        apt.priorite,
        specialtyName,
        specialtyColorMap,
      )
      const classNames = getEventClassNames(
        durationMinutes,
        apt.statut,
        apt.priorite,
      )

      return {
        id: String(apt.id),
        title:
          `${apt.patient?.prenom ?? ''} ${apt.patient?.nom ?? ''}`.trim() ||
          apt.motif ||
          'Rendez-vous',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        resourceId: apt.medecin_id ? String(apt.medecin_id) : undefined,
        color,
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        classNames,
        extendedProps: {
          ...apt,
          patientName: `${apt.patient?.prenom ?? ''} ${
            apt.patient?.nom ?? ''
          }`.trim(),
          specialtyName,
          specialtyColor: color,
          durationMinutes,
        },
      }
    })
  }, [filteredAppointments, medecinsById, specialtyColorMap])

  const visibleMedecins = useMemo(() => {
    return medecins.filter((medecin) => {
      if (
        selectedSpecialty !== 'all' &&
        (medecin.specialite?.trim() ?? '') !== selectedSpecialty
      ) {
        return false
      }
      if (
        localDoctorFilter !== 'all' &&
        String(medecin.id) !== String(localDoctorFilter)
      ) {
        return false
      }
      return true
    })
  }, [localDoctorFilter, medecins, selectedSpecialty])

  const calendarResources = useMemo(() => {
    return visibleMedecins.map((medecin) => ({
      id: String(medecin.id),
      title: `Dr. ${medecin.prenom ?? ''} ${medecin.nom ?? ''}`.trim(),
      extendedProps: {
        specialite: medecin.specialite ?? '',
        medecin,
      },
    }))
  }, [visibleMedecins])

  useEffect(() => {
    if (calendarView === 'timeGridDay' && disableDoctorFilter) {
      const applyFullWidth = () => {
        const cols = document.querySelectorAll('.fc-resource-timeline-col')
        const headerCells = document.querySelectorAll(
          '.fc-resource-timeline-header-cell',
        )
        const slotLanes = document.querySelectorAll(
          '.fc-resource-timeline-slot-lane',
        )

        if (cols.length === 1) {
          cols.forEach((col) => {
            col.style.width = '100%'
            col.style.minWidth = '100%'
            col.style.maxWidth = '100%'
          })

          headerCells.forEach((cell) => {
            cell.style.width = '100%'
            cell.style.minWidth = '100%'
            cell.style.maxWidth = '100%'
          })

          slotLanes.forEach((lane) => {
            lane.style.width = '100%'
            lane.style.minWidth = '100%'
            lane.style.maxWidth = '100%'
          })
        }
      }

      applyFullWidth()
      const timeout = setTimeout(applyFullWidth, 100)
      const timeout2 = setTimeout(applyFullWidth, 500)

      return () => {
        clearTimeout(timeout)
        clearTimeout(timeout2)
      }
    }
  }, [calendarView, disableDoctorFilter])

  const dayViewMinWidth = useMemo(() => {
    if (calendarView !== 'timeGridDay') return null
    if (disableDoctorFilter) return null
    const resourceCount = Math.max(calendarResources.length, 1)
    return resourceCount * RESOURCE_COLUMN_MIN_WIDTH + RESOURCE_AREA_WIDTH
  }, [calendarView, calendarResources.length, disableDoctorFilter])

  const stats = useMemo(
    () => buildStats(filteredAppointments),
    [filteredAppointments],
  )

  const getNavigationText = useCallback(() => {
    return calendarView === 'timeGridDay' ? 'Journée' : 'Semaine'
  }, [calendarView])

  const getDateDisplayText = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi?.view?.title) {
      return calendarApi.view.title
    }
    return selectedDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [selectedDate])

  const handlePrev = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi()
    calendarApi?.prev()
  }, [])

  const handleNext = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi()
    calendarApi?.next()
  }, [])

  const handleToday = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi()
    calendarApi?.today()
  }, [])

  const handleViewChange = useCallback((view) => {
    const calendarApi = calendarRef.current?.getApi()
    const fullCalendarView =
      view === 'timeGridDay' ? 'resourceTimeGridDay' : view

    if (calendarApi) {
      calendarApi.changeView(fullCalendarView)
    }
    setCalendarView(view)
  }, [])

  const selectSearchResult = useCallback(
    (result) => {
      setSelectedSearchResult(result)
      setSearchTerm(result.name ?? '')
      setShowSearchDropdown(false)

      const calendarApi = calendarRef.current?.getApi()
      if (!calendarApi) return

      if (result.type === 'appointment' && result.date) {
        const targetDate = new Date(result.date)
        calendarApi.gotoDate(targetDate)
        calendarApi.changeView('resourceTimeGridDay')
        setCalendarView('timeGridDay')
        if (result.medecinId) {
          setLocalDoctorFilter(String(result.medecinId))
        }
      } else if (result.type === 'patient') {
        const nextAppointment = appointments
          .filter((apt) => apt.patient_id === result.id)
          .sort(
            (a, b) =>
              new Date(a.date_heure).getTime() -
              new Date(b.date_heure).getTime(),
          )[0]

        if (nextAppointment) {
          const targetDate = new Date(nextAppointment.date_heure)
          calendarApi.gotoDate(targetDate)
          calendarApi.changeView('resourceTimeGridDay')
          setCalendarView('timeGridDay')
          if (nextAppointment.medecin_id) {
            setLocalDoctorFilter(String(nextAppointment.medecin_id))
          }
        }
      }
    },
    [appointments, setSelectedSearchResult, setSearchTerm, setShowSearchDropdown],
  )

  const handleDateSelect = useCallback(
    (selectionInfo) => {
      const start = selectionInfo.start
      const end =
        selectionInfo.end ??
        new Date(start.getTime() + DEFAULT_APPOINTMENT_DURATION * 60000)
      const minutes = (end.getTime() - start.getTime()) / (1000 * 60)
      const duration = clampDuration(minutes)
      setEditingAppointment(null)
      setModalInitialDate(start)
      setModalInitialDuration(duration)
      setModalInitialDoctorId(
        selectionInfo.resource ? String(selectionInfo.resource.id) : '',
      )
      setModalInitialSpecialty(
        selectionInfo.resource?.extendedProps?.medecin?.specialite
          ? selectionInfo.resource.extendedProps.medecin.specialite
          : selectedSpecialty !== 'all'
          ? selectedSpecialty
          : '',
      )
      setModalInitialPatientId('')
      setShowAppointmentModal(true)
      try {
        if (typeof window !== 'undefined') {
          const hh = start.getHours().toString().padStart(2, '0')
          const mm = start.getMinutes().toString().padStart(2, '0')
          localStorage.setItem('rdv_last_time', `${hh}:${mm}`)
        }
      } catch (error) {
        console.warn(
          "Impossible de stocker l'heure du créneau sélectionné:",
          error,
        )
      }
    },
    [selectedSpecialty],
  )

  const handleEventClick = useCallback(
    (clickInfo) => {
      const event = clickInfo.event
      const appointment = appointments.find(
        (apt) => String(apt.id) === event.id,
      )

      if (!appointment) return

      const eventDuration =
        appointment.duree ??
        clampDuration(
          ((event.end?.getTime() ?? event.start?.getTime() ?? 0) -
            event.start?.getTime()) /
            (1000 * 60),
        )
      setEditingAppointment({
        ...appointment,
        date_heure: appointment.date_heure ?? getIsoString(event.start),
      })
      setModalInitialDuration(eventDuration ?? DEFAULT_APPOINTMENT_DURATION)
      setModalInitialDate(new Date(appointment.date_heure ?? event.start))
      setModalInitialDoctorId(
        appointment.medecin_id ? String(appointment.medecin_id) : '',
      )
      setModalInitialPatientId(
        appointment.patient_id ? String(appointment.patient_id) : '',
      )
      const medecinSpecialite =
        appointment.medecin?.specialite ??
        medecinsById.get(String(appointment.medecin_id))?.specialite ??
        ''
      setModalInitialSpecialty(medecinSpecialite || '')
      setShowAppointmentModal(true)
    },
    [appointments, medecinsById],
  )

  const handleEventDrop = useCallback(
    async (eventDropInfo) => {
      const { event, newResource } = eventDropInfo
      const appointmentId = event.id
      const start = event.start
      const end =
        event.end ??
        new Date(start.getTime() + DEFAULT_APPOINTMENT_DURATION * 60000)

      try {
        await appointmentService.update(
          appointmentId,
          {
            date_heure: getIsoString(start),
            heure_fin: getIsoString(end),
            medecin_id: newResource ? parseInt(newResource.id, 10) : undefined,
            duree: (end.getTime() - start.getTime()) / (1000 * 60),
          },
          currentUser,
        ) // Pass currentUser here
        await loadData()
      } catch (error) {
        console.error(
          'Erreur lors du déplacement du rendez-vous:',
          appointmentService.getErrorMessage(error),
        )
        eventDropInfo.revert()
      }
    },
    [loadData, currentUser],
  )

  const handleEventResize = useCallback(
    async (eventResizeInfo) => {
      const { event } = eventResizeInfo
      const appointmentId = event.id
      const start = event.start
      const end = event.end ?? start

      try {
        await appointmentService.update(
          appointmentId,
          {
            date_heure: getIsoString(start),
            heure_fin: getIsoString(end),
            duree: (end.getTime() - start.getTime()) / (1000 * 60),
          },
          currentUser,
        ) // Pass currentUser here
        await loadData()
      } catch (error) {
        console.error(
          'Erreur lors du redimensionnement du rendez-vous:',
          appointmentService.getErrorMessage(error),
        )
        eventResizeInfo.revert()
      }
    },
    [loadData, currentUser],
  )

  const handleDoctorFilterChange = useCallback((value) => {
    setLocalDoctorFilter(value)
  }, [])

  const handleDatesSet = useCallback(
    (arg) => {
      const nextDate = arg?.start ?? null

      setSelectedDate((prevDate) => {
        if (!prevDate && !nextDate) return prevDate
        if (prevDate && nextDate && prevDate.getTime() === nextDate.getTime()) {
          return prevDate
        }
        return nextDate
      })

      if (calendarView === 'timeGridDay' && disableDoctorFilter) {
        setTimeout(() => {
          const cols = document.querySelectorAll('.fc-resource-timeline-col')
          const headerCells = document.querySelectorAll(
            '.fc-resource-timeline-header-cell',
          )
          const slotLanes = document.querySelectorAll(
            '.fc-resource-timeline-slot-lane',
          )

          if (cols.length === 1) {
            cols.forEach((col) => {
              col.style.width = '100%'
              col.style.minWidth = '100%'
              col.style.maxWidth = '100%'
            })

            headerCells.forEach((cell) => {
              cell.style.width = '100%'
              cell.style.minWidth = '100%'
              cell.style.maxWidth = '100%'
            })

            slotLanes.forEach((lane) => {
              lane.style.width = '100%'
              lane.style.minWidth = '100%'
              lane.style.maxWidth = '100%'
            })
          }
        }, 100)
      }
    },
    [calendarView, disableDoctorFilter],
  )

  const createAppointment = async (formData) => {
    try {
      const result = await appointmentService.create(formData, currentUser)
      loadData()
      return result
    } catch (error) {
      console.error(
        'Erreur lors de la création du rendez-vous:',
        appointmentService.getErrorMessage(error),
      )
      throw error
    }
  }

  const updateAppointment = async (id, formData) => {
    try {
      const result = await appointmentService.update(id, formData, currentUser)
      loadData()
      return result
    } catch (error) {
      console.error(
        'Erreur lors de la mise à jour du rendez-vous:',
        appointmentService.getErrorMessage(error),
      )
      throw error
    }
  }

  const deleteAppointment = async (id) => {
    try {
      await appointmentService.deleteAppointmentAndQueue(id)
      loadData()
    } catch (error) {
      console.error(
        'Erreur lors de la suppression du rendez-vous:',
        appointmentService.getErrorMessage(error),
      )
      throw error
    }
  }

  return {
    // State
    loading,
    calendarRef,
    audioRef,
    appointments,
    patients,
    medecins,
    specialites,
    calendarView,
    selectedDate,
    searchTerm,
    searchResults,
    showSearchDropdown,
    selectedSearchResult,
    showAppointmentModal,
    modalInitialDate,
    modalInitialDuration,
    modalInitialDoctorId,
    modalInitialPatientId,
    modalInitialSpecialty,
    editingAppointment,
    animatedStats,
    selectedSpecialty,
    localDoctorFilter,
    showDragDemo,
    filteredAppointments,
    calendarEvents,
    calendarResources,
    dayViewMinWidth,
    stats,

    // Setters
    setSearchTerm,
    setSearchResults,
    setShowSearchDropdown,
    setSelectedSearchResult,
    setShowAppointmentModal,
    setModalInitialDate,
    setModalInitialDuration,
    setModalInitialDoctorId,
    setModalInitialPatientId,
    setModalInitialSpecialty,
    setEditingAppointment,
    setAnimatedStats,
    setSelectedSpecialty,
    setLocalDoctorFilter,
    setShowDragDemo,
    setCalendarView,
    setSelectedDate,

    // Handlers & Memoized functions
    loadData,
    medecinsById,
    availableSpecialties,
    specialtyColorMap,
    searchPatientsAndMotifs,
    clearSearch,
    selectSearchResult,
    getNavigationText,
    getDateDisplayText,
    handlePrev,
    handleNext,
    handleToday,
    handleViewChange,
    handleDateSelect,
    handleEventClick,
    handleEventDrop,
    handleEventResize,
    handleDoctorFilterChange,
    handleDatesSet,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentErrorMessage: appointmentService.getErrorMessage,
    DEFAULT_APPOINTMENT_DURATION,
    MAX_SELECTION_MINUTES,
    RESOURCE_COLUMN_MIN_WIDTH,
    RESOURCE_AREA_WIDTH,
    getEventColor,
    getEventClassNames,
    buildStats,
  }
}
