-- Script de remplissage de données pour le cabinet médical
-- Ce script insère des données de test réalistes

-- ===== UTILISATEURS (MÉDECINS ET SECRÉTAIRES) =====

-- Médecins
INSERT INTO public.users (email, role, nom, prenom, specialite) VALUES
('dr.diallo@cabinet.com', 'doctor', 'Diallo', 'Mamadou', 'Médecine générale'),
('dr.ndiaye@cabinet.com', 'doctor', 'Ndiaye', 'Fatou', 'Cardiologie'),
('dr.seck@cabinet.com', 'doctor', 'Seck', 'Ousmane', 'Dermatologie'),
('dr.fall@cabinet.com', 'doctor', 'Fall', 'Aminata', 'Pédiatrie'),
('dr.ba@cabinet.com', 'doctor', 'Ba', 'Ibrahima', 'Gynécologie'),
('dr.sarr@cabinet.com', 'doctor', 'Sarr', 'Aissatou', 'Ophtalmologie'),
('dr.cisse@cabinet.com', 'doctor', 'Cissé', 'Moussa', 'Orthopédie'),
('dr.thiam@cabinet.com', 'doctor', 'Thiam', 'Khady', 'Neurologie')
ON CONFLICT (email) DO NOTHING;

-- Secrétaires
INSERT INTO public.users (email, role, nom, prenom) VALUES
('secretaire1@cabinet.com', 'secretary', 'Gueye', 'Awa'),
('secretaire2@cabinet.com', 'secretary', 'Diouf', 'Mame Fatou'),
('secretaire3@cabinet.com', 'secretary', 'Sy', 'Mariama')
ON CONFLICT (email) DO NOTHING;

-- Admin
INSERT INTO public.users (email, role, nom, prenom) VALUES
('admin@cabinet.com', 'admin', 'Sow', 'Administrateur')
ON CONFLICT (email) DO NOTHING;

-- ===== PATIENTS =====

INSERT INTO public.patients (nom, prenom, date_naissance, telephone, adresse, assurance) VALUES
('Diallo', 'Aminata', '1985-03-15', '771234567', 'Quartier Médina, Dakar', 'IPM'),
('Ndiaye', 'Mamadou', '1978-07-22', '772345678', 'Quartier Plateau, Dakar', 'IPRES'),
('Seck', 'Fatou', '1992-11-08', '773456789', 'Quartier Liberté, Dakar', 'IPM'),
('Fall', 'Ousmane', '1965-04-30', '774567890', 'Quartier Parcelles Assainies, Dakar', 'IPRES'),
('Ba', 'Aissatou', '1988-09-12', '775678901', 'Quartier Grand Yoff, Dakar', 'IPM'),
('Sarr', 'Ibrahima', '1973-12-25', '776789012', 'Quartier Almadies, Dakar', 'IPRES'),
('Cissé', 'Khady', '1995-06-18', '777890123', 'Quartier Mermoz, Dakar', 'IPM'),
('Thiam', 'Moussa', '1980-01-03', '778901234', 'Quartier Sacré-Cœur, Dakar', 'IPRES'),
('Gueye', 'Mariama', '1990-08-14', '779012345', 'Quartier Fann, Dakar', 'IPM'),
('Diouf', 'Cheikh', '1987-05-20', '770123456', 'Quartier Point E, Dakar', 'IPRES'),
('Sy', 'Awa', '1976-10-07', '771234568', 'Quartier Ouakam, Dakar', 'IPM'),
('Mbaye', 'Alioune', '1993-02-28', '772345679', 'Quartier Ngor, Dakar', 'IPRES'),
('Faye', 'Binta', '1982-12-10', '773456780', 'Quartier Yoff, Dakar', 'IPM'),
('Ndour', 'Modou', '1989-07-04', '774567891', 'Quartier Hann, Dakar', 'IPRES'),
('Wade', 'Seynabou', '1971-03-21', '775678902', 'Quartier Colobane, Dakar', 'IPM'),
('Diop', 'Pape', '1996-11-30', '776789013', 'Quartier Dieuppeul, Dakar', 'IPRES'),
('Kane', 'Adama', '1984-04-16', '777890124', 'Quartier Cambérène, Dakar', 'IPM'),
('Sow', 'Fatoumata', '1986-08-25', '778901235', 'Quartier Pikine, Dakar', 'IPRES'),
('Camara', 'Lamine', '1979-01-12', '779012346', 'Quartier Guédiawaye, Dakar', 'IPM'),
('Touré', 'Ndèye', '1991-06-08', '770123457', 'Quartier Rufisque, Dakar', 'IPRES'),
('Keita', 'Souleymane', '1974-09-19', '771234569', 'Quartier Thiaroye, Dakar', 'IPM'),
('Baldé', 'Oumou', '1988-12-03', '772345680', 'Quartier Keur Massar, Dakar', 'IPRES'),
('Traoré', 'Bakary', '1983-05-27', '773456781', 'Quartier Malika, Dakar', 'IPM'),
('Konaté', 'Aïda', '1994-10-14', '774567892', 'Quartier Yeumbeul, Dakar', 'IPRES'),
('Sidibé', 'Mamadou Lamine', '1977-02-08', '775678903', 'Quartier Keur Mbaye Fall, Dakar', 'IPM')
ON CONFLICT DO NOTHING;

-- ===== RENDEZ-VOUS =====

-- Récupérer les IDs des médecins et patients
DO $$
DECLARE
    medecin_ids bigint[];
    patient_ids bigint[];
    current_date date := CURRENT_DATE;
    appointment_date timestamp with time zone;
    i integer;
    j integer;
    medecin_id bigint;
    patient_id bigint;
    motifs text[] := ARRAY[
        'Consultation de routine',
        'Suivi traitement',
        'Examen médical',
        'Contrôle tension',
        'Vaccination',
        'Analyse de sang',
        'Échographie',
        'Radiographie',
        'Consultation urgente',
        'Bilan de santé'
    ];
    statuts text[] := ARRAY['confirme', 'en_attente', 'annule'];
    durees integer[] := ARRAY[15, 30, 45, 60];
BEGIN
    -- Récupérer les IDs des médecins
    SELECT array_agg(id) INTO medecin_ids FROM public.users WHERE role = 'doctor';
    
    -- Récupérer les IDs des patients
    SELECT array_agg(id) INTO patient_ids FROM public.patients;
    
    -- Créer des rendez-vous pour les 30 prochains jours
    FOR i IN 0..29 LOOP
        appointment_date := current_date + (i || ' days')::interval;
        
        -- Créer 3-8 rendez-vous par jour
        FOR j IN 1..(3 + (i % 6)) LOOP
            -- Sélectionner un médecin et un patient aléatoires
            medecin_id := medecin_ids[1 + (i + j) % array_length(medecin_ids, 1)];
            patient_id := patient_ids[1 + (i + j) % array_length(patient_ids, 1)];
            
            -- Heure entre 8h et 18h
            appointment_date := appointment_date + ((8 + (j % 10)) || ' hours')::interval + ((j * 15) || ' minutes')::interval;
            
            -- Insérer le rendez-vous
            INSERT INTO public.appointments (patient_id, medecin_id, date_heure, motif, statut, duree) VALUES
            (
                patient_id,
                medecin_id,
                appointment_date,
                motifs[1 + (i + j) % array_length(motifs, 1)],
                statuts[1 + (i + j) % array_length(statuts, 1)],
                durees[1 + (i + j) % array_length(durees, 1)]
            );
        END LOOP;
    END LOOP;
END $$;

-- ===== CONSULTATIONS =====

-- Créer des consultations basées sur les rendez-vous terminés
INSERT INTO public.consultations (patient_id, medecin_id, date_consultation, motif, diagnostic, traitement, notes)
SELECT 
    a.patient_id,
    a.medecin_id,
    a.date_heure::date,
    a.motif,
    CASE 
        WHEN a.motif LIKE '%routine%' THEN 'État général satisfaisant'
        WHEN a.motif LIKE '%tension%' THEN 'Tension artérielle normale'
        WHEN a.motif LIKE '%traitement%' THEN 'Traitement efficace'
        ELSE 'Examen normal'
    END,
    CASE 
        WHEN a.motif LIKE '%vaccination%' THEN 'Vaccin administré'
        WHEN a.motif LIKE '%traitement%' THEN 'Poursuite du traitement'
        ELSE 'Aucun traitement nécessaire'
    END,
    'Consultation réalisée avec succès'
FROM public.appointments a
WHERE a.statut = 'confirme'
AND a.date_heure < CURRENT_DATE
LIMIT 50;

-- ===== FACTURES =====

-- Créer des factures pour les consultations
INSERT INTO public.invoices (patient_id, consultation_id, montant, statut_paiement)
SELECT 
    c.patient_id,
    c.id,
    75.00, -- Montant total
    CASE 
        WHEN random() > 0.3 THEN 'paye'
        ELSE 'en_attente'
    END
FROM public.consultations c
LIMIT 30;

-- ===== PRESCRIPTIONS =====

-- Créer des prescriptions pour certaines consultations
INSERT INTO public.prescriptions (patient_id, medecin_id, medicaments, posologie, date_prescription, statut)
SELECT 
    c.patient_id,
    c.medecin_id,
    CASE 
        WHEN random() > 0.7 THEN 'Paracétamol 500mg'
        WHEN random() > 0.7 THEN 'Ibuprofène 400mg'
        WHEN random() > 0.7 THEN 'Oméprazole 20mg'
        ELSE 'Vitamine D 1000 UI'
    END,
    CASE 
        WHEN random() > 0.5 THEN '1 comprimé 3 fois par jour'
        ELSE '1 comprimé par jour'
    END,
    c.date_consultation,
    'active'
FROM public.consultations c
WHERE random() > 0.6
LIMIT 20;

-- ===== FILE D'ATTENTE =====

-- Créer des entrées dans la file d'attente pour aujourd'hui
DO $$
DECLARE
    medecin_ids bigint[];
    patient_ids bigint[];
    i integer;
    medecin_id bigint;
    patient_id bigint;
    statuses text[] := ARRAY['waiting', 'present', 'in_consultation'];
BEGIN
    -- Récupérer les IDs des médecins
    SELECT array_agg(id) INTO medecin_ids FROM public.users WHERE role = 'doctor';
    
    -- Récupérer les IDs des patients
    SELECT array_agg(id) INTO patient_ids FROM public.patients;
    
    -- Créer des entrées dans la file d'attente
    FOR i IN 1..15 LOOP
        medecin_id := medecin_ids[1 + (i % array_length(medecin_ids, 1))];
        patient_id := patient_ids[1 + (i % array_length(patient_ids, 1))];
        
        INSERT INTO public.waiting_queue (patient_id, medecin_id, order_position, status, arrived_at)
        VALUES (
            patient_id,
            medecin_id,
            i,
            statuses[1 + (i % array_length(statuses, 1))],
            CURRENT_TIMESTAMP - (random() * interval '2 hours')
        );
    END LOOP;
END $$;

-- ===== NOTIFICATIONS =====

-- Note: La table notifications n'existe pas dans le schéma fourni
-- Si vous avez besoin de notifications, vous devrez créer cette table
-- ou utiliser une autre approche pour les notifications

-- Afficher un résumé des données insérées
SELECT 
    'Résumé des données insérées' as info,
    (SELECT COUNT(*) FROM public.users WHERE role = 'doctor') as medecins,
    (SELECT COUNT(*) FROM public.users WHERE role = 'secretary') as secretaires,
    (SELECT COUNT(*) FROM public.patients) as patients,
    (SELECT COUNT(*) FROM public.appointments) as rendez_vous,
    (SELECT COUNT(*) FROM public.consultations) as consultations,
    (SELECT COUNT(*) FROM public.invoices) as factures,
    (SELECT COUNT(*) FROM public.prescriptions) as prescriptions,
    (SELECT COUNT(*) FROM public.waiting_queue) as file_attente;
