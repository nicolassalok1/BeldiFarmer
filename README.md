# Prélèvements GPS — ANRAC

Outil de terrain pour définir les champs d'une exploitation agricole et générer automatiquement les points de prélèvement GPS avec export des coordonnées.

## Fonctionnalités

### Gestion multi-parcelles
- Dessinez autant de champs que nécessaire directement sur la carte
- Chaque champ possède un nom personnalisé, une couleur distincte et un label visible sur la carte
- Sélection, suppression et régénération par champ

### Génération automatique des points de prélèvement
Trois méthodes disponibles :
- **Grille régulière** — points uniformément espacés dans le champ
- **Zigzag (W)** — parcours en W, classique pour les prélèvements de sol
- **Aléatoire stratifié** — points aléatoires avec distance minimum entre eux pour éviter les regroupements

La densité est configurable de 0.5 à 20 points par hectare.

### Statistiques en temps réel
- Nombre de champs
- Surface totale (hectares)
- Nombre de points de prélèvement

### Export des données
- **CSV** — colonnes : Champ, Label, Latitude, Longitude (8 décimales)
- **GeoJSON** — FeatureCollection avec points et polygones des parcelles
- **KML** — Placemarks organisés par dossier (un par champ)

## Utilisation

1. Saisissez le nom du champ (ex: "Blé Nord")
2. Cliquez **Dessiner sur la carte** et tracez les limites en cliquant les sommets
3. Choisissez la méthode de génération et la densité souhaitée
4. Cliquez **Générer les points**
5. Répétez pour chaque champ de l'exploitation
6. Exportez les coordonnées en CSV, GeoJSON ou KML

## Stack technique

- HTML / CSS / JavaScript (vanilla, fichier unique)
- [Leaflet.js 1.9.4](https://leafletjs.com/) — carte interactive
- [Leaflet.draw 1.0.4](https://leaflet.github.io/Leaflet.draw/) — dessin de polygones
- Fond de carte CartoDB Dark
- Google Fonts : Share Tech Mono + Barlow Condensed

## Déploiement

Site statique hébergé sur Vercel. Chaque push sur `main` déclenche un redéploiement automatique.

```bash
# Développement local
npx serve public -l 3000
```

## Licence

Usage interne ANRAC.
