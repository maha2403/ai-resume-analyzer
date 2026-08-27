const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const skillsList = [
  "JavaScript",
  "React",
  "Node.js",
  "Express",
  "MongoDB",
  "MySQL",
  "SQL",
  "Python",
  "Java",
  "C++",
  "HTML",
  "CSS",
  "Git",
  "GitHub",
  "Power BI",
  "Excel",
  "Tableau",
  "PHP",
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
  "Bootstrap",
  "Tailwind",
  "TypeScript",
  "Next.js",
  "Django",
  "Flask",
  "Firebase",
  "Docker",
  "Linux",
];

const sectionNames = [
  "summary",
  "objective",
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
  "achievement",
  "internship",
  "internships",
  "contact",
  "profile",
  "languages",
];

function findSkills(text) {
  const lowerText = text.toLowerCase();

  return [
    ...new Set(
      skillsList.filter((skill) =>
        lowerText.includes(skill.toLowerCase())
      )
    ),
  ];
}

function findSections(text) {
  const lowerText = text.toLowerCase();

  return [
    ...new Set(
      sectionNames.filter((section) =>
        lowerText.includes(section.toLowerCase())
      )
    ),
  ];
}

function calculateATS(text, skills, sections) {
  let score = 25;

  score += Math.min(skills.length * 3, 30);
  score += Math.min(sections.length * 4, 28);

  if (text.length > 1000) score += 5;
  if (text.length > 2000) score += 5;
  if (text.length > 3000) score += 5;

  return Math.min(score, 100);
}

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

function generateSuggestions(
  text,
  skills,
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
      "Add your LinkedIn profile."
    );
  }

  if (!lowerText.includes("github")) {
    suggestions.push(
      "Add your GitHub profile."
    );
  }

  if (jobDescription && jobDescription.trim()) {
    suggestions.push(
      "Customize your resume with keywords from the job description."
    );
  }

  return [...new Set(suggestions)].slice(0, 7);
}

/* HOME */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ResumeAI backend is running",
    status: "online",
  });
});

/* HEALTH */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is working correctly",
    status: "online",
  });
});

/* ANALYZE */

app.post(
  "/api/analyze",
  upload.single("resume"),
  async (req, res) => {
    let parser = null;

    try {
      console.log("=================================");
      console.log("ANALYZE REQUEST RECEIVED");

      if (!req.file) {
        console.log("NO FILE RECEIVED");

        return res.status(400).json({
          success: false,
          error: "No resume file received.",
        });
      }

      console.log("File:", req.file.originalname);
      console.log("Mimetype:", req.file.mimetype);
      console.log("Size:", req.file.size);

      /*
       * IMPORTANT:
       * Mobile browsers may sometimes send
       * application/octet-stream instead of
       * application/pdf.
       *
       * So we check both MIME type AND extension.
       */

      const fileName =
        req.file.originalname || "";

      const isPDF =
        req.file.mimetype === "application/pdf" ||
        fileName.toLowerCase().endsWith(".pdf");

      if (!isPDF) {
        return res.status(400).json({
          success: false,
          error: "Please upload a PDF resume.",
        });
      }

      const jobDescription =
        req.body?.jobDescription || "";

      console.log("Reading PDF...");

      parser = new PDFParse({
        data: req.file.buffer,
      });

      const pdfData = await parser.getText();

      const resumeText =
        pdfData?.text || "";

      console.log(
        "Extracted text length:",
        resumeText.length
      );

      if (!resumeText.trim()) {
        return res.status(400).json({
          success: false,
          error:
            "No readable text found in this PDF. Please upload a text-based PDF.",
        });
      }

      const skills =
        findSkills(resumeText);

      const sectionsFound =
        findSections(resumeText);

      const score =
        calculateATS(
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
          jobDescription
        );

      console.log("Analysis successful");
      console.log("Score:", score);
      console.log("Skills:", skills.length);
      console.log("Sections:", sectionsFound.length);
      console.log(
        "Job Match:",
        jobMatchScore
      );

      return res.json({
        success: true,

        fileName:
          req.file.originalname,

        score,

        skills,

        sectionsFound,

        jobMatchScore,

        suggestions,
      });
    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "ANALYSIS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to analyze resume.",
        details:
          error?.message ||
          "Unknown server error.",
      });
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch (error) {
          console.error(
            "Parser cleanup error:",
            error.message
          );
        }
      }
    }
  }
);

/* MULTER / SERVER ERROR */

app.use(
  (error, req, res, next) => {
    console.error(
      "SERVER ERROR:",
      error
    );

    if (
      error instanceof multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          error:
            "File is too large. Maximum size is 5 MB.",
        });
      }
    }

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Internal server error.",
    });
  }
);

/* START SERVER */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "================================="
    );
    console.log(
      "ResumeAI Backend Started"
    );
    console.log(
      "Port:",
      PORT
    );
    console.log(
      "API: /api/analyze"
    );
    console.log(
      "Health: /api/health"
    );
    console.log(
      "================================="
    );
  }
);