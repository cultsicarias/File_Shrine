document.addEventListener('DOMContentLoaded', () => {
    // Page sections
    const loginOverlay = document.getElementById('login-overlay');
    const mainContent = document.getElementById('main-content');

    // Login elements
    const loginForm = document.getElementById('login-form');
    const loginPasswordInput = document.getElementById('login-password');
    const loginStatus = document.getElementById('login-status');

    // Main content elements
    const uploadBox = document.getElementById('upload-box');
    const fileInput = document.getElementById('file-input');
    const fileGrid = document.getElementById('file-grid');
    const statusMessage = document.getElementById('status-message');
    const progressBarContainer = document.getElementById('upload-progress');
    const progressBar = document.querySelector('.progress-bar');
    const speedIndicator = document.getElementById('speed-indicator');

    // FIX: Variable to track the current upload state
    let isUploading = false;

    // Show/Hide main content based on auth state
    const showMainContent = (show) => {
        if (show) {
            loginOverlay.classList.add('hidden');
            mainContent.classList.remove('hidden');
            fetchFiles();
        } else {
            loginOverlay.classList.remove('hidden');
            mainContent.classList.add('hidden');
        }
    };

    // Check auth status when page loads
    const checkAuthStatus = async () => {
        try {
            const response = await fetch('/auth-status');
            const data = await response.json();
            showMainContent(data.authenticated);
        } catch (error) {
            console.error('Auth check failed:', error);
            showMainContent(false);
        }
    };

    // Handle login form submission
    const handleLogin = async (event) => {
        event.preventDefault();
        const password = loginPasswordInput.value;
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const result = await response.json();
            if (response.ok) {
                showMainContent(true);
            } else {
                loginStatus.textContent = result.message || 'Login failed.';
            }
        } catch (error) {
            loginStatus.textContent = 'An error occurred. Please try again.';
        }
    };

    loginForm.addEventListener('submit', handleLogin);
    
    // Creates the file preview cards (This function is correct and does not need changes)
    const createFileCard = (file) => {
        let previewHtml;
        const fileUrl = `/uploads/${encodeURIComponent(file.name)}`;

        switch (file.type) {
            case 'image': previewHtml = `<img src="${fileUrl}" alt="${file.name}" loading="lazy">`; break;
            case 'video': previewHtml = `<video controls preload="metadata"><source src="${fileUrl}#t=0.5"></video>`; break;
            case 'audio': previewHtml = `<audio controls><source src="${fileUrl}"></audio>`; break;
            default: previewHtml = `<svg class="generic-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>`; break;
        }

        const card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = `
            <div class="file-preview">${previewHtml}</div>
            <div class="file-info"><div class="file-name" title="${file.name}">${file.name}</div><div class="file-meta">${formatFileSize(file.size)}</div></div>
            <div class="file-actions"><a href="/download/${encodeURIComponent(file.name)}" class="action-btn download-btn" download>Download</a></div>
        `;
        return card;
    };
    
    // Fetch and display files
    const fetchFiles = async () => {
        try {
            const response = await fetch('/files');
            if (!response.ok) {
                if(response.status === 401) showMainContent(false);
                return;
            };
            const files = await response.json();
            fileGrid.innerHTML = '';
            files.forEach(file => fileGrid.appendChild(createFileCard(file)));
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    // Upload function
    const uploadFiles = (files) => {
        // FIX: Prevent new uploads while one is in progress
        if (isUploading) {
            statusMessage.textContent = 'Please wait for the current upload to finish.';
            statusMessage.style.color = '#ff6ac1';
            return;
        }
        isUploading = true;
        uploadBox.classList.add('upload-busy'); // Visually disable the upload box

        const formData = new FormData();
        for (const file of files) formData.append('files', file);

        progressBarContainer.style.display = 'block';
        progressBar.style.width = '0%';
        statusMessage.textContent = 'Starting upload...';
        speedIndicator.textContent = '';
        
        const xhr = new XMLHttpRequest();
        let lastLoaded = 0, lastTime = Date.now();

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                progressBar.style.width = (event.loaded / event.total) * 100 + '%';
                const currentTime = Date.now();
                const elapsedTime = (currentTime - lastTime) / 1000;
                const loadedSinceLast = event.loaded - lastLoaded;
                if (elapsedTime > 0.5) { // Update speed only every half a second to smooth it out
                    const speed = loadedSinceLast / elapsedTime;
                    speedIndicator.textContent = formatSpeed(speed);
                    lastLoaded = event.loaded;
                    lastTime = currentTime;
                }
            }
        };

        const onUploadComplete = () => {
            // FIX: This function resets the state after an upload is done
            isUploading = false;
            uploadBox.classList.remove('upload-busy');
            // CRUCIAL: This line fixes the "upload twice" issue
            fileInput.value = null; 
        };

        xhr.onload = () => {
            const response = JSON.parse(xhr.responseText);
            statusMessage.textContent = response.message;
            if (xhr.status === 200) {
                statusMessage.style.color = '#00f5d4';
                fetchFiles();
                setTimeout(() => { progressBarContainer.style.display = 'none'; }, 2000);
            } else {
                statusMessage.style.color = '#ff6ac1';
            }
            onUploadComplete();
        };

        xhr.onerror = () => { 
            statusMessage.textContent = 'Upload failed! Network error.'; 
            statusMessage.style.color = '#ff6ac1'; 
            onUploadComplete();
        };

        xhr.open('POST', '/upload', true);
        xhr.send(formData);
    };

    // Event Listeners for upload box
    uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); if (!isUploading) uploadBox.classList.add('dragover'); });
    uploadBox.addEventListener('dragleave', () => uploadBox.classList.remove('dragover'));
    uploadBox.addEventListener('drop', (e) => { e.preventDefault(); uploadBox.classList.remove('dragover'); if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files); });
    uploadBox.addEventListener('click', () => { if (!isUploading) fileInput.click(); });
    fileInput.addEventListener('change', () => { if (fileInput.files.length > 0) uploadFiles(fileInput.files); });

    // Helper functions
    function formatSpeed(bytes) { if (bytes < 1024) return `${bytes.toFixed(0)} B/s`; const k = 1024, sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`; }
    function formatFileSize(bytes, d = 2) { if (bytes === 0) return '0 Bytes'; const k = 1024, dm = d < 0 ? 0 : d, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`; }

    checkAuthStatus();
});