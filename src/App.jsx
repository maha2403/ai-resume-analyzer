import { useState } from "react";
import "./App.css";

const API_URL =
  "https://jubilant-sparkle-production-4e1e.up.railway.app/api/analyze";

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [activeCard, setActiveCard] = useState(null);
  const [error, setError] = useState("");

  // ===============================
  // FILE CHANGE
  // ===============================

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    const isValidExtension = /\.(pdf|doc|docx)$/i.test(
      selectedFile.name
    );

    if (
      !allowedTypes.includes(selectedFile.type) &&
      !isValidExtension
    ) {
      setError(
        "Please upload a PDF or DOC/DOCX resume."
      );
      setFile(null);
      return;
    }

    // Backend currently supports PDF only
    if (!/\.pdf$/i.test(selectedFile.name)) {
      setError(
        "Please upload a PDF resume. DOC/DOCX analysis is not supported by the backend yet."
      );
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setAnalysis(null);
    setActiveCard(null);
    setError("");
  };

  // ===============================
  // ANALYZE RESUME
  // ===============================

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload your resume first.");
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setActiveCard(null);
    setError("");

    try {
      const formData = new FormData();

      // IMPORTANT:
      // Backend expects "resume"
      formData.append("resume", file);

      // Optional job description
      formData.append(
        "jobDescription",
        jobDescription.trim()
      );

      console.log("================================");
      console.log("ResumeAI Analysis Started");
      console.log("API:", API_URL);
      console.log("File:", file.name);
      console.log("Type:", file.type);
      console.log("Size:", file.size);
      console.log("================================");

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      console.log(
        "Response status:",
        response.status
      );

      const responseText = await response.text();

      console.log(
        "Backend response:",
        responseText
      );

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Server returned an invalid response (${response.status}).`
        );
      }

      console.log("Parsed data:", data);

      if (!response.ok || data.success === false) {
        throw new Error(
          data.error ||
            data.details ||
            data.message ||
            "Resume analysis failed."
        );
      }

      // ===============================
      // NORMALIZE RESPONSE
      // ===============================

      const result = {
        ...data,

        fileName:
          data.fileName ||
          file.name,

        score: Number(
          data.score || 0
        ),

        jobMatchScore: Number(
          data.jobMatchScore || 0
        ),

        skills: Array.isArray(data.skills)
          ? data.skills
          : [],

        sectionsFound: Array.isArray(
          data.sectionsFound
        )
          ? data.sectionsFound
          : [],

        suggestions: Array.isArray(
          data.suggestions
        )
          ? data.suggestions
          : [],
      };

      console.log(
        "Analysis successful:",
        result
      );

      setAnalysis(result);

      // Scroll to results
      setTimeout(() => {
        const results =
          document.getElementById(
            "results"
          );

        if (results) {
          results.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300);

    } catch (err) {
      console.error(
        "================================"
      );

      console.error(
        "ANALYZE ERROR:",
        err
      );

      console.error(
        "ERROR NAME:",
        err?.name
      );

      console.error(
        "ERROR MESSAGE:",
        err?.message
      );

      console.error(
        "================================"
      );

      // More useful error message
      if (
        err?.name === "TypeError"
      ) {
        setError(
          "Unable to connect to the backend. Please check your internet connection and try again."
        );
      } else {
        setError(
          err?.message ||
            "Unable to analyze resume. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // SCORE
  // ===============================

  const score =
    analysis?.score || 0;

  // ===============================
  // STATUS
  // ===============================

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

  // ===============================
  // MATCH SCORES
  // ===============================

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

  const keywordMatch =
    skillsMatch;

  // ===============================
  // UI
  // ===============================

  return (
    <div className="app">

      {/* =========================
          NAVBAR
      ========================== */}

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

        {/* =========================
            HERO
        ========================== */}

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
              ResumeAI analyze your ATS
              score, skills, resume sections
              and job compatibility in
              seconds.
            </p>

            {/* UPLOAD */}

            <div className="upload-area">

              <input
                type="file"
                id="resume-upload"
                accept=".pdf"
                onChange={
                  handleFileChange
                }
                hidden
              />

              <label
                htmlFor="resume-upload"
                className="upload-btn"
              >
                📄 Upload Your Resume
              </label>

              <span className="upload-hint">
                PDF only
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

              <label
                htmlFor="job-description"
              >
                💼 Job Description
              </label>

              <textarea
                id="job-description"
                value={
                  jobDescription
                }
                onChange={(e) =>
                  setJobDescription(
                    e.target.value
                  )
                }
                placeholder="Paste the job description here..."
                rows={6}
              />

              <small>
                Optional — add a job
                description for a more
                accurate job match.
              </small>

            </div>

            {/* ERROR */}

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* ANALYZE */}

            {file && (
              <button
                className="analyze-btn"
                onClick={
                  handleAnalyze
                }
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

          {/* =========================
              PREVIEW CARD
          ========================== */}

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

        {/* =========================
            RESULTS
        ========================== */}

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
                className={`result-card ${
                  activeCard === "ats"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveCard(
                    activeCard === "ats"
                      ? null
                      : "ats"
                  )
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
                  Overall resume
                  compatibility.
                </p>

                <span className="card-action">
                  {activeCard === "ats"
                    ? "Hide details ↑"
                    : "View details →"}
                </span>

              </button>

              {/* SKILLS */}

              <button
                className={`result-card ${
                  activeCard === "skills"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveCard(
                    activeCard === "skills"
                      ? null
                      : "skills"
                  )
                }
              >

                <span className="result-icon">
                  🛠️
                </span>

                <h3>
                  Skills Found
                </h3>

                <strong className="big-score">
                  {
                    analysis.skills
                      .length
                  }
                </strong>

                <p>
                  Skills detected in
                  your resume.
                </p>

                <span className="card-action">
                  {activeCard === "skills"
                    ? "Hide skills ↑"
                    : "View skills →"}
                </span>

              </button>

              {/* SECTIONS */}

              <button
                className={`result-card ${
                  activeCard === "sections"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveCard(
                    activeCard ===
                      "sections"
                      ? null
                      : "sections"
                  )
                }
              >

                <span className="result-icon">
                  📑
                </span>

                <h3>
                  Sections Found
                </h3>

                <strong className="big-score">
                  {
                    analysis
                      .sectionsFound
                      .length
                  }
                </strong>

                <p>
                  Important sections
                  detected.
                </p>

                <span className="card-action">
                  {activeCard ===
                  "sections"
                    ? "Hide sections ↑"
                    : "View sections →"}
                </span>

              </button>

              {/* JOB MATCH */}

              <button
                className={`result-card ${
                  activeCard === "job"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveCard(
                    activeCard === "job"
                      ? null
                      : "job"
                  )
                }
              >

                <span className="result-icon">
                  💼
                </span>

                <h3>
                  Job Match
                </h3>

                <strong className="big-score">
                  {
                    analysis.jobMatchScore
                  }%
                </strong>

                <p>
                  Resume and job
                  compatibility.
                </p>

                <span className="card-action">
                  {activeCard === "job"
                    ? "Hide details ↑"
                    : "View match →"}
                </span>

              </button>

            </div>

            {/* =====================
                DETAILS
            ====================== */}

            {activeCard && (
              <div className="detail-panel">

                {/* ATS DETAILS */}

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
                          compatibility
                          details.
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
                            width:
                              `${score}%`,
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

                {/* SKILLS DETAILS */}

                {activeCard ===
                  "skills" && (
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
                          Technical and
                          professional
                          skills found in
                          your resume.
                        </p>

                      </div>

                    </div>

                    <div className="skill-list">

                      {analysis.skills
                        .length > 0 ? (
                        analysis.skills.map(
                          (
                            skill,
                            index
                          ) => (
                            <span
                              key={index}
                            >
                              ✓ {skill}
                            </span>
                          )
                        )
                      ) : (
                        <p>
                          No specific
                          skills detected.
                        </p>
                      )}

                    </div>

                  </>
                )}

                {/* SECTION DETAILS */}

                {activeCard ===
                  "sections" && (
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
                          Important
                          sections found
                          in your resume.
                        </p>

                      </div>

                    </div>

                    <div className="section-list">

                      {analysis
                        .sectionsFound
                        .map(
                          (
                            section,
                            index
                          ) => (
                            <div
                              key={
                                index
                              }
                            >

                              <span>
                                ✓
                              </span>

                              <strong>
                                {String(
                                  section
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase() +
                                  String(
                                    section
                                  ).slice(
                                    1
                                  )}
                              </strong>

                              <small>
                                Detected
                              </small>

                            </div>
                          )
                        )}

                    </div>

                  </>
                )}

                {/* JOB DETAILS */}

                {activeCard ===
                  "job" && (
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
                          How closely your
                          resume matches
                          the job
                          description.
                        </p>

                      </div>

                    </div>

                    <div className="job-match-box">

                      <strong>
                        {
                          analysis.jobMatchScore
                        }%
                      </strong>

                      <span>
                        Job Match Score
                      </span>

                      <div className="progress-bar">

                        <span
                          style={{
                            width:
                              `${analysis.jobMatchScore}%`,
                          }}
                        />

                      </div>

                    </div>

                    {!jobDescription.trim() && (
                      <div className="info-box">
                        💡 Add a job
                        description
                        before analyzing
                        to get a
                        meaningful job
                        match score.
                      </div>
                    )}

                  </>
                )}

              </div>
            )}

            {/* =====================
                SUGGESTIONS
            ====================== */}

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
                    Personalized
                    improvements
                    for your resume.
                  </p>

                </div>

              </div>

              {analysis.suggestions
                .length > 0 ? (
                analysis.suggestions.map(
                  (
                    suggestion,
                    index
                  ) => (
                    <div
                      className="suggestion"
                      key={index}
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

                  Your resume looks
                  good!

                </div>
              )}

            </div>

          </section>
        )}

        {/* =========================
            FEATURES
        ========================== */}

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
              Your Resume
            </span>
          </h2>

          <p className="features-subtitle">
            Get a complete overview of
            your resume and discover
            exactly what you can improve.
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
                Understand how well your
                resume performs with
                Applicant Tracking
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
                Analyze your skills,
                experience, keywords and
                important resume sections.
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
                Compare your resume with a
                job description and identify
                relevant skills.
              </p>

            </div>

          </div>

        </section>

        {/* =========================
            FOOTER
        ========================== */}

        <footer className="footer">

          <div className="logo">
            Resume<span>AI</span>
          </div>

          <p>
            AI-powered resume analysis
            for smarter job applications.
          </p>

          <small>
            © 2026 ResumeAI. Built with
            React.
          </small>

        </footer>

      </main>

    </div>
  );
}

export default App;