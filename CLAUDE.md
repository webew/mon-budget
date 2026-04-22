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
- Graphique de répartition des dépenses par catégorie (canvas ou SVG natif)
- Totaux revenus / dépenses

### Historique
- Liste de toutes les transactions
- Filtres : par catégorie, par type (dépense/revenu), par période
- Suppression d'une transaction

## Structure des fichiers

```
Mon-budget/
├── index.html       # Page principale
├── style.css        # Styles globaux
└── app.js           # Logique applicative
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
