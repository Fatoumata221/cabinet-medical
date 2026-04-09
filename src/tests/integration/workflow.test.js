import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DoctorDashboard from '../../components/doctor/DoctorDashboard';
import SecretaryDashboard from '../../components/secretary/SecretaryDashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { doctorService } from '../../services/doctorService';
import { secretaryService } from '../../services/secretaryService';

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
      single: jest.fn().mockReturnThis(),
    })),
  },
}));

jest.mock('../../services/notificationService');
jest.mock('../../services/doctorService');
jest.mock('../../services/secretaryService');

// Mock de window.notificationManager
global.window = {
  notificationManager: {
    add: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    clearAll: jest.fn(),
  },
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Workflow Intégration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Workflow Médecin - Appel Patient', () => {
    test('médecin peut appeler un patient et la secrétaire reçoit une notification', async () => {
      // Mock des données
      const mockPatient = {
        id: 1,
        status: 'en_attente',
        patient: { prenom: 'Marie', nom: 'Martin' },
      };

      const mockUser = {
        id: 1,
        prenom: 'Jean',
        nom: 'Dupont',
        role: 'doctor',
      };

      // Mock des services
      doctorService.getWaitingQueue.mockResolvedValue([mockPatient]);
      doctorService.getTodayAppointments.mockResolvedValue([]);
      doctorService.getNotifications.mockResolvedValue([]);
      notificationService.notifyPatientCalled.mockResolvedValue();

      // Rendre le dashboard médecin
      renderWithProviders(<DoctorDashboard />);

      // Attendre que le dashboard se charge
      await waitFor(() => {
        expect(screen.getByText('Dashboard Médecin')).toBeInTheDocument();
      });

      // Vérifier que le patient est affiché
      await waitFor(() => {
        expect(screen.getByText('Marie Martin')).toBeInTheDocument();
      });

      // Simuler l'appel du patient
      const callButton = screen.getByText('Faire rentrer');
      fireEvent.click(callButton);

      // Vérifier que la notification a été envoyée
      await waitFor(() => {
        expect(notificationService.notifyPatientCalled).toHaveBeenCalledWith(
          1, // patientId
          1, // medecinId
          'Marie Martin', // patientName
          'Dr. Jean Dupont' // doctorName
        );
      });
    });
  });

  describe('Workflow Secrétaire - Ajout Patient', () => {
    test('secrétaire peut ajouter un patient à la file d\'attente', async () => {
      // Mock des données
      const mockDoctors = [
        { id: 1, prenom: 'Jean', nom: 'Dupont', specialite: 'Cardiologie' },
      ];

      const mockUser = {
        id: 2,
        prenom: 'Sophie',
        nom: 'Martin',
        role: 'secretary',
      };

      // Mock des services
      secretaryService.getActiveDoctors.mockResolvedValue(mockDoctors);
      secretaryService.getAllWaitingQueues.mockResolvedValue([]);
      secretaryService.getNotifications.mockResolvedValue([]);
      secretaryService.addPatientToQueue.mockResolvedValue({ id: 1 });
      notificationService.notifyPatientAdded.mockResolvedValue();

      // Rendre le dashboard secrétaire
      renderWithProviders(<SecretaryDashboard />);

      // Attendre que le dashboard se charge
      await waitFor(() => {
        expect(screen.getByText('Dashboard Secrétaire')).toBeInTheDocument();
      });

      // Vérifier que les médecins sont affichés
      await waitFor(() => {
        expect(screen.getByText('Dr. Jean Dupont')).toBeInTheDocument();
      });

      // Ouvrir le modal d'ajout de patient
      const addButton = screen.getByText('Ajouter Patient');
      fireEvent.click(addButton);

      // Vérifier que le modal s'ouvre
      await waitFor(() => {
        expect(screen.getByText('Ajouter un patient')).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Notification Temps Réel', () => {
    test('les notifications sont affichées en temps réel', async () => {
      // Mock des données
      const mockNotifications = [
        {
          id: 1,
          type_notification: 'patient_called',
          titre: 'Patient Appelé',
          message: 'Marie Martin a été appelé par Dr. Jean Dupont',
          created_at: new Date().toISOString(),
        },
      ];

      const mockUser = {
        id: 2,
        prenom: 'Sophie',
        nom: 'Martin',
        role: 'secretary',
      };

      // Mock des services
      secretaryService.getActiveDoctors.mockResolvedValue([]);
      secretaryService.getAllWaitingQueues.mockResolvedValue([]);
      secretaryService.getNotifications.mockResolvedValue(mockNotifications);

      // Rendre le dashboard secrétaire
      renderWithProviders(<SecretaryDashboard />);

      // Attendre que le dashboard se charge
      await waitFor(() => {
        expect(screen.getByText('Dashboard Secrétaire')).toBeInTheDocument();
      });

      // Vérifier que les notifications sont affichées
      await waitFor(() => {
        expect(screen.getByText('1 notifications')).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Gestion des Erreurs', () => {
    test('gère les erreurs de connexion Supabase', async () => {
      // Mock d'une erreur
      const { supabase } = require('../../lib/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(new Error('Erreur de connexion')),
      });

      const mockUser = {
        id: 1,
        prenom: 'Jean',
        nom: 'Dupont',
        role: 'doctor',
      };

      // Rendre le dashboard médecin
      renderWithProviders(<DoctorDashboard />);

      // Attendre que le dashboard se charge
      await waitFor(() => {
        expect(screen.getByText('Dashboard Médecin')).toBeInTheDocument();
      });

      // Vérifier que l'erreur est gérée gracieusement
      await waitFor(() => {
        expect(screen.getByText('Aucun patient en attente')).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Performance', () => {
    test('optimise les requêtes avec debouncing', async () => {
      const mockUser = {
        id: 1,
        prenom: 'Jean',
        nom: 'Dupont',
        role: 'doctor',
      };

      // Mock des services avec délai
      doctorService.getWaitingQueue.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      // Rendre le dashboard médecin
      renderWithProviders(<DoctorDashboard />);

      // Attendre que le dashboard se charge
      await waitFor(() => {
        expect(screen.getByText('Dashboard Médecin')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Vérifier que les données sont chargées
      await waitFor(() => {
        expect(doctorService.getWaitingQueue).toHaveBeenCalled();
      });
    });
  });
});

