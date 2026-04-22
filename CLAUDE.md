# Mon Budget — Application de gestion de budget personnel

## Description

Application web de gestion de budget personnel, entièrement en français, avec un design moderne et épuré. Fonctionne sans backend ni dépendances externes.

## Technologies

- **HTML5** — structure sémantique
- **CSS3** — design moderne, responsive, variables CSS
- **JavaScript pur (ES6+)** — aucune bibliothèque externe
- **localStorage** — persistance des données côté client

## Fonctionnalités

### Saisie de transactions
- Ajout de dépenses et de revenus
- Champs : montant, catégorie, date, description
- Catégories disponibles : `alimentation`, `logement`, `transport`, `loisirs`, `santé`, `autres`

### Tableau de bord
- Solde actuel (revenus − dépenses)
- Graphique donut de répartition des dépenses par catégorie (Canvas natif, total au centre)
- Totaux revenus / dépenses

### Historique
- Liste de toutes les transactions
- Filtres : par catégorie, par type (dépense/revenu), par période
- Suppression d'une transaction

## Repository

- **GitHub** : https://github.com/webew/mon-budget
- **Branche principale** : `main`

## Lancer en local

```bash
npx serve . --listen 3000
# puis ouvrir http://localhost:3000
```

Le fichier `.claude/launch.json` configure le serveur de prévisualisation (port 3000).

## Structure des fichiers

```
Mon-budget/
├── index.html            # Page principale
├── style.css             # Styles globaux
└── app.js                # Logique applicative
└── .claude/
    └── launch.json       # Serveur de prévisualisation (npx serve, port 3000)
```

## Modèle de données (localStorage)

Les transactions sont stockées sous la clé `monbudget_transactions` au format JSON :

```json
[
  {
    "id": "uuid",
    "type": "depense" | "revenu",
    "montant": 42.50,
    "categorie": "alimentation",
    "date": "2026-04-21",
    "description": "Courses semaine"
  }
]
```

## Conventions

- Interface entièrement en français
- Montants affichés en euros (€)
- Dates au format JJ/MM/AAAA en affichage, ISO 8601 en stockage
- Couleurs : dépenses en rouge/orange, revenus en vert
