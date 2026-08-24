# QA export DOCX — Phase 13

## Références inspectées

La référence Word principale est `حسناء فرض الثالثة[1].docx` (A4 portrait).
Elle correspond visuellement au PDF homonyme et contient 118 paragraphes,
4 tableaux, 6 lignes de tableau, 11 cellules et une image embarquée. Son XML
active explicitement `w:bidi` sur 114 paragraphes et `w:rtl` sur 234 runs.

Les PDF `devoire 1 3eme annee.pdf` (A4 portrait) et `devoire 1 ac.pdf`
(A5 portrait) complètent la recette des niveaux troisième et première année.
Le fichier `.doc` historique est une référence binaire ancienne, non utilisée
comme source OpenXML.

## Décisions génériques protégées

- A4 portrait `210 × 297 mm`, marges Word centralisées à 10 mm en haut,
  17,5 mm sur les côtés et 5 mm en bas, avec bordure de page.
- Paragraphes arabes en bidi réel et tables avec `bidiVisual`; aucune donnée du
  Domain n'est inversée.
- Header, informations élève, vrai/faux, tableaux, matching et sujet rédaction
  restent des tables/paragraphes Word natifs et éditables.
- Titres de section en `keepNext`, petites lignes en `keepLines`, lignes de
  tableaux en `cantSplit`, en-têtes de tableaux répétés.
- PNG et JPEG sont embarqués directement. WEBP est converti localement en PNG
  pour compatibilité Word. Un asset indisponible devient un placeholder.
- Les sauts initiaux, finaux et consécutifs sont normalisés pour éviter des
  pages blanches artificielles.

## Fichiers de recette générés

La commande QA utilisée pendant la phase produit, dans `.qa/phase13-docx/` :

- `reference-third-year-ar.docx` ;
- `reference-first-year-ar.docx` ;
- `reference-all-blocks-fr.docx`.

Ces artefacts temporaires ne sont pas des données de production. Leur archive
OpenXML est contrôlée (`document.xml`, relations, styles et médias), puis les
documents sont ouverts/convertis avec Microsoft Word lorsqu'il est disponible.
La reconstruction troisième année retire le saut synthétique de la fixture
Phase 11, absent du PDF réel ; les sauts explicites restent testés séparément.

## Limites de comparaison

Word possède son propre moteur de pagination et ses métriques de police. La
structure, les proportions, le bidi et l'éditabilité sont prioritaires sur une
égalité de pagination pixel à pixel avec Chromium. Le seul DOCX OpenXML réel
fourni limite la comparaison structurelle directe à une famille de devoirs ; les
autres fichiers servent de références visuelles PDF.
