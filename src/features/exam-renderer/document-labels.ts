import type { DocumentLanguage } from "@/domain/exam";

export interface DocumentLabels {
  academy: string;
  provincialDirectorate: string;
  institution: string;
  level: string;
  subject: string;
  teacher: string;
  academicYear: string;
  fullName: string;
  studentNumber: string;
  className: string;
  grade: string;
  duration: string;
  minutes: string;
  source: string;
  reference: string;
  trueLabel: string;
  falseLabel: string;
  statement: string;
  context: string;
  topics: string;
  points: string;
  total: string;
  imageUnavailable: string;
  chart: string;
  series: string;
  chartInvalid: string;
  chartNoData: string;
  chartType: string;
  category: string;
}

const DOCUMENT_LABELS: Record<DocumentLanguage, DocumentLabels> = {
  ar: {
    academy: "الأكاديمية الجهوية",
    provincialDirectorate: "المديرية الإقليمية",
    institution: "المؤسسة",
    level: "المستوى",
    subject: "المادة",
    teacher: "الأستاذ(ة)",
    academicYear: "السنة الدراسية",
    fullName: "الاسم الكامل",
    studentNumber: "الرقم الترتيبي",
    className: "القسم",
    grade: "النقطة",
    duration: "المدة",
    minutes: "دقيقة",
    source: "المصدر",
    reference: "المرجع",
    trueLabel: "صحيح",
    falseLabel: "خطأ",
    statement: "المعطيات",
    context: "السياق",
    topics: "العناصر",
    points: "ن",
    total: "المجموع",
    imageUnavailable: "الصورة غير متوفرة",
    chart: "المبيان",
    series: "السلسلة",
    chartInvalid: "بيانات المبيان غير متوافقة.",
    chartNoData: "لا توجد بيانات للعرض.",
    chartType: "النوع",
    category: "الفئة",
  },
  fr: {
    academy: "Académie régionale",
    provincialDirectorate: "Direction provinciale",
    institution: "Établissement",
    level: "Niveau",
    subject: "Matière",
    teacher: "Professeur",
    academicYear: "Année scolaire",
    fullName: "Nom complet",
    studentNumber: "Numéro",
    className: "Classe",
    grade: "Note",
    duration: "Durée",
    minutes: "min",
    source: "Source",
    reference: "Référence",
    trueLabel: "Vrai",
    falseLabel: "Faux",
    statement: "Énoncé",
    context: "Contexte",
    topics: "Éléments à traiter",
    points: "pt",
    total: "Total",
    imageUnavailable: "Image indisponible",
    chart: "Graphique",
    series: "Série",
    chartInvalid: "Les données ne sont pas compatibles avec ce graphique.",
    chartNoData: "Aucune donnée à afficher.",
    chartType: "Type",
    category: "Catégorie",
  },
};

export function getDocumentLabels(language: DocumentLanguage): DocumentLabels {
  return DOCUMENT_LABELS[language];
}
