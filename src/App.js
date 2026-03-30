import React, {
  useState, useCallback, useMemo, useEffect,
  createContext, useContext,
} from 'react';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════
// SUPABASE CLIENT
// CRA:  REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY
// Vite: VITE_SUPABASE_URL     / VITE_SUPABASE_ANON_KEY
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL      = process.env.REACT_APP_SUPABASE_URL      || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ═══════════════════════════════════════════════════════════
// DATA MODE
// 'local'  → localStorage mock (no Supabase needed)
// 'remote' → real Supabase (requires env vars + seeded DB)
// ═══════════════════════════════════════════════════════════
const DATA_MODE = 'remote';

// ═══════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════
const C = {
  primary: '#2563eb', primaryHover: '#1d4ed8', primaryLight: '#eff6ff',
  success: '#16a34a', successLight: '#dcfce7', successBorder: '#86efac',
  warning: '#d97706', warningLight: '#fffbeb', warningBorder: '#fcd34d',
  gray50: '#f9fafb', gray100: '#f3f4f6', gray200: '#e5e7eb',
  gray400: '#9ca3af', gray500: '#6b7280', gray700: '#374151', gray900: '#111827',
  white: '#ffffff', red: '#dc2626', redLight: '#fef2f2',
};

const SUBJECT_TYPE_INFO = {
  gemara:         { label: 'גמרא',      color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
  mishna:         { label: 'משנה',      color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
  halacha:        { label: 'הלכה',      color: '#7e22ce', bg: '#faf5ff', border: '#d8b4fe' },
  beitMidrash:    { label: 'בית מדרש', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  toshevaUnified: { label: 'תושב"ע',   color: '#0369a1', bg: '#f0f9ff', border: '#7dd3fc' },
};

const VIEWS      = { GRADES: 'grades', CLASSES: 'classes', SUBJECTS: 'subjects', UNITS: 'units' };
const STORAGE_KEY = 'tosheva_app_v1';

// ═══════════════════════════════════════════════════════════
// AUTH CONTEXT
// ═══════════════════════════════════════════════════════════
const AuthContext = createContext(null);

// ═══════════════════════════════════════════════════════════
// MOCK DATA  (local mode only)
// ═══════════════════════════════════════════════════════════
const mk = (id, title, order, done = false, notes = '') => ({
  id, title, order, completed: done,
  completedAt: done ? '2026-02-01' : null,
  notes, teachingQuality: null,
});

const INITIAL_DATA = {
  users: {
    'nir-sharafi': {
      id: 'nir-sharafi', name: 'ניר שרפי', role: 'admin',
      assignedClasses: [], assignedSubjects: [],
    },
    'shimon-turgeman': {
      id: 'shimon-turgeman', name: 'שמעון תורגמן', role: 'teacher',
      assignedClasses: [
        { disciplineId: 'tosheva', gradeId: 'grade7', classId: '7-1' },
        { disciplineId: 'tosheva', gradeId: 'grade9', classId: '9-2' },
      ],
      assignedSubjects: [
        { disciplineId: 'tosheva', gradeId: 'grade7', classId: '7-1', subjectId: 'gemara-kiddushin' },
        { disciplineId: 'tosheva', gradeId: 'grade7', classId: '7-1', subjectId: 'halacha-tefila' },
        { disciplineId: 'tosheva', gradeId: 'grade9', classId: '9-2', subjectId: 'gemara-sanhedrin' },
      ],
    },
    'eliyahu-amsalem': {
      id: 'eliyahu-amsalem', name: 'אליהו אמסלם', role: 'teacher',
      assignedClasses: [
        { disciplineId: 'tosheva', gradeId: 'grade8', classId: '8-1' },
        { disciplineId: 'tosheva', gradeId: 'grade8', classId: '8-4' },
      ],
      assignedSubjects: [
        { disciplineId: 'tosheva', gradeId: 'grade8', classId: '8-1', subjectId: 'gemara-bavakama' },
        { disciplineId: 'tosheva', gradeId: 'grade8', classId: '8-1', subjectId: 'halacha-shabbat' },
        { disciplineId: 'tosheva', gradeId: 'grade8', classId: '8-4', subjectId: 'mishna-bm' },
        { disciplineId: 'tosheva', gradeId: 'grade8', classId: '8-4', subjectId: 'halacha-shabbat-g' },
      ],
    },
  },
  disciplines: {
    tosheva: {
      label: 'תושב"ע',
      grades: {
        grade7: {
          label: "כיתה ז'",
          classes: {
            '7-1': {
              label: "ז'1", gender: 'boys',
              subjects: {
                'gemara-kiddushin': {
                  id: 'gemara-kiddushin', subjectType: 'gemara',
                  subjectTitle: 'קידושין', teacherId: 'shimon-turgeman',
                  sourceFile: 'חומר לימוד לכיתה ז - גמרא - בנים',
                  lastUpdated: '', notes: '', isLocked: false,
                  units: [
                    mk('u1','ברכות התפילין',1,true), mk('u2','מהי ברכת התפילין?',2,true),
                    mk('u3','סדר הנחת תפילין וחליצתן',3,true), mk('u4','זמן הנחת תפילין',4),
                    mk('u5','מיקום הנחת תפילין',5), mk('u6','מקום התפילין של ראש',6),
                    mk('u7','התאמת התפילין למידותיך',7), mk('u8','יצור תפילין',8),
                    mk('u9','קידושין – מצוות אבות ובנים (כז.)',9),
                    mk('u10','"כל מצוות הבן על האב" (כט.)',10),
                    mk('u11','מי חייב לקיים מצוות ברית מילה? (כט.)',11),
                    mk('u12','מי חייב לקיים מצוות פדיון הבן? (כט:)',12),
                    mk('u13','הוא לפדות ובנו ללמד (כט:)',13),
                  ],
                },
                'halacha-tefila': {
                  id: 'halacha-tefila', subjectType: 'halacha',
                  subjectTitle: 'פניני הלכה – הלכות תפילה', teacherId: 'shimon-turgeman',
                  sourceFile: 'חומר לימוד לכיתה ז - הלכה - בנים',
                  lastUpdated: '', notes: '', isLocked: false,
                  units: [
                    mk('h1','יסודות הלכות תפילה – א. התפילה',1),
                    mk('h2','ב. תפילותיהם של האבות והנביאים',2),
                    mk('h3','ג. פעולתה של התפילה',3),
                    mk('h4','ד. האם חיובה מהתורה?',4),
                    mk('h5','ה. תקנת התפילה ע"י אנשי כנסת הגדולה',5),
                    mk('h6','ו. הנוסח הקבוע',6), mk('h7','ז. תקנת שלוש התפילות',7),
                    mk('h8','הלכות כיפה – יסוד ההלכה',8),
                    mk('h9','הלכות כיפה – שיעור הכיפה',9),
                    mk('h10','הלכות ציצית – בגד הציצית',10),
                  ],
                },
              },
            },
          },
        },
        grade8: {
          label: "כיתה ח'",
          classes: {
            '8-1': {
              label: "ח'1", gender: 'boys',
              subjects: {
                'gemara-bavakama': {
                  id: 'gemara-bavakama', subjectType: 'gemara',
                  subjectTitle: 'בבא קמא – פרק המניח', teacherId: 'eliyahu-amsalem',
                  sourceFile: 'חומר לימוד לכיתה ח - גמרא - בנים',
                  lastUpdated: '', notes: '', isLocked: false,
                  units: [
                    mk('b1','משנה א – רכוש שהונח ברשות הרבים (כז.)',1,true),
                    mk('b2','פתח בכד וסיים בחבית (כז:)',2,true),
                    mk('b3','אין הולכים במון אחר הרוב (כז.-כז:)',3,true),
                    mk('b4','הנתקל ששבר את הכד (כז:)',4,true),
                    mk('b5','אין דרכן של בני אדם להתבונן בדרכים (כז:)',5,true),
                    mk('b6','במקום פסידה דינא אינש עביד לנפשיה (כז:)',6,true),
                    mk('b7','כניסה לחצר חברו ללא רשות (כז:-כח.)',7),
                    mk('b8','שור שעלה על גבי חברו להורגו (כח.)',8),
                    mk('b9','הממלא חצר חברו כדי יין וכדי שמן (כח.)',9),
                    mk('b10','נרצע לו יציא לו ימיו (כח.)',10),
                    mk('b11','הניח הכד ברשות הרבים ובא אחר ונתקל בה (כח.)',11),
                    mk('b12','"וקצתה את כפה" (כח.)',12),
                    mk('b13','משנה ב – נזק שנגרם מחפץ שנשבר ברשות הרבים (כח.-כח:)',13),
                    mk('b14','מחלוקת ר׳ מאיר ור׳ יהודה (כח:)',14),
                    mk('b15','משנה ג – המזיק באמצעות רכישו ברשות הרבים (ל.)',15),
                  ],
                },
                'halacha-shabbat': {
                  id: 'halacha-shabbat', subjectType: 'halacha',
                  subjectTitle: 'חמדת ימים – הלכות שבת', teacherId: 'eliyahu-amsalem',
                  sourceFile: 'חומר לימוד לכיתה ח - הלכה',
                  lastUpdated: '', notes: '', isLocked: false,
                  units: [
                    mk('s1','כבוד השבת – א. כבוד ועונג מצוות דרבנן',1,true),
                    mk('s2','כבוד השבת – ב. ההכנות לשבת',2,true),
                    mk('s3','כבוד השבת – ג. איסור קביעת סעודה בערב שבת',3,true),
                    mk('s4','כבוד השבת – ד. רחצה בערב שבת',4,true),
                    mk('s5','כבוד השבת – ה. בגדי שבת',5),
                    mk('s6','כבוד השבת – ו. זירוז העם לכבוד שבת קודש',6),
                    mk('s7','זמני כניסת השבת – א. בין השמשות',7),
                    mk('s8','זמני כניסת השבת – ב. תוספת שבת',8),
                    mk('s9','נרות שבת – א. טעמי הדלקת הנרות',9),
                    mk('s10','נרות שבת – ב. חובת הדלקת הנר',10),
                    mk('s11','נרות שבת – ג. מספר הנרות וגודלם',11),
                    mk('s12','נרות שבת – ד. זמן ההדלקה',12),
                    mk('s13','נרות שבת – ה. מקום ההדלקה',13),
                    mk('s14','נרות שבת – ו. הברכה וההדלקה',14),
                    mk('s15','קידוש – א. מצות הקידוש מקורה וטעמה',15),
                    mk('s16','קידוש – ב. נוסח הקידוש',16),
                    mk('s17','קידוש – ג. דיני השתייה של יין הקידוש',17),
                    mk('s18','קידוש – ד. קידוש במקום סעודה',18),
                    mk('s19','קידוש – ה. חובת נשים בקידוש',19),
                    mk('s20','סעודות השבת – א. שלוש סעודות',20),
                  ],
                },
              },
            },
            '8-4': {
              label: "ח'4", gender: 'girls',
              subjects: {
                'mishna-bm': {
                  id: 'mishna-bm', subjectType: 'mishna',
                  subjectTitle: 'בבא מציעא ושבת', teacherId: 'eliyahu-amsalem',
                  sourceFile: 'חומר לימוד לכיתה ח - משנה - בנות',
                  lastUpdated: '', notes: '', isLocked: false,
                  units: [
                    mk('m1','הקדמה לפרק ב',1,true),
                    mk('m2','משנה א – מציאות שהן של המוצא',2,true),
                    mk('m3','משנה ב – מציאות שהמוצא חייב להכריז עליהן',3,true),
                    mk('m4','משנה ג – מציאת דברים שהונחו בכוונה',4,true),
                    mk('m5','משנה ד – מציאות בחנות ובאזורי מסחר',5,true),
                    mk('m6','משנה ה – מדרש סימנים ותובעים',6,true),
                    mk('m7','משנה ו – משך זמן ההכרזה על האבדה',7,true),
                    mk('m8','משנה ז – השבת אבדה כנגד סימן ושמירת בעל חיים',8),
                    mk('m9','משנה ח – הטיפול הראוי באבדה',9),
                    mk('m10','משנה ט – דינים נוספים בהשבת אבדה',10),
                    mk('m11','משנה י – מצוות פריקה וטעינה',11),
                    mk('m12','משנה יא – דיני קדימות בהשבת אבדה',12),
                  ],
                },
                'halacha-shabbat-g': {
                  id: 'halacha-shabbat-g', subjectType: 'halacha',
                  subjectTitle: 'חמדת ימים – הלכות שבת', teacherId: 'eliyahu-amsalem',
                  sourceFile: 'חומר לימוד לכיתה ח - הלכה',
                  lastUpdated: '', notes: '', isLocked: false,
                  units: [
                    mk('sg1','כבוד השבת – כבוד ועונג',1,true),
                    mk('sg2','כבוד השבת – ב. ההכנות לשבת',2,true),
                    mk('sg3','זמני כניסת השבת – בין השמשות',3),
                    mk('sg4','נרות שבת – טעמי הדלקת הנרות',4),
                    mk('sg5','נרות שבת – חובת הדלקת הנר',5),
                    mk('sg6','קידוש – מצות הקידוש',6),
                    mk('sg7','סעודות השבת',7), mk('sg8','הבדלה',8),
                  ],
                },
                'beit-midrash': {
                  id: 'beit-midrash', subjectType: 'beitMidrash',
                  subjectTitle: 'בית מדרש', teacherId: 'hani-gabai',
                  sourceFile: '', lastUpdated: '', notes: '', isLocked: false,
                  units: [
                    mk('bm1','הכרות עם בית המדרש',1),
                    mk('bm2','לימוד בחברותא',2),
                    mk('bm3','מיומנויות עיון בגמרא',3),
                    mk('bm4','סוגיית הרחבה',4),
                  ],
                },
              },
            },
          },
        },
        grade9: {
          label: "כיתה ט'",
          classes: {
            '9-2': {
              label: "ט'2", gender: 'boys',
              subjects: {
                'gemara-sanhedrin': {
                  id: 'gemara-sanhedrin', subjectType: 'gemara',
                  subjectTitle: 'סנהדרין – פרק קמא', teacherId: 'shimon-turgeman',
                  sourceFile: '', lastUpdated: '', notes: '', isLocked: false,
                  units: [
                    mk('sn1','דיני ממונות בשלושה (ב.)',1,true),
                    mk('sn2','הדיינים בדיני נפשות (ב.)',2,true),
                    mk('sn3','סמיכת זקנים (ב.)',3,true),
                    mk('sn4','עגלה ערופה (ב.)',4,true),
                    mk('sn5','מינוי מלך (ב.)',5),
                    mk('sn6','שבטים ועיר הנידחת (ב.)',6),
                    mk('sn7','הבדל בין דיני ממונות לנפשות (ג:)',7),
                    mk('sn8','שאלות שנפסקות בשלושה (ג:)',8),
                  ],
                },
                'halacha-shabbat-9': {
                  id: 'halacha-shabbat-9', subjectType: 'halacha',
                  subjectTitle: 'פניני הלכה – הלכות שבת', teacherId: 'ariel-svid',
                  sourceFile: '', lastUpdated: '', notes: '', isLocked: false,
                  units: [
                    mk('hd1','מהות השבת',1), mk('hd2','שביתה ממלאכה',2),
                    mk('hd3','ל"ט מלאכות',3), mk('hd4','מלאכות גידול',4),
                    mk('hd5','בישול בשבת',5), mk('hd6','הוצאה ממקום למקום',6),
                  ],
                },
              },
            },
          },
        },
        grade10: {
          label: "כיתה י'",
          classes: {
            '10-3': {
              label: "י'3", gender: 'girls',
              subjects: {
                'tosheva-10-3': {
                  id: 'tosheva-10-3', subjectType: 'toshevaUnified',
                  subjectTitle: 'תושב"ע', teacherId: 'nir-sharafi',
                  sourceFile: '', lastUpdated: '', notes: '', isLocked: false,
                  units: [
                    mk('t1','מבוא לתושב"ע',1,true),
                    mk('t2','ספרות חז"ל – סקירה כללית',2,true),
                    mk('t3','משנה: מבנה וסגנון',3,true),
                    mk('t4','גמרא: מבנה הסוגיה',4,true),
                    mk('t5','מדרש הלכה ואגדה',5,true),
                    mk('t6','יחסי תורה שבכתב ותורה שבעל פה',6),
                    mk('t7','מחלוקת בהלכה',7),
                    mk('t8','פסיקת הלכה – עקרונות',8),
                    mk('t9','ראשונים ואחרונים',9),
                    mk('t10','ספרות השו"ת',10),
                    mk('t11','ישיבות ומרכזי תורה לאורך הדורות',11),
                    mk('t12','תורה שבעל פה בזמן הזה',12),
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
  teachers: {
    'shimon-turgeman': { id: 'shimon-turgeman', name: 'שמעון תורגמן' },
    'eliyahu-amsalem': { id: 'eliyahu-amsalem', name: 'אליהו אמסלם' },
    'hani-gabai':      { id: 'hani-gabai',      name: 'חני גבאי' },
    'ariel-svid':      { id: 'ariel-svid',       name: 'אריאל סוויד' },
    'nir-sharafi':     { id: 'nir-sharafi',      name: 'ניר שרפי' },
  },
};

// ═══════════════════════════════════════════════════════════
// SHARED DATA HELPERS
// ═══════════════════════════════════════════════════════════
const clone = (obj) => JSON.parse(JSON.stringify(obj));

function _canEditSubject(user, path) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.assignedSubjects.some((as) =>
    as.disciplineId === path.disciplineId &&
    as.gradeId      === path.gradeId      &&
    as.classId      === path.classId      &&
    as.subjectId    === path.subjectId
  );
}

function _getSubjectRef(data, path) {
  const { disciplineId, gradeId, classId, subjectId } = path;
  return data.disciplines[disciplineId].grades[gradeId].classes[classId].subjects[subjectId];
}

// ═══════════════════════════════════════════════════════════
// _assembleData  — converts flat Supabase rows → nested App structure
// ═══════════════════════════════════════════════════════════
function _assembleData(profile, disciplines, grades, classes, subjects, units, tcaRows, tsaRows, profilesMap) {
  // Lookup maps
  const classToGrade   = {};  // classId   → gradeId
  const gradeToDisc    = {};  // gradeId   → disciplineId
  const subjectToClass = {};  // subjectId → classId

  (classes   || []).forEach(c => { classToGrade[c.id]   = c.grade_id;      });
  (grades    || []).forEach(g => { gradeToDisc[g.id]     = g.discipline_id; });
  (subjects  || []).forEach(s => { subjectToClass[s.id]  = s.class_id;      });

  // assignedClasses
  const assignedClasses = (tcaRows || []).map(tca => ({
    disciplineId: tca.discipline_id,
    gradeId:      tca.grade_id,
    classId:      tca.class_id,
  }));

  // assignedSubjects — derive full path from lookup maps
  const assignedSubjects = (tsaRows || []).map(tsa => {
    const classId      = subjectToClass[tsa.subject_id];
    const gradeId      = classToGrade[classId];
    const disciplineId = gradeToDisc[gradeId];
    return { disciplineId, gradeId, classId, subjectId: tsa.subject_id };
  });

  // User object (same shape as local mock)
  const user = {
    id: profile.id, name: profile.name, role: profile.role,
    assignedClasses, assignedSubjects,
  };

  // Teachers map (for teacher name display)
  // Layer 1: all profiles we can SELECT (admin gets all; teacher gets own)
  const teachers = {};
  Object.values(profilesMap || {}).forEach(p => {
    teachers[p.id] = { id: p.id, name: p.name };
  });
  // Layer 2: names embedded in the subjects join — works even when RLS
  // restricts profiles SELECT (teacher sees only own profile, but the join
  // resolves teacher_id → name for every subject they have permission to read)
  (subjects || []).forEach(s => {
    if (s.teacher && s.teacher_id) {
      teachers[s.teacher_id] = { id: s.teacher_id, name: s.teacher.name };
    }
  });

  // Group units by subject_id
  const unitsBySubject = {};
  (units || []).forEach(u => {
    if (!unitsBySubject[u.subject_id]) unitsBySubject[u.subject_id] = [];
    unitsBySubject[u.subject_id].push({
      id:              u.id,           // UUID from Supabase
      title:           u.title,
      order:           u.sort_order,
      completed:       u.completed,
      completedAt:     u.completed_at,
      notes:           u.notes  || '',
      teachingQuality: u.teaching_quality,
    });
  });

  // Build nested disciplines object
  const disciplinesObj = {};

  (disciplines || []).forEach(d => {
    disciplinesObj[d.id] = { label: d.label, grades: {} };
  });

  (grades || []).forEach(g => {
    if (disciplinesObj[g.discipline_id]) {
      disciplinesObj[g.discipline_id].grades[g.id] = { label: g.label, classes: {} };
    }
  });

  (classes || []).forEach(c => {
    const discId    = gradeToDisc[c.grade_id];
    const gradeNode = disciplinesObj[discId]?.grades[c.grade_id];
    if (gradeNode) {
      gradeNode.classes[c.id] = { label: c.label, gender: c.gender, subjects: {} };
    }
  });

  (subjects || []).forEach(s => {
    const gradeId   = classToGrade[s.class_id];
    const discId    = gradeToDisc[gradeId];
    const classNode = disciplinesObj[discId]?.grades[gradeId]?.classes[s.class_id];
    if (classNode) {
      classNode.subjects[s.id] = {
        id:           s.id,
        subjectType:  s.subject_type,
        subjectTitle: s.subject_title,
        teacherId:    s.teacher_id,
        sourceFile:   s.source_file  || '',
        notes:        s.notes        || '',
        isLocked:     s.is_locked,
        lastUpdated:  s.last_updated,
        units: (unitsBySubject[s.id] || []).sort((a, b) => a.order - b.order),
      };
    }
  });

  return {
    users:       { [profile.id]: user },
    disciplines: disciplinesObj,
    teachers,
  };
}

// ═══════════════════════════════════════════════════════════
// LOCAL DATA SERVICE  (localStorage mock — DATA_MODE = 'local')
// ═══════════════════════════════════════════════════════════
const LocalDataService = {
  canEditSubject: _canEditSubject,
  getSubject(data, path)    { return _getSubjectRef(data, path); },
  getTeacherName(data, tid) { return data.teachers?.[tid]?.name || tid; },

  _applyMutation(data, path, updater, user) {
    if (!_canEditSubject(user, path)) return data;
    const newData = clone(data);
    const subject = _getSubjectRef(newData, path);
    updater(subject);
    subject.lastUpdated = new Date().toISOString();
    return newData;
  },
  _persist(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  },

  async getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.users) parsed.users = clone(INITIAL_DATA.users);
        return parsed;
      }
    } catch (e) {}
    return clone(INITIAL_DATA);
  },

  async toggleUnit(data, path, unitId, user) {
    const newData = this._applyMutation(data, path, (subject) => {
      const unit = subject.units.find((u) => u.id === unitId);
      if (unit) { unit.completed = !unit.completed; unit.completedAt = unit.completed ? new Date().toISOString() : null; }
    }, user);
    this._persist(newData);
    return newData;
  },
  async editUnit(data, path, unitId, title, user) {
    const newData = this._applyMutation(data, path, (subject) => {
      const unit = subject.units.find((u) => u.id === unitId);
      if (unit) unit.title = title;
    }, user);
    this._persist(newData);
    return newData;
  },
  async deleteUnit(data, path, unitId, user) {
    const newData = this._applyMutation(data, path, (subject) => {
      subject.units = subject.units.filter((u) => u.id !== unitId);
    }, user);
    this._persist(newData);
    return newData;
  },
  async addUnit(data, path, title, user) {
    const newData = this._applyMutation(data, path, (subject) => {
      subject.units.push({
        id: `u_${Date.now()}`, title,
        order: subject.units.length + 1,
        completed: false, completedAt: null, notes: '', teachingQuality: null,
      });
    }, user);
    this._persist(newData);
    return newData;
  },
  async updateUnitNote(data, path, unitId, notes, user) {
    const newData = this._applyMutation(data, path, (subject) => {
      const unit = subject.units.find((u) => u.id === unitId);
      if (unit) unit.notes = notes;
    }, user);
    this._persist(newData);
    return newData;
  },
  async updateSubjectNotes(data, path, notes, user) {
    const newData = this._applyMutation(data, path, (subject) => { subject.notes = notes; }, user);
    this._persist(newData);
    return newData;
  },
};

// ═══════════════════════════════════════════════════════════
// REMOTE DATA SERVICE  (real Supabase — DATA_MODE = 'remote')
// RLS on the DB handles row-level access automatically.
// After each mutation, full data is reloaded for simplicity.
// ═══════════════════════════════════════════════════════════
const RemoteDataService = {
  canEditSubject: _canEditSubject,
  getSubject(data, path)    { return _getSubjectRef(data, path); },
  getTeacherName(data, tid) { return data.teachers?.[tid]?.name || ''; },

  async getData() {
    const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authUser) throw new Error('לא מחובר');

    const [
      profileRes, discRes, gradeRes, classRes,
      subjectRes, unitRes, tcaRes, tsaRes, profilesRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', authUser.id).single(),
      supabase.from('disciplines').select('*').order('sort_order'),
      supabase.from('grades').select('*').order('sort_order'),
      supabase.from('classes').select('*'),
      supabase.from('subjects').select('*, teacher:profiles!subjects_teacher_id_fkey(id, name)'),
      supabase.from('units').select('*').order('sort_order'),
      supabase.from('teacher_class_assignments').select('*').eq('user_id', authUser.id),
      supabase.from('teacher_subject_assignments').select('*').eq('user_id', authUser.id),
      supabase.from('profiles').select('id, name'),  // admin gets all; teacher gets own
    ]);

    const firstError = [
      profileRes, discRes, gradeRes, classRes,
      subjectRes, unitRes, tcaRes, tsaRes, profilesRes,
    ].map(r => r.error).find(Boolean);
    if (firstError) throw firstError;

    const profilesMap = {};
    (profilesRes.data || []).forEach(p => { profilesMap[p.id] = p; });

    return _assembleData(
      profileRes.data,
      discRes.data, gradeRes.data, classRes.data,
      subjectRes.data, unitRes.data,
      tcaRes.data, tsaRes.data,
      profilesMap,
    );
  },

  async toggleUnit(data, path, unitId, _user) {
    const unit = _getSubjectRef(data, path).units.find(u => u.id === unitId);
    if (!unit) throw new Error('יחידה לא נמצאה');
    const newCompleted = !unit.completed;
    const { error } = await supabase.from('units').update({
      completed:    newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
      updated_at:   new Date().toISOString(),
    }).eq('id', unitId);
    if (error) throw error;
    return this.getData();
  },

  async editUnit(_data, _path, unitId, title, _user) {
    const { error } = await supabase.from('units')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', unitId);
    if (error) throw error;
    return this.getData();
  },

  async deleteUnit(_data, _path, unitId, _user) {
    const { error } = await supabase.from('units').delete().eq('id', unitId);
    if (error) throw error;
    return this.getData();
  },

  async addUnit(data, path, title, _user) {
    const units     = _getSubjectRef(data, path).units;
    const nextOrder = units.length > 0 ? Math.max(...units.map(u => u.order)) + 1 : 1;
    const { error } = await supabase.from('units').insert({
      subject_id: path.subjectId,
      title,
      sort_order: nextOrder,
      completed:  false,
    });
    if (error) throw error;
    return this.getData();
  },

  async updateUnitNote(_data, _path, unitId, notes, _user) {
    const { error } = await supabase.from('units')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', unitId);
    if (error) throw error;
    return this.getData();
  },

  async updateSubjectNotes(_data, path, notes, _user) {
    const { error } = await supabase.from('subjects')
      .update({ notes, last_updated: new Date().toISOString() })
      .eq('id', path.subjectId);
    if (error) throw error;
    return this.getData();
  },
};

// ── Factory ───────────────────────────────────────────────
const createDataService = () => DATA_MODE === 'local' ? LocalDataService : RemoteDataService;
const DataService = createDataService();

// ═══════════════════════════════════════════════════════════
// FILTER DATA FOR USER
// Admin → full data. Teacher → only assigned classes/subjects.
// In remote mode, RLS already filtered; this is a safe no-op.
// ═══════════════════════════════════════════════════════════
function filterDataForUser(fullData, user) {
  if (!user || user.role === 'admin') return fullData;
  const filtered = clone(fullData);
  for (const [discId, disc] of Object.entries(filtered.disciplines)) {
    for (const gradeId of Object.keys(disc.grades)) {
      const grade = disc.grades[gradeId];
      for (const classId of Object.keys(grade.classes)) {
        const hasClass = user.assignedClasses.some(
          (ac) => ac.disciplineId === discId && ac.gradeId === gradeId && ac.classId === classId
        );
        if (!hasClass) { delete grade.classes[classId]; continue; }
        const subjects = grade.classes[classId].subjects;
        for (const subjectId of Object.keys(subjects)) {
          const hasSubject = user.assignedSubjects.some(
            (as) => as.disciplineId === discId && as.gradeId === gradeId &&
                    as.classId === classId && as.subjectId === subjectId
          );
          if (!hasSubject) delete subjects[subjectId];
        }
      }
      if (Object.keys(grade.classes).length === 0) delete disc.grades[gradeId];
    }
  }
  return filtered;
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════
const calcProgress   = (units) => {
  if (!units || units.length === 0) return { pct: 0, done: 0, total: 0 };
  const done = units.filter((u) => u.completed).length;
  return { pct: Math.round((done / units.length) * 100), done, total: units.length };
};
const progressColor  = (pct) => pct === 0 ? C.gray400 : pct === 100 ? C.success : C.warning;
const progressBg     = (pct) => pct === 0 ? C.gray100 : pct === 100 ? C.successLight : C.warningLight;

// ═══════════════════════════════════════════════════════════
// LOADING SCREEN
// ═══════════════════════════════════════════════════════════
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.gray50, direction: 'rtl' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>📚</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.gray900, marginBottom: 8 }}>טוען נתונים...</div>
        <div style={{ fontSize: 14, color: C.gray500 }}>מערכת ניהול פדגוגי · קריית חינוך תורנית מדעים</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LOGIN SCREEN  (remote mode only)
// ═══════════════════════════════════════════════════════════
function LoginScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [loginErr, setLoginErr] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginErr('שם משתמש או סיסמה שגויים');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.gray50, direction: 'rtl' }}>
      <div style={{ background: C.white, borderRadius: 16, padding: '40px 36px', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', width: '100%', maxWidth: 380 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📚</div>
          <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: C.gray900 }}>קריית חינוך תורנית מדעים</h1>
          <div style={{ fontSize: 13, color: C.gray500 }}>מערכת ניהול פדגוגי</div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>אימייל</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" required autoComplete="email"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.gray200}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', direction: 'ltr' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.gray700, marginBottom: 6 }}>סיסמה</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.gray200}`, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', direction: 'ltr' }}
            />
          </div>
          {loginErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: C.red, fontSize: 13 }}>
              {loginErr}
            </div>
          )}
          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: loading ? C.gray400 : C.primary, color: C.white, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ERROR BANNER
// ═══════════════════════════════════════════════════════════
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 16px', margin: '8px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span style={{ color: C.red, fontSize: 14, fontWeight: 500 }}>{message}</span>
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, fontSize: 22, lineHeight: 1, padding: '0 4px', fontFamily: 'inherit', opacity: 0.7 }}>×</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// AUTH BAR  (remote mode — replaces UserSwitcher)
// ═══════════════════════════════════════════════════════════
function AuthBar({ user, isSaving, onLogout }) {
  const isAdmin = user?.role === 'admin';
  return (
    <div style={{ background: '#1e293b', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{user?.name}</span>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: isAdmin ? '#1d4ed8' : '#15803d', color: '#fff' }}>
          {isAdmin ? 'רכז' : 'מורה'}
        </span>
        {isSaving && (
          <span style={{ color: '#94a3b8', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#f59e0b' }} />
            שומר...
          </span>
        )}
      </div>
      <button
        onClick={onLogout}
        style={{ background: '#334155', border: 'none', color: '#94a3b8', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
      >
        התנתק
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// USER SWITCHER  (local mode — simulation bar)
// ═══════════════════════════════════════════════════════════
function UserSwitcher({ users, currentUserId, onSwitch, isSaving }) {
  const user    = users[currentUserId];
  const isAdmin = user?.role === 'admin';
  return (
    <div style={{ background: '#1e293b', padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#64748b', fontSize: 11, letterSpacing: 0.5 }}>🧪 סימולציה</span>
        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{user?.name}</span>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: isAdmin ? '#1d4ed8' : '#15803d', color: '#fff' }}>
          {isAdmin ? 'רכז' : 'מורה'}
        </span>
        {isSaving && (
          <span style={{ color: '#94a3b8', fontSize: 11 }}>שומר...</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#64748b', fontSize: 11 }}>החלף משתמש:</span>
        <select
          value={currentUserId} onChange={(e) => onSwitch(e.target.value)} disabled={isSaving}
          style={{ background: '#334155', color: '#e2e8f0', border: '1px solid #475569', borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: isSaving ? 'not-allowed' : 'pointer', direction: 'rtl', fontFamily: 'inherit', opacity: isSaving ? 0.6 : 1 }}
        >
          {Object.values(users).map((u) => (
            <option key={u.id} value={u.id}>{u.name} ({u.role === 'admin' ? 'רכז' : 'מורה'})</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════
function ProgressBar({ units, compact = false }) {
  const { pct, done, total } = calcProgress(units);
  const color = progressColor(pct);
  return (
    <div style={{ direction: 'rtl' }}>
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: C.gray500 }}>{done} מתוך {total} יחידות הושלמו</span>
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
        </div>
      )}
      <div style={{ height: compact ? 6 : 10, borderRadius: 99, background: C.gray200, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      {compact && (
        <div style={{ marginTop: 4, fontSize: 11, color: C.gray500, textAlign: 'right' }}>{done}/{total} ({pct}%)</div>
      )}
    </div>
  );
}

function Badge({ type }) {
  const info = SUBJECT_TYPE_INFO[type] || { label: type, color: C.gray700, bg: C.gray100, border: C.gray200 };
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: info.color, background: info.bg, border: `1px solid ${info.border}` }}>
      {info.label}
    </span>
  );
}

function BackButton({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.primary, fontSize: 14, fontWeight: 600, padding: '6px 0', marginBottom: 16, fontFamily: 'inherit' }}>
      ← {label}
    </button>
  );
}

function Card({ children, onClick, style = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: C.white, border: `1px solid ${hovered ? C.primary : C.gray200}`, borderRadius: 12, padding: '16px 20px', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s', boxShadow: hovered ? '0 2px 12px rgba(37,99,235,0.12)' : '0 1px 3px rgba(0,0,0,0.06)', ...style }}
    >
      {children}
    </div>
  );
}

function IconBtn({ emoji, title, onClick, danger = false, disabled = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onClick(); }}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{ background: hovered ? (danger ? C.redLight : C.gray100) : 'transparent', border: 'none', borderRadius: 6, width: 30, height: 30, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', fontFamily: 'inherit', opacity: disabled ? 0.4 : 1 }}
    >
      {emoji}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// UNIT ITEM
// ═══════════════════════════════════════════════════════════
function UnitItem({ unit, onToggle, onDelete, onEdit, onNoteChange, disabled = false }) {
  const [noteOpen,  setNoteOpen]  = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(unit.title);
  const [noteText,  setNoteText]  = useState(unit.notes || '');

  const handleEditSave = () => {
    if (editTitle.trim()) onEdit(unit.id, editTitle.trim());
    setIsEditing(false);
  };

  return (
    <div style={{ background: unit.completed ? '#f0fdf4' : C.white, border: `1px solid ${unit.completed ? '#86efac' : C.gray200}`, borderRadius: 10, marginBottom: 8, overflow: 'hidden', transition: 'all 0.15s', opacity: disabled ? 0.7 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', direction: 'rtl' }}>
        <button
          onClick={() => !disabled && onToggle(unit.id)} disabled={disabled}
          style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: `2px solid ${unit.completed ? C.success : C.gray400}`, background: unit.completed ? C.success : C.white, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', padding: 0 }}
        >
          {unit.completed && <span style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>✓</span>}
        </button>

        {isEditing ? (
          <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setIsEditing(false); }}
            style={{ flex: 1, border: `2px solid ${C.primary}`, borderRadius: 6, padding: '4px 8px', fontSize: 14, direction: 'rtl', fontFamily: 'inherit', outline: 'none' }}
          />
        ) : (
          <span
            style={{ flex: 1, fontSize: 14, color: unit.completed ? C.gray500 : C.gray900, textDecoration: unit.completed ? 'line-through' : 'none', cursor: disabled ? 'default' : 'text' }}
            onDoubleClick={() => !disabled && setIsEditing(true)}
          >
            {unit.title}
          </span>
        )}

        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <IconBtn emoji={unit.notes ? '💬' : '📝'} title="הערה" onClick={() => setNoteOpen(!noteOpen)} disabled={disabled} />
          <IconBtn emoji="✏️" title="עריכה" onClick={() => { setEditTitle(unit.title); setIsEditing(true); }} disabled={disabled} />
          <IconBtn emoji="🗑️" title="מחיקה" onClick={() => onDelete(unit.id)} danger disabled={disabled} />
        </div>
      </div>

      {noteOpen && (
        <div style={{ padding: '0 14px 12px 14px', borderTop: `1px solid ${C.gray200}` }}>
          <textarea
            value={noteText} onChange={(e) => setNoteText(e.target.value)}
            onBlur={() => !disabled && onNoteChange(unit.id, noteText)}
            disabled={disabled} placeholder="הוסף הערה ליחידה..." rows={2}
            style={{ width: '100%', marginTop: 10, padding: '8px 10px', border: `1px solid ${C.gray200}`, borderRadius: 8, fontSize: 13, direction: 'rtl', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', background: C.gray50 }}
          />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ADD UNIT ROW
// ═══════════════════════════════════════════════════════════
function AddUnitRow({ onAdd, disabled = false }) {
  const [open,  setOpen]  = useState(false);
  const [title, setTitle] = useState('');

  const handleAdd = () => {
    if (title.trim()) { onAdd(title.trim()); setTitle(''); setOpen(false); }
  };

  if (!open) {
    return (
      <button
        onClick={() => !disabled && setOpen(true)} disabled={disabled}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `2px dashed ${C.gray200}`, background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 14, color: C.gray500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', direction: 'rtl', opacity: disabled ? 0.5 : 1 }}
        onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; } }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.color = C.gray500; }}
      >
        ＋ הוסף יחידה
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, padding: '10px 14px', border: `2px solid ${C.primary}`, borderRadius: 10, background: C.primaryLight, direction: 'rtl' }}>
      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setOpen(false); setTitle(''); } }}
        placeholder="שם היחידה..."
        style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${C.gray200}`, fontSize: 14, fontFamily: 'inherit', direction: 'rtl', outline: 'none' }}
      />
      <button onClick={handleAdd} disabled={disabled} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: C.primary, color: C.white, fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>הוסף</button>
      <button onClick={() => { setOpen(false); setTitle(''); }} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: C.gray200, color: C.gray700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>ביטול</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUBJECT VIEW
// ═══════════════════════════════════════════════════════════
function SubjectView({ data, path, commit, classLabel, gradeLabel, onBack, isSaving }) {
  const { currentUser }  = useContext(AuthContext);
  const subject          = DataService.getSubject(data, path);
  const units            = subject.units;
  const teacherName      = DataService.getTeacherName(data, subject.teacherId);
  const [subjectNotes, setSubjectNotes] = useState(subject.notes || '');

  const toggleUnit       = (unitId)        => commit(DataService.toggleUnit(data, path, unitId, currentUser));
  const editUnit         = (unitId, title) => commit(DataService.editUnit(data, path, unitId, title, currentUser));
  const deleteUnit       = (unitId)        => { if (window.confirm('למחוק יחידה זו?')) commit(DataService.deleteUnit(data, path, unitId, currentUser)); };
  const addUnit          = (title)         => commit(DataService.addUnit(data, path, title, currentUser));
  const updateNote       = (unitId, notes) => commit(DataService.updateUnitNote(data, path, unitId, notes, currentUser));
  const saveSubjectNotes = ()              => commit(DataService.updateSubjectNotes(data, path, subjectNotes, currentUser));

  const { pct, done, total } = calcProgress(units);
  const color = progressColor(pct);

  return (
    <div style={{ direction: 'rtl', maxWidth: 720, margin: '0 auto', padding: '0 16px 40px' }}>
      <BackButton label={`${gradeLabel} / ${classLabel}`} onClick={onBack} />
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <Badge type={subject.subjectType} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.gray900 }}>{subject.subjectTitle}</h1>
          {isSaving && <span style={{ fontSize: 12, color: C.gray400, fontWeight: 400 }}>שומר...</span>}
        </div>
        <div style={{ fontSize: 13, color: C.gray500, marginBottom: 16 }}>
          👨‍🏫 {teacherName || '—'}
          {subject.sourceFile && <span> · 📄 {subject.sourceFile}</span>}
        </div>
        <Card style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.gray900 }}>התקדמות: {done} מתוך {total} יחידות</span>
            <span style={{ fontSize: 18, fontWeight: 800, color, padding: '2px 12px', background: progressBg(pct), borderRadius: 99 }}>{pct}%</span>
          </div>
          <ProgressBar units={units} />
        </Card>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.gray700, display: 'block', marginBottom: 4 }}>הערות לנושא:</label>
        <textarea value={subjectNotes} onChange={(e) => setSubjectNotes(e.target.value)} onBlur={saveSubjectNotes}
          disabled={isSaving} placeholder="הוסף הערות כלליות לנושא לימוד זה..." rows={2}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.gray200}`, fontSize: 13, fontFamily: 'inherit', direction: 'rtl', resize: 'vertical', background: C.gray50, boxSizing: 'border-box', outline: 'none', opacity: isSaving ? 0.6 : 1 }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.gray900 }}>יחידות לימוד ({total})</h2>
        <span style={{ fontSize: 12, color: C.gray400 }}>לחץ פעמיים על שם יחידה לעריכה</span>
      </div>

      {units.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: C.gray400, fontSize: 14 }}>אין יחידות עדיין. הוסף את היחידה הראשונה 👇</div>
      )}
      {units.map((unit) => (
        <UnitItem key={unit.id} unit={unit}
          onToggle={toggleUnit} onDelete={deleteUnit} onEdit={editUnit} onNoteChange={updateNote}
          disabled={isSaving}
        />
      ))}
      <div style={{ marginTop: 12 }}>
        <AddUnitRow onAdd={addUnit} disabled={isSaving} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUBJECT LIST VIEW
// ═══════════════════════════════════════════════════════════
function SubjectListView({ data, classData, gradeLabel, onBack, onSelectSubject }) {
  const subjects = Object.values(classData.subjects || {});
  return (
    <div style={{ direction: 'rtl', maxWidth: 720, margin: '0 auto', padding: '0 16px 40px' }}>
      <BackButton label={gradeLabel} onClick={onBack} />
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: C.gray900 }}>{classData.label}</h1>
        <div style={{ fontSize: 13, color: C.gray500 }}>
          {classData.gender === 'boys' ? '👦 בנים' : '👧 בנות'} · {subjects.length} נושאי לימוד
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {subjects.map((subject) => {
          const teacherName = DataService.getTeacherName(data, subject.teacherId);
          return (
            <Card key={subject.id} onClick={() => onSelectSubject(subject.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Badge type={subject.subjectType} />
                    <span style={{ fontWeight: 700, fontSize: 15, color: C.gray900 }}>{subject.subjectTitle}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.gray500, marginBottom: 10 }}>👨‍🏫 {teacherName || '—'}</div>
                  <ProgressBar units={subject.units} compact />
                </div>
                <span style={{ fontSize: 20, color: C.gray400, flexShrink: 0 }}>←</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CLASS LIST VIEW
// ═══════════════════════════════════════════════════════════
function ClassListView({ gradeData, onBack, onSelectClass }) {
  const classes = Object.entries(gradeData.classes || {});
  const boys    = classes.filter(([, c]) => c.gender === 'boys');
  const girls   = classes.filter(([, c]) => c.gender === 'girls');

  const renderClassCard = ([classId, classData]) => {
    const subjects = Object.values(classData.subjects || {});
    const allUnits = subjects.flatMap((s) => s.units || []);
    const { pct }  = calcProgress(allUnits);
    return (
      <Card key={classId} onClick={() => onSelectClass(classId)} style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.gray900 }}>{classData.label}</span>
              <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: classData.gender === 'boys' ? '#eff6ff' : '#fdf2f8', color: classData.gender === 'boys' ? '#1d4ed8' : '#a21caf', fontWeight: 600 }}>
                {classData.gender === 'boys' ? 'בנים' : 'בנות'}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {subjects.map((s) => <Badge key={s.id} type={s.subjectType} />)}
            </div>
            <ProgressBar units={allUnits} compact />
          </div>
          <span style={{ fontSize: 20, color: C.gray400, marginRight: 8 }}>←</span>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ direction: 'rtl', maxWidth: 720, margin: '0 auto', padding: '0 16px 40px' }}>
      <BackButton label="כל השכבות" onClick={onBack} />
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: C.gray900 }}>{gradeData.label}</h1>
        <div style={{ fontSize: 13, color: C.gray500 }}>{classes.length} כיתות</div>
      </div>
      {boys.length  > 0 && <div style={{ marginBottom: 20 }}><h2 style={{ fontSize: 15, fontWeight: 700, color: C.gray700, marginBottom: 10 }}>👦 בנים</h2>{boys.map(renderClassCard)}</div>}
      {girls.length > 0 && <div><h2 style={{ fontSize: 15, fontWeight: 700, color: C.gray700, marginBottom: 10 }}>👧 בנות</h2>{girls.map(renderClassCard)}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// GRADES LIST VIEW
// ═══════════════════════════════════════════════════════════
function GradeListView({ disciplineData, onSelectGrade }) {
  const { currentUser } = useContext(AuthContext);
  const grades  = Object.entries(disciplineData?.grades || {});
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div style={{ direction: 'rtl', maxWidth: 720, margin: '0 auto', padding: '0 16px 40px' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)', borderRadius: 16, padding: '24px 28px', marginBottom: 28, color: C.white, direction: 'rtl' }}>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>קריית חינוך תורנית מדעים</div>
        {isAdmin ? (
          <>
            <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>מערכת ניהול פדגוגי</h1>
            <div style={{ fontSize: 14, opacity: 0.85 }}>תורה שבעל פה — חטיבת ביניים ותיכון</div>
          </>
        ) : (
          <>
            <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>שלום, {currentUser?.name} 👋</h1>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              {currentUser?.assignedSubjects?.length} נושאים ב-{currentUser?.assignedClasses?.length} כיתות
            </div>
          </>
        )}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.gray700, marginBottom: 16 }}>
        {isAdmin ? 'בחר שכבה:' : 'הכיתות שלי:'}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {grades.map(([gradeId, gradeData]) => {
          const classes  = Object.values(gradeData.classes || {});
          const allUnits = classes.flatMap((c) => Object.values(c.subjects || {}).flatMap((s) => s.units || []));
          const { pct }  = calcProgress(allUnits);
          const color    = progressColor(pct);
          return (
            <Card key={gradeId} onClick={() => onSelectGrade(gradeId)} style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: C.primary, marginBottom: 4 }}>
                {gradeData.label.replace('כיתה ', '')}
              </div>
              <div style={{ fontSize: 12, color: C.gray500, marginBottom: 12 }}>
                {classes.length} {classes.length === 1 ? 'כיתה' : 'כיתות'}
              </div>
              <div style={{ height: 6, borderRadius: 99, background: C.gray200, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 11, color }}>{pct}% הושלם</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  // ── Core state ────────────────────────────────────────────
  const [data,          setData]          = useState(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isSaving,      setIsSaving]      = useState(false);
  const [error,         setError]         = useState(null);
  const [view,          setView]          = useState(VIEWS.GRADES);
  const [path,          setPath]          = useState({ disciplineId: 'tosheva', gradeId: null, classId: null, subjectId: null });
  const [currentUserId, setCurrentUserId] = useState(DATA_MODE === 'local' ? 'nir-sharafi' : null);

  // ── Auth state (remote mode only) ─────────────────────────
  const [authSession, setAuthSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(DATA_MODE === 'remote');

  // ── Remote: subscribe to Supabase auth changes ────────────
  useEffect(() => {
    if (DATA_MODE !== 'remote') return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      if (!session) {
        // User logged out → reset all state
        setData(null);
        setCurrentUserId(null);
        setIsLoading(true);
        setView(VIEWS.GRADES);
        setPath({ disciplineId: 'tosheva', gradeId: null, classId: null, subjectId: null });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Local: load data once on mount ────────────────────────
  useEffect(() => {
    if (DATA_MODE !== 'local') return;
    DataService.getData()
      .then((d) => { setData(d); setIsLoading(false); })
      .catch(() => { setError('לא ניתן לטעון את המידע'); setIsLoading(false); });
  }, []);

  // ── Remote: load data when auth session becomes available ─
  useEffect(() => {
    if (DATA_MODE !== 'remote') return;
    if (!authSession) return;
    setIsLoading(true);
    DataService.getData()
      .then((d) => {
        setData(d);
        setCurrentUserId(authSession.user.id);
        setIsLoading(false);
      })
      .catch(() => { setError('לא ניתן לטעון את המידע'); setIsLoading(false); });
  }, [authSession]);

  // ── Derived: currentUser and filteredData ─────────────────
  const currentUser  = data?.users?.[currentUserId];
  const filteredData = useMemo(
    () => (data && currentUser ? filterDataForUser(data, currentUser) : null),
    [data, currentUser]
  );

  // ── Local: reset nav when user switches ──────────────────
  useEffect(() => {
    if (DATA_MODE !== 'local') return;
    setView(VIEWS.GRADES);
    setPath({ disciplineId: 'tosheva', gradeId: null, classId: null, subjectId: null });
  }, [currentUserId]);

  // ── commit: wraps any DataService mutation ─────────────────
  const commit = useCallback(async (mutationPromise) => {
    setIsSaving(true);
    setError(null);
    try {
      const newData = await mutationPromise;
      setData(newData);
    } catch (e) {
      setError('אירעה שגיאה בשמירת הנתונים');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange fires → resets state → shows LoginScreen
  };

  // ── Navigation helpers ────────────────────────────────────
  const goGrades   = () => { setView(VIEWS.GRADES);   setPath((p) => ({ ...p, gradeId: null, classId: null, subjectId: null })); };
  const goClasses  = (gradeId)   => { setView(VIEWS.CLASSES);  setPath((p) => ({ ...p, gradeId,  classId: null, subjectId: null })); };
  const goSubjects = (classId)   => { setView(VIEWS.SUBJECTS); setPath((p) => ({ ...p, classId,  subjectId: null })); };
  const goUnits    = (subjectId) => { setView(VIEWS.UNITS);    setPath((p) => ({ ...p, subjectId })); };

  // ── Render guards ─────────────────────────────────────────
  if (DATA_MODE === 'remote' && authLoading)  return <LoadingScreen />;
  if (DATA_MODE === 'remote' && !authSession) return <LoginScreen />;
  if (isLoading || !data || !filteredData)    return <LoadingScreen />;

  // ── Derive navigation context from filteredData ───────────
  const filtDisc        = filteredData.disciplines[path.disciplineId];
  const filtGradeData   = path.gradeId   ? filtDisc?.grades?.[path.gradeId]           : null;
  const filtClassData   = path.classId   ? filtGradeData?.classes?.[path.classId]     : null;
  const filtSubjectData = path.subjectId ? filtClassData?.subjects?.[path.subjectId]  : null;
  const gradeLabel      = filtGradeData?.label || '';
  const classLabel      = filtClassData?.label || '';

  return (
    <AuthContext.Provider value={{ currentUser, currentUserId, setCurrentUserId }}>
      <div style={{ minHeight: '100vh', background: C.gray50, fontFamily: "'Segoe UI', 'Arial', sans-serif", direction: 'rtl' }}>

        {/* Header bar: AuthBar (remote) or UserSwitcher (local) */}
        {DATA_MODE === 'remote' ? (
          <AuthBar user={currentUser} isSaving={isSaving} onLogout={handleLogout} />
        ) : (
          <UserSwitcher
            users={data.users} currentUserId={currentUserId}
            onSwitch={setCurrentUserId} isSaving={isSaving}
          />
        )}

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <div style={{ paddingTop: 16 }}>
          {/* Breadcrumb */}
          {view !== VIEWS.GRADES && (
            <div style={{ background: C.white, borderBottom: `1px solid ${C.gray200}`, padding: '0 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.gray500, height: 44, direction: 'rtl', overflowX: 'auto' }}>
              <button onClick={goGrades} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary, fontWeight: 600, fontSize: 13, padding: '0 4px', fontFamily: 'inherit' }}>
                {currentUser?.role === 'admin' ? 'כל השכבות' : 'הכיתות שלי'}
              </button>
              {path.gradeId && (<>
                <span style={{ color: C.gray300 }}>›</span>
                <button onClick={() => goClasses(path.gradeId)} style={{ background: 'none', border: 'none', cursor: view === VIEWS.CLASSES ? 'default' : 'pointer', color: view === VIEWS.CLASSES ? C.gray900 : C.primary, fontWeight: view === VIEWS.CLASSES ? 700 : 600, fontSize: 13, padding: '0 4px', fontFamily: 'inherit' }}>
                  {gradeLabel}
                </button>
              </>)}
              {path.classId && (<>
                <span style={{ color: C.gray300 }}>›</span>
                <button onClick={() => goSubjects(path.classId)} style={{ background: 'none', border: 'none', cursor: view === VIEWS.SUBJECTS ? 'default' : 'pointer', color: view === VIEWS.SUBJECTS ? C.gray900 : C.primary, fontWeight: view === VIEWS.SUBJECTS ? 700 : 600, fontSize: 13, padding: '0 4px', fontFamily: 'inherit' }}>
                  {classLabel}
                </button>
              </>)}
              {path.subjectId && (<>
                <span style={{ color: C.gray300 }}>›</span>
                <span style={{ color: C.gray900, fontWeight: 700, padding: '0 4px' }}>{filtSubjectData?.subjectTitle}</span>
              </>)}
            </div>
          )}

          {/* Views */}
          {view === VIEWS.GRADES && filtDisc && (
            <GradeListView disciplineData={filtDisc} onSelectGrade={goClasses} />
          )}
          {view === VIEWS.CLASSES && filtGradeData && (
            <ClassListView gradeData={filtGradeData} onBack={goGrades} onSelectClass={goSubjects} />
          )}
          {view === VIEWS.SUBJECTS && filtClassData && (
            <SubjectListView
              data={filteredData} classData={filtClassData}
              gradeLabel={gradeLabel}
              onBack={() => goClasses(path.gradeId)}
              onSelectSubject={goUnits}
            />
          )}
          {view === VIEWS.UNITS && filtSubjectData && (
            <SubjectView
              data={data} path={path} commit={commit}
              classLabel={classLabel} gradeLabel={gradeLabel}
              onBack={() => goSubjects(path.classId)}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </AuthContext.Provider>
  );
}