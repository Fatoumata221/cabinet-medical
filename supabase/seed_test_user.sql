-- Script pour insérer un utilisateur de test
-- À exécuter après avoir créé la table users

INSERT INTO public.users (
  email,
  role,
  nom,
  prenom,
  specialite,
  telephone,
  duree_consultation,
  actif
) VALUES (
  'doctor@test.com',  -- Remplacez par l'email de votre utilisateur Supabase Auth
  'doctor',
  'Dupont',
  'Jean',
  'Médecin généraliste',
  '0123456789',
  30,
  true
) ON CONFLICT (email) DO UPDATE SET
  nom = EXCLUDED.nom,
  prenom = EXCLUDED.prenom,
  specialite = EXCLUDED.specialite,
  telephone = EXCLUDED.telephone,
  duree_consultation = EXCLUDED.duree_consultation,
  actif = EXCLUDED.actif;

-- Insérer aussi un patient de test pour la file d'attente
INSERT INTO public.patients (
  nom,
  prenom,
  date_naissance,
  telephone,
  numero_dossier,
  email,
  sexe,
  actif
) VALUES (
  'Martin',
  'Marie',
  '1985-03-15',
  '0987654321',
  'P001',
  'marie.martin@email.com',
  'F',
  true
) ON CONFLICT (numero_dossier) DO NOTHING;

-- Insérer un rendez-vous de test
INSERT INTO public.appointments (
  patient_id,
  medecin_id,
  date_heure,
  motif,
  statut,
  duree
) VALUES (
  (SELECT id FROM public.patients WHERE numero_dossier = 'P001'),
  (SELECT id FROM public.users WHERE email = 'doctor@test.com'),
  NOW() + INTERVAL '1 hour',
  'Consultation de routine',
  'confirme',
  30
) ON CONFLICT DO NOTHING;

-- Insérer un patient dans la file d'attente
INSERT INTO public.waiting_queue (
  patient_id,
  medecin_id,
  order_position,
  status,
  arrived_at
) VALUES (
  (SELECT id FROM public.patients WHERE numero_dossier = 'P001'),
  (SELECT id FROM public.users WHERE email = 'doctor@test.com'),
  1,
  'waiting',
  NOW()
) ON CONFLICT DO NOTHING;
