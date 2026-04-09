import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NewCalendar from '../../components/NewCalendar';

const MyCalendar = () => {
  const { userProfile } = useAuth();
  
  if (!userProfile?.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <NewCalendar 
        selectedDoctorFilter={String(userProfile.id)}
        disableDoctorFilter={true}
        onDoctorFilterChange={(value) => {
          // Le filtre est déjà fixé sur le médecin connecté, 
          // mais on garde cette prop pour la compatibilité
          console.log('Filtre médecin changé:', value);
        }}
      />
    </div>
  );
};

export default MyCalendar;
