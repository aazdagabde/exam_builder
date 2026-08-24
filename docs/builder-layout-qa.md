# Builder layout QA — Phase 11C

## Baseline

The original responsive grid enabled three application panels at Tailwind's
`xl` breakpoint while `SectionEditor` enabled a second two-column grid at the
same breakpoint. At common laptop widths this produced four competing columns:
sections, blocks, form, and preview. The source capture mentioned in the phase
brief was not present in the available attachments, so the baseline audit used
the original layout code and the running Builder.

## Responsive contract

- `< 1024 px`: one active pane among Structure, Editing, and Preview.
- `1024–1599 px`: Structure remains visible; Editing and Preview are switched.
- `>= 1600 px`: Structure, Editing, and Preview are visible together.
- The DOM order remains Structure, Editing, Preview. CSS direction places
  Structure on the right in RTL and on the left in LTR.
- The Builder shell is fixed to `100dvh`; Structure, Editing, and Preview own
  their vertical scrolling.

## Chromium measurements

Measurements use the complex QA Exam (3 sections, 15 blocks, 4 A4 pages) and
real CSS viewport sizes.

| Viewport    | UI  | Structure | Editing |  Preview | Global overflow | A4 pages |
| ----------- | --- | --------: | ------: | -------: | --------------- | -------: |
| 1366 × 768  | AR  |    272 px | 1042 px | switched | none            |        4 |
| 1440 × 900  | AR  |    272 px | 1116 px | switched | none            |        4 |
| 1536 × 864  | AR  |    272 px | 1212 px | switched | none            |        4 |
| 1728 × 900  | AR  |    300 px |  603 px |   761 px | none            |        4 |
| 1920 × 1080 | AR  |    300 px |  688 px |   868 px | none            |        4 |
| 1366 × 768  | FR  |    272 px | 1042 px | switched | none            |        4 |
| 1728 × 900  | FR  |    300 px |  603 px |   761 px | none            |        4 |
| 1024 × 768  | AR  |    272 px |  700 px | switched | none            |        4 |

For every row, `documentElement.scrollWidth === clientWidth` and
`scrollHeight === clientHeight`. A mobile single-pane check was also performed
at the smallest width supported by the local Windows headless Chrome window
(504 CSS px), without global overflow.

## Editor cases

- Definition: long Arabic content, two items, points, and answer-line fields.
- Table: four columns and populated rows; no page-level horizontal scrolling.
- Matching: stacked in narrower containers and two-column once its own
  container has sufficient width.
- Preview: Fit is the default, the A4 page remains centered, and the compact
  zoom select exposes 50%, 75%, 100%, 125%, and Fit.

## Renderer non-regression

Across the five requested AR desktop widths, the same reference Exam produced
identical structural output: 4 rendered pages, 55 pagination units, 47 rendered
block instances, and 19 rendered table instances (including measurement and
paginated copies). No document template, A4 style, or Domain type was changed.
