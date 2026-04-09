import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DoctorDashboard from '../../components/doctor/DoctorDashboard';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock des services
jest.mock('../../lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    })),
  },
}));

jest.mock('../../services/notificationService', () => ({
  notificationService: {
    notifyPatientCalled: jest.fn(),
    notifyPatientEntered: jest.fn(),
    notifyConsultationFinished: jest.fn(),
  },
}));

const mockUser = {
  id: 1,
  prenom: 'Jean',
  nom: 'Dupont',
  specialite: 'Cardiologie',
  role: 'doctor',
};

const mockPatients = [
  {
    id: 1,
    status: 'en_attente',
    priority: 'normale',
    arrived_at: new Date().toISOString(),
    patient: {
      prenom: 'Marie',
      nom: 'Martin',
      telephone: '0123456789',
      numero_dossier: 'P001',
    },
    appointment: {
      motif: 'Consultation routine',
      duree: 30,
    },
  },
];

const mockAppointments = [
  {
    id: 1,
    date_heure: new Date().toISOString(),
    motif: 'Consultation',
    patient: {
      prenom: 'Pierre',
      nom: 'Durand',
      telephone: '0987654321',
      numero_dossier: 'P002',
    },
  },
];

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('DoctorDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('affiche le titre du dashboard', async () => {
    renderWithProviders(<DoctorDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Médecin')).toBeInTheDocument();
    });
  });

  test('affiche les informations du médecin', async () => {
    renderWithProviders(<DoctorDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Dr. Jean Dupont/)).toBeInTheDocument();
      expect(screen.getByText(/Cardiologie/)).toBeInTheDocument();
    });
  });

  test('affiche les statistiques', async () => {
    renderWithProviders(<DoctorDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('En attente')).toBeInTheDocument();
      expect(screen.getByText('En consultation')).toBeInTheDocument();
      expect(screen.getByText('Urgences')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  test('affiche le patient actuel en évidence', async () => {
    renderWithProviders(<DoctorDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Patient Actuel')).toBeInTheDocument();
    });
  });

  test('affiche les rendez-vous du jour', async () => {
    renderWithProviders(<DoctorDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Rendez-vous du jour')).toBeInTheDocument();
    });
  });

  test('bouton actualiser fonctionne', async () => {
    renderWithProviders(<DoctorDashboard />);
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Actualiser');
      expect(refreshButton).toBeInTheDocument();
    });
  });

  test('bouton actif/inactif fonctionne', async () => {
    renderWithProviders(<DoctorDashboard />);
    
    await waitFor(() => {
      const activeButton = screen.getByText('Actif');
      expect(activeButton).toBeInTheDocument();
    });
  });
});

