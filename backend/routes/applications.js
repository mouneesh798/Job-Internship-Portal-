const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// APPLY (Candidate only) - multipart/form-data: resume, job_id, cover_note
router.post('/apply', verifyToken, requireRole('candidate'), upload.single('resume'), async (req, res) => {
    try {
        const { job_id, cover_note } = req.body;
        if (!job_id) return res.status(400).json({ message: 'job_id is required.' });
        if (!req.file) return res.status(400).json({ message: 'Resume file is required.' });

        const resumePath = `/uploads/resumes/${req.file.filename}`;

        await db.query('UPDATE users SET resume_path = ? WHERE id = ?', [resumePath, req.user.id]);

        const [result] = await db.query(
            `INSERT INTO applications (job_id, candidate_id, resume_path, cover_note)
             VALUES (?, ?, ?, ?)`,
            [job_id, req.user.id, resumePath, cover_note || null]
        );

        res.status(201).json({ message: 'Application submitted successfully.', applicationId: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'You have already applied to this job.' });
        }
        console.error(err);
        res.status(500).json({ message: 'Server error while submitting application.' });
    }
});

// CANDIDATE: TRACK MY APPLICATIONS
router.get('/my', verifyToken, requireRole('candidate'), async (req, res) => {
    try {
        const [apps] = await db.query(
            `SELECT a.*, j.title, j.type, j.location, u.company_name
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             JOIN users u ON j.employer_id = u.id
             WHERE a.candidate_id = ?
             ORDER BY a.applied_at DESC`,
            [req.user.id]
        );
        res.json(apps);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// EMPLOYER: VIEW APPLICANTS FOR A JOB
router.get('/job/:jobId', verifyToken, requireRole('employer'), async (req, res) => {
    try {
        const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [req.params.jobId]);
        if (jobs.length === 0) return res.status(404).json({ message: 'Job not found.' });
        if (jobs[0].employer_id !== req.user.id) {
            return res.status(403).json({ message: 'You do not own this job posting.' });
        }

        const [applicants] = await db.query(
            `SELECT a.id AS application_id, a.status, a.resume_path, a.cover_note, a.applied_at,
                    u.id AS candidate_id, u.name, u.email, u.phone
             FROM applications a
             JOIN users u ON a.candidate_id = u.id
             WHERE a.job_id = ?
             ORDER BY a.applied_at DESC`,
            [req.params.jobId]
        );
        res.json(applicants);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// EMPLOYER: UPDATE APPLICATION STATUS
router.put('/:applicationId/status', verifyToken, requireRole('employer'), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Applied', 'Shortlisted', 'Rejected', 'Selected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        const [rows] = await db.query(
            `SELECT a.*, j.employer_id FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.id = ?`,
            [req.params.applicationId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Application not found.' });
        if (rows[0].employer_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this application.' });
        }

        await db.query('UPDATE applications SET status = ? WHERE id = ?', [status, req.params.applicationId]);
        res.json({ message: 'Application status updated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
