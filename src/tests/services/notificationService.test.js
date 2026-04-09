import { notificationService } from '../../services/notificationService';

// Mock de Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
  },
}));

// Mock de window.notificationManager
global.window = {
  notificationManager: {
    add: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    clearAll: jest.fn(),
  },
};

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('notifySecretary', () => {
    test('crée une notification pour la secrétaire', async () => {
      const notificationData = {
        type: 'test',
        titre: 'Test',
        message: 'Message de test',
        priorite: 'normale',
        data: { test: true },
      };

      const result = await notificationService.notifySecretary(notificationData);

      expect(result).toEqual([{ id: 1 }]);
    });

    test('gère les erreurs', async () => {
      const { supabase } = require('../../lib/supabase');
      supabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: null, error: new Error('Test error') }),
      });

      const notificationData = {
        message: 'Test',
      };

      await expect(notificationService.notifySecretary(notificationData)).rejects.toThrow('Test error');
    });
  });

  describe('notifyPatientCalled', () => {
    test('notifie quand un patient est appelé', async () => {
      const patientId = 1;
      const medecinId = 2;
      const patientName = 'Marie Martin';
      const doctorName = 'Dr. Jean Dupont';

      await notificationService.notifyPatientCalled(patientId, medecinId, patientName, doctorName);

      expect(window.notificationManager.add).toHaveBeenCalledWith({
        message: `${patientName} a été appelé par ${doctorName}`,
        type: 'patient_called',
        duration: 5000,
      });
    });
  });

  describe('notifyPatientEntered', () => {
    test('notifie quand un patient entre en consultation', async () => {
      const patientId = 1;
      const medecinId = 2;
      const patientName = 'Marie Martin';
      const doctorName = 'Dr. Jean Dupont';

      await notificationService.notifyPatientEntered(patientId, medecinId, patientName, doctorName);

      expect(window.notificationManager.add).toHaveBeenCalledWith({
        message: `${patientName} est entré en consultation avec ${doctorName}`,
        type: 'patient_entered',
        duration: 5000,
      });
    });
  });

  describe('notifyConsultationFinished', () => {
    test('notifie quand une consultation est terminée', async () => {
      const patientId = 1;
      const medecinId = 2;
      const patientName = 'Marie Martin';
      const doctorName = 'Dr. Jean Dupont';

      await notificationService.notifyConsultationFinished(patientId, medecinId, patientName, doctorName);

      expect(window.notificationManager.add).toHaveBeenCalledWith({
        message: `Consultation terminée pour ${patientName} par ${doctorName}`,
        type: 'consultation_finished',
        duration: 5000,
      });
    });
  });

  describe('getNotifications', () => {
    test('récupère les notifications d\'un utilisateur', async () => {
      const userId = 1;
      const mockNotifications = [
        { id: 1, message: 'Test 1' },
        { id: 2, message: 'Test 2' },
      ];

      const { supabase } = require('../../lib/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      });

      const result = await notificationService.getNotifications(userId);

      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    test('marque une notification comme lue', async () => {
      const notificationId = 1;
      const mockUpdatedNotification = { id: 1, lu: true };

      const { supabase } = require('../../lib/supabase');
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdatedNotification, error: null }),
      });

      const result = await notificationService.markAsRead(notificationId);

      expect(result).toEqual(mockUpdatedNotification);
    });
  });

  describe('deleteNotification', () => {
    test('supprime une notification', async () => {
      const notificationId = 1;

      const { supabase } = require('../../lib/supabase');
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      await notificationService.deleteNotification(notificationId);

      expect(supabase.from).toHaveBeenCalledWith('notifications_realtime');
    });
  });

  describe('cleanupOldNotifications', () => {
    test('supprime les anciennes notifications', async () => {
      const { supabase } = require('../../lib/supabase');
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      await notificationService.cleanupOldNotifications();

      expect(supabase.from).toHaveBeenCalledWith('notifications_realtime');
    });
  });

  describe('getNotificationStats', () => {
    test('récupère les statistiques des notifications', async () => {
      const userId = 1;
      const mockStats = {
        total: 10,
        unread: 5,
        today: 3,
      };

      const { supabase } = require('../../lib/supabase');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockStats, error: null }),
      });

      const result = await notificationService.getNotificationStats(userId);

      expect(result).toEqual(mockStats);
    });
  });
});

