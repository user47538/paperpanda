const commonNaplanResources = [
  {
    label: "NAPLAN public demonstration site",
    url: "https://www.nap.edu.au/naplan/public-demonstration-site",
    type: "practice test",
    note: "Best for familiarising students with the structure of online reading, conventions and writing tasks."
  },
  {
    label: "NAPLAN 2012–2016 test papers",
    url: "https://www.acara.edu.au/assessment/naplan/naplan-2012-2016-test-papers",
    type: "practice papers",
    note: "Older public test papers with answers that are useful for timed revision."
  }
];

const englishNaplanResources = [
  {
    label: "Year 7 reading example test",
    url: "https://www.nap.edu.au/_resources/example_test_answer_reading_y7.pdf",
    type: "reading practice",
    note: "A direct Year 7 reading comprehension paper."
  },
  {
    label: "Year 7 language conventions example test",
    url: "https://www.nap.edu.au/_resources/example_test_language_conventions_y7.pdf",
    type: "grammar practice",
    note: "Grammar, punctuation and spelling practice in the NAPLAN format."
  },
  {
    label: "Persuasive writing marking guide",
    url: "https://www.nap.edu.au/docs/default-source/naplan/persuasive-writing-marking-guide.pdf",
    type: "answer guide",
    note: "Shows how stronger writing is judged, including audience, ideas, vocabulary and cohesion."
  }
];

const hscExamResources = [
  {
    label: "NESA HSC exam papers",
    url: "https://educationstandards.nsw.edu.au/wps/portal/nesa/resource-finder/hsc-exam-papers",
    type: "past papers",
    note: "The main official source for HSC exam packs, papers and marking guidelines."
  },
  {
    label: "NESA Stage 6 sample work",
    url: "https://educationstandards.nsw.edu.au/wps/portal/nesa/11-12/resources/sample-work",
    type: "student exemplars",
    note: "Useful for seeing the standard of work expected in senior courses."
  }
];

const year7SubjectEnhancements = {
  english: {
    topics: [
      "reading comprehension and inference",
      "language features and persuasive devices",
      "visual texts and representation",
      "novel study and character analysis",
      "speech writing and oral delivery",
      "grammar, punctuation and vocabulary"
    ],
    resources: [
      {
        label: "Year 7 sample scope and sequence – English",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/english/english-curriculum-resources-k-12/english-7-10-resources/year-7-sample-scope-and-sequence-english",
        type: "scope and sequence",
        note: "Useful for seeing how Year 7 English is typically structured across the year."
      },
      {
        label: "Powerful youth voices – Year 7, Term 1",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/english/english-curriculum-resources-k-12/english-7-10-resources/stage-4-year-7-powerful-youth-voices",
        type: "unit resource",
        note: "Links persuasive writing, personal voice and response structure."
      },
      {
        label: "Seeing through a text – Year 7, Term 2",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/english/english-curriculum-resources-k-12/english-7-10-resources/stage-4-year-7-seeing-through-a-text",
        type: "unit resource",
        note: "Supports visual literacy and close reading of multimodal texts."
      },
      {
        label: "Escape into the world of the novel – Year 7, Term 3",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/english/english-curriculum-resources-k-12/english-7-10-resources/stage-4-year-7-escape-into-the-world-of-the-novel",
        type: "unit resource",
        note: "Useful for character, theme and evidence-based paragraph practice."
      },
      {
        label: "Speak the speech – Year 7, Term 4",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/english/english-curriculum-resources-k-12/english-7-10-resources/speak-the-speech-year-7-term-4",
        type: "unit resource",
        note: "Good for oral presentation structure and delivery."
      }
    ]
  },
  maths: {
    topics: [
      "integers and number operations",
      "fractions, decimals and percentages",
      "algebra and substitution",
      "measurement and geometry",
      "data and probability",
      "multi-step numeracy reasoning"
    ],
    resources: [
      {
        label: "Year 7 numeracy example test",
        url: "https://www.nap.edu.au/docs/default-source/default-document-library/example_test_answer_numeracy_y7.pdf?sfvrsn=2",
        type: "practice test",
        note: "A direct Year 7 numeracy example test in the NAPLAN style."
      },
      {
        label: "Year 7 numeracy non-calculator example test",
        url: "https://www.nap.edu.au/_resources/Example_Test_Answer_Numeracy_Y7_Non_Calc.pdf",
        type: "practice test",
        note: "Useful for number sense and reasoning without calculator support."
      },
      {
        label: "National minimum standards – Year 7 numeracy",
        url: "https://www.nap.edu.au/naplan/whats-in-the-tests/national-minimum-standards",
        type: "skills guide",
        note: "Useful for understanding the baseline numeracy skills students are expected to demonstrate."
      }
    ]
  },
  science: {
    topics: [
      "living systems",
      "classification and cells",
      "forces and motion",
      "mixtures and materials",
      "earth and space systems",
      "working scientifically"
    ],
    resources: [
      {
        label: "Living systems – Stage 4, Science",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/science/science-curriculum-resources-k-12/science-7-10-curriculum-resources/science-s4-living-systems",
        type: "unit resource",
        note: "Includes a sample assessment and program materials for a core Stage 4 unit."
      },
      {
        label: "NESA ARC Science work samples – Stage 4",
        url: "https://arc.nesa.nsw.edu.au/go/7-8/science/stu-work",
        type: "student exemplars",
        note: "Good for seeing how investigations and short responses are judged."
      }
    ]
  },
  history: {
    topics: [
      "the ancient past",
      "historical concepts and inquiry",
      "source skills",
      "ancient Egypt",
      "ancient China",
      "PEEL paragraph writing in history"
    ],
    resources: [
      {
        label: "The ancient past – History, Stage 4",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/hsie/hsie-curriculum-resources-k-12/hsie-7-10-curriculum-resources/history-s4-the-ancient-past",
        type: "unit resource",
        note: "Includes a sample assessment and student resource pack for Year 7 core history."
      },
      {
        label: "Depth study – ancient China – History, Stage 4",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/hsie/hsie-curriculum-resources-k-12/hsie-7-10-curriculum-resources/history-s4-ancient-china",
        type: "unit resource",
        note: "Provides support material, an assessment task and a historical skills slide deck."
      },
      {
        label: "NESA ARC History work samples – Stage 4",
        url: "https://arc.nesa.nsw.edu.au/go/7-8/history",
        type: "student exemplars",
        note: "Helpful for source analysis and historical writing expectations."
      }
    ]
  },
  music: {
    topics: [
      "beat and rhythm notation",
      "pitch and melody",
      "performing and composing",
      "music literacy",
      "listening analysis"
    ],
    resources: [
      {
        label: "Beats and tunes – Music, Stage 4",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/creative-arts/creative-arts-curriculum-resources-k-12/7-10-curriculum-resources/music-stage-4-beats-and-tunes",
        type: "unit resource",
        note: "Includes a sample assessment task, score booklet and teaching support."
      },
      {
        label: "Analysing popular music – Stage 4",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/creative-arts/creative-arts-curriculum-resources-k-12/7-10-curriculum-resources/analysing-popular-music",
        type: "analysis resource",
        note: "Useful for listening analysis and musical terminology."
      }
    ]
  },
  pdhpe: {
    topics: [
      "strengths and identity",
      "healthy, safe and active choices",
      "movement skill application",
      "reflection and goal setting",
      "respectful relationships"
    ],
    resources: [
      {
        label: "Exploring my strengths and identity – Stage 4 PDHPE",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/pdhpe/pdhpe-curriculum-resources-k-12/pdhpe-7-10-curriculum-resources/strengths-and-identity-s4",
        type: "unit resource",
        note: "A Year 7-focused Stage 4 program with an assessment and slide deck."
      },
      {
        label: "Creating my toolkit for change – Stage 4",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/pdhpe/pdhpe-curriculum-resources-k-12/pdhpe-7-10-curriculum-resources/creating-my-toolkit-for-change-s4",
        type: "unit resource",
        note: "Useful for application and reflection tasks in Stage 4 PDHPE."
      },
      {
        label: "Stage 4 respectful relationships resources",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/respectful-relationships-education/research-and-resources-rre/rre-resources/rre-curriculum-resources-7-12",
        type: "support resource",
        note: "Useful for scenario-based discussion and applied wellbeing/PDHPE tasks."
      }
    ]
  },
  "design-tech": {
    topics: [
      "design process",
      "user needs and design briefs",
      "materials, tools and safety",
      "research and idea generation",
      "evaluation and justification"
    ],
    resources: [
      {
        label: "Planning, programming and assessing TAS 7–10",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/tas/planning-programming-and-assessing-tas-7-10",
        type: "curriculum guide",
        note: "The main NSW guide for Technology Mandatory in Years 7–8."
      },
      {
        label: "NESA ARC Technology (Mandatory) – Stage 4",
        url: "https://arc.nesa.nsw.edu.au/go/7-8/tech",
        type: "student exemplars",
        note: "Useful for design-process tasks and seeing how work can be assessed."
      }
    ]
  },
  art: {
    topics: [
      "visual conventions and artmaking",
      "artist, artwork, world, audience",
      "frames and interpretation",
      "process reflection",
      "critical and historical response"
    ],
    resources: [
      {
        label: "Sample scope and sequence – Visual Arts, Stage 4",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/creative-arts/creative-arts-curriculum-resources-k-12/7-10-curriculum-resources/stage-4-visual-arts-sample-scope-and-sequence",
        type: "scope and sequence",
        note: "Useful for seeing how Year 7–8 artmaking and critical study can be structured."
      },
      {
        label: "NESA ARC Visual Arts – Stage 4",
        url: "https://arc.nesa.nsw.edu.au/go/7-8/visual-arts",
        type: "student exemplars",
        note: "Shows visual arts activities and student work samples for Stage 4."
      },
      {
        label: "Interpreting art – Part 1 – The frames",
        url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/creative-arts/creative-arts-curriculum-resources-k-12/7-10-curriculum-resources/interpreting-art-part-1-the-frames",
        type: "analysis resource",
        note: "Good for written analysis and art interpretation practice."
      }
    ]
  }
};

function createEntry({
  grade,
  subjectId,
  subjectName,
  curriculumOverview,
  skillsTested,
  topics,
  resources,
  allowsTextInput = false,
  revisionStyle = "naplan-inspired"
}) {
  return {
    grade,
    subjectId,
    subjectName,
    curriculumOverview,
    skillsTested,
    topics,
    resources,
    allowsTextInput,
    revisionStyle
  };
}

function juniorEnglishTopics(grade) {
  if (grade === "7") {
    return [
      "personal voice and persuasive writing",
      "visual texts and representation",
      "novel study and character analysis",
      "speech, oral storytelling and performance"
    ];
  }

  if (grade === "8") {
    return [
      "argument and persuasive language",
      "poetry and figurative language",
      "narrative viewpoint and conflict",
      "multimodal interpretation"
    ];
  }

  if (grade === "9") {
    return [
      "close reading and analysis",
      "extended response writing",
      "comparing perspectives across texts",
      "voice, style and purpose"
    ];
  }

  return [
    "critical interpretation",
    "essay planning and textual evidence",
    "argument, rhetoric and perspective",
    "creative and discursive writing"
  ];
}

function juniorEntriesForGrade(grade) {
  const stageLabel = grade === "7" || grade === "8" ? "Stage 4" : "Stage 5";
  const historyStagePath = grade === "7" || grade === "8" ? "7-8" : "sc";
  const musicStagePath = grade === "7" || grade === "8" ? "7-8" : "sc";
  const scienceStagePath = grade === "7" || grade === "8" ? "7-8" : "sc";
  const artStagePath = grade === "7" || grade === "8" ? "7-8" : "sc";

  return [
    createEntry({
      grade,
      subjectId: "english",
      subjectName: "English",
      curriculumOverview: `${stageLabel} English builds reading, writing, speaking and viewing through increasingly complex literary, factual and multimodal texts. Students learn to explain how language choices shape meaning and to compose imaginative, informative and persuasive responses.`,
      skillsTested: [
        "reading comprehension and inference",
        "text analysis using evidence",
        "grammar, punctuation and vocabulary control",
        "persuasive, imaginative and analytical writing",
        "oral presentation and listening"
      ],
      topics: grade === "7" ? year7SubjectEnhancements.english.topics : juniorEnglishTopics(grade),
      resources: [
        {
          label: "NSW English 7–10 planning resources",
          url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/english/planning-programming-and-assessing-english-7-10",
          type: "curriculum guide",
          note: "Official NSW teaching and assessment support for English 7–10."
        },
        {
          label: "NESA ARC English work samples",
          url:
            grade === "7" || grade === "8"
              ? "https://arc.nesa.nsw.edu.au/go/7-8/english/stu-work"
              : "https://arc.nesa.nsw.edu.au/go/sc/english/stu-work/a/persuasive-writing-to-raise-public-awareness-jody/grade-commentary",
          type: "student exemplars",
          note: "Shows the standard of answers and why they achieved their grade."
        },
        ...commonNaplanResources,
        ...englishNaplanResources,
        ...(grade === "7" ? year7SubjectEnhancements.english.resources : [])
      ],
      allowsTextInput: true,
      revisionStyle: "naplan-english"
    }),
    createEntry({
      grade,
      subjectId: "maths",
      subjectName: "Maths and Numeracy",
      curriculumOverview: `${stageLabel} Mathematics develops number sense, algebraic reasoning, measurement, geometry, statistics and problem solving. Students are expected to show working, choose efficient methods and explain their mathematical reasoning clearly.`,
      skillsTested: [
        "fluency with number and operations",
        "interpreting mathematical information",
        "multi-step problem solving",
        "showing working and reasoning",
        "using mathematical language accurately"
      ],
      topics:
        grade === "7"
          ? year7SubjectEnhancements.maths.topics
          : grade === "8"
            ? ["ratio and rates", "linear relationships", "angles and area", "data representation"]
            : grade === "9"
              ? ["indices and surds", "linear equations", "Pythagoras", "statistics and probability"]
              : ["quadratic relationships", "trigonometry", "financial maths", "probability and reasoning"],
      resources: [
        {
          label: "Mathematics 7–10 units and assessments",
          url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/mathematics/planning-programming-and-assessing-mathematics-7-10/mathematics-7-10-units",
          type: "curriculum guide",
          note: "Official NSW unit and assessment support."
        },
        ...commonNaplanResources,
        ...(grade === "7" ? year7SubjectEnhancements.maths.resources : [])
      ]
    }),
    createEntry({
      grade,
      subjectId: "science",
      subjectName: "Science",
      curriculumOverview: `${stageLabel} Science develops scientific knowledge, investigation skills and evidence-based explanation. Students learn to plan investigations, analyse results and communicate scientific ideas using correct terminology.`,
      skillsTested: [
        "scientific literacy and vocabulary",
        "interpreting data and observations",
        "experimental design",
        "explaining results using evidence",
        "short and extended scientific responses"
      ],
      topics:
        grade === "7"
          ? year7SubjectEnhancements.science.topics
          : grade === "8"
            ? ["cells and body systems", "energy transfers", "rocks and cycles", "ecology"]
            : grade === "9"
              ? ["atomic theory", "ecosystems", "motion", "chemical reactions"]
              : ["genetics", "waves", "periodic table", "global systems"],
      resources: [
        {
          label: "Science 7–10 planning resources",
          url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/science/planning-programming-and-assessing-science-7-10",
          type: "curriculum guide",
          note: "Official NSW support for science content and assessment."
        },
        {
          label: "NESA ARC Science work samples",
          url:
            scienceStagePath === "7-8"
              ? "https://arc.nesa.nsw.edu.au/go/7-8/science/stu-work"
              : "https://arc.nesa.nsw.edu.au/go/9-10/work-samples-and-activities",
          type: "student exemplars",
          note: "Useful for seeing how short and extended science answers are assessed."
        },
        ...(grade === "7" ? year7SubjectEnhancements.science.resources : [])
      ]
    }),
    createEntry({
      grade,
      subjectId: "history",
      subjectName: "History",
      curriculumOverview: `${stageLabel} History develops chronology, source analysis, historical perspectives and explanation of cause, consequence and significance. Students are assessed on how well they use evidence to support historical claims.`,
      skillsTested: [
        "source interpretation",
        "chronology and sequence",
        "cause and consequence",
        "historical explanation using evidence",
        "short and extended responses"
      ],
      topics:
        grade === "7"
          ? year7SubjectEnhancements.history.topics
          : grade === "8"
            ? ["medieval Europe", "the Vikings", "the Ottoman Empire", "Shogunate Japan"]
            : grade === "9"
              ? ["making a better world", "Australia and Asia", "World War I", "rights and freedoms"]
              : ["World War II", "the Holocaust", "migration experiences", "popular culture"],
      resources: [
        {
          label: "NESA ARC History work samples",
          url:
            historyStagePath === "7-8"
              ? "https://arc.nesa.nsw.edu.au/go/7-8/history/stu-work"
              : "https://arc.nesa.nsw.edu.au/go/9-10/work-samples-and-activities",
          type: "student exemplars",
          note: "Good for source skills and historical writing practice."
        },
        ...(grade === "7" ? year7SubjectEnhancements.history.resources : [])
      ]
    }),
    createEntry({
      grade,
      subjectId: "music",
      subjectName: "Music",
      curriculumOverview: `${stageLabel} Music builds listening, performing, composing and reflection. Students learn to describe musical concepts and to justify choices in performance and composition tasks.`,
      skillsTested: [
        "listening and identifying musical concepts",
        "performance reflection",
        "notation and rhythm understanding",
        "composition choices",
        "written response using music terminology"
      ],
      topics:
        grade === "7"
          ? year7SubjectEnhancements.music.topics
          : grade === "8"
            ? ["ensemble skills", "structure and form", "music from different contexts", "composition planning"]
            : grade === "9"
              ? ["style analysis", "performance preparation", "composition development", "aural listening"]
              : ["music analysis", "extended composition", "performance critique", "genre comparison"],
      resources: [
        {
          label: "NESA ARC Music resources",
          url:
            musicStagePath === "7-8"
              ? "https://arc.nesa.nsw.edu.au/go/7-8/music"
              : "https://arc.nesa.nsw.edu.au/go/sc/music/activities/composing-medieval-music",
          type: "curriculum and tasks",
          note: "Useful for performance, listening and composition style tasks."
        },
        ...(grade === "7" ? year7SubjectEnhancements.music.resources : [])
      ]
    }),
    createEntry({
      grade,
      subjectId: "pdhpe",
      subjectName: "PDHPE",
      curriculumOverview: `${stageLabel} PDHPE develops health literacy, movement competence and informed decision making. Students are assessed in both practical and theory contexts, including reflection and application of health concepts.`,
      skillsTested: [
        "health knowledge and application",
        "movement reflection",
        "decision-making in scenarios",
        "planning and evaluation",
        "theory short-answer responses"
      ],
      topics:
        grade === "7"
          ? year7SubjectEnhancements.pdhpe.topics
          : grade === "8"
            ? ["nutrition and wellbeing", "challenge and resilience", "games and strategy", "respectful relationships"]
            : grade === "9"
              ? ["drug education", "physical activity planning", "mental health", "skill application"]
              : ["health promotion", "first aid", "training principles", "ethical decision making"],
      resources: [
        {
          label: "PDHPE 7–10 planning resources",
          url: "https://education.nsw.gov.au/teaching-and-learning/curriculum/pdhpe/planning-programming-and-assessing-pdhpe-k-12/planning-programming-and-assessing-pdhpe-7-10",
          type: "curriculum guide",
          note: "Official NSW support for practical and theory assessment planning."
        },
        ...(grade === "7" ? year7SubjectEnhancements.pdhpe.resources : [])
      ]
    }),
    createEntry({
      grade,
      subjectId: "wellbeing",
      subjectName: "Wellbeing",
      curriculumOverview: `PaperPanda uses Wellbeing as a student support space for organisation, study habits and reflection. Revision in this area should focus on self-management, planner use and reflective writing rather than formal syllabus testing.`,
      skillsTested: [
        "study planning",
        "self-reflection",
        "goal setting",
        "organisation"
      ],
      topics: ["study planner", "task breakdown", "reflection", "weekly priorities"],
      resources: []
    }),
    createEntry({
      grade,
      subjectId: "design-tech",
      subjectName: "Design & Technology",
      curriculumOverview: `${stageLabel} Design & Technology develops design thinking, production processes and evaluation. Students are assessed on how well they identify problems, generate ideas, justify decisions and reflect on the finished product.`,
      skillsTested: [
        "design process explanation",
        "research and idea generation",
        "evaluation and justification",
        "technical vocabulary",
        "annotated design responses"
      ],
      topics:
        grade === "7"
          ? year7SubjectEnhancements["design-tech"].topics
          : grade === "8"
            ? ["user needs", "modification and iteration", "production planning", "sustainability"]
            : grade === "9"
              ? ["design briefs", "research and investigation", "prototype evaluation", "communication"]
              : ["project management", "innovation", "testing and refinement", "design justification"],
      resources: [
        {
          label: "NESA Years 9–10 work samples and activities",
          url: "https://arc.nesa.nsw.edu.au/go/9-10/work-samples-and-activities",
          type: "student exemplars",
          note: "Useful for seeing how design-style responses can be structured and marked."
        },
        ...(grade === "7" ? year7SubjectEnhancements["design-tech"].resources : [])
      ]
    }),
    createEntry({
      grade,
      subjectId: "art",
      subjectName: "Art",
      curriculumOverview: `${stageLabel} Visual Arts develops artmaking, interpretation and reflection. Students are assessed on their ability to explain visual conventions, interpret artworks and reflect on process in both practical and written forms.`,
      skillsTested: [
        "art interpretation",
        "using visual arts terminology",
        "process reflection",
        "linking technique and meaning",
        "short and extended written responses"
      ],
      topics:
        grade === "7"
          ? year7SubjectEnhancements.art.topics
          : grade === "8"
            ? ["representation and style", "mixed media", "audience interpretation", "practice reflection"]
            : grade === "9"
              ? ["historical and critical studies", "artmaking reflection", "concept development", "analysis of artworks"]
              : ["artist practice", "body of work planning", "concept and audience", "critical response"],
      resources: [
        {
          label: "NESA ARC Visual Arts resources",
          url:
            artStagePath === "7-8"
              ? "https://arc.nesa.nsw.edu.au/go/7-8/visual-arts"
              : "https://arc.nesa.nsw.edu.au/go/9-10/work-samples-and-activities",
          type: "curriculum and exemplars",
          note: "Good for visual analysis and reflection-style response models."
        },
        ...(grade === "7" ? year7SubjectEnhancements.art.resources : [])
      ]
    })
  ];
}

function seniorEntriesForGrade(grade) {
  const gradeLabel = grade === "11" ? "Year 11" : "HSC / Year 12";

  return [
    createEntry({
      grade,
      subjectId: "english",
      subjectName: "English",
      curriculumOverview: `${gradeLabel} English focuses on critical reading, comparative thinking and sustained analytical or discursive writing. Students are expected to use textual evidence precisely and shape responses for exam conditions.`,
      skillsTested: [
        "close analysis of unseen texts",
        "essay planning and argument",
        "synthesising evidence",
        "writing under time pressure",
        "evaluating language, form and purpose"
      ],
      topics:
        grade === "11"
          ? ["close reading", "essay structure", "creative and discursive writing", "module-based analysis"]
          : ["Paper 1 reading skills", "module essay writing", "comparative analysis", "craft of writing"],
      resources: [
        ...hscExamResources,
        {
          label: "English Standard 2024 HSC exam pack",
          url: "https://educationstandards.nsw.edu.au/wps/portal/nesa/11-12/resources/hsc-exam-papers/hsc-exam-paper-detail/2024/english-standard-2024-hsc-exam-pack",
          type: "exam pack",
          note: "Past paper, marking guidelines and marker feedback."
        }
      ],
      allowsTextInput: true,
      revisionStyle: "hsc-english"
    }),
    createEntry({
      grade,
      subjectId: "maths",
      subjectName: "Maths and Numeracy",
      curriculumOverview: `${gradeLabel} Mathematics revision should focus on procedural fluency, interpretation of exam questions, and showing complete reasoning in multi-step solutions.`,
      skillsTested: [
        "algebraic fluency",
        "exam problem solving",
        "showing reasoning",
        "interpreting graphs and data"
      ],
      topics:
        grade === "11"
          ? ["algebra and functions", "financial maths", "trigonometry", "measurement"]
          : ["exam techniques", "financial maths", "trigonometry", "data and statistics"],
      resources: [
        ...hscExamResources,
        {
          label: "Mathematics Standard 2024 HSC exam pack",
          url: "https://educationstandards.nsw.edu.au/wps/portal/nesa/11-12/resources/hsc-exam-papers/hsc-exam-paper-detail/2024/mathematics-standard-2024-hsc-exam-pack",
          type: "exam pack",
          note: "A strong source for realistic senior maths revision."
        }
      ]
    }),
    createEntry({
      grade,
      subjectId: "science",
      subjectName: "Science",
      curriculumOverview: `${gradeLabel} Senior science revision should emphasise scientific explanation, data interpretation, practical investigation and the use of evidence in extended responses.`,
      skillsTested: [
        "data analysis",
        "scientific explanation",
        "practical investigation skills",
        "extended response structure"
      ],
      topics:
        grade === "11"
          ? ["working scientifically", "scientific models", "data interpretation", "investigations"]
          : ["exam-style data analysis", "extended response writing", "practical reasoning", "evidence-based explanation"],
      resources: hscExamResources
    }),
    createEntry({
      grade,
      subjectId: "history",
      subjectName: "History",
      curriculumOverview: `${gradeLabel} Senior history revision focuses on source analysis, historical argument and extended writing that addresses significance, continuity, change and perspective.`,
      skillsTested: [
        "source analysis",
        "historical argument",
        "extended responses",
        "using evidence and historians' views"
      ],
      topics:
        grade === "11"
          ? ["historical investigation", "source analysis", "change and continuity", "essay planning"]
          : ["exam source skills", "extended response writing", "significance and perspective", "historical debate"],
      resources: [
        ...hscExamResources,
        {
          label: "Modern History sample work",
          url: "https://educationstandards.nsw.edu.au/wps/portal/nesa/11-12/resources/sample-work/stage-6-years-11-12-modern-history",
          type: "student exemplars",
          note: "Useful for seeing what stronger senior history work looks like."
        }
      ]
    }),
    createEntry({
      grade,
      subjectId: "music",
      subjectName: "Music",
      curriculumOverview: `${gradeLabel} Senior music revision combines listening analysis, terminology, performance reflection and composition planning.`,
      skillsTested: [
        "aural analysis",
        "music terminology",
        "composition reflection",
        "performance evaluation"
      ],
      topics: ["listening analysis", "concepts of music", "performance reflection", "composition choices"],
      resources: hscExamResources
    }),
    createEntry({
      grade,
      subjectId: "pdhpe",
      subjectName: "PDHPE",
      curriculumOverview: `${gradeLabel} Senior PDHPE revision focuses on applying health and movement concepts in short and extended responses using case studies, data and course terminology.`,
      skillsTested: [
        "short-answer application",
        "extended response writing",
        "using case studies and examples",
        "course terminology"
      ],
      topics:
        grade === "11"
          ? ["factors affecting performance", "health priorities", "movement analysis", "improving performance"]
          : ["exam-style application", "health promotion", "sports medicine", "training and recovery"],
      resources: [
        ...hscExamResources,
        {
          label: "PDHPE 2024 HSC exam pack",
          url: "https://educationstandards.nsw.edu.au/wps/portal/nesa/resource-finder/hsc-exam-papers/2024/pdhpe-2024-hsc-exam-pack",
          type: "exam pack",
          note: "Past paper plus marking guidance for realistic practice."
        }
      ]
    }),
    createEntry({
      grade,
      subjectId: "wellbeing",
      subjectName: "Wellbeing",
      curriculumOverview: `For senior students, PaperPanda treats Wellbeing as a study-skills and organisation space rather than a formal syllabus subject.`,
      skillsTested: ["planning", "reflection", "stress management", "study organisation"],
      topics: ["exam planning", "study block design", "reflection", "balance and routine"],
      resources: []
    }),
    createEntry({
      grade,
      subjectId: "design-tech",
      subjectName: "Design & Technology",
      curriculumOverview: `${gradeLabel} Senior Design & Technology revision focuses on design process, project justification, research integration and evaluative writing.`,
      skillsTested: [
        "design process explanation",
        "justifying design decisions",
        "research integration",
        "evaluative reflection"
      ],
      topics: ["design process", "project management", "innovation", "evaluation"],
      resources: hscExamResources
    }),
    createEntry({
      grade,
      subjectId: "art",
      subjectName: "Art",
      curriculumOverview: `${gradeLabel} Senior visual arts revision focuses on artmaking reflection, frames and practice, and sustained critical responses using artist examples and visual evidence.`,
      skillsTested: [
        "critical and historical writing",
        "artist practice analysis",
        "linking concept and material practice",
        "evaluative reflection"
      ],
      topics:
        grade === "11"
          ? ["artist practice", "concept development", "critical language", "reflection"]
          : ["critical and historical studies", "frames and practice", "body of work reflection", "artist comparison"],
      resources: [
        ...hscExamResources,
        {
          label: "Visual Arts sample work",
          url: "https://educationstandards.nsw.edu.au/wps/portal/nesa/11-12/resources/sample-work/stage-6-years-11-12-visual-arts",
          type: "student exemplars",
          note: "Good for understanding strong senior visual arts responses."
        }
      ]
    })
  ];
}

export const availableRevisionGrades = [
  { value: "7", label: "Year 7" },
  { value: "8", label: "Year 8" },
  { value: "9", label: "Year 9" },
  { value: "10", label: "Year 10" },
  { value: "11", label: "Year 11" },
  { value: "12", label: "HSC / Year 12" }
];

export const revisionCatalogueByGrade = {
  "7": juniorEntriesForGrade("7"),
  "8": juniorEntriesForGrade("8"),
  "9": juniorEntriesForGrade("9"),
  "10": juniorEntriesForGrade("10"),
  "11": seniorEntriesForGrade("11"),
  "12": seniorEntriesForGrade("12")
};

export function getRevisionCatalogueForGrade(grade) {
  return revisionCatalogueByGrade[String(grade || "7")] || revisionCatalogueByGrade["7"];
}

export function getRevisionEntry(grade, subjectId) {
  return getRevisionCatalogueForGrade(grade).find((entry) => entry.subjectId === subjectId) || null;
}
