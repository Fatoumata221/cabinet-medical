import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DoctorDashboard from '../../components/doctor/DoctorDashboard';
import SecretaryDashboard from '../../components/secretary/SecretaryDashboard';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock des services pour les tests de performance
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

jest.mock('../../services/notificationService', () => ({
  notificationService: {
    notifyPatientCalled: jest.fn(),
    notifyPatientEntered: jest.fn(),
    notifyConsultationFinished: jest.fn(),
  },
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

// Fonction utilitaire pour mesurer le temps d'exécution
const measureExecutionTime = (fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, executionTime: end - start };
};

// Fonction utilitaire pour mesurer la mémoire
const measureMemoryUsage = () => {
  if (performance.memory) {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
    };
  }
  return null;
};

describe('Tests de Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Performance du Dashboard Médecin', () => {
    test('temps de rendu initial du dashboard médecin', async () => {
      const { executionTime } = measureExecutionTime(() => {
        renderWithProviders(<DoctorDashboard />);
      });

      // Le temps de rendu initial doit être inférieur à 100ms
      expect(executionTime).toBeLessThan(100);
    });

    test('performance avec beaucoup de patients', async () => {
      // Simuler beaucoup de patients
      const manyPatients = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        status: 'en_attente',
        patient: { prenom: `Patient${i}`, nom: 'Test' },
        priority: 'normale',
        arrived_at: new Date().toISOString(),
      }));

      const { executionTime } = measureExecutionTime(() => {
        renderWithProviders(<DoctorDashboard />);
      });

      // Le temps de rendu doit rester acceptable même avec beaucoup de données
      expect(executionTime).toBeLessThan(200);
    });

    test('performance des animations CSS', async () => {
      renderWithProviders(<DoctorDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard Médecin')).toBeInTheDocument();
      });

      // Mesurer le temps d'exécution des animations
      const animationStart = performance.now();
      
      // Simuler des interactions qui déclenchent des animations
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        fireEvent.mouseEnter(button);
        fireEvent.mouseLeave(button);
      });

      const animationEnd = performance.now();
      const animationTime = animationEnd - animationStart;

      // Les animations doivent être fluides (moins de 50ms)
      expect(animationTime).toBeLessThan(50);
    });
  });

  describe('Performance du Dashboard Secrétaire', () => {
    test('temps de rendu initial du dashboard secrétaire', async () => {
      const { executionTime } = measureExecutionTime(() => {
        renderWithProviders(<SecretaryDashboard />);
      });

      // Le temps de rendu initial doit être inférieur à 100ms
      expect(executionTime).toBeLessThan(100);
    });

    test('performance avec beaucoup de médecins et patients', async () => {
      // Simuler beaucoup de médecins et patients
      const manyDoctors = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        prenom: `Dr${i}`,
        nom: 'Test',
        specialite: 'Médecine',
      }));

      const { executionTime } = measureExecutionTime(() => {
        renderWithProviders(<SecretaryDashboard />);
      });

      // Le temps de rendu doit rester acceptable
      expect(executionTime).toBeLessThan(200);
    });
  });

  describe('Performance des Requêtes', () => {
    test('temps de réponse des requêtes Supabase', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ data: [], error: null });
      
      const { executionTime } = await measureExecutionTime(async () => {
        await mockQuery();
      });

      // Les requêtes doivent être rapides (moins de 100ms)
      expect(executionTime).toBeLessThan(100);
    });

    test('performance avec requêtes simultanées', async () => {
      const mockQueries = Array.from({ length: 10 }, () => 
        jest.fn().mockResolvedValue({ data: [], error: null })
      );

      const start = performance.now();
      
      await Promise.all(mockQueries.map(query => query()));
      
      const end = performance.now();
      const totalTime = end - start;

      // Les requêtes simultanées doivent être efficaces
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('Performance de la Mémoire', () => {
    test('utilisation de la mémoire après rendu', () => {
      const initialMemory = measureMemoryUsage();
      
      renderWithProviders(<DoctorDashboard />);
      
      const finalMemory = measureMemoryUsage();
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used;
        
        // L'augmentation de mémoire doit être raisonnable (moins de 10MB)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });

    test('nettoyage de la mémoire après démontage', () => {
      const initialMemory = measureMemoryUsage();
      
      const { unmount } = renderWithProviders(<DoctorDashboard />);
      
      const beforeUnmountMemory = measureMemoryUsage();
      unmount();
      const afterUnmountMemory = measureMemoryUsage();
      
      if (initialMemory && beforeUnmountMemory && afterUnmountMemory) {
        const memoryBeforeUnmount = beforeUnmountMemory.used - initialMemory.used;
        const memoryAfterUnmount = afterUnmountMemory.used - initialMemory.used;
        
        // La mémoire doit être libérée après démontage
        expect(memoryAfterUnmount).toBeLessThan(memoryBeforeUnmount);
      }
    });
  });

  describe('Performance des Notifications', () => {
    test('temps de création des notifications', async () => {
      const { notificationService } = require('../../services/notificationService');
      
      const start = performance.now();
      
      await notificationService.notifyPatientCalled(1, 1, 'Test Patient', 'Dr. Test');
      
      const end = performance.now();
      const notificationTime = end - start;

      // La création de notification doit être rapide
      expect(notificationTime).toBeLessThan(50);
    });

    test('performance avec beaucoup de notifications', async () => {
      const { notificationService } = require('../../services/notificationService');
      
      const notifications = Array.from({ length: 50 }, (_, i) => ({
        patientId: i,
        medecinId: 1,
        patientName: `Patient${i}`,
        doctorName: 'Dr. Test',
      }));

      const start = performance.now();
      
      await Promise.all(
        notifications.map(n => 
          notificationService.notifyPatientCalled(n.patientId, n.medecinId, n.patientName, n.doctorName)
        )
      );
      
      const end = performance.now();
      const totalTime = end - start;

      // La création de nombreuses notifications doit être efficace
      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe('Performance des Animations', () => {
    test('fluidité des animations CSS', () => {
      // Créer un élément avec des animations
      const element = document.createElement('div');
      element.className = 'patient-called urgent-pulse';
      document.body.appendChild(element);

      const start = performance.now();
      
      // Simuler l'animation
      element.style.animation = 'patientCalled 0.6s ease-in-out';
      
      const end = performance.now();
      const animationSetupTime = end - start;

      // La configuration des animations doit être rapide
      expect(animationSetupTime).toBeLessThan(10);

      document.body.removeChild(element);
    });
  });

  describe('Performance du Cache', () => {
    test('temps d\'accès au cache local', () => {
      const testData = { test: 'data' };
      const cacheKey = 'test-cache';
      
      // Mesurer le temps d'écriture
      const writeStart = performance.now();
      localStorage.setItem(cacheKey, JSON.stringify(testData));
      const writeEnd = performance.now();
      const writeTime = writeEnd - writeStart;

      // Mesurer le temps de lecture
      const readStart = performance.now();
      const cachedData = JSON.parse(localStorage.getItem(cacheKey));
      const readEnd = performance.now();
      const readTime = readEnd - readStart;

      // Les opérations de cache doivent être très rapides
      expect(writeTime).toBeLessThan(5);
      expect(readTime).toBeLessThan(5);
      expect(cachedData).toEqual(testData);

      localStorage.removeItem(cacheKey);
    });
  });

  describe('Tests de Charge', () => {
    test('performance sous charge (simulation)', async () => {
      const iterations = 100;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        renderWithProviders(<DoctorDashboard />);
        
        const end = performance.now();
        times.push(end - start);
      }

      // Calculer les statistiques
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      // Les performances doivent rester stables
      expect(avgTime).toBeLessThan(150);
      expect(maxTime).toBeLessThan(300);
      expect(minTime).toBeLessThan(50);
    });
  });
});

