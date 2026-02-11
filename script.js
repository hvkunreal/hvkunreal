// =======================================
// CANDIDATURE — stockage local
// =======================================
const form = document.getElementById('form-candidature');
if(form){
  form.addEventListener('submit', function(e){
    e.preventDefault();

    const formData = {};
    [...form.elements].forEach(el => {
      if(el.name) formData[el.name] = el.value;
    });

    // Récupère les candidatures existantes dans localStorage
    const existing = JSON.parse(localStorage.getItem('candidatures') || "[]");
    existing.push(formData);
    localStorage.setItem('candidatures', JSON.stringify(existing));

    // Message succès
    form.reset();
    document.getElementById('success-msg').style.display = 'block';
  });
}

// =======================================
// ADMIN — mot de passe + affichage
// =======================================
const ADMIN_PASSWORD = "HVK2026ADMIN"; // CHANGE le mot de passe ici

const loginBtn = document.getElementById('login-btn');
if(loginBtn){
  loginBtn.addEventListener('click', () => {
    const input = document.getElementById('admin-password').value;
    if(input === ADMIN_PASSWORD){
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('admin-section').style.display = 'block';
      loadCandidatures();
    } else {
      document.getElementById('login-error').style.display = 'block';
    }
  });
}

// Fonction pour afficher les candidatures dans le tableau
function loadCandidatures(){
  const tableBody = document.querySelector('#candidature-table tbody');
  tableBody.innerHTML = "";

  const data = JSON.parse(localStorage.getItem('candidatures') || "[]");

  data.forEach(cand => {
    const row = document.createElement('tr');
    Object.values(cand).forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      row.appendChild(td);
    });
    tableBody.appendChild(row);
  });
}


// =======================================
// COMPTEURS D'ABONNÉS — YouTube & Twitch
// =======================================

// ─────────────────────────────────────────────────────────────────
// ⚠️  CONFIGURATION — Remplis ces valeurs avec tes identifiants
// ─────────────────────────────────────────────────────────────────

// YouTube :
//   1. Va sur https://console.cloud.google.com/
//   2. Crée un projet → active "YouTube Data API v3"
//   3. Génère une clé API (Credentials → Create Credentials → API key)
//   4. Colle-la ci-dessous
const YOUTUBE_API_KEY    = "AIzaSyBfJtCQDywTVpItaO6xyhxNNlIGYmumWFg";   // ← Ta clé API YouTube
const YOUTUBE_CHANNEL_ID = "UCISUJgSbXYAiylRHOLEfqlg";       // ← L'ID de ta chaîne (ex: UCxxxxxxxxxxxxxx)
//   Astuce pour trouver ton Channel ID : ouvre ta chaîne YouTube,
//   clique droit → Afficher le code source, cherche "channelId"

// Twitch :
//   1. Va sur https://dev.twitch.tv/console
//   2. Crée une application → note le Client ID
//   3. Pour le Client Secret, génère-le dans ton application
//   4. Les compteurs Twitch utilisent l'API Helix (OAuth client_credentials)
const TWITCH_CLIENT_ID     = "rvf1upmormkeotg87x0abqtjgicxsd";     // ← Client ID Twitch
const TWITCH_CLIENT_SECRET = "35xiaopqkblsh74flgjfhsdo0c2hrz"; // ← Client Secret Twitch
const TWITCH_USERNAME      = "ytb_hvk_unreal";                              // ← Ton nom d'utilisateur Twitch

// ─────────────────────────────────────────────────────────────────

/**
 * Formate un nombre pour l'affichage
 * Ex: 12345 → "12 345"  |  1234567 → "1 234 567"
 */
function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  return parseInt(n, 10).toLocaleString('fr-FR');
}

/**
 * Affiche une valeur dans un élément avec animation
 */
function setCount(elementId, value, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.innerHTML = isError
    ? `<span class="stat-error">Indisponible</span>`
    : formatNumber(value);

  el.classList.add('loaded');
}

// ─────────────────────────────────────────────────────────────────
// YOUTUBE — Récupère les abonnés via l'API YouTube Data v3
// ─────────────────────────────────────────────────────────────────
async function fetchYouTubeSubscribers() {
  // Vérifie que les clés sont configurées
  if (
    YOUTUBE_API_KEY === "REMPLACE_PAR_TA_CLE_API_YOUTUBE" ||
    YOUTUBE_CHANNEL_ID === "REMPLACE_PAR_TON_CHANNEL_ID"
  ) {
    setCount('yt-count', null, true);
    return;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const subs = data.items[0].statistics.subscriberCount;
      setCount('yt-count', subs);
    } else {
      throw new Error("Chaîne introuvable");
    }
  } catch (err) {
    console.error("[YouTube] Erreur:", err);
    setCount('yt-count', null, true);
  }
}

// ─────────────────────────────────────────────────────────────────
// TWITCH — Récupère les followers via l'API Helix (OAuth)
// ─────────────────────────────────────────────────────────────────
async function fetchTwitchFollowers() {
  // Vérifie que les clés sont configurées
  if (
    TWITCH_CLIENT_ID === "rvf1upmormkeotg87x0abqtjgicxsd" ||
    TWITCH_CLIENT_SECRET === "35xiaopqkblsh74flgjfhsdo0c2hrz"
  ) {
    setCount('twitch-count', null, true);
    return;
  }

  try {
    // Étape 1 : Récupère un token OAuth (client_credentials)
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: "client_credentials"
      })
    });

    if (!tokenRes.ok) throw new Error(`Token HTTP ${tokenRes.status}`);
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Étape 2 : Récupère l'ID utilisateur Twitch
    const userRes = await fetch(
      `https://api.twitch.tv/helix/users?login=${TWITCH_USERNAME}`,
      {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          "Authorization": `Bearer ${accessToken}`
        }
      }
    );

    if (!userRes.ok) throw new Error(`User HTTP ${userRes.status}`);
    const userData = await userRes.json();

    if (!userData.data || userData.data.length === 0) {
      throw new Error("Utilisateur Twitch introuvable");
    }

    const userId = userData.data[0].id;

    // Étape 3 : Récupère le nombre de followers
    const followRes = await fetch(
      `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}`,
      {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          "Authorization": `Bearer ${accessToken}`
        }
      }
    );

    if (!followRes.ok) throw new Error(`Follow HTTP ${followRes.status}`);
    const followData = await followRes.json();

    setCount('twitch-count', followData.total);

  } catch (err) {
    console.error("[Twitch] Erreur:", err);
    setCount('twitch-count', null, true);
  }
}

// ─────────────────────────────────────────────────────────────────
// Lancement des requêtes au chargement de la page
// ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchYouTubeSubscribers();
  fetchTwitchFollowers();
});


// =======================================
// ACCORDÉON — script existant
// =======================================
const accordions = document.querySelectorAll('.accordion-btn');

accordions.forEach(btn => {
  btn.addEventListener('click', () => {
    const content = btn.nextElementSibling;
    const maxHeight = content.style.maxHeight;

    // Fermer tous les autres
    document.querySelectorAll('.accordion-content').forEach(c => {
      if(c !== content) c.style.maxHeight = null;
    });

    // Ouvrir / fermer
    if(maxHeight){
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
});
