# Format de sauvegarde de projet `.exam.json`

Ce document décrit le format de transfert local d’Exam Builder. `PROJECT.md` reste la source de vérité produit.

## Enveloppe versionnée

```json
{
  "format": "exam-builder-project",
  "backupVersion": 1,
  "exportedAt": "2026-08-24T12:00:00.000Z",
  "exam": {},
  "assets": []
}
```

- `format` identifie sans ambiguïté un projet Exam Builder.
- `backupVersion` versionne uniquement cette enveloppe de transport. Il est indépendant de `Exam.schemaVersion` et de la version Dexie.
- `exportedAt` est une date ISO 8601 avec fuseau.
- `exam` est un `Exam` complet. Un nouvel export contient toujours le schéma
  métier courant ; un import connu plus ancien est migré avant validation finale.
- Pour Exam V4, les Timelines conservent intégralement style, mode d’espacement,
  sens chronologique, échelle, positions d’événements, légende et périodes.
- `assets` contient uniquement les images réellement référencées par les `ImageBlock` du devoir.

Une version de sauvegarde inconnue est refusée explicitement. Une future migration devra être ajoutée sans réinterpréter silencieusement le format 1.

## Ressources image

Chaque entrée de `assets` contient :

```json
{
  "id": "asset-source-id",
  "mimeType": "image/png",
  "fileName": "carte.png",
  "size": 1234,
  "createdAt": "2026-08-24T12:00:00.000Z",
  "dataBase64": "...",
  "sha256": "64 caractères hexadécimaux minuscules"
}
```

Les MIME acceptés sont `image/png`, `image/jpeg` et `image/webp`. `size` représente les octets binaires décodés. `sha256` est calculé sur ces mêmes octets avec Web Crypto.

`dataBase64` est exclusivement une représentation de transport dans le fichier `.exam.json`. Il n’est jamais ajouté au modèle `Exam`, ni enregistré dans un enregistrement Exam d’IndexedDB. Après import, les octets redeviennent un `Blob` dans le repository d’assets séparé.

Le base64 augmente généralement la taille d’environ 33 %. Le fichier importé est donc limité à 100 MiB afin d’accepter plusieurs images de 10 MiB tout en bornant la consommation mémoire du navigateur. Le format 1 utilise un JSON compact, sans ZIP, compression ni chiffrement.

## Validation et intégrité

La lecture est intégralement validée avant toute persistance :

1. taille du fichier ;
2. syntaxe JSON, marqueur et version ;
3. enveloppe Zod, migration séquentielle de l'Exam interne, puis `ExamSchema`
   courant ;
4. unicité des identifiants d’assets et MIME ;
5. présence de chaque image référencée ;
6. base64 canonique, taille binaire et SHA-256.

Des assets supplémentaires non référencés sont acceptés pour la compatibilité, vérifiés, puis ignorés lors de l’import. Un même asset partagé par plusieurs blocs n’est exporté et importé qu’une fois.

La migration de l'Exam précède le remappage des assets. Elle conserve les
`ImageBlock.imageId`, les identifiants métier et les timestamps ; le remappage
local intervient seulement après validation du package. Une version future de
`Exam.schemaVersion` est refusée distinctement, même si `backupVersion` vaut 1.

## Remappage local

Chaque asset importé reçoit toujours un nouvel identifiant local. Tous les `ImageBlock.imageId` correspondants sont remappés vers cet identifiant ; les autres identifiants métier ne sont pas modifiés par cette étape. Le nom de fichier, le MIME, la taille, la date de création et les octets restent identiques.

Ce remappage évite d’écraser une image locale et conserve correctement les références partagées.

## Collision de devoir

L’import recherche l’identifiant du devoir avant toute écriture.

- Sans collision : l’identifiant et les dates du devoir sauvegardé sont conservés.
- Importer comme copie : `duplicateExam()` régénère l’identifiant Exam et tous les identifiants internes ; le titre pédagogique est conservé tel quel et les dates deviennent celles de l’import.
- Remplacer : le devoir sauvegardé remplace le devoir local portant le même identifiant et conserve les dates de la sauvegarde.
- Annuler : aucune écriture.

## Persistance et rollback

Les nouvelles images sont enregistrées séquentiellement, puis le devoir remappé est enregistré. Si une écriture d’image ou du devoir échoue, toutes les nouvelles images déjà enregistrées sont supprimées en ordre inverse, autant que possible.

Le rollback ne supprime jamais les anciennes images locales ou potentiellement partagées. Si IndexedDB refuse aussi une suppression de rollback, l’erreur initiale reste prioritaire et un asset orphelin peut exceptionnellement subsister ; cette limite est préférable à la suppression risquée de données existantes.

## Recette de transfert

- Cas A : devoir sans image, export puis import sur une base vide.
- Cas B : devoir avec PNG/JPEG/WEBP et image partagée, comparaison octet par octet.
- Cas C : collision testée avec copie, remplacement et annulation.
- Cas D : corruption JSON/base64/taille/checksum et ressource manquante, sans écriture partielle.
- Cas E : transfert entre deux bases IndexedDB isolées, puis résolution des images par l’aperçu et l’export DOCX.

Le fichier est une sauvegarde locale portable. Il n’est ni chiffré ni signé et peut contenir des informations saisies par le professeur ; il doit donc être conservé comme tout document scolaire local.
