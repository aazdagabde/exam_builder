# Renderer reference QA — Phase 11B

Date de l'audit : 2026-08-23.

Ce document décrit les références réelles utilisées pour la recette du template
`moroccan-college-classic`. Les fichiers originaux de `ressource/exemple devoirs/`
restent inchangés. Les PDF sont prioritaires pour le rendu final ; les fichiers
Word complètent l'analyse structurelle.

## Inventaire

| Référence                              | Format | Pages physiques | Format / orientation                                                       | Niveau et type identifiables                     | Langue | Rôle QA                                                      |
| -------------------------------------- | ------ | --------------: | -------------------------------------------------------------------------- | ------------------------------------------------ | ------ | ------------------------------------------------------------ |
| `devoire 1 3eme annee.pdf`             | PDF    |               1 | A4 portrait contenant deux pages logiques imposées et tournées             | Troisième année, devoir surveillé d' الاجتماعيات | Arabe  | Densité deux-pages, header, questions, documents, sujet      |
| `devoire 1 ac.pdf`                     | PDF    |               1 | Environ A5 portrait, contenu tourné en paysage et composé en deux colonnes | Première année, devoir surveillé                 | Arabe  | Variante compacte, lignes, tableau, sujet                    |
| `حسناء فرض الثالثة[1].pdf`             | PDF    |               2 | A4 portrait                                                                | Troisième année, فرض محروس رقم 2                 | Arabe  | Référence visuelle principale                                |
| `حسناء فرض الثالثة[1].docx`            | DOCX   |               2 | A4 portrait ; marges Word d'environ 10 mm haut, 17,5 mm latérales          | Troisième année, فرض محروس رقم 1                 | Arabe  | Structure éditable, styles, tables et pagination             |
| `الفرض الكتابي رقم 2 النموذج 1(1).doc` | DOC    |               1 | A4 portrait                                                                | Première année, فرض محروس رقم 2                  | Arabe  | Référence historique complémentaire et très dense            |
| `ressource/logo.svg`                   | SVG    |               — | Ratio 261,49 × 104,88                                                      | Logo du ministère marocain                       | Arabe  | Logo institutionnel confirmé dans les références principales |

## Correspondances

- Le PDF et le DOCX `حسناء فرض الثالثة[1]` utilisent la même famille de
  template, la même institution et la même enseignante, mais ne contiennent pas
  le même devoir : numéro, année, sections et questions diffèrent.
- Les fichiers `devoire 1 3eme annee.pdf` et `حسناء فرض الثالثة[1].docx`
  partagent la composition institutionnelle et le niveau, sans correspondance
  exacte de contenu démontrée.
- `devoire 1 ac.pdf` et l'ancien `.doc` concernent tous deux la première année
  et un devoir numéro 2, mais leur header et leur contenu diffèrent fortement.

## Audit avant corrections

### Critical

- Le Renderer ne possède pas le cadre intérieur de page visible dans toutes les
  références.
- Le header actuel n'utilise ni le logo confirmé ni la composition commune en
  trois zones : administration, titre/année, établissement/niveau.

### Major

- La police arabe Arial/Tahoma et l'échelle courante paraissent plus petites et
  moins proches des références Word, dominées par des corps de 10, 12 et 14 pt
  en Sakkal Majalla ou police arabe équivalente.
- Les références utilisent majoritairement des lignes de réponse pointillées,
  avec un pas plus compact que les lignes continues du Renderer.
- Les titres de section sont des bandeaux pleine largeur légèrement remplis,
  tandis que le Renderer utilise un simple cadre à accent latéral.
- Les tables réelles donnent davantage d'espace aux colonnes textuelles et
  gardent les colonnes courtes compactes ; le Renderer répartit toutes les
  colonnes également.
- Les tableaux Vrai/Faux des références sont sensiblement plus compacts.
- Le sujet de rédaction réel est un encadré continu sans libellés artificiels
  « contexte » et « éléments ».

### Minor

- Les couleurs bleu/vert et ombres Word varient entre fichiers et ne constituent
  pas un invariant à reproduire exactement.
- La phrase de clôture `حظ موفق للجميع` n'est pas présente dans toutes les
  références et ne doit pas devenir un footer automatique.
- Les exports imposés/tournés sont des choix d'impression, pas une orientation
  métier à intégrer au template A4 principal.

## Matrice de fidélité pré-correction

| Élément       | PDF troisième année principal      | PDF organisés               | DOCX                          | DOC historique        | Renderer avant 11B            | Action générique                                     |
| ------------- | ---------------------------------- | --------------------------- | ----------------------------- | --------------------- | ----------------------------- | ---------------------------------------------------- |
| Cadre de page | Double cadre sombre                | Cadre sombre ou bleu        | Double cadre                  | Cadre fin             | Aucun                         | Ajouter un cadre imprimable neutre                   |
| Header        | 3 zones, logo, tableau             | 3 zones, logo               | 3 zones, logo                 | Parchemins et ellipse | Empilement 2 colonnes         | Adopter la structure institutionnelle commune        |
| Typographie   | Arabe 10–14 pt, souvent gras       | Arabe dense                 | Sakkal Majalla, 10/12/14 pt   | Arabe gras/italique   | Arial/Tahoma 8,5–15 pt        | Stack arabe locale et échelle adaptée                |
| Sections      | Bandeau clair pleine largeur       | Bandeau gris/vert           | Bandeau bleu clair            | Titre souligné        | Cadre blanc avec accent       | Bandeau gris imprimable sans dépendance couleur      |
| Réponses      | Pointillés, pas compact            | Pointillés                  | Pointillés                    | Pointillés            | Lignes continues              | Pointillés et rythme proche du papier réel           |
| Documents     | Encadrés simples, source basse     | Encadrés                    | Encadrés gris, sources basses | Encadré               | Encadré continu               | Affiner source et densité                            |
| Tables        | Colonnes proportionnées            | Grandes cellules de réponse | Tables compactes              | Tables compactes      | Largeurs égales               | Pondération automatique selon contenu                |
| Vrai/Faux     | Colonnes courtes, lignes compactes | Présent selon devoir        | Structure compatible          | Variante texte        | Colonnes 15 mm, lignes hautes | Réduire largeur/padding dédiés                       |
| Sujet         | Encadré contexte/consigne/axes     | Encadré                     | Encadré                       | Consigne finale       | Libellés supplémentaires      | Hiérarchie sans libellés artificiels                 |
| Pagination    | 2 pages A4                         | Imposition physique         | 2 pages A4                    | 1 page très dense     | Pagination DOM                | Comparer la densité, conserver les règles génériques |

## Décisions architecturales

- `Moroccan College Classic` reste l'unique template V1 : le header décoratif du
  `.doc` est un outlier, pas une structure commune justifiant un second template.
- Aucun champ de layout n'est ajouté au Domain.
- Le logo ministériel est un élément générique du template marocain, car son
  usage est confirmé dans les trois PDF institutionnels et le DOCX.
- Les deux fixtures reconstruites restent dans le périmètre DEV/test et ne sont
  jamais proposées comme données utilisateur.

## Limites d'interprétation

- Les deux PDF `organized` sont principalement constitués d'images et leur texte
  n'est pas extractible ; l'analyse est donc visuelle.
- L'imposition/trotation de ces PDF n'est pas reproduite : la référence du
  Renderer reste une feuille A4 dans son orientation documentaire normale.
- Les variations exactes dues à Sakkal Majalla, Word et aux imprimantes ne sont
  pas des cibles pixel strictes ; structure, densité et lisibilité priment.

## Corrections appliquées

- Cadre intérieur double et neutre sur chaque page A4.
- Header institutionnel en trois zones, avec le logo ministériel réellement
  observé, les informations administratives, le titre/année et les informations
  d'établissement.
- Suppression de la répétition du numéro lorsque le titre le contient déjà.
- Durée déplacée dans une bande dédiée et champs élève rendus plus compacts.
- Stack arabe locale `Sakkal Majalla`, `Traditional Arabic`, Tahoma et Arial.
- Échelle arabe finale : corps 12,5 pt, question 13 pt, section 14 pt, titre
  16 pt, metadata 9,5 pt dans le header et texte secondaire 9,5 pt.
- Bandeaux de section pleine largeur avec fond gris très clair et bord inférieur
  renforcé, lisibles même sans impression des arrière-plans.
- Lignes de réponse pointillées, pas d'environ 5,5 mm.
- Sources documentaires non italiques et discrètes.
- Colonnes de tables pondérées automatiquement selon les intitulés et contenus,
  sans ajout de largeur dans le Domain.
- Lignes de réponse de table détectées par cellules vides et conservées à une
  hauteur manuscrite de 10,5 mm.
- Tableau Vrai/Faux resserré, avec colonnes de réponse de 13 mm.
- Sujet de rédaction présenté comme un encadré scolaire continu, sans libellés
  d'éditeur ajoutés au document.

## Recette après corrections

| Référence                              | Header  | Typographie | Sections | Questions | Tables | Pagination | RTL  | Overall | Justification                                                                                                                      |
| -------------------------------------- | ------- | ----------- | -------- | --------- | ------ | ---------- | ---- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `حسناء فرض الثالثة[1].pdf`             | PASS    | PASS        | PASS     | PASS      | PASS   | PASS       | PASS | PASS    | Reconstruction en 2 pages A4 comme la référence ; repères verticaux et densité comparables, sans overflow                          |
| `حسناء فرض الثالثة[1].docx`            | PASS    | PASS        | PASS     | PASS      | PASS   | PASS       | PASS | PASS    | Structure 3 zones, tables et pagination Word représentables avec les blocs existants                                               |
| `devoire 1 3eme annee.pdf`             | PASS    | PASS        | PASS     | PASS      | PASS   | PARTIAL    | PASS | PASS    | Les deux pages logiques sont couvertes ; l'imposition physique tournée reste volontairement hors template                          |
| `devoire 1 ac.pdf`                     | PASS    | PASS        | PASS     | PASS      | PASS   | PARTIAL    | PASS | PARTIAL | Langage visuel couvert, mais le format A5 paysage/tourné n'est pas reproduit par le template A4                                    |
| `الفرض الكتابي رقم 2 النموذج 1(1).doc` | PARTIAL | PASS        | PARTIAL  | PASS      | PASS   | PARTIAL    | PASS | PARTIAL | Le contenu est représentable et le résultat est plus sobre ; parchemins, ellipse de note et compression extrême ne sont pas repris |

## Contrôles Preview et Print

- Référence troisième année : Preview 100 % = 2 pages, zéro overflow ; print
  Chromium = 2 pages, MediaBox A4 594,96 × 841,92 pt, aucune UI.
- Référence première année : Preview 100 % = 2 pages, zéro overflow ; print
  Chromium = 2 pages, MediaBox A4 594,96 × 841,92 pt, aucune UI.
- Fixture générique arabe : 4 pages, zéro overflow.
- Fixture générique française : 4 pages, zéro overflow et header LTR cohérent.
- Les différences Preview/print se limitent au fond, à l'ombre, au zoom, aux
  contrôles et aux labels de page externes.

## Conclusion QA

Aucun écart critique ni majeur bloquant ne subsiste pour les références
institutionnelles principales. Les écarts restants concernent l'imposition
papier A5/2-up et le header décoratif de l'ancien `.doc`, qui ne doivent pas
dicter le template A4 générique de la V1.
