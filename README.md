# EMDash Highlighter - Chrome Extension

Extension Chrome qui surligne les lignes contenant des em-dashes (—) avec un effet de fade élégant.

## Installation

1. Ouvrez Chrome et allez à `chrome://extensions/`
2. Activez le "Mode développeur" (coin supérieur droit)
3. Cliquez sur "Charger l'extension non empaquetée" et sélectionnez le dossier contenant ces fichiers
4. L'extension est maintenant active sur tous les sites web

## Fonctionnalités

- Détecte automatiquement les em-dashes (—) uniquement
- Surligne toute la ligne avec un effet de dégradé horizontal subtil
- Bordure gauche rouge avec effet de fade
- Effet hover pour plus d'interactivité
- Gère le contenu dynamique (AJAX, SPA)
- Aucune donnée envoyée à l'extérieur
- Pas de permissions excessives

## Fichiers

- `manifest.json` - Configuration de l'extension (Manifest V3)
- `content_script.js` - Logique de détection et surlignage
- `styles.css` - Styles de surlignage
