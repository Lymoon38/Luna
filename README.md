# ☽ Luna — Cycle & Santé

> Application web progressive (PWA) de suivi du cycle menstruel, de la santé et de la nutrition. Aucune installation requise, aucune donnée envoyée sur internet — tout reste sur votre appareil.

![Thème violet moderne](https://img.shields.io/badge/thème-violet%20moderne-9b7fe8?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-installable-22c55e?style=flat-square)
![Licence](https://img.shields.io/badge/licence-MIT-blue?style=flat-square)
![Aucune dépendance](https://img.shields.io/badge/dépendances-aucune-f59e0b?style=flat-square)

---

## ✨ Fonctionnalités

### 📅 Calendrier du cycle
- Visualisation mensuelle avec codes couleur :
  - 🩸 Rouge/rose — jours de règles
  - 🌿 Teal — fenêtre fertile
  - 🌕 Ambre — ovulation estimée
  - 🔮 Violet — rendez-vous médicaux
  - 🟡 Jaune — épisodes de maladie
- Prédictions automatiques sur **3 cycles futurs** (affichées en pointillés)
- Calcul intelligent de la durée du cycle (moyenne sur les 6 derniers cycles)
- Clic sur un jour → détail + ajout rapide d'une entrée journal ou d'un RDV

### 📓 Journal de santé
- Catégories : règles, symptômes, maladie, fièvre, humeur, notes libres
- Sélecteur de type de maladie : rhume, gastro, angine, grippe, sinusite, migraine…
- Saisie de température pour les épisodes de fièvre
- Indicateur d'intensité de 1 à 5
- Filtre par catégorie
- **Statistiques de fréquence des maladies** avec barres de progression

### 💊 Santé & Nutrition
- Calcul de l'**IMC** et interprétation (insuffisance pondérale → obésité)
- **Calories journalières recommandées** selon la formule Mifflin-St Jeor
- Prise en compte du niveau d'activité et de l'objectif (perte / maintien / prise de masse)
- **Suivi du poids** avec graphique en courbe (canvas natif)
- **Conseils alimentaires par phase du cycle** : menstruation, folliculaire, ovulation, lutéale

### 🛒 Listes de courses
- Import de fichiers depuis Todoist, Bring, AnyList ou toute app exportant en `.txt`, `.csv` ou `.json`
- Glisser-déposer de fichier
- Ajout manuel avec catégories (légumes, fruits, viandes, laitiers, féculents, boissons…)
- Cochage et suppression des articles
- Export de la liste en `.txt`

### 📅 Rendez-vous médicaux
- Saisie : titre, date, heure, lieu, notes, type (gynéco / médecin / autre)
- **Export `.ics`** compatible avec Google Calendar, Samsung Calendar, Apple Calendar
- Affichage des RDV sur le calendrier principal
- Suppression individuelle

### 🖨️ Impression & Export
- Rapport imprimable par section : historique des cycles, journal, poids, RDV
- Rapport complet en une page
- Mise en page print optimisée (masquage des éléments de navigation)

---

## 📱 Installation sur Android

1. Ouvrez `index.html` dans **Google Chrome**
2. Appuyez sur le menu ⋮ → **"Ajouter à l'écran d'accueil"**
3. Luna s'installe comme une application native

**Pour ajouter un RDV à Google Calendar :**  
Appuyez sur "📅 Exporter .ics" → ouvrez le fichier téléchargé → Google Calendar l'importe automatiquement avec un rappel 1h avant.

---

## 🗂️ Structure du projet

```
luna/
├── index.html   # Structure HTML & interface complète
├── style.css    # Thème violet moderne, dark/light mode, responsive
├── app.js       # Logique principale : navigation, rendu, interactions
└── data.js      # Calculs du cycle, stockage localStorage, générateur ICS
```

Aucun framework, aucune dépendance, aucun bundler. Vanilla HTML/CSS/JS pur.

---

## 🔒 Confidentialité

**Toutes les données restent sur votre appareil.**  
Luna utilise uniquement `localStorage` du navigateur. Aucune donnée n'est envoyée à un serveur. Aucun compte, aucune connexion internet requise après le premier chargement des polices Google Fonts.

> Pour une confidentialité totale, téléchargez les polices localement et supprimez le lien Google Fonts dans `index.html`.

---

## 🧮 Algorithmes utilisés

| Calcul | Méthode |
|---|---|
| Ovulation estimée | Cycle − 14 jours |
| Fenêtre fertile | J − 5 à J + 1 autour de l'ovulation |
| Durée du cycle | Moyenne glissante sur 6 cycles |
| IMC | Poids (kg) / Taille² (m) |
| Calories de base (BMR) | Mifflin-St Jeor femme |
| Calories totales (TDEE) | BMR × coefficient d'activité |

---

## 🚀 Démarrage rapide

```bash
# Clonez le dépôt
git clone https://github.com/votre-pseudo/luna-cycle.git

# Ouvrez directement dans votre navigateur
open luna-cycle/index.html
```

Ou hébergez sur **GitHub Pages**, **Netlify** ou **Vercel** pour y accéder depuis votre mobile via URL.

---

## 🎨 Personnalisation

Les couleurs et le thème sont entièrement définis via des **variables CSS** dans `style.css` :

```css
:root {
  --violet-500: #7c4dce;   /* Couleur principale */
  --rose-500:   #e879a4;   /* Règles */
  --teal-500:   #2dd4bf;   /* Fenêtre fertile */
  --amber-500:  #f59e0b;   /* Ovulation */
}
```

---

## 📋 Compatibilité

| Navigateur | Support |
|---|---|
| Chrome / Edge (Android & Desktop) | ✅ Complet |
| Safari (iOS 16+) | ✅ Complet |
| Firefox | ✅ Complet |
| Samsung Internet | ✅ Complet |

---

## 📄 Licence

MIT — libre d'utilisation, de modification et de redistribution.

---

<p align="center">Fait avec 💜 pour toutes celles qui méritent un outil simple, privé et beau.<
