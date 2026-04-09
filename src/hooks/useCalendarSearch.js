import { useState, useCallback } from 'react'

export const useCalendarSearch = (appointments, patients) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [selectedSearchResult, setSelectedSearchResult] = useState(null)

  const searchPatientsAndMotifs = useCallback(
    (value) => {
      const term = value.trim().toLowerCase()
      if (!term) {
        setSearchResults([])
        setShowSearchDropdown(false)
        return
      }

      const patientMatches = patients
        .filter((patient) => {
          const fullname = `${patient.prenom ?? ''} ${
            patient.nom ?? ''
          }`.toLowerCase()
          const phone = (patient.telephone ?? '').toLowerCase()
          return (
            fullname.includes(term) ||
            phone.includes(term) ||
            (patient.nom ?? '').toLowerCase().includes(term) ||
            (patient.prenom ?? '').toLowerCase().includes(term)
          )
        })
        .map((patient) => ({
          type: 'patient',
          id: patient.id,
          name: `${patient.prenom ?? ''} ${patient.nom ?? ''}`.trim(),
          phone: patient.telephone ?? '',
        }))

      const appointmentMatches = appointments
        .filter((apt) => {
          const motif = (apt.motif ?? '').toLowerCase()
          const patientName = `${apt.patient?.prenom ?? ''} ${
            apt.patient?.nom ?? ''
          }`.toLowerCase()
          return motif.includes(term) || patientName.includes(term)
        })
        .slice(0, 10)
        .map((apt) => ({
          type: 'appointment',
          id: apt.id,
          name: `${apt.patient?.prenom ?? ''} ${apt.patient?.nom ?? ''}`.trim(),
          patient: `${apt.patient?.prenom ?? ''} ${
            apt.patient?.nom ?? ''
          }`.trim(),
          motif: apt.motif ?? '',
          date: apt.date_heure,
          medecinId: apt.medecin_id,
        }))

      const combined = [...patientMatches, ...appointmentMatches].slice(0, 20)
      setSearchResults(combined)
      setShowSearchDropdown(combined.length > 0)
    },
    [appointments, patients],
  )

  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setSelectedSearchResult(null)
    setSearchResults([])
    setShowSearchDropdown(false)
  }, [])

  return {
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
  }
}
