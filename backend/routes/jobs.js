const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// CREATE JOB (Employer only)
router.post('/', verifyToken, requireRole('employer'), async (req, res) => {
    try {
        const { title, description, type, location, stipend_salary, skills_required } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: 'title and description are required.' });
        }

        const [result] = await db.query(
            `INSERT INTO jobs (employer_id, title, description, type, location, stipend_salary, skills_required)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, title, description, type || 'job', location || null, stipend_salary || null, skills_required || null]
        );

        res.status(201).json({ message: 'Job posted successfully.', jobId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while posting job.' });
    }
});

// LIST OPEN JOBS (Public)
router.get('/', async (req, res) => {
    try {
        const { search, type, location } = req.query;
        let query = `
            SELECT j.*, u.company_name, u.name AS employer_name
            FROM jobs j
            JOIN users u ON j.employer_id = u.id
            WHERE j.status = 'open'`;
        const params = [];

        if (search) {
            query += ' AND (j.title LIKE ? OR j.skills_required LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (type) {
            query += ' AND j.type = ?';
            params.push(type);
        }
        if (location) {
            query += ' AND j.location LIKE ?';
            params.push(`%${location}%`);
        }
        query += ' ORDER BY j.created_at DESC';

        const [jobs] = await db.query(query, params);
        res.json(jobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching jobs.' });
    }
});

// GET SINGLE JOB
router.get('/:id', async (req, res) => {
    try {
        const [jobs] = await db.query(
            `SELECT j.*, u.company_name, u.name AS employer_name
             FROM jobs j JOIN users u ON j.employer_id = u.id
             WHERE j.id = ?`,
            [req.params.id]
        );
        if (jobs.length === 0) return res.status(404).json({ message: 'Job not found.' });
        res.json(jobs[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// EMPLOYER: LIST OWN JOBS
router.get('/employer/mine', verifyToken, requireRole('employer'), async (req, res) => {
    try {
        const [jobs] = await db.query(
            'SELECT * FROM jobs WHERE employer_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(jobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// UPDATE JOB
router.put('/:id', verifyToken, requireRole('employer'), async (req, res) => {
    try {
        const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
        if (jobs.length === 0) return res.status(404).json({ message: 'Job not found.' });
        if (jobs[0].employer_id !== req.user.id) {
            return res.status(403).json({ message: 'You do not own this job posting.' });
        }

        const { title, description, type, location, stipend_salary, skills_required, status } = req.body;
        await db.query(
            `UPDATE jobs SET title=?, description=?, type=?, location=?, stipend_salary=?, skills_required=?, status=?
             WHERE id = ?`,
            [
                title || jobs[0].title,
                description || jobs[0].description,
                type || jobs[0].type,
                location || jobs[0].location,
                stipend_salary || jobs[0].stipend_salary,
                skills_required || jobs[0].skills_required,
                status || jobs[0].status,
                req.params.id
            ]
        );
        res.json({ message: 'Job updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while updating job.' });
    }
});

// DELETE JOB
router.delete('/:id', verifyToken, requireRole('employer'), async (req, res) => {
    try {
        const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
        if (jobs.length === 0) return res.status(404).json({ message: 'Job not found.' });
        if (jobs[0].employer_id !== req.user.id) {
            return res.status(403).json({ message: 'You do not own this job posting.' });
        }

        await db.query('DELETE FROM jobs WHERE id = ?', [req.params.id]);
        res.json({ message: 'Job deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while deleting job.' });
    }
});

module.exports = router;
