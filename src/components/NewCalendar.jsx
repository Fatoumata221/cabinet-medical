import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import RdvCreationModal from './rendez-vous/RdvCreationModal'
import { useNewCalendar } from '../hooks/useNewCalendar'
import CalendarHeader from './calendar/CalendarHeader'
import StatsCards from './calendar/StatsCards'
import React from 'react'
import PropTypes from 'prop-types'

const NewCalendar = ({
  selectedDoctorFilter,
  disableDoctorFilter = false,
}) => {
  const {
    loading,
    calendarRef,
    calendarView,
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
    calendarEvents,
    calendarResources,
    dayViewMinWidth,
    stats,
    medecins,

    setSearchTerm,
    setShowSearchDropdown,
    setSelectedSearchResult,
    setShowAppointmentModal,
    setEditingAppointment,
    setSelectedSpecialty,

    loadData,
    availableSpecialties,
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
    deleteAppointment,

    RESOURCE_AREA_WIDTH,
    createAppointment,
    updateAppointment,
    getAppointmentErrorMessage,
    doctorPlanningLabel,
    useResourceDayView,
    viewingToday,
    handleDateClick,
    dayCellClassNames,
    resolveFullCalendarView,
  } = useNewCalendar({
    selectedDoctorFilter,
    disableDoctorFilter,
  })

  const fullCalendarView = resolveFullCalendarView()
  const isMonthView = calendarView === 'dayGridMonth'
  const isTimeGridView =
    calendarView === 'timeGridWeek' || calendarView === 'timeGridDay'

  const renderEventContent = (eventInfo) => {
    const { event, timeText } = eventInfo
    const props = event.extendedProps || {}
    const patientName = props.patientName || event.title || 'Rendez-vous'
    const motif = props.motif || props.motif_detaille || ''
    const doctorName = props.medecin
      ? `Dr. ${props.medecin.prenom ?? ''} ${props.medecin.nom ?? ''}`.trim()
      : ''
    const duration = Number(props.durationMinutes || 0)

    return (
      <div className="gc-event-content">
        <div className="gc-event-time">{timeText}</div>
        <div className="gc-event-title">{patientName}</div>
        {duration >= 30 && motif && (
          <div className="gc-event-meta">{motif}</div>
        )}
        {duration >= 45 && doctorName && (
          <div className="gc-event-meta">{doctorName}</div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600 text-lg font-medium">
            Chargement du calendrier...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="google-calendar-shell h-screen bg-slate-100 transition-all duration-300 flex flex-col relative">
      <StatsCards stats={stats} animatedStats={animatedStats} />

      <div className="px-3 pb-3 flex-1 flex flex-col min-h-0 sm:px-4 sm:pb-4">
        <div className="google-calendar-surface bg-white border border-slate-200 overflow-hidden flex-1 flex flex-col shadow-sm">
          <CalendarHeader
            handlePrev={handlePrev}
            handleNext={handleNext}
            handleToday={handleToday}
            getDateDisplayText={getDateDisplayText}
            getNavigationText={getNavigationText}
            calendarView={calendarView}
            viewingToday={viewingToday}
            handleViewChange={handleViewChange}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPatientsAndMotifs={searchPatientsAndMotifs}
            clearSearch={clearSearch}
            showSearchDropdown={showSearchDropdown}
            setShowSearchDropdown={setShowSearchDropdown}
            searchResults={searchResults}
            selectSearchResult={selectSearchResult}
            selectedSearchResult={selectedSearchResult}
            setSelectedSearchResult={setSelectedSearchResult}
            localDoctorFilter={localDoctorFilter}
            handleDoctorFilterChange={handleDoctorFilterChange}
            medecins={medecins}
            disableDoctorFilter={disableDoctorFilter}
            doctorPlanningLabel={doctorPlanningLabel}
            availableSpecialties={availableSpecialties}
            selectedSpecialty={selectedSpecialty}
            setSelectedSpecialty={setSelectedSpecialty}
            setEditingAppointment={setEditingAppointment}
            setShowAppointmentModal={setShowAppointmentModal}
          />

          <div className="flex-1 relative overflow-hidden">
            <div className="h-full w-full overflow-hidden relative">
              {calendarView === 'timeGridDay' && useResourceDayView && (
                <div className="absolute top-0 bottom-0 left-0 w-[64px] pointer-events-none gradient-mask-l-0">
                  <div className="h-full w-full bg-gradient-to-r from-white via-white/70 to-transparent" />
                </div>
              )}
              <div
                className="h-full"
                style={{
                  minWidth: dayViewMinWidth ? `${dayViewMinWidth}px` : '100%',
                  width: '100%',
                  maxWidth: '100%',
                }}
              >
                <FullCalendar
                  ref={calendarRef}
                  schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
                  plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    interactionPlugin,
                    listPlugin,
                    resourceTimeGridPlugin,
                  ]}
                  headerToolbar={false}
                  initialView={fullCalendarView}
                  events={calendarEvents}
                  resources={
                    calendarView === 'timeGridDay' && useResourceDayView
                      ? calendarResources
                      : undefined
                  }
                  eventClick={handleEventClick}
                  eventContent={renderEventContent}
                  eventDrop={isTimeGridView ? handleEventDrop : undefined}
                  eventResize={isTimeGridView ? handleEventResize : undefined}
                  editable={isTimeGridView}
                  selectable={isTimeGridView}
                  select={isTimeGridView ? handleDateSelect : undefined}
                  dateClick={isMonthView ? handleDateClick : undefined}
                  selectConstraint={
                    isTimeGridView
                      ? {
                          startTime: '08:00',
                          endTime: '18:00',
                          daysOfWeek: [1, 2, 3, 4, 5, 6],
                        }
                      : undefined
                  }
                  dayCellClassNames={dayCellClassNames}
                  fixedWeekCount={false}
                  showNonCurrentDates
                  dayMaxEventRows={isMonthView ? 3 : false}
                  moreLinkClick="popover"
                  eventMaxStack={isMonthView ? 2 : undefined}
                  height="100%"
                  locale="fr"
                  slotMinTime="08:00:00"
                  slotMaxTime="18:00:00"
                  allDaySlot={false}
                  slotDuration="00:30:00"
                  snapDuration="00:15:00"
                  slotLabelInterval="01:00"
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }}
                  dayHeaderFormat={{
                    weekday: 'long',
                    day: 'numeric',
                  }}
                  slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }}
                  eventDisplay="block"
                  eventResizableFromStart={isTimeGridView}
                  droppable={isTimeGridView}
                  selectMirror={isTimeGridView}
                  eventClassNames="google-calendar-event cursor-pointer"
                  businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5, 6],
                    startTime: '08:00',
                    endTime: '18:00',
                  }}
                  hiddenDays={[0]}
                  nowIndicator
                  scrollTime="08:00:00"
                  expandRows
                  stickyHeaderDates
                  weekNumbers={false}
                  handleWindowResize
                  windowResizeDelay={100}
                  resourceAreaWidth={
                    calendarView === 'timeGridDay' && useResourceDayView
                      ? RESOURCE_AREA_WIDTH
                      : undefined
                  }
                  datesSet={handleDatesSet}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <RdvCreationModal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false)
          setEditingAppointment(null)
        }}
        initialDate={modalInitialDate}
        initialDoctorId={modalInitialDoctorId}
        initialPatientId={modalInitialPatientId}
        initialDuration={modalInitialDuration}
        initialSpecialty={modalInitialSpecialty}
        editingAppointment={editingAppointment}
        createAppointment={createAppointment}
        updateAppointment={updateAppointment}
        deleteAppointment={deleteAppointment}
        getAppointmentErrorMessage={getAppointmentErrorMessage}
        restrictToCurrentDoctor={disableDoctorFilter}
        onSuccess={async () => {
          await loadData()
        }}
        onDelete={
          editingAppointment
            ? async (appointmentId) => {
                if (!window.confirm('Supprimer ce rendez-vous ?')) return
                try {
                  await deleteAppointment(appointmentId)
                } catch (error) {
                  console.error(
                    'Erreur lors de la suppression du rendez-vous:',
                    error,
                  )
                }
              }
            : undefined
        }
      />
    </div>
  )
}
NewCalendar.propTypes = {
  selectedDoctorFilter: PropTypes.string,
  disableDoctorFilter: PropTypes.bool,
}

export default NewCalendar
