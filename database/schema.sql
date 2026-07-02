CREATE DATABASE IF NOT EXISTS job_portal;
USE job_portal;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('candidate', 'employer') NOT NULL,
    company_name VARCHAR(150) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    resume_path VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employer_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('job', 'internship') NOT NULL DEFAULT 'job',
    location VARCHAR(100),
    stipend_salary VARCHAR(50),
    skills_required VARCHAR(255),
    status ENUM('open', 'closed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    candidate_id INT NOT NULL,
    resume_path VARCHAR(255) NOT NULL,
    cover_note TEXT,
    status ENUM('Applied', 'Shortlisted', 'Rejected', 'Selected') DEFAULT 'Applied',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_application (job_id, candidate_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_jobs_employer ON jobs(employer_id);
CREATE INDEX idx_apps_candidate ON applications(candidate_id);
CREATE INDEX idx_apps_job ON applications(job_id);
