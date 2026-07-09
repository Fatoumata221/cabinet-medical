[1mdiff --git a/src/pages/SalleAttentePage.jsx b/src/pages/SalleAttentePage.jsx[m
[1mindex 3307458..9ae8115 100644[m
[1m--- a/src/pages/SalleAttentePage.jsx[m
[1m+++ b/src/pages/SalleAttentePage.jsx[m
[36m@@ -80,7 +80,7 @@[m [mconst SalleAttentePage = () => {[m
     // Actualisation automatique toutes les 30 secondes[m
     const interval = setInterval(fetchPatientsEnAttente, 30000);[m
     return () => clearInterval(interval);[m
[31m-  }, [userProfile?.cabinet_id]);[m
[32m+[m[32m  }, [userProfile?.tenant_id]);[m
 [m
   // Gestion du redimensionnement du panneau[m
   useEffect(() => {[m
[36m@@ -166,7 +166,7 @@[m [mconst SalleAttentePage = () => {[m
 [m
       const notifications = Array.isArray(notificationsData) ? notificationsData : [];[m
       console.log('🔔 [SalleAttente] Notifications patient_ready récupérées:', notifications.length);[m
[31m-      console.log('🔔 [SalleAttente] Cabinet ID pour notifications:', userProfile?.cabinet_id);[m
[32m+[m[32m      console.log('🔔 [SalleAttente] Tenant ID pour notifications:', userProfile?.tenant_id);[m
       setPatientReadyNotifications(notifications);[m
     } catch (error) {[m
       console.error('Erreur lors de la récupération des notifications:', error);[m
[36m@@ -219,7 +219,7 @@[m [mconst SalleAttentePage = () => {[m
 [m
       const list = Array.isArray(queueData) ? queueData : [];[m
       console.log('📊 [SalleAttente] Données brutes récupérées:', list.length, 'entrées');[m
[31m-      console.log('📊 [SalleAttente] Cabinet ID:', userProfile?.cabinet_id);[m
[32m+[m[32m      console.log('📊 [SalleAttente] Tenant ID:', userProfile?.tenant_id);[m
       console.log('📊 [SalleAttente] Statuts présents:', [...new Set(list.map(i => i.status))]);[m
       console.log('📊 [SalleAttente] Statuts arrivee des rendez-vous:', [...new Set(list.map(i => i.appointments?.statut_arrivee))]);[m
       console.log('📊 [SalleAttente] WAITING_QUEUE_ACTIVE_STATUSES:', WAITING_QUEUE_ACTIVE_STATUSES);[m
