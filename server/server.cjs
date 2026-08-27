const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
  })
);

app.use(express.json());

// ==========================================
// MULTER
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ==========================================
// SKILLS DATABASE
// ==========================================

const skillsList = [
  "JavaScript",
  "React",
  "React.js",
  "Node.js",
  "Express",
  "MongoDB",
  "MySQL",
  "SQL",
  "Python",
  "Java",
  "C++",
  "C",
  "HTML",
  "CSS",
  "Git",
  "GitHub",
  "Power BI",
  "Excel",
  "Tableau",
  "PHP",
  "Figma",
  "AWS",
  "Azure",
  "Machine Learning",
  "Data Analysis",
  "Data Analytics",
  "Communication",
  "Leadership",
  "Problem Solving",
  "Teamwork",
  "REST API",
  "API",
  "Bootstrap",
  "Tailwind",
  "TypeScript",
  "Next.js",
  "Django",
  "Flask",
  "Spring Boot",
  "Firebase",
  "Docker",
  "Linux",
  "UI/UX",
  "WordPress",
];

// ==========================================
// RESUME SECTIONS
// ==========================================

const sectionNames = [
  "summary",
  "professional summary",
  "objective",
  "career objective",
  "education",
  "experience",
  "work experience",
  "employment",
  "skills",
  "technical skills",
  "projects",
  "project",
  "certifications",
  "certificate",
  "achievements",
  "internship",
  "internships",
  "contact",
  "profile",
  "languages",
  "interests",
  "references",
];

// ==========================================
// FIND SKILLS
// ==========================================

function findSkills(text) {
  const lowerText = text.toLowerCase();

  const foundSkills = [];

  for (const skill of skillsList) {
    const skillLower = skill.toLowerCase();

    if (lowerText.includes(skillLower)) {
      foundSkills.push(skill);
    }
  }

  return [...new Set(foundSkills)];
}

// ==========================================
// FIND SECTIONS
// ==========================================

function findSections(text) {
  const lowerText = text.toLowerCase();

  const foundSections = [];

  for (const section of sectionNames) {
    if (lowerText.includes(section.toLowerCase())) {
      foundSections.push(section);
    }
  }

  return [...new Set(foundSections)];
}

// ==========================================
// ATS SCORE
// ==========================================

function calculateATS(text, skills, sections) {
  let score = 25;

  // Skills
  score += Math.min(skills.length * 3, 30);

  // Sections
  score += Math.min(sections.length * 4, 28);

  // Resume length
  if (text.length > 1000) {
    score += 5;
  }

  if (text.length > 2000) {
    score += 5;
  }

  if (text.length > 3000) {
    score += 5;
  }

  return Math.min(score, 100);
}

// ==========================================
// JOB MATCH SCORE
// ==========================================

function calculateJobMatch(resumeText, jobDescription) {
  if (!jobDescription || !jobDescription.trim()) {
    return 0;
  }

  const cleanResume = resumeText
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ");

  const cleanJob = jobDescription
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ");

  const resumeWords = new Set(
    cleanResume
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );

  const jobWords = [
    ...new Set(
      cleanJob
        .split(/\s+/)
        .filter((word) => word.length > 2)
    ),
  ];

  if (jobWords.length === 0) {
    return 0;
  }

  const matchedWords = jobWords.filter((word) =>
    resumeWords.has(word)
  );

  return Math.min(
    Math.round(
      (matchedWords.length / jobWords.length) * 100
    ),
    100
  );
}

// ==========================================
// SMART SUGGESTIONS
// ==========================================

function generateSuggestions(
  text,
  skills,
  sections,
  jobDescription
) {
  const suggestions = [];

  const lowerText = text.toLowerCase();

  if (
    !lowerText.includes("summary") &&
    !lowerText.includes("objective")
  ) {
    suggestions.push(
      "Add a professional summary at the top of your resume."
    );
  }

  if (
    !lowerText.includes("experience") &&
    !lowerText.includes("employment")
  ) {
    suggestions.push(
      "Add your work experience with measurable achievements."
    );
  }

  if (!lowerText.includes("project")) {
    suggestions.push(
      "Add relevant projects and mention the technologies used."
    );
  }

  if (skills.length < 5) {
    suggestions.push(
      "Add more relevant technical skills based on your target job."
    );
  }

  if (
    !lowerText.includes("certification") &&
    !lowerText.includes("certificate")
  ) {
    suggestions.push(
      "Add relevant certifications to strengthen your resume."
    );
  }

  if (!lowerText.includes("achievement")) {
    suggestions.push(
      "Include measurable achievements using numbers and results."
    );
  }

  if (!lowerText.includes("linkedin")) {
    suggestions.push(
      "Add your LinkedIn profile to make it easier for recruiters to find you."
    );
  }

  if (
    !lowerText.includes("github") &&
    skills.some((skill) =>
      [
        "Git",
        "GitHub",
        "JavaScript",
        "React",
        "Python",
      ].includes(skill)
    )
  ) {
    suggestions.push(
      "Add your GitHub profile to showcase your technical projects."
    );
  }

  if (
    jobDescription &&
    jobDescription.trim() &&
    !lowerText.includes("keyword")
  ) {
    suggestions.push(
      "Customize your resume with keywords from the job description."
    );
  }

  return suggestions.slice(0, 7);
}

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ResumeAI backend is running 🚀",
    status: "online",
    port: PORT,
  });
});

// ==========================================
// API HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is working correctly",
  });
});

// ==========================================
// ANALYZE RESUME
// ==========================================

app.post(
  "/api/analyze",
  upload.single("resume"),
  async (req, res) => {
    let parser = null;

    try {
      console.log("=================================");
      console.log("Resume analysis request received");
      console.log("=================================");

      // ------------------------------------------
      // FILE CHECK
      // ------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Please upload a resume.",
        });
      }

      console.log("File:", req.file.originalname);
      console.log("Type:", req.file.mimetype);
      console.log("Size:", req.file.size);

      // ------------------------------------------
      // JOB DESCRIPTION
      // ------------------------------------------

      const jobDescription =
        req.body?.jobDescription || "";

      // ------------------------------------------
      // PDF CHECK
      // ------------------------------------------

      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({
          success: false,
          error:
            "Please upload a PDF resume. PDF analysis is currently supported.",
        });
      }

      // ------------------------------------------
      // PDF TEXT EXTRACTION
      // pdf-parse v2
      // ------------------------------------------

      console.log("Reading PDF...");

      parser = new PDFParse({
        data: req.file.buffer,
      });

      const pdfData = await parser.getText();

      const resumeText = pdfData.text || "";

      console.log(
        "Extracted characters:",
        resumeText.length
      );

      // ------------------------------------------
      // EMPTY PDF CHECK
      // ------------------------------------------

      if (!resumeText.trim()) {
        return res.status(400).json({
          success: false,
          error:
            "No readable text found in this PDF. Please upload a text-based PDF.",
        });
      }

      // ------------------------------------------
      // ANALYSIS
      // ------------------------------------------

      const skills = findSkills(resumeText);

      const sectionsFound =
        findSections(resumeText);

      const score = calculateATS(
        resumeText,
        skills,
        sectionsFound
      );

      const jobMatchScore =
        calculateJobMatch(
          resumeText,
          jobDescription
        );

      const suggestions =
        generateSuggestions(
          resumeText,
          skills,
          sectionsFound,
          jobDescription
        );

      // ------------------------------------------
      // FINAL RESPONSE
      // ------------------------------------------

      const result = {
        success: true,
        fileName: req.file.originalname,
        score,
        skills,
        sectionsFound,
        jobMatchScore,
        suggestions,
      };

      console.log("=================================");
      console.log("Analysis completed successfully");
      console.log("ATS Score:", score);
      console.log("Skills:", skills.length);
      console.log(
        "Sections:",
        sectionsFound.length
      );
      console.log(
        "Job Match:",
        jobMatchScore
      );
      console.log("=================================");

      return res.json(result);
    } catch (error) {
      console.error(
        "SERVER ANALYSIS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to analyze resume. Please try another PDF.",
        details: error.message,
      });
    } finally {
      // ------------------------------------------
      // DESTROY PDF PARSER
      // ------------------------------------------

      if (parser) {
        try {
          await parser.destroy();
        } catch (destroyError) {
          console.error(
            "PDF parser cleanup error:",
            destroyError.message
          );
        }
      }
    }
  }
);

// ==========================================
// MULTER ERROR HANDLER
// ==========================================

app.use(
  (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (
        error.code === "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          error:
            "File is too large. Maximum size is 5 MB.",
        });
      }

      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    console.error(
      "Unhandled server error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Internal server error.",
    });
  }
);

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("=================================");
  console.log("🚀 ResumeAI Backend Started");
  console.log("=================================");
  console.log(
    `Server running on port ${PORT}`
  );
  console.log(
    `API: /api/analyze`
  );
  console.log("=================================");
  console.log("");
});