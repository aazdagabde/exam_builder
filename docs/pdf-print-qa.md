# PDF / Print QA

Date de recette : 23 août 2026  
Navigateur : Chrome Headless 151 / moteur Skia PDF

## Workflow validé

```text
Exam courant du store
→ validation structurelle et métier
→ flush autosave si dirty
→ document.fonts.ready
→ Renderer de la révision courante prêt
→ images chargées et décodées
→ seconde stabilisation de pagination
→ window.print()
```

Le workflow réutilise les `.exam-page` visibles dans le Preview. Aucun renderer
PDF, canvas ou document HTML parallèle n'est créé.

## Résultats Chromium

| Document                     | Preview | PDF | MediaBox                | Texte extractible | UI absente | Résultat |
| ---------------------------- | ------: | --: | ----------------------- | ----------------- | ---------- | -------- |
| Référence troisième année AR |       2 |   2 | 594.96 × 841.92 pt (A4) | Oui               | Oui        | PASS     |
| Référence première année AR  |       2 |   2 | 594.96 × 841.92 pt (A4) | Oui               | Oui        | PASS     |
| Fixture générique FR         |       4 |   4 | 594.96 × 841.92 pt (A4) | Oui               | Oui        | PASS     |
| Builder complexe AR          |       4 |   4 | 594.96 × 841.92 pt (A4) | Oui               | Oui        | PASS     |
| UI arabe / document FR       |       4 |   4 | 594.96 × 841.92 pt (A4) | Oui               | Oui        | PASS     |

Les PDF temporaires ont été rouverts, rasterisés uniquement pour inspection QA,
et analysés avec `pdfinfo` / `pdftotext`. Chaque page contient du texte : aucune
feuille blanche finale n'est présente.

## Défaut découvert et corrigé

La fragmentation paged-media de Chromium interprétait le conteneur de pages RTL
comme une progression physique RTL et insérait une feuille blanche après chaque
page arabe. La progression des wrappers de feuilles est désormais explicitement
LTR à l'impression, tandis que chaque `.exam-page` arabe conserve `direction:
rtl`. Les données et l'ordre des colonnes ne sont jamais inversés.

La recette croisée UI arabe / document français a aussi permis de limiter le
centrage RTL du Preview à la direction propre de `.exam-renderer`, plutôt qu'à
la direction de l'interface.

## Paramètres utilisateur

Dans la fenêtre d'impression Chromium :

- destination : **Enregistrer au format PDF** ;
- papier : **A4** ;
- échelle : **100 % / valeur par défaut** ;
- marges : **aucune** ;
- en-têtes et pieds de page du navigateur : **désactivés**.

Le navigateur reste maître du dernier réglage et de l'emplacement du fichier.
CSS ne peut pas désactiver de force ses en-têtes et pieds de page.

## Périmètre

- Chrome/Edge Chromium est la cible V1 validée.
- Les placeholders d'assets absents restent imprimables et déclenchent un
  avertissement non bloquant.
- Le SVG institutionnel reste fourni directement au navigateur ; aucune
  rasterisation applicative n'est effectuée.
- L'action Dashboard « Exporter » reste hors de cette phase ; l'export fiable est
  disponible depuis le Builder.
