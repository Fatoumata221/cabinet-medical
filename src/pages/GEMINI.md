# `Dashboard.jsx` Component

## 1. Purpose and Overview

The `Dashboard.jsx` component is the main landing page for authenticated users in the application. It provides a high-level overview of the medical practice's daily operations. The dashboard is role-based, meaning its content and available actions change based on the logged-in user's role (e.g., `admin`, `secretaire`, `doctor`).

## 2. Key Features

The dashboard is composed of several widgets:

*   **Header**: Displays a welcome message with the user's name and provides a button to navigate to the "Personnalisation" page (for `admin` and `doctor` roles) and a control to toggle notification sounds.
*   **Statistics Cards**: A set of cards showing key metrics:
    *   Total Patients
    *   Appointments Today
    *   Patients in Waiting Queue
    *   Completed Consultations
    *   Total Revenue
    *   Total Users
*   **Waiting Queue**: Shows a list of patients currently waiting, grouped by doctor. This section is intended to be updated in real-time.
*   **Notifications**: Displays a list of recent notifications. Users can mark notifications as read by clicking on them.
*   **Integrated Calendar**: A calendar view to display appointments.
*   **Quick Actions**: A set of buttons for common actions, available to `admin` and `secretaire` roles:
    *   Create a New Patient
    *   Create a New Appointment
    *   Create a New Invoice
*   **Test Component**: Includes a `TestNotifications` component for development and testing of the notification system.

## 3. Technical Implementation

*   **State Management**: Uses React's `useState`, `useEffect`, and `useRef` hooks for managing component state, side effects, and DOM references (for the notification sound).
*   **Authentication & Authorization**: Relies on `useAuth()` from `../contexts/AuthContext.jsx` to get the current user and check their roles using `hasRole()`. This is used to conditionally render UI elements.
*   **Routing**: Uses `useNavigate()` from `react-router-dom` for programmatic navigation.
*   **Styling**: Styled with Tailwind CSS and uses `framer-motion` for animations to improve user experience. Icons are from the `lucide-react` library.
*   **Data Fetching**: The `loadData` function is responsible for fetching the dashboard data. **Currently, it uses placeholder data and simulated real-time updates.**
    *   **TODO**: Replace the mock data and `setInterval` simulation with actual API calls to the backend service. The real-time functionality should be implemented using WebSockets or a similar technology.

## 4. How to Work with This Component

*   **Adding a new stat card**:
    1.  Update the `stats` state in the `useState` hook.
    2.  Add a new `<motion.div>` element in the statistics grid, following the existing structure.
    3.  Update the `loadData` function to fetch the new statistic.
*   **Modifying the waiting queue**:
    1.  The real-time logic is currently simulated in a `useEffect` hook. To connect it to the backend, you'll need to integrate a real-time service (e.g., via `useRealtimeService` if available in the project).
    2.  The data structure for a waiting queue item should be consistent with the backend.
*   **Customizing for roles**:
    1.  Use the `hasRole(['role1', 'role2'])` function from `useAuth` to wrap any JSX that should be visible only to specific roles.
✦ Analyse du Sélecteur de Dents

  Voici une analyse du sélecteur de dents basée sur les fichiers MouthCanvas.jsx et useToothSelector.js.

  Résumé

  Le sélecteur de dents est implémenté avec un Canvas HTML5 (MouthCanvas.jsx) pour le rendu et un hook personnalisé (useToothSelector.js) pour la   
  gestion de l'état des dents. Il permet aux utilisateurs de cliquer sur les dents pour les sélectionner/désélectionner et de définir leur état     
  (sain, sélectionné, carie, etc.).

  MouthCanvas.jsx - La Vue

   - Rendu : Utilise un élément <canvas> pour dessiner un schéma dentaire réactif qui s'adapte à son conteneur tout en conservant les proportions.  
   - Logique de Dessin : La fonction drawTooth, avec les utilitaires de drawingUtils.js, dessine chaque dent en utilisant les coordonnées et les    
     chemins prédéfinis dans toothMap.js et toothPaths.js. L'apparence de la dent varie selon son state.
   - Détection de Clic : La fonction handleCanvasClick gère la détection des clics. Elle calcule les coordonnées du clic et effectue un "hit        
     testing" sur un canvas en mémoire. Elle parcourt les dents et utilise isPointInPath pour identifier la dent cliquée.
   - Props :
       - teeth : Un objet représentant l'état de toutes les dents.
       - onToothClick : Une fonction de rappel déclenchée lors d'un clic sur une dent.
       - readOnly : Un booléen pour désactiver les interactions.

  useToothSelector.js - La Logique (Hook)

   - Gestion d'État : Utilise le hook useState pour gérer l'objet teeth, où les clés sont les toothId et les valeurs sont des objets contenant      
     l'state de la dent.
   - `handleToothClick` : Cette fonction bascule l'état d'une dent entre "sain" et "sélectionné". Si une dent a une autre condition, un clic la     
     mettra également à "sélectionné".
   - `setToothState` : Une fonction pour définir directement un état spécifique pour une dent.
   - `getSelectedTeeth` : Une fonction utilitaire pour obtenir un tableau des toothId actuellement sélectionnés.
   - Rappel `onChange` : Le hook peut accepter un rappel onChange pour notifier les composants parents des changements d'état des dents.

  Modèle Architectural

  L'implémentation suit une bonne séparation des préoccupations :

   1. Vue/Rendu (`MouthCanvas.jsx`) : Gère uniquement le dessin du schéma dentaire et la détection des entrées utilisateur sur le canvas.
   2. État/Logique (`useToothSelector.js`) : Encapsule la logique métier pour la sélection des dents et la gestion de leurs états.
   3. Configuration/Données (`toothMap.js`, `constants.js`, etc.) : Les données statiques sont séparées pour une maintenance facilitée.

  Fonctionnement

   1. Un composant parent utilise le hook useToothSelector pour obtenir l'objet d'état teeth et le gestionnaire handleToothClick.
   2. Il rend ensuite le composant <MouthCanvas /> en lui passant teeth et handleToothClick comme props.
   3. Lorsqu'un utilisateur clique sur le canvas, MouthCanvas identifie la dent cliquée et appelle la prop onToothClick (qui est handleToothClick). 
   4. handleToothClick met à jour l'état teeth dans le hook.
   5. Cette mise à jour provoque un nouveau rendu du composant parent, qui à son tour met à jour MouthCanvas avec le nouvel état teeth, affichant   
      ainsi la sélection.

  Améliorations Potentielles

   1. Performance : La détection de clic actuelle, bien que suffisante pour environ 32 dents, pourrait être optimisée avec un partitionnement       
      spatial (ex: quadtree) pour des canvas plus complexes, mais ce serait une sur-optimisation ici.
   2. Accessibilité : Le composant basé sur canvas est inaccessible aux lecteurs d'écran. Une représentation non visuelle alternative (ex: une liste
      de cases à cocher) serait nécessaire pour la conformité.
   3. Cycle d'États : La logique dans handleToothClick pourrait être étendue pour parcourir plus d'états, au lieu de simplement basculer entre      
      HEALTHY et SELECTED.
   4. Découplage : La logique de transformation est dupliquée dans handleCanvasClick et redrawCanvas, ce qui est source d'erreurs potentielles. Une 
      technique alternative consisterait à dessiner chaque dent avec une couleur unique sur un canvas "hit" hors écran, simplifiant la détection de 
      clic en lisant la couleur du pixel à l'endroit du clic.

  En résumé, c'est une implémentation solide et bien structurée d'un composant interactif personnalisé en React.
  Y a-t-il une partie que vous souhaiteriez que j'analyse plus en détail, ou préférez-vous que j'examine une autre partie du code ?


