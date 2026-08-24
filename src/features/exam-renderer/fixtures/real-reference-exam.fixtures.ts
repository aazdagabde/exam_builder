import { createEmptyExam, type Exam } from "@/domain/exam";

const REFERENCE_NOW = "2026-08-23T00:00:00.000Z";

export function createThirdYearReferenceExam(): Exam {
  const exam = createEmptyExam({
    id: "qa-third-year-reference",
    now: REFERENCE_NOW,
    documentLanguage: "ar",
    templateId: "moroccan-college-classic",
  });
  return {
    ...exam,
    metadata: {
      title: "فرض محروس رقم 2 الأسدوس الثاني",
      academicYear: "2024/2025",
      regionalAcademy: "الأكاديمية الجهوية للتربية والتكوين لجهة درعة تافيلالت",
      provincialDirectorate: "المديرية الإقليمية: تنغير",
      institution: "الثانوية الإعدادية واكليم",
      level: "الثالثة ثانوي إعدادي",
      subject: "مادة الاجتماعيات",
      teacherName: "الأستاذة: حسناء العبد",
      durationMinutes: 55,
      totalPoints: 20,
      examNumber: "2",
    },
    sections: [
      {
        id: "third-history",
        title: "أولا: مادة التاريخ — الاشتغال على الوثائق",
        points: 7,
        blocks: [
          {
            id: "third-history-instruction",
            type: "instruction",
            startsNewQuestion: false,
            order: 0,
            content: "اقرأ الوثيقة بتمعن ثم أجب عن التعليمات التالية:",
          },
          {
            id: "third-history-document",
            type: "text-document",
            startsNewQuestion: false,
            order: 1,
            content:
              "وفي سنة 1930 ميلادية، أي قبل انتهاء المقاومة المسلحة بالجبال المغربية بأربع سنوات، نشأت في البلاد الواقعة تحت السيطرة الفرنسية حركة وطنية. ولم تحل سنة 1944 حتى نهض الشعب المغربي بقيادة الحركة الوطنية، فطالب بإلغاء الحماية والاعتراف للبلاد باستقلالها، وقد تضامنت الحكومة وعلى رأسها الملك محمد بن يوسف مع الشعب المغربي في وثبته ضد المستعمر.",
            source: "محمد الحسن الوزاني، مذكرات حياة وجهاد",
            reference: "الجزء الأول، ص 47",
            bordered: true,
          },
          {
            id: "third-source-question",
            type: "question",
            startsNewQuestion: true,
            order: 2,
            question: "حدد(ي) مصدر النص ونوعية الوثيقة.",
            answerMode: "lines",
            answerLines: 2,
            points: 1,
          },
          {
            id: "third-definitions",
            type: "definition",
            startsNewQuestion: true,
            order: 3,
            instruction: "اشرح(ي) ما تحته خط شرحا تاريخيا:",
            items: [
              {
                id: "third-national-movement",
                term: "الحركة الوطنية",
                answerLines: 2,
                points: 1,
              },
              {
                id: "third-mohammed-v",
                term: "محمد بن يوسف",
                answerLines: 2,
                points: 1,
              },
            ],
          },
          {
            id: "third-context-question",
            type: "question",
            startsNewQuestion: true,
            order: 4,
            question: "ضع(ي) النص في إطاره التاريخي.",
            answerMode: "lines",
            answerLines: 2,
            points: 1,
          },
          {
            id: "third-demands-question",
            type: "question",
            startsNewQuestion: true,
            order: 5,
            question: "استخرج(ي) من الوثيقة مطالب الحركة الوطنية.",
            answerMode: "lines",
            answerLines: 2,
            points: 1,
          },
          {
            id: "third-history-table",
            type: "table",
            startsNewQuestion: true,
            order: 6,
            showHeader: true,
            columns: [
              { id: "tribes", label: "القبائل المقاومة" },
              { id: "leaders", label: "زعماء المقاومة" },
              { id: "battles", label: "أهم المعارك" },
              { id: "year", label: "السنة" },
            ],
            rows: [
              {
                id: "third-history-row-1",
                cells: [
                  { columnId: "tribes", value: "" },
                  { columnId: "leaders", value: "" },
                  { columnId: "battles", value: "أنوال" },
                  { columnId: "year", value: "" },
                ],
              },
              {
                id: "third-history-row-2",
                cells: [
                  { columnId: "tribes", value: "قبائل أيت عطا بمنطقة صاغرو" },
                  { columnId: "leaders", value: "" },
                  { columnId: "battles", value: "" },
                  { columnId: "year", value: "" },
                ],
              },
            ],
            points: 2,
          },
        ],
      },
      {
        id: "third-citizenship",
        title: "ثانيا: مادة التربية على المواطنة — أسئلة موضوعية",
        points: 6,
        blocks: [
          {
            id: "third-page-break",
            type: "page-break",
            startsNewQuestion: false,
            order: 0,
          },
          {
            id: "third-citizenship-definitions",
            type: "definition",
            startsNewQuestion: true,
            order: 1,
            instruction: "عرف(ي) المصطلحات التالية:",
            items: [
              {
                id: "third-dialogue",
                term: "حوار الأديان",
                answerLines: 2,
                points: 1,
              },
              {
                id: "third-coexistence",
                term: "التعايش السلمي",
                answerLines: 2,
                points: 1,
              },
            ],
          },
          {
            id: "third-true-false",
            type: "true-false",
            startsNewQuestion: true,
            order: 2,
            instruction: "ضع(ي) علامة (×) أمام الجواب المناسب:",
            statements: [
              {
                id: "third-statement-1",
                text: "الحوارات الجماعية تتم عن طريق تبادل الرسائل بين العلماء المتخصصين في ديانات مختلفة.",
              },
              {
                id: "third-statement-2",
                text: "نهج المغرب أسلوبا سلميا متحضرا بتنظيم المسيرة الخضراء.",
              },
              {
                id: "third-statement-3",
                text: "أعطى المغرب مكانة كبيرة لمبادئ السلم والتعايش في سياسته الخارجية.",
              },
              {
                id: "third-statement-4",
                text: "شارك المغرب في حفظ السلم العالمي عبر المشاركات الأممية.",
              },
            ],
            points: 2,
          },
          {
            id: "third-media-question",
            type: "question",
            startsNewQuestion: true,
            order: 3,
            question: "اذكر(ي) أنواع البرامج الإعلامية.",
            answerMode: "lines",
            answerLines: 3,
            points: 2,
          },
        ],
      },
      {
        id: "third-geography",
        title: "ثالثا: مادة الجغرافيا — موضوع مقالي",
        points: 7,
        blocks: [
          {
            id: "third-essay",
            type: "essay",
            startsNewQuestion: true,
            order: 0,
            context:
              "تعتبر نيجيريا من أغنى البلدان الإفريقية من حيث الثروات الطبيعية، إلا أنها ضعيفة من الناحية التنموية.",
            instruction: "اكتب موضوعا مقاليا من مقدمة وعرض وخاتمة توضح فيه:",
            topics: [
              { id: "third-topic-1", text: "مظاهر الغنى الطبيعي بنيجيريا" },
              { id: "third-topic-2", text: "أسباب الضعف التنموي" },
              {
                id: "third-topic-3",
                text: "بعض الإجراءات لمواجهة الضعف التنموي",
              },
            ],
            points: 7,
          },
          {
            id: "third-closing",
            type: "free-text",
            startsNewQuestion: false,
            order: 1,
            content: "حظ موفق للجميع",
            variant: "note",
          },
        ],
      },
    ],
  };
}

export function createFirstYearReferenceExam(): Exam {
  const exam = createEmptyExam({
    id: "qa-first-year-reference",
    now: REFERENCE_NOW,
    documentLanguage: "ar",
    templateId: "moroccan-college-classic",
  });
  return {
    ...exam,
    metadata: {
      title: "فرض محروس رقم 2",
      academicYear: "2025/2026",
      institution: "الثانوية الإعدادية واكليم",
      level: "الأولى ثانوي إعدادي",
      subject: "مادة الاجتماعيات",
      teacherName: "ذ. حسناء العبد",
      durationMinutes: 60,
      totalPoints: 20,
      examNumber: "2",
    },
    sections: [
      {
        id: "first-geography",
        title: "الموضوع الأول: مادة الجغرافيا — تعاريف وأسئلة موضوعية",
        points: 7,
        blocks: [
          {
            id: "first-definitions",
            type: "definition",
            startsNewQuestion: true,
            order: 0,
            instruction: "عرف ما يلي:",
            items: [
              { id: "first-industry", term: "الصناعة", answerLines: 2 },
              { id: "first-agriculture", term: "الفلاحة", answerLines: 2 },
            ],
            points: 2,
          },
          {
            id: "first-industry-table",
            type: "table",
            startsNewQuestion: true,
            order: 1,
            showHeader: true,
            columns: [
              { id: "industry", label: "الصناعات" },
              { id: "examples", label: "أمثلة" },
            ],
            rows: [
              {
                id: "first-industry-row-1",
                cells: [
                  { columnId: "industry", value: "الصناعة الكيماوية" },
                  { columnId: "examples", value: "" },
                ],
              },
              {
                id: "first-industry-row-2",
                cells: [
                  { columnId: "industry", value: "" },
                  { columnId: "examples", value: "مشتقات الحليب" },
                ],
              },
              {
                id: "first-industry-row-3",
                cells: [
                  { columnId: "industry", value: "الصناعة الإلكترونية" },
                  { columnId: "examples", value: "" },
                ],
              },
            ],
            points: 3,
          },
          {
            id: "first-true-false",
            type: "true-false",
            startsNewQuestion: true,
            order: 2,
            instruction: "أجب بصحيح أو خطأ:",
            statements: [
              {
                id: "first-statement-1",
                text: "يدخل الجلد ضمن الموارد الباطنية.",
              },
              {
                id: "first-statement-2",
                text: "يعتبر البترول من مصادر الطاقة.",
              },
            ],
            points: 1,
          },
          {
            id: "first-agriculture-question",
            type: "question",
            startsNewQuestion: true,
            order: 3,
            question: "اذكر المقومات الأساسية للفلاحة.",
            answerMode: "lines",
            answerLines: 2,
            points: 1,
          },
        ],
      },
      {
        id: "first-citizenship",
        title: "الموضوع الثاني: التربية على المواطنة — الاشتغال على الوثيقة",
        points: 6,
        blocks: [
          {
            id: "first-un-document",
            type: "text-document",
            startsNewQuestion: false,
            order: 0,
            title: "وثيقة",
            content:
              "تأسست هيئة الأمم المتحدة سنة 1945 وفق مؤتمر سان فرانسيسكو، وتهدف إلى الحفاظ على السلم والأمن الدولي وإعمال مبادئ العدل والقانون الدولي وحل المنازعات الدولية وتسويتها.",
            source:
              "كتاب في رحاب الاجتماعيات للسنة الأولى من التعليم الثانوي الإعدادي",
            reference: "ص 184",
            bordered: true,
          },
          {
            id: "first-source-question",
            type: "question",
            startsNewQuestion: true,
            order: 1,
            question: "حدد مصدر الوثيقة.",
            answerMode: "lines",
            answerLines: 1,
            points: 1,
          },
          {
            id: "first-goals-question",
            type: "question",
            startsNewQuestion: true,
            order: 2,
            question: "استخلص من الوثيقة هدفين من أهداف هيئة الأمم المتحدة.",
            answerMode: "lines",
            answerLines: 2,
            points: 2,
          },
          {
            id: "first-organs-question",
            type: "question",
            startsNewQuestion: true,
            order: 3,
            question: "استخرج من الوثيقة بعض أجهزة هيئة الأمم المتحدة.",
            answerMode: "lines",
            answerLines: 1,
            points: 1,
          },
          {
            id: "first-role-question",
            type: "question",
            startsNewQuestion: true,
            order: 4,
            question: "حدد دور الجمعية العامة لهيئة الأمم المتحدة.",
            answerMode: "lines",
            answerLines: 2,
            points: 2,
          },
        ],
      },
      {
        id: "first-history",
        title: "الموضوع الثالث: التاريخ — الموضوع المقالي",
        points: 7,
        blocks: [
          {
            id: "first-history-table",
            type: "table",
            startsNewQuestion: true,
            order: 0,
            showHeader: true,
            columns: [
              { id: "caliphate", label: "الخلافة" },
              { id: "founder", label: "المؤسس" },
              { id: "period", label: "الفترة الزمنية" },
              { id: "lineage", label: "النسب" },
              { id: "area", label: "المجال" },
            ],
            rows: [
              {
                id: "first-umayyad",
                cells: [
                  { columnId: "caliphate", value: "الأموية" },
                  { columnId: "founder", value: "معاوية بن أبي سفيان" },
                  { columnId: "period", value: "من 661 إلى 750م" },
                  { columnId: "lineage", value: "فرع بني أمية" },
                  {
                    columnId: "area",
                    value: "من حدود الهند شرقا إلى الأندلس غربا",
                  },
                ],
              },
              {
                id: "first-abbasid",
                cells: [
                  { columnId: "caliphate", value: "العباسية" },
                  { columnId: "founder", value: "أبو العباس السفاح" },
                  { columnId: "period", value: "من 750 إلى 1258م" },
                  { columnId: "lineage", value: "الفرع الهاشمي" },
                  {
                    columnId: "area",
                    value: "من حدود الهند شرقا إلى إفريقيا غربا",
                  },
                ],
              },
            ],
          },
          {
            id: "first-essay",
            type: "essay",
            startsNewQuestion: true,
            order: 1,
            instruction:
              "اعتمادا على الوثيقة وما درسته، اكتب موضوعا مقاليا من مقدمة وعرض وخاتمة تبرز فيه مراحل حكم الأمويين والعباسيين.",
            topics: [],
            points: 7,
          },
        ],
      },
    ],
  };
}
