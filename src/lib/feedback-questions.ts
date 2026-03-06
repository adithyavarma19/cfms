export type McqOption = {
  value: string;
  label: string;
};

export type McqQuestion = {
  qNumber: number;
  question: string;
  options: McqOption[];
};

export type TextQuestion = {
  qNumber: number;
  question: string;
};

export const MCQ_QUESTIONS_1: McqQuestion[] = [
  {
    qNumber: 1,
    question: "This course is",
    options: [
      { value: "A", label: "A. completely related to the Program" },
      { value: "B", label: "B. Fairly related" },
      { value: "C", label: "C. Related to some extent" },
      { value: "D", label: "D. less related" },
      { value: "E", label: "E. not related" },
    ],
  },
  {
    qNumber: 2,
    question: "Course importance for program and employment",
    options: [
      { value: "A", label: "A. Highly important" },
      { value: "B", label: "B. Fairly important" },
      { value: "C", label: "C. Important to some extent" },
      { value: "D", label: "D. Less important" },
      { value: "E", label: "E. Very less important" },
    ],
  },
  {
    qNumber: 3,
    question: "Course contents are",
    options: [
      { value: "A", label: "A. up-to-date and adequate" },
      { value: "B", label: "B. up-to-date and fairly adequate" },
      { value: "C", label: "C. up-to-date but not adequate" },
      { value: "D", label: "D. adequate in quantity but not up-to-date" },
      { value: "E", label: "E. neither up-to-date nor adequate" },
    ],
  },
  {
    qNumber: 4,
    question: "Course objectives are",
    options: [
      { value: "A", label: "A. contemporary and enhance skills" },
      { value: "B", label: "B. fairly contemporary and enhance skills" },
      { value: "C", label: "C. contemporary but do not enhance skills" },
      { value: "D", label: "D. Enhance skills but not contemporary" },
      { value: "E", label: "E. Neither contemporary nor able to enhance skills" },
    ],
  },
  {
    qNumber: 5,
    question: "Course ILOs are",
    options: [
      { value: "A", label: "A. understandable and completely achievable" },
      { value: "B", label: "B. Mostly clear and completely achievable" },
      { value: "C", label: "C. Clear and fairly achievable" },
      { value: "D", label: "D. complex but fairly achievable" },
      { value: "E", label: "E. Complex and not achievable" },
      { value: "F", label: "F. Course ILOs are not given" },
    ],
  },
  {
    qNumber: 6,
    question: "Course ILOs are",
    options: [
      { value: "A", label: "A. Completely related to the course objectives" },
      { value: "B", label: "B. Highly related to the course objectives" },
      { value: "C", label: "C. Fairly related to the course objectives" },
      { value: "D", label: "D. Lowly related to the course objectives" },
      { value: "E", label: "E. Unrelated to the course objectives" },
      { value: "F", label: "F. Course ILOs are not given" },
    ],
  },
  {
    qNumber: 7,
    question: "Teaching methods used in the course",
    options: [
      { value: "A", label: "A. Highly useful to gain mastery in the subject" },
      { value: "B", label: "B. Fairly useful to gain mastery in the subject" },
      { value: "C", label: "C. Useful to some extent to gain mastery in the subject" },
      { value: "D", label: "D. Less useful to gain mastery in the subject" },
      { value: "F", label: "F. Not useful to gain mastery in the subject" },
    ],
  },
  {
    qNumber: 8,
    question: "Assessment methods prescribed by course outline are",
    options: [
      { value: "A", label: "A. Highly appropriate to its contents" },
      { value: "B", label: "B. Fairly appropriate to its contents" },
      { value: "C", label: "C. Appropriate to its contents to some extent" },
      { value: "D", label: "D. Less appropriate to its contents" },
      { value: "E", label: "E. Not appropriate to its contents" },
    ],
  },
  {
    qNumber: 9,
    question: "Exams' & quizzes' questions are clear & completely relate to course contents.",
    options: [
      { value: "A", label: "A. Very clear and Completely related to the course contents" },
      { value: "B", label: "B. Clear and highly related to the course Contents" },
      { value: "C", label: "C. Clear and Fairly related to the course contents" },
      { value: "D", label: "D. Clear but lowly related to the course Contents" },
      { value: "E", label: "E. Unclear and Unrelated to the course contents" },
    ],
  },
  {
    qNumber: 10,
    question: "Text book used is the",
    options: [
      { value: "A", label: "A. Highly suitable and the current Edition" },
      { value: "B", label: "B. Highly suitable but not the current Edition" },
      { value: "C", label: "C. Fairly suitable and the current Edition" },
      { value: "D", label: "D. Fairly suitable but not the current Edition" },
      { value: "E", label: "E. Not suitable and the old Edition" },
    ],
  },
];

export const TEXT_QUESTIONS_1: TextQuestion[] = [
  { qNumber: 11, question: "Usefulness:" },
  { qNumber: 12, question: "Contents:" },
  { qNumber: 13, question: "Suggestions:" },
];

export const MCQ_QUESTIONS_2: McqQuestion[] = [
  {
    qNumber: 14,
    question: "Punctuality to the class",
    options: [
      { value: "A", label: "A. Highly Punctual" },
      { value: "B", label: "B. Mostly Punctual" },
      { value: "C", label: "C. Sometimes Punctual" },
      { value: "D", label: "D. Few times Punctual" },
      { value: "E", label: "E. Rarely Punctual" },
    ],
  },
  {
    qNumber: 15,
    question: "Provided course Plan",
    options: [
      { value: "A", label: "A. At the beginning of the semester" },
      { value: "B", label: "B. One week after commencement" },
      { value: "C", label: "C. Two weeks after commencement" },
      { value: "D", label: "D. In the middle of the semester" },
      { value: "E", label: "E. Never given" },
    ],
  },
  {
    qNumber: 16,
    question: "Instructor's knowledge in the subject is",
    options: [
      { value: "A", label: "A. Very High" },
      { value: "B", label: "B. High" },
      { value: "C", label: "C. Average" },
      { value: "D", label: "D. Low" },
      { value: "E", label: "E. Very Low" },
    ],
  },
  {
    qNumber: 17,
    question: "Planning the sequence of course delivery is",
    options: [
      { value: "A", label: "A. Excellent" },
      { value: "B", label: "B. Very Good" },
      { value: "C", label: "C. Good" },
      { value: "D", label: "D. Not Good" },
      { value: "E", label: "E. Not at all good" },
    ],
  },
  {
    qNumber: 18,
    question: "Time given to teach each topic",
    options: [
      { value: "A", label: "A. Appropriate time to each topic" },
      { value: "B", label: "B. Given equal time to each topic" },
      { value: "C", label: "C. Some chapters are not given enough time" },
      { value: "D", label: "D. More time to beginning chapters and less time to end chapters" },
      { value: "E", label: "E. No proper planning of time" },
    ],
  },
  {
    qNumber: 19,
    question: "Explanation of the concepts is",
    options: [
      { value: "A", label: "A. Excellent" },
      { value: "B", label: "B. Very Good" },
      { value: "C", label: "C. Good" },
      { value: "D", label: "D. Fair" },
      { value: "E", label: "E. Poor" },
    ],
  },
  {
    qNumber: 20,
    question: "Dictates notes in the class",
    options: [
      { value: "A", label: "A. Always" },
      { value: "B", label: "B. Mostly" },
      { value: "C", label: "C. Sometimes" },
      { value: "D", label: "D. Few times" },
      { value: "E", label: "E. Rarely" },
    ],
  },
  {
    qNumber: 21,
    question: "Faculty attends to individual student needs",
    options: [
      { value: "A", label: "A. Always" },
      { value: "B", label: "B. Mostly" },
      { value: "C", label: "C. Sometimes" },
      { value: "D", label: "D. Few times" },
      { value: "E", label: "E. Rarely" },
    ],
  },
  {
    qNumber: 22,
    question: "Fairness in grading of answers in Exams/Quizzes/Assignments/Projects is",
    options: [
      { value: "A", label: "A. Very High" },
      { value: "B", label: "B. High" },
      { value: "C", label: "C. Moderate" },
      { value: "D", label: "D. Less" },
      { value: "E", label: "E. Not Fair" },
    ],
  },
  {
    qNumber: 23,
    question: "Gives feedback on Exams/Quizzes/Assignments/Projects",
    options: [
      { value: "A", label: "A. Always both orally in class and on answer script" },
      { value: "B", label: "B. Sometimes orally in class and always on answer script" },
      { value: "C", label: "C. Sometimes orally in class and sometimes on answer script" },
      { value: "D", label: "D. Never orally in class and sometimes on answer script" },
      { value: "E", label: "E. Never both orally in class or on answer script" },
    ],
  },
  {
    qNumber: 24,
    question: "Faculty encourages students to ask questions/doubts and to be active in the class",
    options: [
      { value: "A", label: "A. Always" },
      { value: "B", label: "B. Mostly" },
      { value: "C", label: "C. Sometimes" },
      { value: "D", label: "D. Few times" },
      { value: "E", label: "E. Rarely" },
    ],
  },
  {
    qNumber: 25,
    question: "The faculty member uses Telugu in the classroom",
    options: [
      { value: "A", label: "A. Always both for teaching subject and general talk" },
      { value: "B", label: "B. Always for general talk only" },
      { value: "C", label: "C. Intermittently for teaching and always for general talk" },
      { value: "D", label: "D. Sometimes for teaching and general talk" },
      { value: "E", label: "E. Never speaks in Telugu" },
    ],
  },
  {
    qNumber: 26,
    question: "Maintaining discipline in the class by the faculty member",
    options: [
      { value: "A", label: "A. Excellent" },
      { value: "B", label: "B. Very Good" },
      { value: "C", label: "C. Good" },
      { value: "D", label: "D. Fair" },
      { value: "E", label: "E. Poor" },
    ],
  },
  {
    qNumber: 27,
    question: "Behaviour with the students",
    options: [
      { value: "A", label: "A. Excellent" },
      { value: "B", label: "B. Very Good" },
      { value: "C", label: "C. Good" },
      { value: "D", label: "D. Fair" },
      { value: "E", label: "E. Poor" },
    ],
  },
  {
    qNumber: 28,
    question: "Encourages and motivates the students towards regular studies",
    options: [
      { value: "A", label: "A. Always" },
      { value: "B", label: "B. Mostly" },
      { value: "C", label: "C. Sometimes" },
      { value: "D", label: "D. Few times" },
      { value: "E", label: "E. Rarely" },
    ],
  },
  {
    qNumber: 29,
    question: "Coverage of Course syllabus",
    options: [
      { value: "A", label: "A. Completely covered" },
      { value: "B", label: "B. Mostly covered" },
      { value: "C", label: "C. Few chapters are left" },
      { value: "D", label: "D. Half only covered" },
      { value: "E", label: "E. Poor" },
    ],
  },
  {
    qNumber: 30,
    question: "Effectiveness of Usage of Chalk/White Board and/or PPT",
    options: [
      { value: "A", label: "A. Excellent" },
      { value: "B", label: "B. Very Good" },
      { value: "C", label: "C. Good" },
      { value: "D", label: "D. Fair" },
      { value: "E", label: "E. Poor" },
    ],
  },
  {
    qNumber: 31,
    question: "Meeting the Faculty member after class hours or in leisure time",
    options: [
      { value: "A", label: "A. Always available" },
      { value: "B", label: "B. Available sometimes" },
      { value: "C", label: "C. Available on few times" },
      { value: "D", label: "D. Do not encourage to meet" },
      { value: "E", label: "E. Poor" },
    ],
  },
];

export const TEXT_QUESTIONS_2: TextQuestion[] = [
  { qNumber: 32, question: "Strengths" },
  { qNumber: 33, question: "Weaknesses" },
  { qNumber: 34, question: "Suggestions" },
];
