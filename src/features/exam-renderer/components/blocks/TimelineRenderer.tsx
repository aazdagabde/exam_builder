import type { TimelineBlock } from "@/domain/exam";
import { DocumentPoints } from "@/features/exam-renderer/components/DocumentPrimitives";
import type { DocumentLabels } from "@/features/exam-renderer/document-labels";

export function TimelineRenderer({
  block,
  labels,
}: {
  block: TimelineBlock;
  labels: DocumentLabels;
}) {
  return (
    <figure
      className={`exam-timeline exam-timeline--${block.orientation}`}
      data-timeline-orientation={block.orientation}
    >
      {block.title?.trim() ? (
        <figcaption className="exam-visual-title" dir="auto">
          {block.title}
        </figcaption>
      ) : null}
      <ol className="exam-timeline__events">
        {block.events.map((event) => (
          <li key={event.id} className="exam-timeline__event">
            {block.showDates ? (
              <div className="exam-timeline__date" dir="auto">
                {event.date || "\u00a0"}
              </div>
            ) : null}
            <span className="exam-timeline__marker" aria-hidden="true" />
            <div className="exam-timeline__content">
              <div className="exam-timeline__label" dir="auto">
                {event.label || "\u00a0"}
              </div>
              {event.description?.trim() ? (
                <div className="exam-timeline__description" dir="auto">
                  {event.description}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <DocumentPoints points={block.points} labels={labels} />
    </figure>
  );
}
