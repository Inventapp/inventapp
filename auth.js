// auth.js
import { auth, db, doc, getDoc, setDoc, onAuthStateChanged } from './firebase-config.js';

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-root').style.display = 'none';
    return;
  }
  
  try {
    const uRef = doc(db, 'users', user.uid);
    const uSnap = await getDoc(uRef);
    
    // ... [Aquí mantienes tu lógica existente de creación de perfil/admin] ...
    
    // En lugar de window._currentUser, usamos una variable local exportable
    currentUser = { uid: user.uid, ...uSnap.data() };
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-root').style.display = 'block';
    
    // Inicializar el resto de la app
    iniciarAplicacion(currentUser); 
    
  } catch(e) {
    console.error('Error crítico en autenticación:', e);
    // Ya no ignoramos el error, le damos feedback visual al usuario
    showToast('Error al cargar el perfil. Intenta recargar la página.', 'error');
  }
});

export const getCurrentUser = () => currentUser;