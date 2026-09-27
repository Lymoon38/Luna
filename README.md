# ☽ Luna — Cycle & Santé

> Application web progressive (PWA) de suivi du cycle menstruel, de la santé et de la nutrition. Aucune installation requise, aucune donnée envoyée sur internet — tout reste sur votre appareil.

![Thème violet moderne](https://img.shields.io/badge/thème-violet%20moderne-9b7fe8?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-installable-22c55e?style=flat-square)
![Licence](https://img.shields.io/badge/licence-MIT-blue?style=flat-square)
![Aucune dépendance](https://img.shields.io/badge/dépendances-aucune-f59e0b?style=flat-square)

---

# 🌙 Luna — Mon cycle & santé

> Une application web simple, accessible et pensée pour faciliter le suivi du cycle menstruel au quotidien.

**Luna** est une application web développée en **HTML, CSS et JavaScript**, avec une approche **local-first** : les informations sont enregistrées directement dans le navigateur de l'utilisateur.

Le projet a été conçu avec une idée centrale : rendre le suivi du cycle **simple, visuel et accessible**, y compris pour une personne qui peut avoir des difficultés à lire ou à utiliser une interface classique.

---

## ✨ Fonctionnalités

### 🩸 Suivi des règles

* Enregistrement de la date de début des règles
* Enregistrement de la date de fin
* Calcul de la durée du cycle
* Estimation du prochain cycle
* Affichage du jour actuel du cycle
* Visualisation des différentes phases du cycle

### 📅 Calendrier

Le calendrier permet de visualiser :

* 🩸 les règles
* 🌸 la période fertile estimée
* 🥚 l'ovulation estimée
* 📅 les rendez-vous
* 🤒 les périodes de maladie

Les informations sont directement intégrées dans le calendrier de Luna.

---

## 🎙️ Mode vocal

L'une des fonctionnalités particulières de Luna est son **mode vocal**.

L'objectif est de permettre une utilisation beaucoup plus simple lorsque la saisie classique est difficile.

Exemple :

> 🎙️ « J'ai mes règles »

Luna récupère automatiquement la **date actuelle du téléphone**, puis demande :

> « Nous sommes le 27 septembre 2026. Confirmes-tu que tu as tes règles aujourd'hui ? »

L'utilisateur peut répondre :

> **« Oui »**

Luna enregistre alors automatiquement la période.

### Le mode vocal comprend également :

* 🎙️ reconnaissance vocale
* 🔊 synthèse vocale
* 🧠 interprétation de phrases simples
* 📅 récupération automatique de la date locale
* ✅ confirmation avant enregistrement
* ❌ possibilité d'annuler
* 🩸 bouton de secours « J'ai mes règles aujourd'hui »
* 📱 utilisation adaptée aux smartphones

La reconnaissance vocale dépend cependant des possibilités du navigateur utilisé et de l'autorisation donnée au microphone.

---

## 📔 Journal

Luna permet également de conserver un journal personnel avec différentes informations liées au quotidien.

Les entrées sont enregistrées localement et peuvent être consultées directement depuis l'application.

---

## ❤️ Santé & nutrition

L'application propose également des informations et outils autour :

* des différentes phases du cycle
* de la santé
* de la nutrition
* des symptômes et observations

Ces informations sont destinées à accompagner le suivi personnel et **ne remplacent pas un avis médical**.

---

## ⚖️ Suivi du poids

Luna permet :

* d'enregistrer un poids
* d'associer une date
* de consulter l'historique
* d'afficher l'évolution du poids

---

## 🛒 Liste de courses

Une liste de courses intégrée permet de :

* ajouter des articles
* cocher les articles terminés
* supprimer des articles
* nettoyer les éléments terminés

---

## 👩‍⚕️ Rendez-vous

L'application permet également de gérer les rendez-vous :

* titre
* date
* heure
* lieu
* notes
* type de rendez-vous

Les rendez-vous peuvent également être exportés au format **`.ics`** afin de pouvoir être ajoutés à un calendrier compatible.

---

## 🌓 Thème clair / sombre

Luna dispose d'un système de thème permettant de passer entre :

* ☀️ mode clair
* 🌙 mode sombre

Le choix est conservé localement dans le navigateur.

---

# 🧩 Architecture du projet

Le projet reste volontairement simple et ne nécessite pas de framework.

```text
Luna/
│
├── index.html
├── styles.css
├── app.js
└── data.js
```

### `index.html`

Contient la structure et les différentes sections de l'application :

* calendrier
* règles
* journal
* santé
* poids
* courses
* rendez-vous

### `styles.css`

Contient toute la partie visuelle :

* mise en page
* couleurs
* cartes
* boutons
* calendrier
* responsive design
* mode sombre
* interface vocale

### `app.js`

Contient la logique principale :

* navigation
* calendrier
* formulaires
* affichage des données
* calculs
* interactions
* mode vocal
* synthèse vocale
* reconnaissance vocale

### `data.js`

Contient la gestion des données locales de Luna.

Les données sont stockées avec **`localStorage`**.

---

# 🔐 Données locales

Luna utilise une approche **local-first**.

Les données sont enregistrées dans le navigateur grâce à :

```js
localStorage
```

Aucune base de données distante n'est nécessaire pour faire fonctionner l'application.

Cela permet notamment de conserver localement :

* les règles
* le journal
* le poids
* les rendez-vous
* la liste de courses
* les paramètres
* la durée du cycle

> ⚠️ Les données étant stockées dans le navigateur, leur conservation dépend du navigateur et de l'appareil utilisé.

---

# 📱 Utilisation sur smartphone

Luna est conçue pour fonctionner sur ordinateur mais également sur smartphone.

Pour tester le projet :

1. Télécharger ou cloner le dépôt.
2. Ouvrir `index.html`.
3. Utiliser l'application dans un navigateur compatible.

Pour le mode vocal :

1. Autoriser l'accès au microphone.
2. Appuyer sur **🎙️ Parler à Luna**.
3. Dire par exemple :
   **« J'ai mes règles »**.
4. Écouter la confirmation.
5. Répondre **« Oui »**.

---

# 🛠️ Technologies utilisées

| Technologie          | Utilisation                    |
| -------------------- | ------------------------------ |
| HTML5                | Structure de l'application     |
| CSS3                 | Interface et responsive design |
| JavaScript           | Logique et interactions        |
| LocalStorage         | Stockage local                 |
| Web Speech API       | Reconnaissance vocale          |
| Speech Synthesis API | Réponses vocales               |
| ICS                  | Export des rendez-vous         |

---

# 🎯 Objectif du projet

Luna est avant tout un projet de développement personnel autour d'une question :

> **Comment rendre une application de suivi de cycle plus simple à utiliser pour tout le monde ?**

Le mode vocal est particulièrement important dans cette démarche.

L'idée n'est pas seulement de créer une application qui affiche des informations, mais de proposer une interface dans laquelle l'utilisateur peut **parler naturellement à l'application**.

---

# 🚧 État du projet

**Luna est actuellement un projet en développement.**

Certaines fonctionnalités peuvent encore évoluer :

* amélioration du mode vocal
* amélioration de l'accessibilité
* amélioration de l'interface mobile
* enrichissement des informations
* nouvelles fonctionnalités de suivi
* amélioration des interactions vocales

---

# 💡 Pourquoi ce projet ?

Luna fait partie de mes projets personnels de développement.

Je m'intéresse particulièrement à la création de petites applications utiles, accessibles et faciles à utiliser.

Ce projet me permet de travailler concrètement sur :

* JavaScript
* manipulation du DOM
* stockage local
* interfaces responsives
* API du navigateur
* reconnaissance vocale
* synthèse vocale
* conception d'une application complète sans framework

---

# 🚀 Pistes d'évolution

Quelques idées envisagées pour les prochaines versions :

* 🎙️ commandes vocales plus nombreuses
* 🗣️ dialogue vocal plus naturel
* 📱 amélioration de l'expérience mobile
* 🔔 rappels
* 📊 statistiques plus poussées
* 📈 graphiques supplémentaires
* 🗓️ amélioration du calendrier
* 💾 système d'export/import des données
* 🔒 amélioration de la gestion des données personnelles
* 🌍 possibilité d'ajouter plusieurs langues

---

# ⚠️ Important

Luna est un **outil personnel de suivi et d'organisation**.

Les estimations concernant le cycle, l'ovulation ou la période fertile sont indicatives et ne doivent pas être utilisées comme méthode contraceptive ou comme diagnostic médical.

En cas de question concernant sa santé, ses symptômes ou son cycle, il est recommandé de consulter un professionnel de santé.

---

# 👩‍💻 Projet

**Luna — Mon cycle & santé**

Projet personnel développé en **HTML / CSS / JavaScript**.

---

## ⭐ Si vous trouvez le projet intéressant

N'hésitez pas à explorer le code, proposer des améliorations ou partager vos idées.

Luna est avant tout un projet qui évolue au fil des expérimentations et de l'apprentissage du développement web.
