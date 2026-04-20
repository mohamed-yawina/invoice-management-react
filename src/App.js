import './App.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { addFacture, auth, logOut } from './services/firebaseService';

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) navigate("/", { replace: true });
    });
    return () => unsub();
  }, [navigate]);

 const testFacture = async () => {
  try {
    console.log("CLICK OK");

    await addFacture({
      numero: "F001",
      date_creation: new Date().toISOString(),
      client_id: "-OqaDz6i8HDf92w7Lxhx",
      articles: [
        {
          designation: "Ordinateur",
          qte: 1,
          prix: 5000
        }
      ],
      total_ht: 5000,
      tva: 1000,
      total_ttc: 6000,
      statut: "En attente",
      validated_by_admin: false
    });

    console.log("Facture ajoutée ✅");
  } catch (e) {
    console.error("Erreur Firebase ❌ :", e);
  }
};

  if (!authReady || !user) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        {!authReady ? "Chargement…" : null}
      </div>
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <p style={{ marginBottom: 16 }}>
        Connecté en tant que <strong>{user.email}</strong>
      </p>
      <button type="button" onClick={() => logOut()} style={{ marginBottom: 24 }}>
        Déconnexion
      </button>
      <div>
        <button type="button" onClick={testFacture}>
          Ajouter Facture Test
        </button>
      </div>
    </div>
  );
}

export default App;