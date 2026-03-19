/**
 * firebase-init.js
 * Inicialización centralizada de Firebase.
 * Cargado por las 4 páginas justo después de los scripts CDN de Firebase
 * y antes del script inline de cada página.
 *
 * Requisito: los scripts CDN de Firebase compat ya deben estar
 * cargados ANTES de este archivo en cada HTML:
 *   firebase-app-compat.js
 *   firebase-firestore-compat.js
 *   firebase-database-compat.js
 *
 * Cada página puede continuar usando `const db = firebase.firestore()`
 * en su propio script; firebase.firestore() devuelve el mismo singleton.
 */
(function () {
  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyBxBmuQY5n5ecf5Vy6vLPu_qKP726IaLzs",
    authDomain: "gymnastics-club-by-ibime.firebaseapp.com",
    databaseURL: "https://gymnastics-club-by-ibime-default-rtdb.firebaseio.com/",
    projectId: "gymnastics-club-by-ibime",
    appId: "1:849277925066:web:6ef91b240277fe24846633"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
})();
