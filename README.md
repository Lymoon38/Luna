# 🌙 Luna — Mon cycle & ma santé

Application web **simple et privée** pour suivre son cycle menstruel, ses symptômes et sa santé au quotidien. Elle est pensée pour être utilisée facilement, **y compris à la voix** : Luna peut lire les conseils à voix haute et comprendre quelques mots simples.

Aucune inscription, aucun serveur, aucune base de données : tout fonctionne dans le navigateur et **les données restent sur l'appareil**.

---

## ✨ Fonctionnalités

### 📅 Calendrier
- Phase du cycle en cours (menstruation, folliculaire, ovulation, lutéale) et jour du cycle
- Prévision des prochaines règles, de l'ovulation et de la fenêtre fertile
- Saisie des règles (début, fin, durée du cycle) et alertes avant les événements importants
- Rendez-vous, maladies et symptômes visibles directement sur le calendrier

### 🎙️ Mode vocal « Parler à Luna »
- Dire un mot simple (« règles », « oui »…) puis répondre **oui / non** à la voix ou avec les gros boutons
- Reconnaissance volontairement tolérante : Luna ne bloque jamais sur « je n'ai pas compris », et rien n'est enregistré sans un « oui »
- Comprend « aujourd'hui », « hier » et « avant-hier »
- Évite les doublons si les règles sont déjà enregistrées

### 🔊 Conseils de nutrition lus à voix haute
- Conseils adaptés à chaque phase du cycle (aliments, astuces, calories)
- Bouton **« Écouter mes conseils du jour »** et bouton 🔊 sur chaque phase
- Textes préparés pour la lecture (« jours 6 à 13 », « kilocalories », pas d'emojis…)

### 😖 Symptômes sur plusieurs jours
- Mini-calendrier : on touche tous les jours concernés
- 12 symptômes en gros boutons, avec 3 niveaux d'intensité (un peu / moyennement / beaucoup)
- Chaque choix est dit à voix haute, avec « Relire mon résumé » avant d'enregistrer
- Une entrée de journal est créée pour chaque jour choisi

### 🔊 Voix de Luna réglable
- Choix de la voix parmi les voix françaises de l'appareil
- Vitesse réglable, essai en un bouton, choix mémorisé

### 📓 Journal de santé
- Règles, symptômes, maladies, fièvre, humeur, notes libres
- Filtres par catégorie et statistiques sur la fréquence des maladies

### ❤️ Santé & nutrition
- IMC, besoins en calories, poids idéal
- Suivi du poids avec graphique

### 🗓️ Rendez-vous
- Liste des rendez-vous (gynécologue, médecin…)
- Export `.ics` pour ajouter un rendez-vous à Google Agenda ou à l'agenda du téléphone

### 🖨️ Autres
- Impression / export de l'historique, du journal, du poids et des rendez-vous
- Thème sombre et clair

---

## 🔒 Confidentialité

- Les données sont enregistrées **uniquement dans le `localStorage` du navigateur** (clés commençant par `luna_`).
- Rien n'est envoyé sur un serveur par l'application.
- Seule la police d'écriture est chargée depuis Google Fonts (l'application fonctionne sans, avec une police par défaut).
- ⚠️ La reconnaissance vocale est fournie par le navigateur : selon le navigateur et l'appareil (Chrome, par exemple), l'audio peut être traité par un service en ligne. Si cela pose problème, utiliser les boutons plutôt que le micro.
- Effacer les données du site dans le navigateur supprime aussi les données de Luna : pensez à imprimer ou exporter ce qui compte.

---

## 🚀 Utilisation

### En local
Aucune installation. Ouvrez simplement `index.html` dans un navigateur.

Pour tester le micro, il vaut mieux passer par un petit serveur local :

```bash
python3 -m http.server 8000
```

puis ouvrir <http://localhost:8000>.

### Sur GitHub Pages (recommandé pour le téléphone)
1. Envoyer les 4 fichiers à la racine du dépôt.
2. Dans **Settings → Pages**, choisir la branche `main` et le dossier `/ (root)`.
3. Ouvrir l'adresse en `https://` donnée par GitHub.

> Le micro n'est autorisé que sur une page **sécurisée** (`https://` ou `localhost`). GitHub Pages convient très bien.

### 📲 Ajouter Luna à l'écran d'accueil du téléphone
Une fois la page ouverte en `https://` :

- **Android (Chrome) :** menu ⋮ → **Ajouter à l'écran d'accueil** (ou **Installer l'application**).
- **iPhone (Safari) :** bouton Partager → **Sur l'écran d'accueil**.

Luna s'ouvre alors comme une application, avec son icône 🌙 et en plein écran.

---

## 📱 Compatibilité vocale

| Navigateur | Voix de Luna (lecture) | Micro (reconnaissance) |
|---|---|---|
| Chrome / Edge (Android, ordinateur) | ✅ | ✅ |
| Safari (iPhone / iPad / Mac) | ✅ | ⚠️ selon la version |
| Firefox | ✅ | ❌ (utiliser les boutons) |

Le nombre de voix disponibles dépend de l'appareil. On peut en installer d'autres dans les réglages du téléphone (rubrique « Synthèse vocale »).

Quand le micro n'est pas disponible, tout reste utilisable avec les boutons (par exemple « J'ai mes règles aujourd'hui »).

---

## 🗂️ Structure du projet

```
├── index.html            Structure des pages et de la navigation
├── styles.css            Styles (thème sombre / clair, mobile d'abord)
├── data.js               Stockage local et calculs (cycle, santé, nutrition, export .ics)
├── app.js                Interface, calendrier, journal, voix, symptômes
├── manifest.webmanifest  Nom et icône pour l'écran d'accueil du téléphone
└── icons/                Icône de Luna (SVG modifiable + PNG 32, 180, 192 et 512 px)
```

- **Technologies :** HTML, CSS et JavaScript « vanilla » — aucune dépendance, aucune étape de compilation.
- **API navigateur utilisées :** `localStorage`, Web Speech API (`SpeechSynthesis` et `SpeechRecognition`).

---

## ⚕️ Avertissement

Luna est un outil de suivi personnel. Les prévisions du cycle sont des **estimations** et les conseils de nutrition sont **généraux** : ils ne remplacent en aucun cas l'avis d'un professionnel de santé. Ne pas utiliser Luna comme moyen de contraception. En cas de doute ou de symptômes inhabituels, consultez un médecin.

---

## 📄 Licence

À définir par l'auteur·e du dépôt (par exemple MIT).
