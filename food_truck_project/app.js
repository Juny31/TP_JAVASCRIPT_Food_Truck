
const menuContainer = document.getElementById("menu-container");
let menuGlobal = [];
let panier = [];
let commandesEnCours = JSON.parse(localStorage.getItem("commandes")) || [];

// Sauvegarde dans le localStorage
function sauvegarderCommandes() {
  localStorage.setItem("commandes", JSON.stringify(commandesEnCours));
}

// Nettoyage au démarrage
commandesEnCours = commandesEnCours.filter(c => c.etat !== "✅ Livré");
sauvegarderCommandes();

// Chargement dynamique du menu
async function chargerMenu() {
  try {
    const response = await fetch("https://keligmartin.github.io/api/menu.json");
    const plats = await response.json();
    menuGlobal = plats;

    plats.forEach(plat => {
      const item = document.createElement("div");
      item.classList.add("item");
      item.innerHTML = `
        <img src="images/${plat.image}" alt="${plat.name}">
        <h3>${plat.name}</h3>
        <p>Prix : ${plat.price}€</p>
        <button onclick="ajouterAuPanier(${plat.id})">Ajouter</button>
      `;
      menuContainer.appendChild(item);
    });
  } catch (err) {
    console.error("Erreur menu :", err);
  }
}
chargerMenu();

// Ajout panier
function ajouterAuPanier(id) {
  const plat = menuGlobal.find(p => p.id === Number(id));
  const item = panier.find(p => p.id === id);
  if (item) item.quantite += 1;
  else panier.push({ ...plat, quantite: 1 });
  afficherPanier();
}

// Affichage panier
function afficherPanier() {
  const container = document.getElementById("panier-container");
  const totalSpan = document.getElementById("total");
  container.innerHTML = "";
  let total = 0;
  panier.forEach(item => {
    const div = document.createElement("div");
    div.textContent = `${item.name} x${item.quantite} = ${(item.quantite * item.price).toFixed(2)}€`;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.style.marginLeft = "10px";
    removeBtn.onclick = () => {
      panier = panier.filter(p => p.id !== item.id);
      afficherPanier();
    };
    div.appendChild(removeBtn);
    container.appendChild(div);
    total += item.quantite * item.price;
  });
  totalSpan.textContent = total.toFixed(2) + "€";
}

// Récapitulatif
function afficherRecapitulatif() {
  const recap = document.getElementById("recap-section");
  const container = document.getElementById("recap-container");
  container.innerHTML = "";
  let totalHT = 0;

  panier.forEach(item => {
    const ligne = document.createElement("div");
    const sousTotal = item.price * item.quantite;
    ligne.textContent = `${item.name} x${item.quantite} = ${sousTotal.toFixed(2)}€`;
    container.appendChild(ligne);
    totalHT += sousTotal;
  });

  const tva = totalHT * 0.2;
  const ttc = totalHT + tva;
  container.innerHTML += `<div>TVA (20%) : ${tva.toFixed(2)}€</div>
                          <div>Total TTC : ${ttc.toFixed(2)}€</div>`;
  recap.style.display = "block";
}

// Commande async
function fakePostCommande() {
  return new Promise(resolve => {
    setTimeout(() => resolve("Commande enregistrée !"), 1000);
  });
}

// Progression visuelle
function animateProgress(duration) {
  const bar = document.getElementById("progress-bar");
  bar.value = 0;
  let start = Date.now();
  const tick = () => {
    const elapsed = Date.now() - start;
    bar.value = Math.min((elapsed / duration) * 100, 100);
    if (elapsed < duration) requestAnimationFrame(tick);
  };
  tick();
}

// Valider commande
document.getElementById("valider").addEventListener("click", async () => {
  if (commandesEnCours.length >= 5) {
    alert("❌ Trop de commandes en cours.");
    return;
  }

  const id = Date.now();
  commandesEnCours.push({ id, etat: "Envoi en cours", contenu: panier.slice() });
  sauvegarderCommandes();
  afficherCommandes();

  panier = [];
  afficherPanier();
  document.getElementById("recap-section").style.display = "none";

  const suivi = document.getElementById("suivi-section");
  const etat = document.getElementById("suivi-etat");
  suivi.style.display = "block";

  etat.textContent = "Envoi de la commande...";
  animateProgress(1000);
  await fakePostCommande();

  const commande = commandesEnCours.find(c => c.id === id);
  if (!commande) return;

  commande.etat = "🧑‍🍳 Préparation";
  sauvegarderCommandes();
  afficherCommandes();
  etat.textContent = "🧑‍🍳 Préparation...";
  animateProgress(15000);
  await new Promise(r => setTimeout(r, 15000));

  commande.etat = "🛵 En livraison";
  sauvegarderCommandes();
  afficherCommandes();
  etat.textContent = "🛵 En livraison...";
  animateProgress(20000);
  await new Promise(r => setTimeout(r, 20000));

  commande.etat = "✅ Livré";
  sauvegarderCommandes();
  afficherCommandes();
  etat.textContent = "✅ Livré ! Bon appétit 🍽️";
  animateProgress(100);
});

// Afficher commandes
function afficherCommandes() {
  const ul = document.getElementById("liste-commandes");
  ul.innerHTML = "";
  commandesEnCours
    .filter(c => c.etat !== "✅ Livré")
    .forEach(c => {
      const li = document.createElement("li");
      li.textContent = `Commande ${c.id} – État : ${c.etat}`;
      if (c.etat === "🧑‍🍳 Préparation") {
        const btn = document.createElement("button");
        btn.textContent = "Annuler";
        btn.onclick = () => {
          commandesEnCours = commandesEnCours.filter(x => x.id !== c.id);
          sauvegarderCommandes();
          afficherCommandes();
        };
        li.appendChild(btn);
      }
      ul.appendChild(li);
    });
}
afficherCommandes();

// Autres boutons
document.getElementById("btn-commander").addEventListener("click", afficherRecapitulatif);
document.getElementById("annuler").addEventListener("click", () => {
  document.getElementById("recap-section").style.display = "none";
});
document.getElementById("reset").addEventListener("click", () => {
  localStorage.removeItem("commandes");
  commandesEnCours = [];
  sauvegarderCommandes();
  afficherCommandes();
  alert("Commandes réinitialisées !");
});
