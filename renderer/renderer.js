const { ipcRenderer } = require('electron');

// Tab switching functionality
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.form-section').forEach(f => f.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.form}Form`).classList.add('active');
    });
});

// Show status message
function showStatus(message, isError = false) {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status-message ${isError ? 'error' : 'success'}`;
    statusEl.style.display = 'block';
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
}

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loginData = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    };

    try {
        const result = await ipcRenderer.invoke('login-user', loginData);
        if (result.success) {
            showStatus('Login successful! Redirecting...');
            setTimeout(() => {
                ipcRenderer.send('navigate-to-home', { user: result.user });
            }, 1000);
        } else {
            showStatus(result.message || 'Login failed. Please check your credentials.', true);
        }
    } catch (error) {
        showStatus('Login failed: ' + error.message, true);
    }
});

// Handle signup form submission
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    if (password !== confirmPassword) {
        showStatus('Passwords do not match!', true);
        return;
    }
    
    const userData = {
        name: document.getElementById('signup-name').value,
        email: document.getElementById('signup-email').value,
        password: password,
        type: 'manual'
    };

    try {
        const result = await ipcRenderer.invoke('register-user', userData);
        if (result.success) {
            showStatus('Account created successfully! Please login.');
            // Reset form and switch to login tab
            e.target.reset();
            document.querySelector('[data-form="login"]').click();
        } else {
            showStatus(result.message || 'Failed to create account.', true);
        }
    } catch (error) {
        showStatus('Registration failed: ' + error.message, true);
    }
});