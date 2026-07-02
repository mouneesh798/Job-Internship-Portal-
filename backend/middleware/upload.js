const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'resumes'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

function fileFilter(req, file, cb) {
    const allowedTypes = /pdf|doc|docx/;
    const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extValid) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, or DOCX files are allowed.'));
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;
