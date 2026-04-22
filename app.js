'use strict';

// ── Constantes ──────────────────────────────────────────────────────────────

const CLE_STORAGE = 'monbudget_transactions';

const CATEGORIES = {
  alimentation: { label: 'Alimentation', emoji: '🛒', couleur: '#f39c12' },
  logement:     { label: 'Logement',     emoji: '🏠', couleur: '#3498db' },
  transport:    { label: 'Transport',    emoji: '🚗', couleur: '#9b59b6' },
  loisirs:      { label: 'Loisirs',      emoji: '🎬', couleur: '#1abc9c' },
  sante:        { label: 'Santé',        emoji: '❤️', couleur: '#e74c3c' },
  autres:       { label: 'Autres',       emoji: '📦', couleur: '#95a5a6' },
};

const DEMO = [
  { type: 'revenu',  montant: 2400,  categorie: 'autres',       date: aujourdhuiISO(-15), description: 'Salaire avril' },
  { type: 'depense', montant: 750,   categorie: 'logement',     date: aujourdhuiISO(-14), description: 'Loyer' },
  { type: 'depense', montant: 87.50, categorie: 'alimentation', date: aujourdhuiISO(-7),  description: 'Courses semaine' },
  { type: 'depense', montant: 45,    categorie: 'transport',    date: aujourdhuiISO(-5),  description: 'Abonnement transport' },
  { type: 'depense', montant: 30,    categorie: 'loisirs',      date: aujourdhuiISO(-2),  description: 'Cinéma + resto' },
];

// ── Utilitaires ──────────────────────────────────────────────────────────────

function genererID() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function aujourdhuiISO(decalageJours = 0) {
  const d = new Date();
  d.setDate(d.getDate() + decalageJours);
  return d.toISOString().slice(0, 10);
}

function formaterDate(iso) {
  const [a, m, j] = iso.split('-');
  return `${j}/${m}/${a}`;
}

function formaterMontant(n) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// ── Persistance ──────────────────────────────────────────────────────────────

let transactions = [];

function chargerTransactions() {
  try {
    transactions = JSON.parse(localStorage.getItem(CLE_STORAGE)) || [];
  } catch {
    transactions = [];
  }
  if (transactions.length === 0) injecterDemo();
}

function sauvegarderTransactions() {
  localStorage.setItem(CLE_STORAGE, JSON.stringify(transactions));
}

function injecterDemo() {
  transactions = DEMO.map(t => ({ ...t, id: genererID() }));
  sauvegarderTransactions();
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

function ajouterTransaction(type, montant, categorie, date, description) {
  transactions.unshift({ id: genererID(), type, montant, categorie, date, description });
  sauvegarderTransactions();
}

function supprimerTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  sauvegarderTransactions();
}

function obtenirTransactionsFiltrees({ type, categorie, mois }) {
  return transactions.filter(t => {
    if (type      && t.type      !== type)           return false;
    if (categorie && t.categorie !== categorie)       return false;
    if (mois      && !t.date.startsWith(mois))        return false;
    return true;
  });
}

// ── Calculs ──────────────────────────────────────────────────────────────────

function totalParType(type) {
  return transactions.filter(t => t.type === type).reduce((s, t) => s + t.montant, 0);
}

function repartitionParCategorie() {
  return transactions
    .filter(t => t.type === 'depense')
    .reduce((acc, t) => {
      acc[t.categorie] = (acc[t.categorie] || 0) + t.montant;
      return acc;
    }, {});
}

// ── Rendu DOM ────────────────────────────────────────────────────────────────

function mettreAJourSolde() {
  const revenus  = totalParType('revenu');
  const depenses = totalParType('depense');
  const solde    = revenus - depenses;

  el('solde').textContent          = formaterMontant(solde);
  el('total-revenus').textContent  = formaterMontant(revenus);
  el('total-depenses').textContent = formaterMontant(depenses);

  el('solde').className = solde >= 0 ? 'solde-valeur solde-ok' : 'solde-valeur solde-negatif';
}

function rendreListe(liste) {
  const conteneur = el('liste-transactions');
  const vide      = el('liste-vide');

  conteneur.innerHTML = '';
  if (liste.length === 0) {
    vide.hidden = false;
    return;
  }
  vide.hidden = true;

  const fragment = document.createDocumentFragment();
  liste.forEach(t => fragment.appendChild(rendreCarte(t)));
  conteneur.appendChild(fragment);
}

function rendreCarte(t) {
  const cat  = CATEGORIES[t.categorie] || CATEGORIES.autres;
  const li   = document.createElement('li');
  li.className = 'transaction';
  li.dataset.id = t.id;

  li.innerHTML = `
    <div class="transaction-badge cat-${t.categorie}" title="${cat.label}">
      ${cat.emoji}
    </div>
    <div class="transaction-infos">
      <div class="transaction-desc">${escHTML(t.description || cat.label)}</div>
      <div class="transaction-meta">
        <span class="transaction-cat">${cat.label}</span>
        &middot; ${formaterDate(t.date)}
      </div>
    </div>
    <span class="transaction-montant ${t.type === 'depense' ? 'montant-depense' : 'montant-revenu'}">
      ${t.type === 'depense' ? '−' : '+'}${formaterMontant(t.montant)}
    </span>
    <button class="btn-supprimer" title="Supprimer" data-id="${t.id}" aria-label="Supprimer cette transaction">×</button>
  `;
  return li;
}

function escHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Graphique (Canvas) ────────────────────────────────────────────────────────

function dessinerGraphique(repartition) {
  const canvas  = el('graphique');
  const legende = el('legende');
  const vide    = el('graphique-vide');
  const ctx     = canvas.getContext('2d');
  const entrees = Object.entries(repartition).filter(([, v]) => v > 0);
  const total   = entrees.reduce((s, [, v]) => s + v, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  legende.innerHTML = '';

  if (entrees.length === 0 || total === 0) {
    canvas.hidden = true;
    legende.hidden = true;
    vide.hidden = false;
    return;
  }

  canvas.hidden = false;
  legende.hidden = false;
  vide.hidden = true;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r  = Math.min(cx, cy) - 10;

  let angleDebut = -Math.PI / 2;

  entrees.forEach(([cat, valeur]) => {
    const anglePart = (valeur / total) * 2 * Math.PI;
    const couleur   = CATEGORIES[cat]?.couleur || '#95a5a6';
    const label     = CATEGORIES[cat]?.label   || cat;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angleDebut, angleDebut + anglePart);
    ctx.closePath();
    ctx.fillStyle = couleur;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, angleDebut, angleDebut + anglePart);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    angleDebut += anglePart;

    const puce = document.createElement('li');
    puce.innerHTML = `
      <span class="legende-puce" style="background:${couleur}"></span>
      ${label} — ${formaterMontant(valeur)}
    `;
    legende.appendChild(puce);
  });

  // Cercle central blanc (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.45, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();

  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 13px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formaterMontant(total), cx, cy);
}

// ── Filtres ───────────────────────────────────────────────────────────────────

function lireFiltres() {
  return {
    type:      el('filtre-type').value,
    categorie: el('filtre-categorie').value,
    mois:      el('filtre-mois').value,
  };
}

function mettreAJourListe() {
  rendreListe(obtenirTransactionsFiltrees(lireFiltres()));
}

// ── Interface globale ─────────────────────────────────────────────────────────

function mettreAJourInterface() {
  mettreAJourSolde();
  mettreAJourListe();
  dessinerGraphique(repartitionParCategorie());
}

// ── Validation formulaire ─────────────────────────────────────────────────────

function validerFormulaire(montant, categorie, date) {
  let ok = true;

  const setErreur = (champId, erreurId, msg) => {
    const champ = el(champId);
    const erreur = el(erreurId);
    if (msg) {
      champ.classList.add('invalide');
      erreur.textContent = msg;
      ok = false;
    } else {
      champ.classList.remove('invalide');
      erreur.textContent = '';
    }
  };

  setErreur('montant',   'erreur-montant',   (!montant || montant <= 0) ? 'Montant invalide.' : '');
  setErreur('categorie', 'erreur-categorie', !categorie                 ? 'Choisissez une catégorie.' : '');
  setErreur('date',      'erreur-date',      !date                      ? 'Choisissez une date.' : '');

  return ok;
}

// ── Événements ────────────────────────────────────────────────────────────────

function bindFormulaire() {
  el('formulaire').addEventListener('submit', e => {
    e.preventDefault();

    const type        = document.querySelector('input[name="type"]:checked').value;
    const montant     = parseFloat(el('montant').value);
    const categorie   = el('categorie').value;
    const date        = el('date').value;
    const description = el('description').value.trim();

    if (!validerFormulaire(montant, categorie, date)) return;

    ajouterTransaction(type, montant, categorie, date, description);
    mettreAJourInterface();

    el('montant').value     = '';
    el('description').value = '';
    el('montant').focus();
  });
}

function bindFiltres() {
  ['filtre-type', 'filtre-categorie', 'filtre-mois'].forEach(id => {
    el(id).addEventListener('change', mettreAJourListe);
  });

  el('btn-effacer-filtres').addEventListener('click', () => {
    el('filtre-type').value      = '';
    el('filtre-categorie').value = '';
    el('filtre-mois').value      = '';
    mettreAJourListe();
  });
}

function bindSuppression() {
  el('liste-transactions').addEventListener('click', e => {
    const btn = e.target.closest('.btn-supprimer');
    if (!btn) return;
    supprimerTransaction(btn.dataset.id);
    mettreAJourInterface();
  });
}

// ── Initialisation ────────────────────────────────────────────────────────────

function el(id) { return document.getElementById(id); }

document.addEventListener('DOMContentLoaded', () => {
  el('date').value = aujourdhuiISO();

  chargerTransactions();
  mettreAJourInterface();

  bindFormulaire();
  bindFiltres();
  bindSuppression();
});
