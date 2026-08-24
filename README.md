# Exam Builder

Application web frontend destinée aux enseignants marocains pour créer, imprimer et transférer des devoirs structurés en français et en arabe. `PROJECT.md` reste la source de vérité fonctionnelle et architecturale.

## Prérequis

- Node.js 22 ou une version LTS compatible
- npm
- Chrome ou Edge Chromium récent pour la recette V1 d’impression

## Installation et développement

```bash
npm install
npm run dev
```

## Fonctionnalités V1 disponibles

- Dashboard local : création, modification, duplication et suppression des devoirs.
- Builder avec sections, 14 types de blocs, glisser-déposer, alternatives clavier, Undo/Redo et autosave.
- Numérotation automatique et réordonnable des questions, identique en aperçu, PDF et DOCX.
- Interface arabe par défaut ou française, avec direction RTL/LTR et préférence synchronisée par cookie et IndexedDB.
- Aperçu A4 multi-pages avec le template **Moroccan College Classic**.
- impression/enregistrement PDF via Chromium, avec une page A4 par feuille ou deux pages sur une feuille A4 paysage ;
- export DOCX éditable ;
- export/import d’un projet `.exam.json`, images comprises.

Le produit est frontend-only : aucun compte, backend, cloud ou service réseau n’est requis pour les fonctions V1.

## Données locales et sauvegarde

Les devoirs, images et préférences sont enregistrés dans IndexedDB sur l’appareil courant. Utilisez **Exporter le projet** pour sauvegarder ou transférer un devoir complet.

La suppression des données du navigateur peut supprimer définitivement les devoirs qui n’ont pas été sauvegardés dans un fichier `.exam.json`.

## Qualité et production

```bash
npm run lint
npm run typecheck
npm run test
npm run e2e
npm run build
npm run preview
npm run e2e:preview
```

Les tests E2E utilisent une installation locale de Google Chrome. Firefox et Safari ne sont pas certifiés pour cette V1.

Le déploiement Netlify utilise `netlify.toml` pour construire `dist` et rediriger les routes de l’application vers `index.html`.

## Documentation

- [`PROJECT.md`](PROJECT.md) — source de vérité produit et architecture.
- [`docs/v1-definition-of-done.md`](docs/v1-definition-of-done.md) — audit final V1.
- [`docs/project-backup-format.md`](docs/project-backup-format.md) — format de sauvegarde portable.
