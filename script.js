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
