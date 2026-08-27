import { useState } from "react";
import "./App.css";

// =====================================================
// BACKEND API
// =====================================================

const API_URL =
  "https://jubilant-sparkle-production-4e1e.up.railway.app/api/analyze";

// =====================================================
// APP
// =====================================================

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [activeCard, setActiveCard] = useState(null);
  const [error, setError] = useState("");

  // ===================================================
  // FILE SELECT
  // ===================================================

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    setError("");
    setAnalysis(null);
    setActiveCard(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const fileName = selectedFile.name.toLowerCase();

    // Backend currently supports PDF
    if (!fileName.endsWith(".pdf")) {
      setFile(null);

      setError(
        "Please upload a PDF resume. DOC/DOCX analysis is currently not supported."
      );

      return;
    }

    // Maximum 5 MB
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);

      setError(
        "File is too large. Maximum size is 5 MB."
      );

      return;
    }

    setFile(selectedFile);

    console.log("=================================");
    console.log("FILE SELECTED");
    console.log("Name:", selectedFile.name);
    console.log("Type:", selectedFile.type);
    console.log("Size:", selectedFile.size);
    console.log("=================================");
  };

  // ===================================================
  // ANALYZE RESUME
  // ===================================================

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload your resume first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);
    setActiveCard(null);

    try {
      console.log("=================================");
      console.log("RESUME ANALYSIS STARTED");
      console.log("=================================");

      console.log("Backend:", API_URL);
      console.log("File:", file.name);
      console.log("File type:", file.type);
      console.log("File size:", file.size);

      // -------------------------------------------------
      // CREATE FORM DATA
      // -------------------------------------------------

      const formData = new FormData();

      // IMPORTANT:
      // Backend has upload.single("resume")
      formData.append("resume", file);

      formData.append(
        "jobDescription",
        jobDescription.trim()
      );

      console.log("FormData created");
      console.log("Sending request...");

      // -------------------------------------------------
      // SEND REQUEST
      // -------------------------------------------------

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      console.log(
        "Backend response status:",
        response.status
      );

      console.log(
        "Backend response OK:",
        response.ok
      );

      // -------------------------------------------------
      // READ RESPONSE
      // -------------------------------------------------

      const text = await response.text();

      console.log(
        "Backend raw response:",
        text
      );

      if (!text) {
        throw new Error(
          `Backend returned an empty response. Status: ${response.status}`
        );
      }

      // -------------------------------------------------
      // PARSE JSON
      // -------------------------------------------------

      let data;

      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.error(
          "JSON PARSE ERROR:",
          jsonError
        );

        throw new Error(
          `Backend returned an invalid response. Status: ${response.status}`
        );
      }

      console.log(
        "Backend JSON:",
        data
      );

      // -------------------------------------------------
      // BACKEND ERROR
      // -------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.details ||
            `Backend request failed (${response.status})`
        );
      }

      if (data?.success === false) {
        throw new Error(
          data?.error ||
            data?.details ||
            "Resume analysis failed."
        );
      }

      // -------------------------------------------------
      // NORMALIZE RESULT
      // -------------------------------------------------

      const result = {
        ...data,

        fileName:
          data?.fileName ||
          file.name,

        score: Number(
          data?.score || 0
        ),

        skills:
          Array.isArray(data?.skills)
            ? data.skills
            : [],

        sectionsFound:
          Array.isArray(
            data?.sectionsFound
          )
            ? data.sectionsFound
            : [],

        suggestions:
          Array.isArray(
            data?.suggestions
          )
            ? data.suggestions
            : [],

        jobMatchScore:
          Number(
            data?.jobMatchScore || 0
          ),
      };

      console.log("=================================");
      console.log("ANALYSIS SUCCESS");
      console.log(result);
      console.log("=================================");

      // -------------------------------------------------
      // SHOW RESULT
      // -------------------------------------------------

      setAnalysis(result);

      // Scroll to result
      setTimeout(() => {
        document
          .getElementById("results")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 300);

    } catch (err) {
      console.error("=================================");
      console.error("ANALYSIS ERROR");
      console.error(err);
      console.error("=================================");

      // Network error
      if (
        err instanceof TypeError &&
        err.message
          ?.toLowerCase()
          .includes("fetch")
      ) {
        setError(
          "Unable to connect to the backend. Please check the Railway backend server."
        );
      } else {
        setError(
          err?.message ||
            "Unable to analyze resume."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // SCORE
  // ===================================================

  const score = analysis?.score || 0;

  // ===================================================
  // STATUS
  // ===================================================

  const getStatus = () => {
    if (score >= 86) {
      return {
        icon: "🏆",
        title: "Excellent Resume",
        text:
          "Your resume is highly ATS-friendly.",
      };
    }

    if (score >= 71) {
      return {
        icon: "🟢",
        title: "Good Resume",
        text:
          "Your resume is strong, but there is still room for improvement.",
      };
    }

    if (score >= 41) {
      return {
        icon: "🟡",
        title: "Average Resume",
        text:
          "Add more relevant skills, keywords and achievements.",
      };
    }

    return {
      icon: "🔴",
      title: "Needs Improvement",
      text:
        "Your resume needs significant improvements.",
    };
  };

  const status = getStatus();

  // ===================================================
  // MATCH CALCULATIONS
  // ===================================================

  const skillsMatch = analysis
    ? Math.min(
        analysis.skills.length * 10,
        100
      )
    : 0;

  const experienceMatch = analysis
    ? analysis.sectionsFound.some(
        (section) => {
          const value =
            String(section).toLowerCase();

          return (
            value.includes("experience") ||
            value.includes("employment")
          );
        }
      )
      ? 100
      : 50
    : 0;

  const keywordMatch = analysis
    ? analysis.jobMatchScore > 0
      ? analysis.jobMatchScore
      : skillsMatch
    : 0;

  // ===================================================
  // TOGGLE CARD
  // ===================================================

  const toggleCard = (card) => {
    setActiveCard(
      activeCard === card
        ? null
        : card
    );
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="app">

      {/* NAVBAR */}

      <nav className="navbar">

        <div className="logo">
          Resume<span>AI</span>
        </div>

        <div className="nav-links">
          <a href="#home">
            Home
          </a>

          <a href="#features">
            Features
          </a>

          <a href="#results">
            Results
          </a>
        </div>

        <button
          className="nav-btn"
          type="button"
          onClick={() =>
            document
              .getElementById(
                "resume-upload"
              )
              ?.click()
          }
        >
          Get Started
        </button>

      </nav>

      <main>

        {/* HERO */}

        <section
          id="home"
          className="hero-section"
        >

          <div className="hero-content">

            <div className="badge">
              ✦ AI-Powered Resume Analysis
            </div>

            <h1>
              Build a Resume That
              <span>
                {" "}Gets Noticed.
              </span>
            </h1>

            <p>
              Upload your resume and let
              ResumeAI analyze your ATS score,
              skills, resume sections and job
              compatibility in seconds.
            </p>

            {/* UPLOAD */}

            <div className="upload-area">

              <input
                type="file"
                id="resume-upload"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                hidden
              />

              <label
                htmlFor="resume-upload"
                className="upload-btn"
              >
                📄 Upload Your Resume
              </label>

              <span className="upload-hint">
                PDF only • Maximum 5 MB
              </span>

            </div>

            {/* SELECTED FILE */}

            {file && (
              <div className="selected-file">

                <div className="file-icon">
                  📎
                </div>

                <div>
                  <strong>
                    {file.name}
                  </strong>

                  <small>
                    ✓ Resume selected successfully
                  </small>
                </div>

              </div>
            )}

            {/* JOB DESCRIPTION */}

            <div className="job-description-box">

              <label htmlFor="job-description">
                💼 Job Description
              </label>

              <textarea
                id="job-description"
                value={jobDescription}
                onChange={(e) =>
                  setJobDescription(
                    e.target.value
                  )
                }
                placeholder="Paste the job description here..."
                rows={6}
              />

              <small>
                Optional — add a job description
                for a more accurate job match.
              </small>

            </div>

            {/* ERROR */}

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* ANALYZE BUTTON */}

            {file && (
              <button
                className="analyze-btn"
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading
                  ? "⏳ Analyzing Resume..."
                  : "🚀 Analyze My Resume"}
              </button>
            )}

            <p className="supported">
              🔒 Your resume stays private •
              Fast analysis • ATS friendly
            </p>

          </div>

          {/* PREVIEW CARD */}

          <div className="hero-card">

            <div className="card-header">

              <div>
                <span className="card-title">
                  Resume Analysis
                </span>

                <small>
                  AI-powered report
                </small>
              </div>

              <span className="status">
                ● AI Ready
              </span>

            </div>

            <div className="score">

              <div className="score-circle">

                <strong>
                  {analysis
                    ? score
                    : "--"}
                </strong>

                <small>
                  ATS Score
                </small>

              </div>

            </div>

            <div className="analysis-item">
              <span>
                ✓ Skills Match
              </span>

              <strong>
                {analysis
                  ? `${skillsMatch}%`
                  : "--"}
              </strong>
            </div>

            <div className="analysis-item">
              <span>
                ✓ Experience
              </span>

              <strong>
                {analysis
                  ? `${experienceMatch}%`
                  : "--"}
              </strong>
            </div>

            <div className="analysis-item">
              <span>
                ✓ Keywords
              </span>

              <strong>
                {analysis
                  ? `${keywordMatch}%`
                  : "--"}
              </strong>
            </div>

          </div>

        </section>

        {/* RESULTS */}

        {analysis && (
          <section
            id="results"
            className="results-section"
          >

            <div className="results-header">

              <span className="result-badge">
                ✨ Analysis Complete
              </span>

              <h2>
                Your Resume Analysis
              </h2>

              <p>
                Results for{" "}
                <strong>
                  {analysis.fileName}
                </strong>
              </p>

            </div>

            {/* STATUS */}

            <div className="score-status">

              <div className="status-icon">
                {status.icon}
              </div>

              <div>
                <strong>
                  {status.title}
                </strong>

                <p>
                  {status.text}
                </p>
              </div>

            </div>

            {/* RESULT GRID */}

            <div className="result-grid">

              {/* ATS */}

              <button
                type="button"
                className={`result-card ${
                  activeCard === "ats"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  toggleCard("ats")
                }
              >

                <span className="result-icon">
                  🎯
                </span>

                <h3>
                  ATS Score
                </h3>

                <strong className="big-score">
                  {score}/100
                </strong>

                <p>
                  Overall resume compatibility.
                </p>

                <span className="card-action">
                  {activeCard === "ats"
                    ? "Hide details ↑"
                    : "View details →"}
                </span>

              </button>

              {/* SKILLS */}

              <button
                type="button"
                className={`result-card ${
                  activeCard === "skills"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  toggleCard("skills")
                }
              >

                <span className="result-icon">
                  🛠️
                </span>

                <h3>
                  Skills Found
                </h3>

                <strong className="big-score">
                  {analysis.skills.length}
                </strong>

                <p>
                  Skills detected in your resume.
                </p>

                <span className="card-action">
                  {activeCard === "skills"
                    ? "Hide skills ↑"
                    : "View skills →"}
                </span>

              </button>

              {/* SECTIONS */}

              <button
                type="button"
                className={`result-card ${
                  activeCard === "sections"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  toggleCard("sections")
                }
              >

                <span className="result-icon">
                  📑
                </span>

                <h3>
                  Sections Found
                </h3>

                <strong className="big-score">
                  {analysis.sectionsFound.length}
                </strong>

                <p>
                  Important sections detected.
                </p>

                <span className="card-action">
                  {activeCard === "sections"
                    ? "Hide sections ↑"
                    : "View sections →"}
                </span>

              </button>

              {/* JOB */}

              <button
                type="button"
                className={`result-card ${
                  activeCard === "job"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  toggleCard("job")
                }
              >

                <span className="result-icon">
                  💼
                </span>

                <h3>
                  Job Match
                </h3>

                <strong className="big-score">
                  {analysis.jobMatchScore}%
                </strong>

                <p>
                  Resume and job compatibility.
                </p>

                <span className="card-action">
                  {activeCard === "job"
                    ? "Hide details ↑"
                    : "View match →"}
                </span>

              </button>

            </div>

            {/* DETAIL PANEL */}

            {activeCard && (
              <div className="detail-panel">

                {/* ATS */}

                {activeCard === "ats" && (
                  <>
                    <div className="detail-header">

                      <span>
                        🎯
                      </span>

                      <div>
                        <h3>
                          ATS Score Breakdown
                        </h3>

                        <p>
                          Your resume's ATS
                          compatibility details.
                        </p>
                      </div>

                    </div>

                    <div className="progress-item">

                      <div>
                        <span>
                          Overall ATS Score
                        </span>

                        <strong>
                          {score}%
                        </strong>
                      </div>

                      <div className="progress-bar">

                        <span
                          style={{
                            width: `${score}%`,
                          }}
                        />

                      </div>

                    </div>

                    <div className="detail-grid">

                      <div>
                        <span>
                          Skills
                        </span>

                        <strong>
                          {skillsMatch}%
                        </strong>
                      </div>

                      <div>
                        <span>
                          Experience
                        </span>

                        <strong>
                          {experienceMatch}%
                        </strong>
                      </div>

                      <div>
                        <span>
                          Keywords
                        </span>

                        <strong>
                          {keywordMatch}%
                        </strong>
                      </div>

                    </div>

                  </>
                )}

                {/* SKILLS */}

                {activeCard === "skills" && (
                  <>
                    <div className="detail-header">

                      <span>
                        🛠️
                      </span>

                      <div>
                        <h3>
                          Skills Detected
                        </h3>

                        <p>
                          Technical and professional
                          skills found in your resume.
                        </p>
                      </div>

                    </div>

                    <div className="skill-list">

                      {analysis.skills.length > 0 ? (
                        analysis.skills.map(
                          (skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                            >
                              ✓ {skill}
                            </span>
                          )
                        )
                      ) : (
                        <p>
                          No specific skills detected.
                        </p>
                      )}

                    </div>
                  </>
                )}

                {/* SECTIONS */}

                {activeCard === "sections" && (
                  <>
                    <div className="detail-header">

                      <span>
                        📑
                      </span>

                      <div>
                        <h3>
                          Resume Sections
                        </h3>

                        <p>
                          Important sections found
                          in your resume.
                        </p>
                      </div>

                    </div>

                    <div className="section-list">

                      {analysis.sectionsFound.length >
                      0 ? (
                        analysis.sectionsFound.map(
                          (
                            section,
                            index
                          ) => (
                            <div
                              key={`${section}-${index}`}
                            >

                              <span>
                                ✓
                              </span>

                              <strong>
                                {String(section)
                                  .charAt(0)
                                  .toUpperCase() +
                                  String(section).slice(
                                    1
                                  )}
                              </strong>

                              <small>
                                Detected
                              </small>

                            </div>
                          )
                        )
                      ) : (
                        <p>
                          No resume sections detected.
                        </p>
                      )}

                    </div>
                  </>
                )}

                {/* JOB MATCH */}

                {activeCard === "job" && (
                  <>
                    <div className="detail-header">

                      <span>
                        💼
                      </span>

                      <div>
                        <h3>
                          Job Match Analysis
                        </h3>

                        <p>
                          How closely your resume
                          matches the job description.
                        </p>
                      </div>

                    </div>

                    <div className="job-match-box">

                      <strong>
                        {analysis.jobMatchScore}%
                      </strong>

                      <span>
                        Job Match Score
                      </span>

                      <div className="progress-bar">

                        <span
                          style={{
                            width: `${analysis.jobMatchScore}%`,
                          }}
                        />

                      </div>

                    </div>

                    {!jobDescription.trim() && (
                      <div className="info-box">
                        💡 Add a job description
                        before analyzing to get a
                        meaningful job match score.
                      </div>
                    )}

                  </>
                )}

              </div>
            )}

            {/* SUGGESTIONS */}

            <div className="suggestions">

              <div className="suggestion-title">

                <span>
                  💡
                </span>

                <div>
                  <h3>
                    Smart Suggestions
                  </h3>

                  <p>
                    Personalized improvements
                    for your resume.
                  </p>
                </div>

              </div>

              {analysis.suggestions.length > 0 ? (
                analysis.suggestions.map(
                  (
                    suggestion,
                    index
                  ) => (
                    <div
                      className="suggestion"
                      key={`${index}-${suggestion}`}
                    >

                      <span>
                        ✓
                      </span>

                      {suggestion}

                    </div>
                  )
                )
              ) : (
                <div className="suggestion">

                  <span>
                    ✓
                  </span>

                  Your resume looks good!

                </div>
              )}

            </div>

          </section>
        )}

        {/* FEATURES */}

        <section
          id="features"
          className="features"
        >

          <div className="section-label">
            FEATURES
          </div>

          <h2>
            Everything You Need to Improve
            <span>
              {" "}Your Resume
            </span>
          </h2>

          <p className="features-subtitle">
            Get a complete overview of your resume
            and discover exactly what you can improve.
          </p>

          <div className="feature-grid">

            <div className="feature-card">

              <div className="feature-icon">
                🎯
              </div>

              <h3>
                ATS Score
              </h3>

              <p>
                Understand how well your resume
                performs with Applicant Tracking
                Systems.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                🧠
              </div>

              <h3>
                Smart Analysis
              </h3>

              <p>
                Analyze your skills, experience,
                keywords and important resume
                sections.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                💼
              </div>

              <h3>
                Job Matching
              </h3>

              <p>
                Compare your resume with a job
                description and identify relevant
                skills.
              </p>

            </div>

          </div>

        </section>

        {/* FOOTER */}

        <footer className="footer">

          <div className="logo">
            Resume<span>AI</span>
          </div>

          <p>
            AI-powered resume analysis for smarter
            job applications.
          </p>

          <small>
            © 2026 ResumeAI. Built with React.
          </small>

        </footer>

      </main>

    </div>
  );
}

export default App;