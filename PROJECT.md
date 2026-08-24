# PROJECT.md — Exam Builder / Générateur de devoirs

## 1. Vision du projet

Construire une application web moderne permettant aux professeurs de créer facilement des devoirs scolaires imprimables, principalement pour la matière **Histoire-Géographie / الاجتماعيات** au collège marocain.

La première utilisatrice est une professeure qui prépare actuellement ses devoirs manuellement avec Word.

L'objectif principal est de remplacer cette manipulation complexe par un éditeur simple :

1. Le professeur choisit le niveau.
2. Il crée les différentes parties du devoir.
3. Il saisit uniquement le contenu pédagogique.
4. Il choisit les types de questions.
5. Il indique le nombre de lignes/espace souhaité pour les réponses.
6. L'application construit automatiquement la mise en page.
7. Un aperçu A4 fidèle au document final est affiché.
8. Le devoir peut être exporté en PDF et DOCX.

Le professeur ne doit pas avoir à gérer manuellement :

- les pointillés ;
- les espacements ;
- les tableaux ;
- les marges ;
- les alignements ;
- les sauts de pages ;
- la direction RTL ;
- le format A4 ;
- la mise en page Word.

---

# 2. Objectif produit

L'application doit être plus simple que Microsoft Word pour la création de devoirs scolaires.

Le produit ne doit PAS être un clone de Word.

Il doit être un **Exam Builder basé sur des blocs structurés**.

Exemple :

```text
Créer un devoir
      ↓
Informations générales
      ↓
Ajouter une section
      ↓
Ajouter des blocs
      ↓
Aperçu A4
      ↓
PDF / Word
```

Le professeur travaille avec des composants métier et non avec une page blanche.

---

# 3. Utilisateurs

## V1

Un professeur utilisant l'application localement dans son navigateur.

Aucun compte utilisateur requis.

## Futur

L'architecture doit permettre une évolution vers une plateforme SaaS utilisée par plusieurs professeurs.

Exemples futurs :

- comptes professeurs ;
- établissements ;
- sauvegarde cloud ;
- bibliothèque de questions ;
- partage des devoirs ;
- modèles publics/privés ;
- collaboration ;
- IA ;
- abonnement.

La V1 ne doit PAS implémenter ces fonctionnalités.

---

# 4. Périmètre pédagogique V1

Matière principale :

```text
الاجتماعيات
```

Niveaux :

```text
الأولى إعدادي
الثانية إعدادي
الثالثة إعدادي
```

Les devoirs peuvent contenir plusieurs matières/sections, principalement :

```text
التاريخ
الجغرافيا
التربية على المواطنة
```

Le système ne doit cependant pas coder ces trois valeurs en dur.

Une section doit pouvoir avoir un nom personnalisé.

---

# 5. Langues

L'application doit être entièrement bilingue :

```text
العربية
Français
```

Utiliser un vrai système d'internationalisation.

Recommandation :

```text
react-i18next
```

Fichiers :

```text
src/
  locales/
    ar.json
    fr.json
```

IMPORTANT :

La langue de l'interface et la langue du devoir sont deux concepts différents.

Exemple :

```text
Interface : Français
Contenu du devoir : Arabe
```

ou :

```text
Interface : العربية
Contenu du devoir : Arabe
```

L'application doit gérer :

```text
RTL → arabe
LTR → français
```

Ne jamais multiplier les conditions :

```ts
if (language === "ar")
```

dans les composants.

La gestion RTL/LTR doit être centralisée.

---

# 6. Stack technique V1

## Frontend

```text
React
TypeScript
Vite
```

## UI

```text
Tailwind CSS
shadcn/ui
Lucide Icons
```

## State management

```text
Zustand
```

## Internationalisation

```text
react-i18next
```

## Drag & Drop

```text
dnd-kit
```

## Validation

```text
Zod
```

## Sauvegarde locale

```text
IndexedDB
```

Utiliser éventuellement :

```text
Dexie.js
```

comme abstraction IndexedDB.

## Export PDF

Priorité :

```text
HTML/CSS A4
→ print CSS
→ Browser print
→ PDF
```

Le PDF doit être visuellement identique au preview.

## Export DOCX

Utiliser une bibliothèque JavaScript dédiée à la génération DOCX.

Exemple :

```text
docx
```

Le DOCX doit rester éditable.

---

# 7. Backend

## V1

AUCUN backend.

Ne pas ajouter :

```text
FastAPI
Django
Node.js API
PostgreSQL
Firebase
Supabase
```

sans demande explicite.

La première version fonctionne entièrement côté navigateur.

---

# 8. Préparation pour le futur backend

Ne jamais appeler IndexedDB directement depuis les composants React.

Créer une abstraction :

```ts
interface ExamRepository {
  findAll(): Promise<Exam[]>;
  findById(id: string): Promise<Exam | null>;
  save(exam: Exam): Promise<void>;
  delete(id: string): Promise<void>;
}
```

V1 :

```text
IndexedDbExamRepository
```

Future version SaaS :

```text
ApiExamRepository
```

Ainsi le frontend pourra rester quasiment identique lors de l'ajout futur de :

```text
FastAPI
PostgreSQL
Authentication
Cloud storage
```

---

# 9. Architecture générale

```text
┌─────────────────────────────┐
│          React UI           │
│                             │
│ Dashboard                   │
│ Exam Builder                │
│ Settings                    │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│       Domain / Exam         │
│                             │
│ Exam                        │
│ Section                     │
│ Blocks                      │
│ Validation                  │
└──────────────┬──────────────┘
               │
       ┌───────┼─────────┐
       ↓       ↓         ↓
    Editor  Renderer  Repository
              │
        ┌─────┴──────┐
        ↓            ↓
       PDF          DOCX
```

Le modèle métier doit être indépendant de React.

---

# 10. Modèle principal Exam

Exemple conceptuel :

```ts
interface Exam {
  id: string;

  metadata: ExamMetadata;

  sections: ExamSection[];

  settings: ExamSettings;

  createdAt: string;

  updatedAt: string;
}
```

---

# 11. Metadata

```ts
interface ExamMetadata {
  title: string;

  academicYear: string;

  institution?: string;

  regionalAcademy?: string;

  provincialDirectorate?: string;

  level: string;

  subject: string;

  teacherName?: string;

  durationMinutes?: number;

  totalPoints?: number;

  examNumber?: string;
}
```

Le système doit également prévoir les champs élève affichés sur le document final :

```text
الاسم الكامل
الرقم الترتيبي
القسم
النقطة /20
```

---

# 12. Sections

Un devoir est composé de sections.

Exemple :

```text
أولا: مادة التاريخ
ثانيا: مادة التربية على المواطنة
ثالثا: مادة الجغرافيا
```

Modèle :

```ts
interface ExamSection {
  id: string;

  title: string;

  subject?: string;

  points?: number;

  blocks: ExamBlock[];
}
```

Le professeur doit pouvoir :

```text
Ajouter
Modifier
Supprimer
Dupliquer
Réordonner
```

une section.

---

# 13. Architecture des blocs

Ne PAS sauvegarder le devoir sous forme d'un gros HTML.

Le devoir doit être représenté sous forme structurée.

Utiliser une union TypeScript discriminée :

```ts
type ExamBlock =
  | InstructionBlock
  | TextDocumentBlock
  | ImageBlock
  | QuestionBlock
  | DefinitionBlock
  | TrueFalseBlock
  | MultipleChoiceBlock
  | FillBlankBlock
  | TableBlock
  | MatchingBlock
  | EssayBlock
  | FreeTextBlock
  | SeparatorBlock
  | PageBreakBlock;
```

Chaque bloc possède au minimum :

```ts
interface BaseBlock {
  id: string;

  type: string;

  order: number;

  points?: number;
}
```

---

# 14. Bloc Question

Cas classique :

```text
اشرح أسباب ظهور الحركة الوطنية
```

Configuration :

```ts
interface QuestionBlock extends BaseBlock {
  type: "question";

  question: string;

  answerMode: "none" | "lines" | "box";

  answerLines?: number;
}
```

Interface :

```text
السؤال

[ اشرح أسباب ظهور الحركة الوطنية ]

النقطة
[ 2 ]

مساحة الإجابة

[ 3 أسطر ▼ ]
```

Résultat :

```text
اشرح أسباب ظهور الحركة الوطنية: (2ن)

........................................................................
........................................................................
........................................................................
```

Les lignes doivent être générées automatiquement.

---

# 15. Bloc Document texte

Permet d'ajouter un document historique ou géographique.

Exemple :

```text
اقرأ الوثيقة بتمعن ثم أجب...
```

Structure :

```ts
interface TextDocumentBlock extends BaseBlock {
  type: "text-document";

  instruction?: string;

  content: string;

  source?: string;

  bordered?: boolean;
}
```

Le document peut contenir :

```text
Titre
Instruction
Texte
Source
Référence
```

---

# 16. Bloc Image / Document

Permet d'ajouter :

```text
Photo
Carte
Graphique
Document historique
Schéma
```

Options :

```text
Image
Titre
Légende
Source
Largeur
Alignement
Bordure
```

---

# 17. Bloc Tableau

Le professeur choisit :

```text
Nombre de lignes
Nombre de colonnes
Titres des colonnes
Cellules préremplies
Cellules vides
```

Exemple :

```text
| القبائل المقاومة | زعماء المقاومة | أهم المعارك | السنة |
|------------------|-----------------|-------------|-------|
|                  |                 | أنوال       |       |
| قبائل أيت عطا    |                 |             |       |
```

Modèle :

```ts
interface TableBlock extends BaseBlock {
  type: "table";

  columns: TableColumn[];

  rows: TableRow[];

  showHeader: boolean;
}
```

---

# 18. Bloc صحيح / خطأ

Modèle :

```ts
interface TrueFalseBlock extends BaseBlock {
  type: "true-false";

  instruction?: string;

  statements: string[];
}
```

Renderer :

```text
┌────────────────────────────┬──────┬──────┐
│ المعطيات                   │ صحيح │ خطأ  │
├────────────────────────────┼──────┼──────┤
│ ...                        │      │      │
└────────────────────────────┴──────┴──────┘
```

---

# 19. Bloc QCM

Prévoir également le cas :

```text
اختيار من متعدد
```

Structure :

```ts
interface MultipleChoiceBlock extends BaseBlock {
  type: "multiple-choice";

  question: string;

  options: string[];

  allowMultipleAnswers?: boolean;
}
```

---

# 20. Bloc أكمل الفراغ

Exemple :

```text
حصل المغرب على الاستقلال سنة ..........
```

Le professeur saisit uniquement le texte.

Le renderer produit automatiquement les zones à compléter.

---

# 21. Bloc المصطلحات / تعريف

Pour des questions comme :

```text
عرف المصطلحات التالية:
التعايش السلمي
حوار الأديان
```

Le professeur doit pouvoir définir :

```text
Terme
Nombre de lignes
Points
```

pour chaque terme.

---

# 22. Bloc صل بسهم

Le système doit gérer spécifiquement les exercices :

```text
صل بسهم
```

Modèle :

```ts
interface MatchingBlock extends BaseBlock {
  type: "matching";

  instruction?: string;

  leftItems: string[];

  rightItems: string[];

  shuffleRight?: boolean;
}
```

Le document imprimé affiche deux colonnes avec suffisamment d'espace entre les deux.

Exemple :

```text
المسيرة الخضراء                 1956

استقلال المغرب                  1975

الحركة الوطنية                  1930
```

IMPORTANT :

Ne PAS dessiner automatiquement les réponses.

L'élève doit pouvoir tracer les flèches sur papier.

---

# 23. Bloc Sujet / الموضوع المقالي

Le sujet de rédaction doit être un bloc métier spécifique.

Modèle :

```ts
interface EssayBlock extends BaseBlock {
  type: "essay";

  context?: string;

  instruction: string;

  topics: string[];

  points?: number;
}
```

Interface :

```text
الموضوع المقالي

السياق
[ ................................ ]

التعليمة
[ اكتب موضوعا مقاليا من مقدمة وعرض وخاتمة... ]

العناصر

1. [ ................................ ]
2. [ ................................ ]
3. [ ................................ ]

[ + إضافة عنصر ]

النقطة
[ 7 ]
```

---

# 24. Règle métier du sujet المقال

Un devoir ne peut contenir qu'UN SEUL bloc :

```text
essay
```

Règle :

```ts
MAX_ESSAY_BLOCKS_PER_EXAM = 1;
```

La règle doit être contrôlée :

```text
Domain validation
+
UI
```

Si un sujet existe déjà :

```text
الموضوع المقالي ✓
```

Le bouton d'ajout doit être désactivé.

Afficher un message clair :

```text
يوجد بالفعل موضوع مقالي في هذا الفرض.
```

ou en français :

```text
Un sujet de rédaction existe déjà dans ce devoir.
```

IMPORTANT :

Ne pas imposer "géographie" dans le modèle métier.

Le EssayBlock appartient simplement à une section.

---

# 25. Bloc texte libre

Permet d'ajouter :

```text
Instruction
Note
Petit texte
Sous-titre
Remarque
```

sans devoir créer un nouveau type métier.

---

# 26. Bloc saut de page

Ajouter un bloc :

```text
PageBreakBlock
```

permettant au professeur d'imposer :

```text
Nouvelle page
```

si nécessaire.

---

# 27. Exam Builder

La page principale de création doit utiliser une organisation claire.

Desktop recommandé :

```text
┌─────────────────┬─────────────────────────┬─────────────────────────┐
│ STRUCTURE       │ EDITEUR                 │ APERÇU A4               │
│                 │                         │                         │
│ التاريخ         │ Question sélectionnée   │      PAGE 1             │
│ ├ Document      │                         │                         │
│ ├ Question      │ Texte                   │ فرض محروس...            │
│ └ Tableau       │ [...................]   │                         │
│                 │                         │                         │
│ المواطنة        │ Points                  │                         │
│ └ صحيح/خطأ     │ [2]                     │                         │
│                 │                         │                         │
│ الجغرافيا       │ Réponse                 │                         │
│ └ مقال          │ [3 lignes]              │                         │
└─────────────────┴─────────────────────────┴─────────────────────────┘
```

L'application doit rester responsive.

Sur écran plus petit :

```text
Editor
Preview
```

peuvent devenir des tabs.

---

# 28. Palette des blocs

Bouton principal :

```text
+ إضافة عنصر
```

ou :

```text
+ Ajouter un élément
```

Afficher :

```text
سؤال
وثيقة نصية
صورة / وثيقة
تعريف مصطلح
صحيح / خطأ
اختيار متعدد
أكمل الفراغ
جدول
صل بسهم
موضوع مقالي
نص
فاصل
فاصل صفحة
```

---

# 29. Actions sur un bloc

Chaque bloc doit pouvoir être :

```text
Modifier
Déplacer
Dupliquer
Supprimer
Réduire
```

Utiliser drag & drop pour le changement d'ordre.

Toujours prévoir des boutons accessibles comme alternative au drag & drop.

---

# 30. Undo / Redo

Le Builder doit proposer :

```text
Undo
Redo
```

Le système doit éviter de perdre accidentellement plusieurs minutes de travail.

---

# 31. Autosave

Sauvegarder automatiquement le devoir en local.

Exemple :

```text
Modifications enregistrées
```

Pas besoin de bouton obligatoire "Enregistrer".

On peut néanmoins conserver :

```text
Enregistrer maintenant
```

comme action secondaire.

---

# 32. Dashboard

Route :

```text
/
```

Contenu :

```text
Mes devoirs
```

Cartes :

```text
┌─────────────────────────────────┐
│ فرض محروس رقم 2                │
│ الثالثة إعدادي                  │
│ الاجتماعيات                    │
│                                 │
│ Dernière modification: ...      │
│                                 │
│ Modifier                        │
│ Dupliquer                       │
│ Exporter                        │
│ Supprimer                       │
└─────────────────────────────────┘
```

Bouton principal :

```text
+ Nouveau devoir
```

---

# 33. Création d'un devoir

Route :

```text
/exams/new
```

Wizard court :

```text
1. Informations
2. Structure
3. Édition
```

Ne pas créer un wizard trop long.

Le professeur doit pouvoir commencer rapidement.

---

# 34. Templates

La V1 doit gérer des templates.

Exemple :

```text
Nouveau devoir

○ Devoir vide
○ Modèle collège
○ Dupliquer un ancien devoir
```

Le template doit contenir principalement la structure et le design.

Le contenu pédagogique doit rester éditable.

---

# 35. Template Original

Créer en priorité un template :

```text
Moroccan College Classic
```

Il doit reproduire le design des devoirs de référence fournis au projet.

Il doit contenir :

```text
Header administratif
Informations établissement
Informations professeur
Informations élève
Note /20
Durée
Titre du devoir
Année scolaire
Sections
Barres de titre
Bordures
Espacement
Tables
Lignes de réponse
Footer éventuel
```

---

# 36. Exigence de fidélité

Le document final doit être :

```text
au minimum aussi professionnel
que les devoirs de référence.
```

Objectif :

```text
Preview ≈ PDF ≈ impression papier
```

Le moteur ne doit jamais produire une mise en page visiblement inférieure aux documents de référence.

Les devoirs de référence constituent les cas de recette principaux.

---

# 37. Design du document ≠ Design de l'application

Ne pas confondre :

```text
Application UI
```

et :

```text
Exam Print Layout
```

L'application peut utiliser :

```text
shadcn/ui
Tailwind
Modern SaaS design
```

Mais le document imprimé doit avoir son propre moteur CSS.

Exemple :

```text
src/
  features/
    exam-renderer/
```

---

# 38. Format A4

Le document doit respecter :

```text
210 mm × 297 mm
```

Créer un composant :

```text
A4Page
```

Exemple :

```css
.exam-page {
  width: 210mm;
  min-height: 297mm;
  box-sizing: border-box;
}
```

Print :

```css
@page {
  size: A4;
  margin: 0;
}
```

Les marges internes doivent être contrôlées par le renderer.

---

# 39. Pagination

Le système doit savoir gérer automatiquement plusieurs pages.

Contraintes :

Ne pas laisser :

```text
un titre de section seul en bas d'une page
```

Éviter de couper :

```text
un petit tableau
une question de sa réponse
un bloc matching
un document court
```

Utiliser des règles telles que :

```css
break-inside: avoid;
page-break-inside: avoid;
```

lorsqu'elles sont pertinentes.

Les blocs très longs doivent néanmoins pouvoir être coupés proprement.

---

# 40. Preview

L'aperçu doit afficher les vraies pages.

Exemple :

```text
Page 1 / 3
Page 2 / 3
Page 3 / 3
```

Chaque page doit apparaître comme une feuille A4.

Prévoir zoom :

```text
50 %
75 %
100 %
125 %
Fit
```

---

# 41. Header du devoir

Créer un composant spécifique :

```text
ExamHeader
```

Il doit pouvoir afficher :

```text
Académie
Direction provinciale
Établissement
Niveau
Matière
Professeur
Titre du devoir
Année scolaire
Nom de l'élève
Numéro
Classe
Note
Durée
Logo
```

Le template doit permettre de masquer certains champs.

---

# 42. Logo

Prévoir :

```text
Logo établissement
Logo institutionnel
```

Les images doivent être sauvegardées dans le document local ou avec un mécanisme permettant leur restauration après réouverture.

---

# 43. Points

Chaque :

```text
Section
Question
Bloc
```

peut avoir un nombre de points.

Afficher si nécessaire :

```text
(2 ن)
```

Le système peut calculer automatiquement :

```text
Total
```

Exemple :

```text
Histoire: 7
Citoyenneté: 6
Géographie: 7

Total: 20
```

Prévoir un warning si :

```text
Total != 20
```

mais ne jamais bloquer le professeur.

---

# 44. Validation

Créer une couche Domain Validation.

Exemples :

```text
Un seul EssayBlock
Exam title requis
Section sans titre → warning
Question vide → warning
Table sans colonne → erreur
Matching avec colonne vide → warning
Total différent de /20 → warning
```

Les erreurs métier ne doivent pas être dispersées dans les composants React.

---

# 45. Export PDF

Priorité absolue de la V1.

Workflow :

```text
Exam JSON
   ↓
A4 Renderer
   ↓
HTML/CSS
   ↓
Print
   ↓
PDF
```

La vue d'impression doit supprimer toute l'interface de l'application.

Ne doivent jamais apparaître dans le PDF :

```text
Sidebar
Toolbar
Buttons
shadcn components
Editor controls
```

---

# 46. Export DOCX

Architecture :

```text
Exam JSON
   ↓
DocxRenderer
   ↓
DOCX
```

Ne pas utiliser le HTML du preview comme source principale du DOCX.

Le renderer DOCX doit interpréter le modèle métier.

Support minimum :

```text
RTL
Paragraphes arabes
Titres
Tables
Images
Bordures
Questions
Lignes de réponse
Matching
True/False
Essay
Page break
```

---

# 47. Import / Export JSON

Ajouter également :

```text
Exporter le projet
Importer le projet
```

Format :

```text
.exam.json
```

Cela permet au professeur :

```text
backup
transfert vers un autre ordinateur
archivage
```

avant l'arrivée du cloud.

---

# 48. Sauvegarde locale

Sauvegarder :

```text
Exam
Templates
User preferences
Interface language
```

dans IndexedDB.

Ne pas utiliser uniquement localStorage pour les devoirs.

---

# 49. Routes

Structure initiale :

```text
/
    Dashboard

/exams/new
    Nouveau devoir

/exams/:id/edit
    Exam Builder

/templates
    Templates

/settings
    Paramètres
```

Pas davantage de pages sans nécessité.

---

# 50. Structure de projet recommandée

```text
src/
│
├── app/
│   ├── router/
│   ├── providers/
│   └── App.tsx
│
├── components/
│   └── ui/
│
├── features/
│   │
│   ├── exams/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   │
│   ├── exam-builder/
│   │   ├── components/
│   │   ├── blocks/
│   │   └── store/
│   │
│   ├── exam-renderer/
│   │   ├── components/
│   │   ├── templates/
│   │   └── styles/
│   │
│   ├── export-pdf/
│   │
│   ├── export-docx/
│   │
│   └── templates/
│
├── domain/
│   ├── exam/
│   │   ├── exam.types.ts
│   │   ├── blocks.types.ts
│   │   ├── exam.schema.ts
│   │   └── exam.validation.ts
│   │
│   └── repositories/
│
├── infrastructure/
│   ├── indexed-db/
│   └── repositories/
│
├── i18n/
│   ├── ar.json
│   ├── fr.json
│   └── index.ts
│
├── lib/
│
└── styles/
```

Éviter les composants géants.

---

# 51. UI Design

L'application doit être :

```text
simple
professionnelle
moderne
rapide
accessible
```

Ne pas surcharger l'écran.

Style SaaS moderne.

Utiliser shadcn/ui pour :

```text
Button
Dialog
DropdownMenu
Select
Tabs
Tooltip
Popover
Sheet
Card
Input
Textarea
AlertDialog
ScrollArea
Separator
Switch
```

Utiliser les composants shadcn comme base puis les adapter au projet.

---

# 52. Couleurs

Utiliser une identité visuelle sobre.

Exemple :

```text
Primary : bleu / indigo institutionnel
Background : blanc / gris très clair
Success : vert
Warning : orange
Danger : rouge
```

Éviter un design enfantin.

Le produit est destiné aux enseignants.

---

# 53. Responsive

Desktop = expérience principale.

Minimum :

```text
1366 × 768
```

Doit également fonctionner sur :

```text
Laptop
Tablet
```

Le smartphone peut offrir une expérience limitée mais fonctionnelle.

---

# 54. Accessibilité

Les actions principales doivent être utilisables :

```text
Souris
Clavier
```

Ajouter :

```text
aria-label
focus states
keyboard navigation
```

Ne pas dépendre uniquement du drag & drop.

---

# 55. Performance

Le Builder doit rester fluide avec :

```text
50+ blocs
plusieurs pages A4
plusieurs images
```

Éviter les rerenders globaux inutiles.

Utiliser correctement les selectors Zustand.

---

# 56. Tests

Utiliser :

```text
Vitest
React Testing Library
```

Tests prioritaires :

```text
Exam validation
Essay uniqueness
Total points calculation
Block CRUD
Serialization
Repository
RTL
Renderer
```

Ajouter ensuite Playwright pour les workflows principaux.

---

# 57. Scénarios E2E

Scénario principal :

```text
Créer devoir
→ saisir metadata
→ ajouter section Histoire
→ ajouter document
→ ajouter questions
→ ajouter table
→ ajouter section Citoyenneté
→ ajouter True/False
→ ajouter section Géographie
→ ajouter Essay
→ preview
→ export PDF
```

Deuxième scénario :

```text
Dupliquer devoir
→ modifier questions
→ conserver design
→ export nouveau PDF
```

---

# 58. Recette avec documents de référence

La V1 n'est considérée comme terminée que lorsque l'application permet de reconstruire proprement les devoirs de référence fournis au projet.

Les documents de référence doivent servir de tests réels.

Vérifier :

```text
Header
Sections
Document historique
Sources
Questions
Zones de réponse
Tables
True/False
Definitions
Sujet المقال
Pagination
Points
Total /20
A4
RTL
PDF
```

---

# 59. Critères de qualité PDF

Le PDF final doit :

```text
être A4
être net
respecter l'arabe RTL
ne pas couper les contenus incorrectement
avoir des bordures propres
avoir une typographie professionnelle
être immédiatement imprimable
```

Le document doit être de qualité égale ou supérieure aux documents de référence.

---

# 60. Principes UX importants

Le professeur doit écrire le minimum possible.

Mauvais :

```text
Créer 5 lignes de pointillés manuellement
```

Bon :

```text
Nombre de lignes de réponse : 5
```

Mauvais :

```text
Dessiner manuellement un tableau
```

Bon :

```text
Colonnes : 4
Lignes : 3
```

Mauvais :

```text
Positionner les deux colonnes d'un صل بسهم
```

Bon :

```text
Ajouter paires
```

L'application doit générer la mise en page automatiquement.

---

# 61. Non-objectifs V1

Ne PAS implémenter pour l'instant :

```text
Authentication
Backend
PostgreSQL
Paiement
Subscription
AI generation
Student accounts
Online exams
Correction automatique
Cloud
Collaboration temps réel
Marketplace
```

Préparer l'architecture pour ces possibilités, mais ne pas les développer.

---

# 62. Roadmap d'implémentation

## Phase 1 — Foundation

Mettre en place :

```text
React
TypeScript
Vite
Tailwind
shadcn/ui
ESLint
Prettier
Vitest
```

---

## Phase 2 — Domain

Créer :

```text
Exam
ExamSection
ExamBlock
schemas Zod
business validation
```

Aucune UI complexe avant que le modèle soit stable.

---

## Phase 3 — i18n

Implémenter :

```text
Français
Arabe
RTL
LTR
```

Tester tous les composants importants dans les deux directions.

---

## Phase 4 — Persistence

Créer :

```text
ExamRepository
IndexedDbExamRepository
```

Ajouter :

```text
Create
Read
Update
Delete
Duplicate
```

---

## Phase 5 — Builder

Créer :

```text
Sections
Block palette
Block editors
Drag & drop
Duplicate
Delete
Undo / Redo
Autosave
```

---

## Phase 6 — Blocks

Implémenter progressivement :

```text
Question
Text Document
Image
Definition
True/False
MCQ
Fill Blank
Table
Matching
Essay
Free Text
Page Break
```

---

## Phase 7 — A4 Renderer

Créer un moteur indépendant de l'éditeur.

Construire :

```text
A4Page
ExamHeader
SectionRenderer
BlockRenderer
```

---

## Phase 8 — Reference Template

Reproduire le design du devoir de référence.

Objectif :

```text
pixel-perfect lorsque raisonnablement possible
```

et qualité visuelle au moins équivalente.

---

## Phase 9 — PDF

Finaliser :

```text
print CSS
pagination
page breaks
RTL
tables
images
```

Faire du PDF la sortie prioritaire.

---

## Phase 10 — DOCX + QA

Implémenter DOCX.

Puis reconstruire complètement les devoirs de référence et corriger les différences.

---

# 63. Règles Codex

Codex doit respecter les règles suivantes pendant tout le développement.

## Règle 1

Lire entièrement :

```text
PROJECT.md
```

avant toute modification importante.

## Règle 2

Ne pas modifier l'architecture sans nécessité démontrée.

## Règle 3

Ne pas ajouter de backend dans la V1.

## Règle 4

Ne pas ajouter de dépendances importantes sans expliquer :

```text
pourquoi
alternative
impact
```

## Règle 5

Ne pas créer de gros composants React monolithiques.

## Règle 6

Le modèle métier ne dépend jamais de React.

## Règle 7

Le renderer ne dépend pas de l'éditeur.

## Règle 8

Le PDF/DOCX doit être généré depuis le modèle Exam.

## Règle 9

Toute nouvelle fonctionnalité doit fonctionner :

```text
FR
AR
RTL
LTR
```

lorsqu'elle est concernée.

## Règle 10

Après chaque étape :

```text
typecheck
lint
tests
build
```

doivent passer.

---

# 64. Commandes qualité attendues

Exemple :

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Aucune étape n'est terminée si ces commandes échouent.

---

# 65. Definition of Done V1

La V1 est terminée lorsque :

```text
✓ création d'un devoir
✓ sauvegarde locale
✓ modification
✓ duplication
✓ suppression
✓ FR / AR
✓ RTL / LTR
✓ sections
✓ questions
✓ documents texte
✓ images
✓ zones de réponse
✓ définitions
✓ true/false
✓ QCM
✓ fill blank
✓ tableaux
✓ صل بسهم
✓ sujet مقالي
✓ règle d'un seul sujet مقالي
✓ drag & drop
✓ preview A4
✓ pagination correcte
✓ template proche du devoir original
✓ export PDF fiable
✓ export DOCX
✓ import/export JSON
✓ reconstruction des devoirs de référence
✓ tests principaux
✓ build production
```

---

# 66. Vision commerciale future

Le frontend doit pouvoir évoluer vers :

```text
                 SaaS
                  │
        ┌─────────┴─────────┐
        │                   │
   React Web           Future Mobile
        │
        ↓
      API
        │
   FastAPI / autre
        │
    PostgreSQL
```

Entités futures possibles :

```text
User
Teacher
School
Exam
Template
QuestionBank
Subscription
Organization
```

Ces entités ne doivent PAS être implémentées en V1.

---

# 67. Principe fondamental

Le cœur du produit est :

```text
Exam JSON
```

et non :

```text
HTML
DOCX
PDF
React
```

React est l'éditeur.

Le renderer produit l'aperçu.

PDF est une sortie.

DOCX est une sortie.

IndexedDB est un stockage.

Plus tard une API pourra remplacer IndexedDB sans modifier le modèle métier.

---

# 68. Priorités

Ordre absolu :

```text
1. Simplicité pour le professeur
2. Qualité du devoir imprimé
3. Fiabilité
4. RTL arabe
5. Modèle métier propre
6. Rapidité de création
7. Extensibilité
8. Design de l'application
```

Un joli dashboard ne doit jamais être prioritaire sur la qualité du document final.

---

# 69. Nom de travail

Nom interne proposé :

```text
Exam Builder
```

Le nom commercial pourra être décidé plus tard.

Le code ne doit donc pas dépendre fortement d'un branding définitif.

---

# 70. Instruction finale à l'agent de développement

Avant d'implémenter une fonctionnalité :

1. Identifier le besoin métier.
2. Vérifier si le modèle Exam le supporte.
3. Modifier le Domain uniquement si nécessaire.
4. Ajouter/adapter l'éditeur.
5. Ajouter/adapter le renderer.
6. Vérifier RTL/LTR.
7. Vérifier le preview A4.
8. Ajouter les tests appropriés.
9. Lancer lint/typecheck/tests/build.
10. Résumer précisément les modifications.

Ne jamais résoudre un problème de mise en page en ajoutant des hacks spécifiques à un devoir particulier.

Le moteur doit rester générique et réutilisable pour les futurs professeurs.

---

# 71. Politique de migration du schéma persistant

Le runtime utilise uniquement le schéma `Exam` courant. Les anciennes versions
ne sont acceptées qu'aux frontières de lecture comme entrées de migration ; elles
ne rendent jamais les propriétés du modèle courant optionnelles.

Trois versions indépendantes doivent être distinguées :

```text
Exam.schemaVersion       = version du modèle métier persistant
Dexie database version   = version physique des tables et index IndexedDB
backupVersion            = version de l'enveloppe de transport .exam.json
```

Une évolution persistante du Domain doit suivre cette procédure :

1. augmenter `CURRENT_EXAM_SCHEMA_VERSION` ;
2. conserver une migration pure et explicite `N → N+1` ;
3. chaîner les migrations avec `migrateExamToLatest()` ;
4. valider avec le `ExamSchema` courant seulement après la dernière migration ;
5. mettre à jour les types, schémas, factories et duplication du modèle courant ;
6. migrer les lectures IndexedDB et réécrire chaque record migré atomiquement ;
7. migrer l'Exam interne des backups sans augmenter `backupVersion` si
   l'enveloppe ne change pas ;
8. préserver identifiants, timestamps, contenu et références d'assets ;
9. rejeter explicitement toute version future inconnue ;
10. ajouter des tests Domain, repository, backup et renderer/builder concernés.

`Exam.schemaVersion` n'est pas augmenté pour une modification UI, renderer ou
calculée qui ne change pas la forme JSON persistée. La version Dexie n'est
augmentée que lorsque les stores, index ou la structure physique IndexedDB
changent. `backupVersion` n'est augmenté que lorsque l'enveloppe de transport
change.

Une migration incertaine doit échouer de manière structurée plutôt que supprimer,
réinterpréter ou remplacer silencieusement les données du professeur.
