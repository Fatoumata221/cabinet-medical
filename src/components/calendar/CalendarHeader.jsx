import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  User,
  X,
  FileText,
} from 'lucide-react'

const CalendarHeader = ({
  handlePrev,
  handleNext,
  handleToday,
  getDateDisplayText,
  getNavigationText,
  calendarView,
  handleViewChange,
  searchTerm,
  setSearchTerm,
  searchPatientsAndMotifs,
  clearSearch,
  showSearchDropdown,
  setShowSearchDropdown,
  searchResults,
  selectSearchResult,
  selectedSearchResult,
  setSelectedSearchResult,
  localDoctorFilter,
  handleDoctorFilterChange,
  medecins,
  disableDoctorFilter,
  availableSpecialties,
  selectedSpecialty,
  setSelectedSpecialty,
  setEditingAppointment,
  setShowAppointmentModal,
  DEFAULT_APPOINTPOINTMENT_DURATION,
}) => {
  return (
    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrev}
            className="p-2 hover:bg-white rounded-xl transition-all"
            title={`${getNavigationText()} précédente`}
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToday}
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer hover:scale-105 transform whitespace-nowrap"
              title="Aller à aujourd'hui"
            >
              {getDateDisplayText()}
            </button>
            {calendarView === 'timeGridDay' && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Navigation par journée
              </span>
            )}
          </div>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-white rounded-xl transition-all"
            title={`${getNavigationText()} suivante`}
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-3">
          <div className="relative search-container">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher un patient ou motif..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value
                setSearchTerm(value)
                searchPatientsAndMotifs(value)
                if (selectedSearchResult) {
                  setSelectedSearchResult(null)
                }
              }}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSearchDropdown(true)
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSearchDropdown(false), 150)
              }}
              className="pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Effacer la recherche"
              >
                <X size={14} className="text-gray-400" />
              </button>
            )}

            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 max-h-64 overflow-y-auto">
                <div className="p-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSearchResult(result)}
                      className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`p-1 rounded-full ${
                            result.type === 'patient'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-green-100 text-green-600'
                          }`}
                        >
                          {result.type === 'patient' ? (
                            <User size={12} />
                          ) : (
                            <FileText size={12} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {result.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {result.type === 'patient'
                              ? result.phone
                                ? `📞 ${result.phone}`
                                : 'Patient'
                              : result.motif
                              ? result.motif
                              : 'Rendez-vous'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!disableDoctorFilter && (
            <div className="relative">
              <select
                value={localDoctorFilter}
                onChange={(e) => handleDoctorFilterChange(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les médecins</option>
                {medecins.map((medecin) => (
                  <option key={medecin.id} value={medecin.id}>
                    Dr. {medecin.prenom} {medecin.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!disableDoctorFilter && availableSpecialties.length > 0 && (
            <div className="relative">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes les spécialités</option>
                {availableSpecialties.map((specialite) => (
                  <option key={specialite} value={specialite}>
                    {specialite}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!disableDoctorFilter &&
            (localDoctorFilter !== 'all' ||
              selectedSearchResult ||
              selectedSpecialty !== 'all') && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                <Filter size={14} />
                <span>Filtres actifs</span>
                {selectedSpecialty !== 'all' && (
                  <button
                    onClick={() => setSelectedSpecialty('all')}
                    className="bg-white/70 text-blue-700 px-2 py-0.5 rounded-full text-xs hover:bg-white transition-colors"
                    title="Supprimer le filtre spécialité"
                  >
                    {selectedSpecialty}
                    <span className="ml-1">x</span>
                  </button>
                )}
                {selectedSearchResult && (
                  <button
                    onClick={clearSearch}
                    className="ml-2 hover:bg-blue-200 rounded-full p-1 transition-colors"
                    title="Effacer la recherche"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-gray-100/80 p-1.5 rounded-2xl backdrop-blur-sm border border-gray-200">
            <div className="flex gap-1">
              {[
                { value: 'timeGridDay', label: 'Jour' },
                { value: 'timeGridWeek', label: 'Semaine' },
              ].map((view) => (
                <button
                  key={view.value}
                  onClick={() => handleViewChange(view.value)}
                  className={`py-2.5 px-5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    calendarView === view.value
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setEditingAppointment(null)
              setShowAppointmentModal(true)
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-2xl flex items-center space-x-2 transition-all transform hover:scale-105 shadow-lg font-semibold text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            <span>Nouveau RDV</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CalendarHeader
