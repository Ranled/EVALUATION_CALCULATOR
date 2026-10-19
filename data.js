// =========================================================================
// CHARRMPASS — ISO/IEC 25010 & SUS Questionnaire Data Structure
// =========================================================================

const LIKERT_SCALE = [
  { scale: 5, min: 4.21, max: 5.00, label: "Very Satisfied", badgeClass: "badge-vs" },
  { scale: 4, min: 3.41, max: 4.20, label: "Satisfied", badgeClass: "badge-s" },
  { scale: 3, min: 2.61, max: 3.40, label: "Neutral", badgeClass: "badge-n" },
  { scale: 2, min: 1.81, max: 2.60, label: "Unsatisfied", badgeClass: "badge-u" },
  { scale: 1, min: 1.00, max: 1.80, label: "Very Unsatisfied", badgeClass: "badge-vu" }
];

const SUS_GRADE_SCALE = [
  { min: 84.1, max: 100.0, rangeLabel: "84.1 – 100", percentile: "96 – 100%", grade: "A+", rank: "Best Imaginable", badgeClass: "badge-vs" },
  { min: 80.8, max: 84.09, rangeLabel: "80.8 – 84.0", percentile: "90 – 95%",  grade: "A",  rank: "Excellent",       badgeClass: "badge-vs" },
  { min: 78.9, max: 80.79, rangeLabel: "78.9 – 80.7", percentile: "85 – 89%",  grade: "A-", rank: "Excellent",       badgeClass: "badge-vs" },
  { min: 77.2, max: 78.89, rangeLabel: "77.2 – 78.8", percentile: "80 – 84%",  grade: "B+", rank: "Excellent",       badgeClass: "badge-s" },
  { min: 74.1, max: 77.19, rangeLabel: "74.1 – 77.1", percentile: "70 – 79%",  grade: "B",  rank: "Good",            badgeClass: "badge-s" },
  { min: 72.6, max: 74.09, rangeLabel: "72.6 – 74.0", percentile: "65 – 69%",  grade: "B-", rank: "Good",            badgeClass: "badge-s" },
  { min: 71.1, max: 72.59, rangeLabel: "71.1 – 72.5", percentile: "60 – 64%",  grade: "C+", rank: "Good",            badgeClass: "badge-s" },
  { min: 65.0, max: 71.09, rangeLabel: "65.0 – 71.0", percentile: "41 – 59%",  grade: "C",  rank: "Average (68 = 50th %ile)", badgeClass: "badge-n" },
  { min: 62.7, max: 64.99, rangeLabel: "62.7 – 64.9", percentile: "35 – 40%",  grade: "C-", rank: "Okay",            badgeClass: "badge-n" },
  { min: 51.7, max: 62.69, rangeLabel: "51.7 – 62.6", percentile: "15 – 34%",  grade: "D",  rank: "Okay",            badgeClass: "badge-u" },
  { min: 0.0,  max: 51.69, rangeLabel: "0.0 – 51.6",  percentile: "0 – 14%",   grade: "F",  rank: "Poor",            badgeClass: "badge-vu" }
];

const DEMOGRAPHIC_CONFIG = {
  age: [
    { id: "age_18_20", label: "18–20" },
    { id: "age_21_25", label: "21–25" },
    { id: "age_26_30", label: "26–30" },
    { id: "age_31_40", label: "31–40" },
    { id: "age_41_up", label: "41 and above" }
  ],
  sex: [
    { id: "sex_male", label: "Male" },
    { id: "sex_female", label: "Female" },
    { id: "sex_prefer_not", label: "Prefer not to say" }
  ],
  role: [
    { id: "role_student", label: "Student" },
    { id: "role_faculty", label: "Faculty" },
    { id: "role_staff", label: "Staff" },
    { id: "role_security", label: "Security Personnel" },
    { id: "role_other", label: "Other" }
  ]
};

const ISO_CRITERIA = [
  {
    id: "A",
    code: "A",
    title: "A. FUNCTIONAL SUITABILITY",
    shortTitle: "Functional Suitability",
    subcriteria: [
      {
        id: "A1",
        title: "Functional Completeness",
        questions: [
          { num: 1, text: "The system provides the necessary functions for registering students, faculty, staff, and their vehicle information." },
          { num: 2, text: "The system allows authorized personnel to associate RFID cards or tags with registered individuals and vehicles." },
          { num: 3, text: "The system provides RFID identification and validation functions at campus entry and exit points." },
          { num: 4, text: "The system provides a centralized dashboard for monitoring individual and vehicle entry and exit activities." },
          { num: 5, text: "The system provides functions for registering and monitoring visitors and their vehicles." },
          { num: 6, text: "The system provides an emergency exemption function for authorized emergency units." },
          { num: 7, text: "The system provides functions for filtering and generating entry and exit transaction reports." },
          { num: 8, text: "The system provides offline transaction recording and subsequent synchronization when connectivity is restored." }
        ]
      },
      {
        id: "A2",
        title: "Functional Correctness",
        questions: [
          { num: 9, text: "The system accurately stores registration and vehicle information." },
          { num: 10, text: "The system correctly identifies registered RFID cards or tags associated with valid records." },
          { num: 11, text: "The system correctly determines whether an individual or vehicle is authorized to enter the campus based on the configured access rules." },
          { num: 12, text: "The system accurately records the date, time, and direction of entry or exit transactions." },
          { num: 13, text: "The system correctly records visitor entry and exit activities." },
          { num: 14, text: "The system correctly applies emergency access exemptions to authorized emergency units." },
          { num: 15, text: "The system generates reports that accurately reflect the recorded transactions and selected filters." },
          { num: 16, text: "The system preserves recorded transactions during supported network interruptions and synchronizes them correctly after reconnection." }
        ]
      },
      {
        id: "A3",
        title: "Functional Appropriateness",
        questions: [
          { num: 17, text: "The registration and permit functions help personnel organize individual and vehicle records." },
          { num: 18, text: "The RFID identification function reduces the need for manual verification of registered individuals and vehicles." },
          { num: 19, text: "The centralized dashboard helps security personnel monitor campus entry and exit activities." },
          { num: 20, text: "The visitor management function supports the systematic recording of campus visitors." },
          { num: 21, text: "The emergency exemption function supports timely access for authorized emergency units." },
          { num: 22, text: "The reporting function helps authorized personnel review and monitor campus access transactions." },
          { num: 23, text: "The offline module helps maintain gate monitoring operations during network or internet interruptions." }
        ]
      }
    ]
  },
  {
    id: "B",
    code: "B",
    title: "B. PERFORMANCE EFFICIENCY",
    shortTitle: "Performance Efficiency",
    subcriteria: [
      {
        id: "B1",
        title: "Time Behaviour & Resource Efficiency",
        questions: [
          { num: 24, text: "The system identifies registered RFID cards or tags within an acceptable period." },
          { num: 25, text: "The system validates access requests without unnecessary delays." },
          { num: 26, text: "The centralized dashboard displays entry and exit transactions within an acceptable period." },
          { num: 27, text: "The system retrieves and generates transaction reports efficiently." },
          { num: 28, text: "The system synchronizes offline transactions within an acceptable period after connectivity is restored." }
        ]
      },
      {
        id: "B2",
        title: "Capacity & Operational Environment",
        questions: [
          { num: 29, text: "The system works correctly with the RFID readers and cards or tags supported by its configuration." },
          { num: 30, text: "The system operates correctly on the supported computers and web browsers used by authorized personnel." },
          { num: 31, text: "The system allows supported gate devices and the centralized monitoring dashboard to exchange transaction information correctly." },
          { num: 32, text: "The system operates properly within its intended campus network and server environment." }
        ]
      }
    ]
  },
  {
    id: "C",
    code: "C",
    title: "C. COMPATIBILITY",
    shortTitle: "Compatibility",
    subcriteria: [
      {
        id: "C1",
        title: "Co-existence & Interoperability",
        questions: [
          { num: 33, text: "The system can be adapted for use in different establishments that require entry and exit monitoring." },
          { num: 34, text: "The system can be configured to meet the entry and exit monitoring requirements of different institutions." },
          { num: 35, text: "The RFID identification and verification process can be used in different locations with compatible RFID hardware." },
          { num: 36, text: "The system can accommodate different categories of users, such as students, faculty, staff, visitors, and authorized personnel, in various establishments." },
          { num: 37, text: "The system can be integrated with compatible RFID readers and devices used in different entry and exit monitoring environments." },
          { num: 38, text: "The system can operate in different establishments with appropriate hardware, network connectivity, and system configuration." }
        ]
      }
    ]
  },
  {
    id: "D",
    code: "D",
    title: "D. USABILITY",
    shortTitle: "Usability",
    subcriteria: [
      {
        id: "D1",
        title: "Appropriateness Recognizability, Learnability & Operability",
        questions: [
          { num: 39, text: "The system interface is easy to understand and navigate." },
          { num: 40, text: "The registration and vehicle permit processes are easy to follow." },
          { num: 41, text: "The system provides clear feedback when an RFID card or tag is successfully identified or rejected." },
          { num: 42, text: "The centralized dashboard presents entry and exit information in an organized and understandable format." },
          { num: 43, text: "The visitor registration process is easy for authorized personnel to perform." },
          { num: 44, text: "The emergency exemption function is understandable to authorized personnel." },
          { num: 45, text: "The reporting interface makes it easy to select filters and review transaction records." },
          { num: 46, text: "The system provides understandable messages when errors or connectivity problems occur." }
        ]
      }
    ]
  },
  {
    id: "E",
    code: "E",
    title: "E. RELIABILITY",
    shortTitle: "Reliability",
    subcriteria: [
      {
        id: "E1",
        title: "Maturity, Availability, Fault Tolerance & Recoverability",
        questions: [
          { num: 47, text: "The system consistently records valid entry and exit transactions during normal operation." },
          { num: 48, text: "The system continues recording transactions locally during supported network or internet interruptions." },
          { num: 49, text: "The system correctly synchronizes stored offline transactions after connectivity is restored." },
          { num: 50, text: "The system maintains the consistency of transaction records during normal operation and synchronization." },
          { num: 51, text: "The system handles RFID reading failures or other operational errors appropriately." },
          { num: 52, text: "The system provides appropriate recovery procedures when a supported component or service fails." }
        ]
      }
    ]
  },
  {
    id: "F",
    code: "F",
    title: "F. SECURITY",
    shortTitle: "Security",
    subcriteria: [
      {
        id: "F1",
        title: "Confidentiality, Integrity, Non-repudiation & Authenticity",
        questions: [
          { num: 53, text: "The system restricts access to administrative and monitoring functions to authenticated, authorized users." },
          { num: 54, text: "The system limits user management and transaction management functions according to assigned permissions." },
          { num: 55, text: "The system prevents unauthorized individuals from gaining access through invalid, unregistered, or unauthorized RFID credentials, according to the configured access rules." },
          { num: 56, text: "The system protects personal, vehicle, visitor, and transaction information against unauthorized access or modification." },
          { num: 57, text: "The system restricts access to historical transaction records and reports to authorized personnel." },
          { num: 58, text: "The system maintains appropriate records of important access and administrative activities, where implemented." }
        ]
      }
    ]
  },
  {
    id: "G",
    code: "G",
    title: "G. MAINTAINABILITY",
    shortTitle: "Maintainability",
    subcriteria: [
      {
        id: "G1",
        title: "Modularity, Modifiability & Testability",
        questions: [
          { num: 59, text: "The system's modules are organized in a manner that supports troubleshooting and maintenance." },
          { num: 60, text: "Authorized developers can update access rules or system functions without unnecessarily affecting unrelated modules." },
          { num: 61, text: "The system can be tested to determine whether updates affect RFID identification, reporting, and offline synchronization." },
          { num: 62, text: "The system's technical documentation supports troubleshooting and future maintenance." }
        ]
      }
    ]
  },
  {
    id: "H",
    code: "H",
    title: "H. PORTABILITY",
    shortTitle: "Portability",
    subcriteria: [
      {
        id: "H1",
        title: "Adaptability, Installability & Replaceability",
        questions: [
          { num: 63, text: "The system can be deployed in another compatible server environment using the appropriate configuration." },
          { num: 64, text: "The system can be configured to operate with compatible RFID hardware and supported client computers." },
          { num: 65, text: "The system's application and database components can be transferred to a compatible environment using documented procedures." }
        ]
      }
    ]
  }
];

const SUS_QUESTIONS = [
  { num: 1, text: "I think that I would like to use this system frequently.", polarity: "positive" },
  { num: 2, text: "I found the system unnecessarily complex.", polarity: "negative" },
  { num: 3, text: "I thought the system was easy to use.", polarity: "positive" },
  { num: 4, text: "I think that I would need the support of a technical person to be able to use this system.", polarity: "negative" },
  { num: 5, text: "I found the various functions in this system were well-integrated.", polarity: "positive" },
  { num: 6, text: "I thought there was too much inconsistency in this system.", polarity: "negative" },
  { num: 7, text: "I would imagine that most people would learn to use this system very quickly.", polarity: "positive" },
  { num: 8, text: "I found the system very cumbersome to use.", polarity: "negative" },
  { num: 9, text: "I felt very confident using the system.", polarity: "positive" },
  { num: 10, text: "I needed to learn a lot of things before I could get going with this system.", polarity: "negative" }
];
