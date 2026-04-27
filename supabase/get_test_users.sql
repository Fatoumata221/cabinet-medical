-- Récupérer les utilisateurs de test par cabinet
SELECT 
    u.email,
    u.nom,
    u.prenom,
    u.role,
    u.actif,
    pc.nom_cabinet,
    pc.ville
FROM users u
LEFT JOIN parametres_cabinet pc ON u.tenant_id = pc.tenant_id
WHERE u.email LIKE '%@cabinet%' OR u.email LIKE '%@gmail.com'
ORDER BY pc.nom_cabinet, u.role, u.nom;
