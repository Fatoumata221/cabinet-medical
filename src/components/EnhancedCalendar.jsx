import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, User, Plus, Filter, ChevronLeft, ChevronRight, X, CheckCircle, FileText, Volume2, VolumeX, Users, Zap, ArrowUpRight, ArrowDownRight, Calendar, Stethoscope, Pill, MoreHorizontal, Edit3, Trash2, Copy, Share2 } from 'lucide-react';

const EnhancedCalendar = () => {
  const [appointments, setAppointments] = useState([
    { id: 1, patient: { nom: 'Martin', prenom: 'Sophie', avatar: '👩' }, medecin: { nom: 'Dupont', prenom: 'Jean' }, date_heure: '2024-01-15T09:00:00', motif: 'Consultation générale', duree: 30, priorite: 'normale', statut: 'confirme' },
    { id: 2, patient: { nom: 'Bernard', prenom: 'Lucas', avatar: '👨' }, medecin: { nom: 'Moreau', prenom: 'Marie' }, date_heure: '2024-01-15T10:30:00', motif: 'Contrôle tension', duree: 45, priorite: 'urgente', statut: 'confirme' },
    { id: 3, patient: { nom: 'Petit', prenom: 'Emma', avatar: '👧' }, medecin: { nom: 'Dupont', prenom: 'Jean' }, date_heure: '2024-01-15T14:00:00', motif: 'Vaccination', duree: 20, priorite: 'normale', statut: 'en_attente' },
  ]);
  
  const [selectedView, setSelectedView] = useState('day');
  const [showSidebar, setShowSidebar] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [animatedStats, setAnimatedStats] = useState(false);

  // Drag and Drop states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [dragMedecin, setDragMedecin] = useState(null);
  const [dragDay, setDragDay] = useState(null);
  const [dragPreview, setDragPreview] = useState([]);

  // Notion-inspired states
  const [hoveredAppointment, setHoveredAppointment] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    setTimeout(() => setAnimatedStats(true), 100);
  }, []);

  // Global mouse up handler for drag and drop
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragPreview, dragStart, dragMedecin]);

  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8; // De 8h à 22h
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // Données des médecins
  

 

  const getAppointmentStyle = (priorite, medecinColor = 'bg-blue-500') => {
    const baseStyle = 'rounded-lg p-2 text-white text-xs font-medium shadow-sm hover:shadow-md transition-all cursor-pointer m-0.5 border-l-4';
    
    switch(priorite) {
      case 'tres_urgente': return `${baseStyle} bg-red-500 border-red-600`;
      case 'urgente': return `${baseStyle} bg-orange-500 border-orange-600`;
      default: return `${baseStyle} ${medecinColor} border-blue-600`;
    }
  };

  const handleTimeSlotClick = (time) => {
    setSelectedAppointment(null);
    setShowAppointmentModal(true);
  };

  const handleAppointmentClick = (apt) => {
    setSelectedAppointment(apt);
    setShowAppointmentModal(true);
  };

  // Drag and Drop functions
  const handleMouseDown = (e, time, medecinId = null, dayOffset = null) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart(time);
    setDragEnd(time);
    setDragMedecin(medecinId);
    setDragDay(dayOffset);
    setDragPreview([time]);
  };

  const handleMouseMove = (e, time, medecinId = null, dayOffset = null) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    // Vérifier que nous sommes dans la même colonne (même médecin/jour)
    if ((selectedView === 'day' && medecinId !== dragMedecin) || 
        (selectedView === 'week' && dayOffset !== dragDay)) {
      return;
    }

    setDragEnd(time);
    
    // Calculer les créneaux entre le début et la fin
    const startIndex = timeSlots.indexOf(dragStart);
    const endIndex = timeSlots.indexOf(time);
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    
    const selectedSlots = timeSlots.slice(minIndex, maxIndex + 1);
    setDragPreview(selectedSlots);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Si on a sélectionné plusieurs créneaux, ouvrir le modal avec la durée calculée
    if (dragPreview.length > 1) {
      const duration = dragPreview.length * 30; // 30 minutes par créneau
      setSelectedAppointment({
        date_heure: `2024-01-15T${dragStart}:00`,
        duree: duration,
        medecin: medecins.find(m => m.id === dragMedecin) || { nom: 'Non défini' }
      });
      setShowAppointmentModal(true);
    }
    
    // Reset drag state
    setDragStart(null);
    setDragEnd(null);
    setDragMedecin(null);
    setDragDay(null);
    setDragPreview([]);
  };

  const isSlotInDragPreview = (time) => {
    return dragPreview.includes(time);
  };

  const getDragSlotStyle = (time) => {
    if (!isSlotInDragPreview(time)) return '';
    
    const isStart = time === dragStart;
    const isEnd = time === dragEnd;
    
    if (isStart && isEnd) {
      return 'bg-blue-500/20 border-2 border-blue-500 shadow-lg';
    } else if (isStart) {
      return 'bg-blue-500/20 border-l-2 border-t-2 border-b-2 border-blue-500 rounded-l-xl shadow-lg';
    } else if (isEnd) {
      return 'bg-blue-500/20 border-r-2 border-t-2 border-b-2 border-blue-500 rounded-r-xl shadow-lg';
    } else {
      return 'bg-blue-500/20 border-t-2 border-b-2 border-blue-500 shadow-md';
    }
  };

  const getDragSlotContent = (time) => {
    if (!isSlotInDragPreview(time)) return null;
    
    const isStart = time === dragStart;
    const isEnd = time === dragEnd;
    
    if (isStart) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-blue-600 font-bold text-sm">
            {time}
          </div>
        </div>
      );
    } else if (isEnd) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-blue-600 font-bold text-sm">
            {time}
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Notion-inspired appointment component
  const AppointmentCard = ({ appointment, medecin }) => {
    const medecinData = medecins.find(m => m.id === medecin.id);
    
    return (
      <div 
        className={`${getAppointmentStyle(appointment.priorite, medecinData?.color)} group relative`}
        onClick={(e) => { e.stopPropagation(); handleAppointmentClick(appointment); }}
        onMouseEnter={() => setHoveredAppointment(appointment.id)}
        onMouseLeave={() => setHoveredAppointment(null)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{appointment.patient.avatar}</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">
              {appointment.patient.prenom} {appointment.patient.nom}
            </div>
            <div className="text-xs opacity-90 truncate">
              {appointment.motif}
            </div>
          </div>
        </div>
        
        {/* Notion-style quick actions */}
        {hoveredAppointment === appointment.id && (
          <div className="absolute top-0 right-0 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-1 z-10 animate-slideInRight">
            <div className="flex space-x-1">
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <Edit3 size={12} className="text-gray-600" />
              </button>
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <Copy size={12} className="text-gray-600" />
              </button>
              <button className="p-1 hover:bg-red-100 rounded transition-colors">
                <Trash2 size={12} className="text-red-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'} transition-all duration-500`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className={`relative overflow-hidden ${darkMode ? 'bg-gray-900/50' : 'bg-white'} backdrop-blur-sm rounded-3xl border ${darkMode ? 'border-gray-800' : 'border-gray-100'} p-6 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 ${animatedStats ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
              
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>{stat.label}</p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</h3>
                    <span className={`text-sm font-semibold flex items-center ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-2xl text-white shadow-lg`}>
                  <stat.icon size={24} />
                </div>
              </div>
              
              {/* Mini Chart */}
              <div className="mt-4 flex items-end space-x-1">
                {[40, 70, 45, 90, 85, 60, 75].map((height, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 bg-gradient-to-t ${stat.color} rounded-full opacity-30 hover:opacity-60 transition-all`}
                    style={{ height: `${height * 0.3}px` }}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Container - Full Width */}
      <div className="px-6 pb-6">
          <div className={`${darkMode ? 'bg-gray-900/50' : 'bg-white'} backdrop-blur-sm rounded-3xl border ${darkMode ? 'border-gray-800' : 'border-gray-100'} overflow-hidden h-[calc(100vh-280px)]`}>
            {/* Calendar Header - Notion Style */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-white'} rounded-xl transition-all`}>
                    <ChevronLeft size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h2>
                  <button className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-white'} rounded-xl transition-all`}>
                    <ChevronRight size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Drag and Drop Instructions */}
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center space-x-2`}>
                    <span>💡</span>
                    <span>Tirez sur les créneaux pour sélectionner la durée</span>
                  </div>
                  
                  {/* View Selector - Notion Style */}
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-1 rounded-2xl`}>
                    <div className="flex gap-1">
                      {['day', 'week'].map((view) => (
                        <button
                          key={view}
                          onClick={() => setSelectedView(view)}
                          className={`py-2 px-4 rounded-xl font-medium capitalize transition-all ${
                            selectedView === view 
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                              : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {view === 'day' ? 'Jour' : 'Semaine'}
                  </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Content */}
            <div className="p-6 overflow-auto h-full">
              {selectedView === 'day' && (
                <div className="grid grid-cols-5 gap-4 h-full">
                  {/* Time Column */}
                  <div className="space-y-4">
                    <div className="h-16 flex items-center justify-center">
                      <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Heures</span>
                    </div>
                    {timeSlots.map((time) => (
                      <div key={time} className="h-16 flex items-center justify-center">
                        <div className={`px-3 py-2 rounded-xl ${darkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-100 text-gray-700'} font-medium text-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          {time}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Doctor Columns */}
                  {medecins.map((medecin) => (
                    <div key={medecin.id} className="space-y-4">
                      {/* Doctor Header */}
                      <div className={`h-16 flex flex-col items-center justify-center ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-xl p-2 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${medecin.color}`}></div>
                          <div className="text-center">
                            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              Dr. {medecin.prenom} {medecin.nom}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {medecin.specialite}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Time Slots */}
                      {timeSlots.map((time) => (
                        <div 
                          key={time}
                          className={`h-16 ${darkMode ? 'bg-gray-800/30 hover:bg-gray-800/50' : 'bg-gray-50 hover:bg-gray-100'} rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-all cursor-pointer group ${getDragSlotStyle(time)}`}
                          onClick={() => !isDragging && handleTimeSlotClick(time)}
                          onMouseEnter={() => !isDragging && setHoveredSlot(`${medecin.id}-${time}`)}
                          onMouseLeave={() => {
                            setHoveredSlot(null);
                            if (isDragging) setIsDragging(false);
                          }}
                          onMouseDown={(e) => handleMouseDown(e, time, medecin.id)}
                          onMouseMove={(e) => handleMouseMove(e, time, medecin.id)}
                          onMouseUp={handleMouseUp}
                          style={{ cursor: isSlotInDragPreview(time) ? 'grabbing' : 'grab' }}
                        >
                          {/* Drag and Drop Content */}
                          {getDragSlotContent(time)}
                          
                          {/* Hover Content */}
                          {!isSlotInDragPreview(time) && hoveredSlot === `${medecin.id}-${time}` && (
                            <div className="h-full flex items-center justify-center">
                              <Plus size={20} className={`${darkMode ? 'text-gray-600' : 'text-gray-400'} group-hover:text-blue-500 transition-colors`} />
                            </div>
                          )}
                          
                          {/* Sample appointments - Notion Style */}
                          {!isSlotInDragPreview(time) && medecin.id === 1 && time === '09:00' && (
                            <AppointmentCard appointment={appointments[0]} medecin={medecin} />
                          )}
                          
                          {!isSlotInDragPreview(time) && medecin.id === 2 && time === '10:00' && (
                            <AppointmentCard appointment={appointments[1]} medecin={medecin} />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

            {selectedView === 'week' && (
                <div className="grid grid-cols-8 gap-4">
                  {/* Time Column */}
                <div className="space-y-4">
                  <div className="h-16 flex items-center justify-center">
                    <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Heures</span>
                  </div>
                  {timeSlots.map((time) => (
                    <div key={time} className="h-16 flex items-center justify-center">
                      <div className={`px-3 py-2 rounded-xl ${darkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-100 text-gray-700'} font-medium text-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        {time}
                      </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Day Columns */}
                  {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => (
                  <div key={dayOffset} className="space-y-4">
                    <div className={`h-16 flex flex-col items-center justify-center ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-xl p-2 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {weekDays[dayOffset]}
                        </p>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {15 + dayOffset}
                        </p>
                      </div>
                      
                      {/* Time Slots */}
                    {timeSlots.map((time) => (
                        <div 
                          key={time}
                        className={`h-16 ${darkMode ? 'bg-gray-800/30 hover:bg-gray-800/50' : 'bg-gray-50 hover:bg-gray-100'} rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-all cursor-pointer group ${getDragSlotStyle(time)}`}
                        onClick={() => !isDragging && handleTimeSlotClick(time)}
                        onMouseEnter={() => !isDragging && setHoveredSlot(`${dayOffset}-${time}`)}
                        onMouseLeave={() => {
                          setHoveredSlot(null);
                          if (isDragging) setIsDragging(false);
                        }}
                        onMouseDown={(e) => handleMouseDown(e, time, null, dayOffset)}
                        onMouseMove={(e) => handleMouseMove(e, time, null, dayOffset)}
                        onMouseUp={handleMouseUp}
                        style={{ cursor: isSlotInDragPreview(time) ? 'grabbing' : 'grab' }}
                      >
                        {/* Drag and Drop Content */}
                        {getDragSlotContent(time)}
                        
                        {/* Hover Content */}
                        {!isSlotInDragPreview(time) && hoveredSlot === `${dayOffset}-${time}` && (
                            <div className="h-full flex items-center justify-center">
                              <Plus size={20} className={`${darkMode ? 'text-gray-600' : 'text-gray-400'} group-hover:text-blue-500 transition-colors`} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Drag Preview Indicator */}
      {isDragging && dragPreview.length > 1 && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-xl shadow-lg z-40 animate-slideInRight">
          <div className="flex items-center space-x-2">
            <Clock size={16} />
            <span className="font-semibold">
              {dragPreview.length * 30} minutes sélectionnées
            </span>
          </div>
        </div>
      )}

      {/* Time Duration Indicator */}
      {isDragging && dragPreview.length > 1 && (
        <div className={`fixed top-20 right-4 ${darkMode ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-2xl shadow-xl z-40 p-4 animate-slideInRight`}>
          <div className="text-center">
            <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Durée sélectionnée</h3>
            <div className="flex items-center justify-center space-x-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">
                  {Math.floor((dragPreview.length * 30) / 60).toString().padStart(2, '0')}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Heures</div>
              </div>
              <div className={`text-3xl font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>:</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">
                  {((dragPreview.length * 30) % 60).toString().padStart(2, '0')}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Minutes</div>
              </div>
            </div>
            <div className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} bg-blue-50 ${darkMode ? 'bg-blue-900/20' : ''} rounded-lg px-2 py-1`}>
              {dragStart} - {dragEnd}
            </div>
            <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {dragPreview.length} créneau{dragPreview.length > 1 ? 'x' : ''} de 30 min
          </div>
        </div>
      </div>
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 animate-slideUp`}>
            {/* Modal Header */}
            <div className={`px-8 py-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedAppointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Remplissez les informations pour planifier la consultation
                  </p>
                </div>
                <button 
                  onClick={() => setShowAppointmentModal(false)}
                  className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-xl transition-all`}
                >
                  <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6">
              <div className="space-y-6">
                {/* Patient Selection */}
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Patient
                  </label>
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-2xl p-1`}>
                    <select className={`w-full px-4 py-3 ${darkMode ? 'bg-transparent text-white' : 'bg-transparent text-gray-900'} rounded-xl focus:outline-none`}>
                      <option>Sélectionner un patient</option>
                      <option>Sophie Martin - 06 12 34 56 78</option>
                      <option>Lucas Bernard - 06 98 76 54 32</option>
                      <option>Emma Petit - 06 11 22 33 44</option>
                    </select>
                  </div>
                </div>

                {/* Date and Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Date
                    </label>
                    <input 
                      type="date" 
                      className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      defaultValue="2024-01-15"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Heure de début
                    </label>
                    <input 
                      type="time" 
                      className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      defaultValue={selectedAppointment?.date_heure?.split('T')[1]?.substring(0, 5) || dragStart || "09:00"}
                    />
                  </div>
                </div>

                {/* Duration and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Durée (minutes)
                    </label>
                    <select className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}>
                      <option>15</option>
                      <option>30</option>
                      <option>45</option>
                      <option>60</option>
                      <option>90</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Priorité
                    </label>
                    <select className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}>
                      <option>Normale</option>
                      <option>Urgente</option>
                      <option>Très urgente</option>
                    </select>
                  </div>
                </div>

                {/* Motif */}
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Motif de consultation
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Décrivez le motif de la consultation..."
                    className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                  ></textarea>
                </div>

                {/* Notes */}
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Notes additionnelles
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Informations complémentaires..."
                    className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`px-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-end space-x-4`}>
              <button 
                onClick={() => setShowAppointmentModal(false)}
                className={`px-6 py-3 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-2xl font-medium transition-all`}
              >
                Annuler
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all transform hover:scale-105">
                {selectedAppointment ? 'Modifier' : 'Créer'} le rendez-vous
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Floating Button - Notion Style */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative group">
          <button className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all transform hover:scale-110 flex items-center justify-center">
            <Plus size={24} />
          </button>
          
          {/* Quick Actions Menu */}
          <div className="absolute bottom-16 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
            <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl border ${darkMode ? 'border-gray-800' : 'border-gray-200'} p-2 space-y-2 min-w-48`}>
              <button className={`w-full flex items-center space-x-3 px-4 py-3 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} rounded-xl transition-all`}>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User size={16} className="text-blue-600" />
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nouveau patient</span>
              </button>
              
              <button className={`w-full flex items-center space-x-3 px-4 py-3 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} rounded-xl transition-all`}>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar size={16} className="text-green-600" />
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nouveau RDV</span>
              </button>
              
              <button className={`w-full flex items-center space-x-3 px-4 py-3 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} rounded-xl transition-all`}>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText size={16} className="text-purple-600" />
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nouveau rapport</span>
              </button>
              
              <button className={`w-full flex items-center space-x-3 px-4 py-3 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} rounded-xl transition-all`}>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Pill size={16} className="text-orange-600" />
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nouvelle prescription</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 hidden">
        <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-3xl p-8 shadow-2xl`}>
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Chargement en cours...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCalendar;