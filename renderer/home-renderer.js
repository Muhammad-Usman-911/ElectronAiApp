const { ipcRenderer } = require('electron');

// Get DOM elements
const userNameElement = document.getElementById('user-name');
const logoutButton = document.getElementById('logout-btn');
const claudeButton = document.getElementById('claude-btn');
const gptButton = document.getElementById('gpt-btn');
const aiWebview = document.getElementById('ai-webview');

// Get current user info when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const userData = await ipcRenderer.invoke('get-current-user');
        if (userData) {
            userNameElement.textContent = userData.name;
        } else {
            // If no user data, redirect back to login
            ipcRenderer.send('logout');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        ipcRenderer.send('logout');
    }
});

// Handle logout button click
logoutButton.addEventListener('click', () => {
    ipcRenderer.send('logout');
});

// Handle Claude button click
claudeButton.addEventListener('click', () => {
    setActiveAI('claude');
    aiWebview.src = 'https://claude.ai';
});

// Handle ChatGPT button click
gptButton.addEventListener('click', () => {
    setActiveAI('gpt');
    aiWebview.src = 'https://chat.openai.com';
});

// Set active AI button
function setActiveAI(ai) {
    if (ai === 'claude') {
        claudeButton.classList.add('active');
        gptButton.classList.remove('active');
    } else {
        gptButton.classList.add('active');
        claudeButton.classList.remove('active');
    }
}

// Listen for webview load events
aiWebview.addEventListener('did-start-loading', () => {
    console.log('Webview started loading');
});

aiWebview.addEventListener('did-finish-load', () => {
    console.log('Webview finished loading');
});

aiWebview.addEventListener('did-fail-load', (event) => {
    console.error('Webview failed to load:', event);
});

// Listen for console messages from webview
aiWebview.addEventListener('console-message', (event) => {
    console.log('Webview console:', event.message);
});