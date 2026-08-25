# Développement — migrations du schéma persistant

`PROJECT.md` reste la source de vérité. Ce document est la checklist technique
réutilisable pour toute évolution persistante de `Exam`.

## Versions actuelles

| Couche               | Version | Rôle                                |
| -------------------- | ------: | ----------------------------------- |
| `Exam.schemaVersion` |       3 | forme JSON métier courante          |
| base Dexie           |       2 | stores et index physiques IndexedDB |
| `backupVersion`      |       1 | enveloppe de transport `.exam.json` |

Ces compteurs sont indépendants. Exam V3 introduit `TimelineBlock` et
`ChartBlock`. La migration pure V2 → V3 augmente uniquement `schemaVersion` et
n’invente aucun bloc dans les devoirs existants. Les tables/index Dexie et
l’enveloppe du backup ne changent pas : les versions Dexie 2 et backup 1 restent
donc correctes.

## Pipeline obligatoire

```text
raw unknown
→ detectExamSchemaVersion()
→ V1 → V2
→ V2 → V3
→ ExamSchema courant
→ Exam courant
```

Le Builder, les renderers A4/PDF/DOCX, la duplication et les services métier ne
reçoivent que l'Exam courant. Ils ne contiennent aucun fallback d'ancien modèle.

## Checklist d'une évolution persistante

- [ ] Le Domain persistant change-t-il ?
- [ ] Si oui, `Exam.schemaVersion` est-il augmenté d'une unité ?
- [ ] La migration `N → N+1` est-elle ajoutée avec ses constantes de versions
      historiques immuables ?
- [ ] `CURRENT_EXAM_SCHEMA_VERSION` pointe-t-elle vers la nouvelle version ?
- [ ] Le schéma Zod courant est-il mis à jour et strict ?
- [ ] Toutes les factories produisent-elles le schéma courant complet ?
- [ ] La migration previous → current est-elle testée ?
- [ ] L'idempotence d'un Exam current est-elle testée ?
- [ ] La migration et la réécriture IndexedDB sont-elles testées ?
- [ ] L'import d'un backup contenant le schéma previous est-il testé ?
- [ ] L'export backup garantit-il le schéma Exam current ?
- [ ] Builder et Renderer sont-ils exempts de fallbacks d'ancienne version ?
- [ ] Démontrer que la forme JSON persistée change réellement.
- [ ] Garder chaque version historique comme constante de migration immuable,
      pas comme type runtime concurrent.
- [ ] Écrire une migration pure `vN-to-vN+1.ts`, sans I/O ni mutation de l'entrée.
- [ ] Enregistrer cette migration dans la chaîne séquentielle centrale.
- [ ] Préserver les valeurs explicites valides, IDs, dates et références d'assets.
- [ ] Fournir uniquement des valeurs par défaut sûres aux champs réellement
      absents.
- [ ] Valider le résultat avec le schéma courant strict.
- [ ] Mettre à jour types, Zod, factories, duplication et fixtures courantes.
- [ ] Faire passer les lectures IndexedDB par `migrateExamToLatest()`.
- [ ] Réécrire atomiquement chaque record migré ; ne jamais supprimer un record
      corrompu ou futur.
- [ ] Migrer l'Exam interne à l'import de backup avant remappage des assets.
- [ ] Exporter uniquement le schéma Exam courant.
- [ ] Ajouter les erreurs structurées et messages UI FR/AR nécessaires.
- [ ] Tester migration, idempotence, données préservées, version future,
      repository mixte et backup précédent.
- [ ] Exécuter lint, typecheck, tests, build et vérification Prettier.

## Quand augmenter chaque version

### `Exam.schemaVersion`

À augmenter lorsqu'un record Exam déjà stocké doit être transformé pour respecter
le nouveau Domain : propriété persistée requise, discriminant modifié, structure
déplacée ou règle structurelle incompatible.

Ne pas augmenter pour un changement CSS, un renderer, une vue, une valeur dérivée
ou une logique non persistée.

### Version Dexie

À augmenter uniquement pour une modification des stores, clés ou index IndexedDB.
Un changement du JSON contenu dans la table `exams` ne nécessite pas à lui seul
une nouvelle version physique.

### `backupVersion`

À augmenter uniquement si l'enveloppe externe change de manière incompatible.
Une nouvelle version de l'Exam interne reste compatible avec l'enveloppe 1 grâce
au pipeline de migration.

## Politique d'erreur et d'atomicité

- Une version future produit `UNSUPPORTED_FUTURE_EXAM_SCHEMA`.
- Une version invalide/inconnue produit `UNSUPPORTED_EXAM_SCHEMA`.
- Une transformation ou validation impossible produit `EXAM_MIGRATION_FAILED`.
- Chaque Exam IndexedDB est migré et réécrit indépendamment par un seul `put`.
- L'échec d'un record n'empêche pas l'inspection des autres et ne détruit rien.
- L'import de backup valide d'abord l'enveloppe, migre ensuite l'Exam, puis valide
  assets, remappage et collision.

Les versions antérieures sont des formats d'entrée documentés par leurs migrations
et tests. Elles ne doivent jamais être recréées comme modèle métier parallèle.
