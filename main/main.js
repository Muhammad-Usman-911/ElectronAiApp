const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcrypt');

let mainWindow;
let currentUser = null;


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true
        },
        icon: path.join(__dirname, '../assets/icon.png'),
        autoHideMenuBar: true, // 👈 Hides the toolbar/menu bar
    });

    mainWindow.maximize(); // 👈 Maximizes the window

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Hash password
async function hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

// Compare password
async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// Register new user
ipcMain.handle('register-user', async (event, userData) => {
    try {
        // Check if email already exists
        const existingUser = await getUserByEmail(userData.email);
        if (existingUser) {
            return { success: false, message: 'Email already registered' };
        }

        // Hash the password
        const hashedPassword = await hashPassword(userData.password);

        // Save user to database
        const userId = await saveUserToDB({
            name: userData.name,
            email: userData.email,
            password: hashedPassword
        });

        return { success: true, userId };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: error.message };
    }
});

// Login user
ipcMain.handle('login-user', async (event, loginData) => {
    try {
        const user = await getUserByEmail(loginData.email);

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        const passwordMatch = await comparePassword(loginData.password, user.password);

        if (!passwordMatch) {
            return { success: false, message: 'Invalid password' };
        }

        // Set current user
        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email
        };

        return {
            success: true,
            user: currentUser
        };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: error.message };
    }
});

// Get current user
ipcMain.handle('get-current-user', (event) => {
    return currentUser;
});

// Navigate to home page
ipcMain.on('navigate-to-home', (event) => {
    if (!currentUser) {
        return;
    }

    mainWindow.loadFile(path.join(__dirname, '../renderer/home.html'));
});

// Logout
ipcMain.on('logout', (event) => {
    currentUser = null;

    // Clear session data
    session.defaultSession.clearStorageData()
        .then(() => {
            console.log('All cookies cleared');
            mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
        })
        .catch(error => {
            console.error('Failed to clear cookies:', error);
        });
});

// Database helper functions
async function getUserByEmail(email) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM user WHERE email = ?", [email], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
}

async function getUserById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM user WHERE id = ?", [id], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
}

async function saveUserToDB(userData) {
    return new Promise((resolve, reject) => {
        const { name, email, password } = userData;
        db.run(
            "INSERT INTO user (name, email, password) VALUES (?, ?, ?)",
            [name, email, password],
            function (err) {
                if (err) reject(err);
                resolve(this.lastID);
            }
        );
    });
}