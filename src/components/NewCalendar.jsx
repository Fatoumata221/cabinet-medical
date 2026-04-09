import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import RdvCreationModal from './rendez-vous/RdvCreationModal'
import { useNewCalendar } from '../hooks/useNewCalendar'
import { useAuth } from '../contexts/AuthContext'
import CalendarHeader from './calendar/CalendarHeader'
import StatsCards from './calendar/StatsCards'
import React from 'react'
import PropTypes from 'prop-types'

const NewCalendar = ({
  selectedDoctorFilter,
  onDoctorFilterChange,
  disableDoctorFilter = false,
}) => {
  const { currentUser } = useAuth()
  const {
    loading,
    calendarRef,
    audioRef,
    medecins,
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
    showDragDemo,
    filteredAppointments,
    calendarEvents,
    calendarResources,
    dayViewMinWidth,
    stats,

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
    
    DEFAULT_APPOINTMENT_DURATION,
    RESOURCE_AREA_WIDTH,
    createAppointment,
    updateAppointment,
    getAppointmentErrorMessage, // Assuming this will be returned by useNewCalendar
  } = useNewCalendar({
    selectedDoctorFilter,
    disableDoctorFilter,
    currentUser,
  })

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
    <div className="h-screen rounded-3xl bg-gradient-to-br from-slate-50 via-white to-blue-50 transition-all duration-500 flex flex-col relative">
      <audio ref={audioRef} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>

      <StatsCards stats={stats} animatedStats={animatedStats} />

      <div className="rounded-3xl pb-6 flex-1 flex flex-col">
        <div className="bg-white backdrop-blur-sm rounded-3xl border border-gray-100 overflow-hidden flex-1 flex flex-col">
          <CalendarHeader
            handlePrev={handlePrev}
            handleNext={handleNext}
            handleToday={handleToday}
            getDateDisplayText={getDateDisplayText}
            getNavigationText={getNavigationText}
            calendarView={calendarView}
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
            availableSpecialties={availableSpecialties}
            selectedSpecialty={selectedSpecialty}
            setSelectedSpecialty={setSelectedSpecialty}
            setEditingAppointment={setEditingAppointment}
            setShowAppointmentModal={setShowAppointmentModal}
            DEFAULT_APPOINTMENT_DURATION={DEFAULT_APPOINTMENT_DURATION}
          />

          <div className="flex-1 relative overflow-hidden">
            <div className="h-full w-full overflow-x-auto relative">
              {calendarView === 'timeGridDay' && (
                <div className="absolute top-0 bottom-0 left-0 w-[64px] pointer-events-none gradient-mask-l-0">
                  <div className="h-full w-full bg-gradient-to-r from-white via-white/70 to-transparent" />
                </div>
              )}
              <div
                className="h-full"
                style={{
                  minWidth: dayViewMinWidth ? `${dayViewMinWidth}px` : 'auto',
                  width: dayViewMinWidth ? `${dayViewMinWidth}px` : '100%',
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
                  initialView={
                    calendarView === 'timeGridDay'
                      ? 'resourceTimeGridDay'
                      : calendarView
                  }
                  events={calendarEvents}
                  resources={
                    calendarView === 'timeGridDay' ? calendarResources : undefined
                  }
                  eventClick={handleEventClick}
                  eventDrop={handleEventDrop}
                  eventResize={handleEventResize}
                  selectable
                  select={handleDateSelect}
                  selectConstraint={{
                    startTime: '08:00',
                    endTime: '18:00',
                    daysOfWeek: [1, 2, 3, 4, 5, 6],
                  }}
                  height="100%"
                  locale="fr"
                  slotMinTime="08:00:00"
                  slotMaxTime="18:00:00"
                  allDaySlot={false}
                  slotDuration="00:15:00"
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
                  eventResizableFromStart
                  editable
                  droppable
                  selectMirror
                  dayMaxEvents
                  moreLinkClick="popover"
                  eventClassNames="cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
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
                    calendarView === 'timeGridDay'
                      ? RESOURCE_AREA_WIDTH
                      : undefined
                  }
                  datesSet={handleDatesSet}
                />
              </div>
            </div>

            {/* Ajuster la largeur de la colonne en vue jour pour un seul médecin */}
            {calendarView === 'timeGridDay' && disableDoctorFilter && calendarResources.length === 1 && (
              <style>{`
                .fc-resource-timeline-col {
                  width: 100% !important;
                  min-width: 100% !important;
                  max-width: 100% !important;
                }
                .fc-resource-timeline-header-cell {
                  width: 100% !important;
                  min-width: 100% !important;
                  max-width: 100% !important;
                }
                .fc-resource-timeline-slot-lane {
                  width: 100% !important;
                  min-width: 100% !important;
                  max-width: 100% !important;
                }
              `}</style>
            )}
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
          await loadData();
        }}
        onDelete={
          editingAppointment
            ? async (appointmentId) => {
                if (!window.confirm('Supprimer ce rendez-vous ?')) return;
                try {
                  await deleteAppointment(appointmentId);
                } catch (error) {
                  console.error('Erreur lors de la suppression du rendez-vous:', error);
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
  onDoctorFilterChange: PropTypes.func,
  disableDoctorFilter: PropTypes.bool,
}

export default NewCalendar

