import {
  createEmptyExam,
  type DocumentLanguage,
  type Exam,
} from "@/domain/exam";

const FIXTURE_NOW = "2026-08-22T12:00:00.000Z";

export function createDiagramReferenceExam(
  documentLanguage: DocumentLanguage,
): Exam {
  const arabic = documentLanguage === "ar";
  const exam = createEmptyExam({
    id: `diagram-reference-${documentLanguage}`,
    now: FIXTURE_NOW,
    documentLanguage,
    templateId: "moroccan-college-classic",
  });
  const labels = arabic
    ? {
        title: "خطاطات تربوية",
        section: "نماذج الخطاطات",
        production: "الإنتاج",
        transport: "النقل",
        distribution: "التوزيع",
        cause: "السبب",
        event: "الحدث",
        consequence: "النتيجة",
        institution: "المؤسسة",
        organA: "الجهاز أ",
        organB: "الجهاز ب",
        organC: "الجهاز ج",
        relation: "يؤدي إلى",
      }
    : {
        title: "Schémas pédagogiques",
        section: "Modèles de schémas",
        production: "Production",
        transport: "Transport",
        distribution: "Distribution",
        cause: "Cause",
        event: "Événement",
        consequence: "Conséquence",
        institution: "Institution",
        organA: "Organe A",
        organB: "Organe B",
        organC: "Organe C",
        relation: "entraîne",
      };
  return {
    ...exam,
    metadata: {
      title: labels.title,
      academicYear: "2026-2027",
      institution: arabic ? "إعدادية ابن خلدون" : "Collège Ibn Khaldoun",
      level: arabic ? "الثالثة إعدادي" : "3e année du collège",
      subject: arabic ? "الاجتماعيات" : "Histoire-Géographie",
      totalPoints: 6,
    },
    sections: [
      {
        id: "diagram-section",
        title: labels.section,
        points: 6,
        blocks: [
          {
            id: "diagram-horizontal-qa",
            type: "diagram",
            startsNewQuestion: true,
            order: 0,
            points: 2,
            title: arabic ? "تدفق أفقي" : "Flux horizontal",
            layout: "horizontal-flow",
            nodes: [
              { id: "horizontal-production", text: labels.production },
              { id: "horizontal-transport", text: labels.transport },
              { id: "horizontal-distribution", text: labels.distribution },
            ],
            edges: [
              {
                id: "horizontal-edge-1",
                fromNodeId: "horizontal-production",
                toNodeId: "horizontal-transport",
                label: "",
              },
              {
                id: "horizontal-edge-2",
                fromNodeId: "horizontal-transport",
                toNodeId: "horizontal-distribution",
                label: labels.relation,
              },
            ],
          },
          {
            id: "diagram-vertical-qa",
            type: "diagram",
            startsNewQuestion: true,
            order: 1,
            points: 2,
            title: arabic ? "تدفق عمودي" : "Flux vertical",
            layout: "vertical-flow",
            nodes: [
              { id: "vertical-cause", text: labels.cause },
              { id: "vertical-event", text: labels.event },
              { id: "vertical-consequence", text: labels.consequence },
            ],
            edges: [
              {
                id: "vertical-edge-1",
                fromNodeId: "vertical-cause",
                toNodeId: "vertical-event",
                label: labels.relation,
              },
              {
                id: "vertical-edge-2",
                fromNodeId: "vertical-event",
                toNodeId: "vertical-consequence",
                label: "",
              },
            ],
          },
          {
            id: "diagram-hierarchy-qa",
            type: "diagram",
            startsNewQuestion: true,
            order: 2,
            points: 2,
            title: arabic ? "تنظيم هرمي" : "Hiérarchie",
            layout: "hierarchy",
            nodes: [
              { id: "hierarchy-root", text: labels.institution },
              { id: "hierarchy-a", text: labels.organA },
              { id: "hierarchy-b", text: labels.organB },
              { id: "hierarchy-c", text: labels.organC },
            ],
            edges: [
              {
                id: "hierarchy-edge-a",
                fromNodeId: "hierarchy-root",
                toNodeId: "hierarchy-a",
                label: "",
              },
              {
                id: "hierarchy-edge-b",
                fromNodeId: "hierarchy-root",
                toNodeId: "hierarchy-b",
                label: "",
              },
              {
                id: "hierarchy-edge-c",
                fromNodeId: "hierarchy-root",
                toNodeId: "hierarchy-c",
                label: "",
              },
            ],
          },
        ],
      },
    ],
  };
}

export function createRendererReferenceExam(
  documentLanguage: DocumentLanguage,
): Exam {
  const arabic = documentLanguage === "ar";
  const exam = createEmptyExam({
    id: `renderer-reference-${documentLanguage}`,
    now: FIXTURE_NOW,
    documentLanguage,
    templateId: "moroccan-college-classic",
  });

  return {
    ...exam,
    metadata: {
      title: arabic
        ? "الفرض المحروس الأول في مادة الاجتماعيات"
        : "Premier contrôle continu d’Histoire-Géographie",
      academicYear: "2026-2027",
      regionalAcademy: arabic
        ? "الأكاديمية الجهوية للتربية والتكوين لجهة الرباط سلا القنيطرة"
        : "Académie régionale de Rabat-Salé-Kénitra",
      provincialDirectorate: arabic
        ? "المديرية الإقليمية بالرباط"
        : "Direction provinciale de Rabat",
      institution: arabic
        ? "الثانوية الإعدادية ابن خلدون"
        : "Collège Ibn Khaldoun",
      level: arabic ? "الثالثة إعدادي" : "3e année du collège",
      subject: arabic ? "الاجتماعيات" : "Histoire-Géographie",
      teacherName: arabic ? "الأستاذة أمينة العمراني" : "Mme Amina El Amrani",
      durationMinutes: 60,
      totalPoints: 20,
      examNumber: "1",
    },
    sections: arabic ? createArabicSections() : createFrenchSections(),
  };
}

function createArabicSections(): Exam["sections"] {
  return [
    {
      id: "history",
      title: "أولا: مكون التاريخ",
      subject: "التاريخ",
      points: 7,
      blocks: [
        {
          id: "history-instruction",
          type: "instruction",
          startsNewQuestion: false,
          order: 0,
          content: "اقرأ الوثيقة الآتية بتمعن، ثم أجب عن الأسئلة.",
        },
        {
          id: "history-document",
          type: "text-document",
          startsNewQuestion: false,
          order: 1,
          title: "وثيقة تاريخية",
          content:
            "ساهمت الحركة الوطنية المغربية في مواجهة نظام الحماية والمطالبة بالإصلاحات السياسية والاجتماعية. وقد انتقلت من المطالبة بالإصلاح إلى المطالبة بالاستقلال، خاصة بعد تقديم وثيقة المطالبة بالاستقلال يوم 11 يناير 1944.\n\nوعقب نفي السلطان محمد الخامس سنة 1953، تصاعدت المقاومة المسلحة وازدادت وحدة المغاربة، فعاد السلطان من المنفى وأعلن استقلال المغرب سنة 1956.",
          source: "بتصرف عن كتاب تاريخ المغرب المعاصر",
          reference: "الصفحات 84-86",
          bordered: true,
          points: 1,
        },
        {
          id: "history-question-lines",
          type: "question",
          startsNewQuestion: true,
          order: 2,
          question: "استخرج من الوثيقة مرحلتين من تطور مطالب الحركة الوطنية.",
          answerMode: "lines",
          answerLines: 3,
          points: 2,
        },
        {
          id: "history-definition",
          type: "definition",
          startsNewQuestion: true,
          order: 3,
          instruction: "عرّف المصطلحين الآتيين:",
          items: [
            {
              id: "definition-protectorate",
              term: "نظام الحماية",
              answerLines: 2,
              points: 1,
            },
            {
              id: "definition-national-movement",
              term: "الحركة الوطنية",
              answerLines: 2,
              points: 1,
            },
          ],
        },
        {
          id: "history-separator",
          type: "separator",
          startsNewQuestion: false,
          order: 4,
          style: "line",
        },
      ],
    },
    {
      id: "citizenship",
      title: "ثانيا: مكون التربية على المواطنة",
      subject: "التربية على المواطنة",
      points: 6,
      blocks: [
        {
          id: "citizenship-true-false",
          type: "true-false",
          startsNewQuestion: true,
          order: 0,
          instruction: "ضع علامة في الخانة المناسبة:",
          statements: [
            {
              id: "statement-1",
              text: "المساواة أمام القانون حق لجميع المواطنين.",
              points: 0.5,
            },
            {
              id: "statement-2",
              text: "يقتصر التضامن على تقديم المساعدة المادية فقط.",
              points: 0.5,
            },
            {
              id: "statement-3",
              text: "يساهم الحوار في حل النزاعات بطريقة سلمية.",
              points: 0.5,
            },
            {
              id: "statement-4",
              text: "المحافظة على الممتلكات العامة مسؤولية مشتركة.",
              points: 0.5,
            },
          ],
        },
        {
          id: "citizenship-mcq",
          type: "multiple-choice",
          startsNewQuestion: true,
          order: 1,
          question: "اختر السلوك الذي يعبر عن المواطنة المسؤولة:",
          options: [
            {
              id: "option-1",
              text: "احترام القانون والمشاركة في خدمة المجتمع",
            },
            { id: "option-2", text: "إتلاف تجهيزات المؤسسة" },
            { id: "option-3", text: "رفض الاستماع إلى الرأي المخالف" },
            { id: "option-4", text: "استعمال العنف لحل الخلافات" },
          ],
          points: 1,
        },
        {
          id: "citizenship-fill-blank",
          type: "fill-blank",
          startsNewQuestion: true,
          order: 2,
          instruction: "أكمل بما يناسب:",
          segments: [
            { type: "text", value: "تقوم المواطنة على التمتع بـ " },
            { type: "blank", id: "blank-rights", width: 11 },
            { type: "text", value: " والالتزام بـ " },
            { type: "blank", id: "blank-duties", width: 11 },
            { type: "text", value: "." },
          ],
          points: 1,
        },
        {
          id: "citizenship-question-box",
          type: "question",
          startsNewQuestion: true,
          order: 3,
          question: "اقترح مبادرة مدرسية تعزز قيمة التضامن.",
          answerMode: "box",
          answerLines: 5,
          points: 2,
        },
      ],
    },
    {
      id: "geography",
      title: "ثالثا: مكون الجغرافيا",
      subject: "الجغرافيا",
      points: 7,
      blocks: [
        {
          id: "geography-page-break",
          type: "page-break",
          startsNewQuestion: false,
          order: 0,
        },
        {
          id: "geography-table",
          type: "table",
          startsNewQuestion: true,
          order: 1,
          showHeader: true,
          columns: [
            { id: "country", label: "البلد" },
            { id: "population", label: "عدد السكان بالمليون" },
            { id: "urban", label: "نسبة التمدن" },
            { id: "growth", label: "معدل النمو" },
          ],
          rows: Array.from({ length: 18 }, (_, index) => ({
            id: `geography-row-${index}`,
            cells: [
              {
                columnId: "country",
                value: ["المغرب", "تونس", "مصر", "السنغال", "نيجيريا", "كينيا"][
                  index % 6
                ],
              },
              { columnId: "population", value: String(38 + index * 3) },
              { columnId: "urban", value: `${56 + (index % 8) * 4}%` },
              {
                columnId: "growth",
                value: `${(1.1 + (index % 5) * 0.3).toFixed(1)}%`,
              },
            ],
          })),
          points: 2,
        },
        {
          id: "geography-matching",
          type: "matching",
          startsNewQuestion: true,
          order: 2,
          instruction: "صل كل مفهوم بما يناسبه:",
          leftItems: [
            { id: "left-density", text: "الكثافة السكانية" },
            { id: "left-urbanization", text: "التمدن" },
            { id: "left-migration", text: "الهجرة القروية" },
          ],
          rightItems: [
            { id: "right-density", text: "عدد السكان في الكيلومتر المربع" },
            { id: "right-urbanization", text: "تزايد نسبة سكان المدن" },
            {
              id: "right-migration",
              text: "انتقال السكان من القرية إلى المدينة",
            },
          ],
          points: 1.5,
        },
        {
          id: "geography-image",
          type: "image",
          startsNewQuestion: false,
          order: 3,
          imageId: "reference-landscape",
          title: "توزيع السكان بالمغرب",
          caption: "خريطة تركيبية مبسطة",
          source: "وثيقة تعليمية تجريبية",
          width: 70,
          alignment: "center",
          bordered: true,
          points: 1,
        },
        {
          id: "geography-essay",
          type: "essay",
          startsNewQuestion: true,
          order: 4,
          context: "تعرف المدن المغربية نموا سكانيا ومجاليا متسارعا.",
          instruction:
            "اكتب موضوعا مقاليا تبرز فيه مظاهر التحضر بالمغرب وبعض نتائجه.",
          topics: [
            { id: "topic-1", text: "مظاهر نمو المدن المغربية" },
            { id: "topic-2", text: "النتائج الاجتماعية والمجالية للتحضر" },
            { id: "topic-3", text: "حلول مقترحة لتنمية حضرية مستدامة" },
          ],
          points: 2.5,
        },
        {
          id: "geography-note",
          type: "free-text",
          startsNewQuestion: false,
          order: 5,
          content: "نظّم إجابتك واحرص على وضوح الخط وسلامة اللغة.",
          variant: "note",
        },
      ],
    },
  ];
}

function createFrenchSections(): Exam["sections"] {
  return [
    {
      id: "history-fr",
      title: "I. Histoire : le Maroc face au protectorat",
      subject: "Histoire",
      points: 8,
      blocks: [
        {
          id: "document-fr",
          type: "text-document",
          startsNewQuestion: false,
          order: 0,
          instruction: "Lisez le document, puis répondez aux questions.",
          title: "L’évolution du mouvement national",
          content:
            "Dans les années 1930, le mouvement national marocain formule des revendications réformatrices. Après la Seconde Guerre mondiale, il réclame ouvertement l’indépendance.\n\nLe Manifeste du 11 janvier 1944 affirme cette évolution. L’exil du sultan Mohammed V en 1953 renforce ensuite la mobilisation populaire jusqu’au retour du souverain et à l’indépendance de 1956.",
          source: "D’après une synthèse d’histoire contemporaine du Maroc",
          reference: "Chapitre 4, p. 72-74",
          bordered: true,
          points: 2,
        },
        {
          id: "question-fr-lines",
          type: "question",
          startsNewQuestion: true,
          order: 1,
          question:
            "Présentez deux étapes de l’évolution du mouvement national.",
          answerMode: "lines",
          answerLines: 5,
          points: 3,
        },
        {
          id: "question-fr-none",
          type: "question",
          startsNewQuestion: true,
          order: 2,
          question: "Relevez la date de l’indépendance du Maroc.",
          answerMode: "none",
          points: 1,
        },
        {
          id: "definitions-fr",
          type: "definition",
          startsNewQuestion: true,
          order: 3,
          instruction: "Définissez les notions suivantes :",
          items: [
            {
              id: "definition-protectorat",
              term: "Protectorat",
              answerLines: 2,
              points: 1,
            },
            {
              id: "definition-independance",
              term: "Indépendance",
              answerLines: 2,
              points: 1,
            },
          ],
        },
      ],
    },
    {
      id: "geography-fr",
      title: "II. Géographie : dynamiques de la population",
      subject: "Géographie",
      points: 7,
      blocks: [
        {
          id: "table-fr",
          type: "table",
          startsNewQuestion: true,
          order: 0,
          showHeader: true,
          columns: [
            { id: "indicator", label: "Indicateur démographique" },
            { id: "value-2004", label: "2004" },
            { id: "value-2014", label: "2014" },
            { id: "observation", label: "Observation" },
          ],
          rows: Array.from({ length: 14 }, (_, index) => ({
            id: `fr-row-${index}`,
            cells: [
              {
                columnId: "indicator",
                value: `Indicateur ${index + 1} avec un intitulé réaliste`,
              },
              { columnId: "value-2004", value: `${25 + index},${index % 10}` },
              {
                columnId: "value-2014",
                value: `${30 + index},${(index + 3) % 10}`,
              },
              {
                columnId: "observation",
                value:
                  index % 3 === 0
                    ? "Progression modérée sur la période étudiée"
                    : "",
              },
            ],
          })),
          points: 3,
        },
        {
          id: "image-fr",
          type: "image",
          startsNewQuestion: false,
          order: 1,
          imageId: "reference-landscape",
          title: "Répartition de la population",
          caption: "Schéma de synthèse",
          source: "Document pédagogique de test",
          width: 50,
          alignment: "end",
          bordered: true,
          points: 1,
        },
        {
          id: "matching-fr",
          type: "matching",
          startsNewQuestion: true,
          order: 2,
          instruction: "Reliez chaque notion à sa définition.",
          leftItems: [
            { id: "urbanisation", text: "Urbanisation" },
            { id: "density", text: "Densité" },
            { id: "migration", text: "Exode rural" },
          ],
          rightItems: [
            { id: "definition-urbanisation", text: "Croissance des villes" },
            { id: "definition-density", text: "Habitants par km²" },
            { id: "definition-migration", text: "Départ des campagnes" },
          ],
          points: 2,
        },
      ],
    },
    {
      id: "citizenship-fr",
      title: "III. Éducation civique",
      subject: "Éducation civique",
      points: 5,
      blocks: [
        {
          id: "break-fr",
          type: "page-break",
          startsNewQuestion: false,
          order: 0,
        },
        {
          id: "true-false-fr",
          type: "true-false",
          startsNewQuestion: true,
          order: 1,
          instruction: "Indiquez si chaque proposition est vraie ou fausse.",
          statements: [
            {
              id: "fr-statement-1",
              text: "La loi s’applique à tous les citoyens.",
              points: 0.5,
            },
            {
              id: "fr-statement-2",
              text: "Le dialogue exclut l’écoute de l’autre.",
              points: 0.5,
            },
            {
              id: "fr-statement-3",
              text: "La solidarité contribue à la cohésion sociale.",
              points: 0.5,
            },
          ],
        },
        {
          id: "mcq-fr",
          type: "multiple-choice",
          startsNewQuestion: true,
          order: 2,
          question: "Quelles actions protègent les biens publics ?",
          allowMultipleAnswers: true,
          options: [
            { id: "fr-option-1", text: "Signaler les dégradations" },
            { id: "fr-option-2", text: "Respecter les équipements collectifs" },
            { id: "fr-option-3", text: "Abandonner les déchets dans la rue" },
            {
              id: "fr-option-4",
              text: "Participer à une action de sensibilisation",
            },
          ],
          points: 1.5,
        },
        {
          id: "fill-fr",
          type: "fill-blank",
          startsNewQuestion: true,
          order: 3,
          instruction: "Complétez la phrase.",
          segments: [
            { type: "text", value: "Tout citoyen dispose de " },
            { type: "blank", id: "fr-rights", width: 10 },
            { type: "text", value: " et assume des " },
            { type: "blank", id: "fr-duties", width: 10 },
            { type: "text", value: "." },
          ],
          points: 1,
        },
        {
          id: "box-fr",
          type: "question",
          startsNewQuestion: true,
          order: 4,
          question:
            "Proposez une action citoyenne réalisable dans votre collège.",
          answerMode: "box",
          answerLines: 5,
          points: 2,
        },
      ],
    },
  ];
}

export const REFERENCE_LANDSCAPE_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="520" viewBox="0 0 1000 520"><rect width="1000" height="520" fill="white"/><path d="M70 400 C220 90 520 80 920 380" fill="none" stroke="#222" stroke-width="12"/><path d="M110 410 L300 245 L470 330 L660 155 L890 390" fill="none" stroke="#666" stroke-width="7"/><circle cx="300" cy="245" r="24" fill="#333"/><circle cx="660" cy="155" r="24" fill="#777"/><text x="500" y="480" font-family="Arial" font-size="34" text-anchor="middle">Document géographique de référence</text></svg>',
)}`;
