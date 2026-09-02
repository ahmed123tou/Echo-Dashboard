/* =========================================================
   ECHO DASHBOARD
   PHASE 1 — LOCAL ACCOUNT SYSTEM
========================================================= */

const USERS_KEY = "ECHO_DASHBOARD_USERS";
const SESSION_KEY = "ECHO_DASHBOARD_SESSION";


/* =========================
   ELEMENTS
========================= */

const authScreen = document.getElementById("authScreen");
const dashboardScreen = document.getElementById("dashboardScreen");

const loginPanel = document.getElementById("loginPanel");
const signupPanel = document.getElementById("signupPanel");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

const loginError = document.getElementById("loginError");
const signupError = document.getElementById("signupError");

const profilePicture = document.getElementById("profilePicture");
const avatarPreview = document.getElementById("avatarPreview");
const avatarPlaceholder = document.getElementById("avatarPlaceholder");

const logoutButton = document.getElementById("logoutButton");


/* =========================
   DEFAULT AVATAR
========================================================= */

const DEFAULT_AVATAR =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
            <rect width="200" height="200" fill="#252a34"/>
            <circle cx="100" cy="78" r="38" fill="#777f8d"/>
            <path d="M35 190c7-45 37-68 65-68s58 23 65 68" fill="#777f8d"/>
        </svg>
    `);


/* =========================
   STORAGE
========================================================= */

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
    return localStorage.getItem(SESSION_KEY);
}

function setSession(username) {
    localStorage.setItem(SESSION_KEY, username);
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}


/* =========================
   PASSWORD HASH
========================================================= */

async function hashPassword(password) {

    const encoder = new TextEncoder();

    const data = encoder.encode(password);

    const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        data
    );

    const hashArray = Array.from(
        new Uint8Array(hashBuffer)
    );

    return hashArray
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}


/* =========================
   SWITCH LOGIN / SIGNUP
========================================================= */

showSignup.addEventListener("click", () => {

    loginPanel.classList.add("hidden");
    signupPanel.classList.remove("hidden");

    loginError.textContent = "";
});


showLogin.addEventListener("click", () => {

    signupPanel.classList.add("hidden");
    loginPanel.classList.remove("hidden");

    signupError.textContent = "";
});


/* =========================
   PASSWORD SHOW/HIDE
========================================================= */

document.querySelectorAll(".password-toggle").forEach(button => {

    button.addEventListener("click", () => {

        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);

        if (input.type === "password") {

            input.type = "text";
            button.textContent = "Hide";

        } else {

            input.type = "password";
            button.textContent = "Show";
        }
    });
});


/* =========================
   PROFILE PICTURE
========================================================= */

let selectedAvatar = DEFAULT_AVATAR;

profilePicture.addEventListener("change", () => {

    const file = profilePicture.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

        signupError.textContent =
            "Please select an image file.";

        profilePicture.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = event => {

        selectedAvatar = event.target.result;

        avatarPreview.src = selectedAvatar;
        avatarPreview.style.display = "block";

        avatarPlaceholder.style.display = "none";

        signupError.textContent = "";
    };

    reader.readAsDataURL(file);
});


/* =========================
   SIGNUP
========================================================= */

signupForm.addEventListener("submit", async event => {

    event.preventDefault();

    signupError.textContent = "";

    const username =
        document.getElementById("signupUsername")
            .value
            .trim();

    const password =
        document.getElementById("signupPassword")
            .value;

    const confirmPassword =
        document.getElementById("signupConfirm")
            .value;


    /* USERNAME VALIDATION */

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {

        signupError.textContent =
            "Username can only contain letters, numbers and underscores.";

        return;
    }


    if (username.length < 3) {

        signupError.textContent =
            "Username must be at least 3 characters.";

        return;
    }


    /* PASSWORD VALIDATION */

    if (password.length < 6) {

        signupError.textContent =
            "Password must be at least 6 characters.";

        return;
    }


    if (password !== confirmPassword) {

        signupError.textContent =
            "Passwords do not match.";

        return;
    }


    /* CHECK EXISTING USER */

    const users = getUsers();

    const usernameExists = users.some(
        user => user.username.toLowerCase() === username.toLowerCase()
    );

    if (usernameExists) {

        signupError.textContent =
            "That username is already taken.";

        return;
    }


    /* HASH PASSWORD */

    const passwordHash =
        await hashPassword(password);


    /* CREATE ACCOUNT */

    const newUser = {

        username: username,

        password: passwordHash,

        avatar: selectedAvatar,

        createdAt: new Date().toISOString()
    };


    users.push(newUser);

    saveUsers(users);

    setSession(username);

    signupForm.reset();

    selectedAvatar = DEFAULT_AVATAR;

    avatarPreview.src = "";
    avatarPreview.style.display = "none";

    avatarPlaceholder.style.display = "block";

    showDashboard(username);
});


/* =========================
   LOGIN
========================================================= */

loginForm.addEventListener("submit", async event => {

    event.preventDefault();

    loginError.textContent = "";

    const username =
        document.getElementById("loginUsername")
            .value
            .trim();

    const password =
        document.getElementById("loginPassword")
            .value;


    const users = getUsers();

    const user = users.find(
        account =>
            account.username.toLowerCase() === username.toLowerCase()
    );


    if (!user) {

        loginError.textContent =
            "Incorrect username or password.";

        return;
    }


    const passwordHash =
        await hashPassword(password);


    if (passwordHash !== user.password) {

        loginError.textContent =
            "Incorrect username or password.";

        return;
    }


    setSession(user.username);

    loginForm.reset();

    showDashboard(user.username);
});


/* =========================
   SHOW DASHBOARD
========================================================= */

function showDashboard(username) {

    const users = getUsers();

    const user = users.find(
        account =>
            account.username.toLowerCase() === username.toLowerCase()
    );


    if (!user) {

        clearSession();

        showAuth();

        return;
    }


    authScreen.classList.add("hidden");

    dashboardScreen.classList.remove("hidden");


    /* USERNAME */

    document.getElementById("dashboardUsername")
        .textContent = user.username;

    document.getElementById("headerUsername")
        .textContent = user.username;

    document.getElementById("accountUsername")
        .textContent = user.username;

    document.getElementById("welcomeTitle")
        .textContent = `Welcome, ${user.username}!`;


    /* AVATARS */

    const avatar =
        user.avatar || DEFAULT_AVATAR;

    document.getElementById("dashboardAvatar")
        .src = avatar;

    document.getElementById("headerAvatar")
        .src = avatar;
}


/* =========================
   SHOW AUTH
========================================================= */

function showAuth() {

    dashboardScreen.classList.add("hidden");

    authScreen.classList.remove("hidden");

    loginPanel.classList.remove("hidden");
    signupPanel.classList.add("hidden");
}


/* =========================
   LOGOUT
========================================================= */

logoutButton.addEventListener("click", () => {

    clearSession();

    showAuth();

    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";

    loginError.textContent = "";
});


/* =========================
   STARTUP
========================================================= */

function startEcho() {

    const session = getSession();

    if (!session) {

        showAuth();

        return;
    }

    showDashboard(session);
}


startEcho();
