const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const PORT = 3000;

const UPLOAD_PASSWORD = 'JAM'; // Your password

app.use(session({
    secret: 'a-super-secret-key-for-sessions',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage }).array('files');

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());

const isAuthenticated = (req, res, next) => {
    if (req.session.isAuthenticated) {
        return next();
    }
    res.status(401).json({ message: 'Not authenticated' });
};

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === UPLOAD_PASSWORD) {
        req.session.isAuthenticated = true;
        res.status(200).json({ message: 'Authentication successful' });
    } else {
        res.status(401).json({ message: 'Incorrect password' });
    }
});

app.get('/auth-status', (req, res) => {
    if (req.session.isAuthenticated) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});

app.post('/upload', isAuthenticated, (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Upload failed' });
        }
        res.status(200).json({ message: 'Files uploaded successfully!' });
    });
});

app.get('/files', isAuthenticated, (req, res) => {
    fs.readdir('./uploads/', (err, files) => {
        if (err) return res.status(500).send('Unable to scan directory');
        const fileDetails = files.map(file => {
            try {
                const stats = fs.statSync(path.join('./uploads', file));
                const extension = path.extname(file).toLowerCase();
                let type = 'other';
                if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(extension)) type = 'image';
                else if (['.mp4', '.webm', '.mov'].includes(extension)) type = 'video';
                else if (['.mp3', '.wav', '.ogg'].includes(extension)) type = 'audio';
                return { name: file, size: stats.size, type: type };
            } catch (e) { return null; }
        }).filter(file => file !== null);
        res.json(fileDetails);
    });
});

app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.download(filePath);
});

app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});