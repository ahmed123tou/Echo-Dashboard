/* =========================================================
   ECHO DASHBOARD
   FULL SCRIPT
   Profile Settings + Appearance + App Icon
========================================================= */

const USERS_KEY = "ECHO_DASHBOARD_USERS";
const SESSION_KEY = "ECHO_DASHBOARD_SESSION";
const SETTINGS_PREFIX = "ECHO_PROFILE_SETTINGS_";

const DEFAULT_AVATAR =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
            <rect width="256" height="256" rx="128" fill="#5865f2"/>
            <text x="50%" y="55%" text-anchor="middle"
                  font-family="Arial" font-size="110"
                  font-weight="700" fill="white">E</text>
        </svg>
    `);

const DEFAULT_ICON = "https://files.catbox.moe/2tyqj2.png";

/* =========================================================
   BASIC STORAGE
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

function getCurrentUser() {
    const username = getSession();

    if (!username) return null;

    const users = getUsers();

    return users.find(
        user => user.username.toLowerCase() === username.toLowerCase()
    ) || null;
}

function saveCurrentUser(updatedUser) {
    const users = getUsers();

    const index = users.findIndex(
        user => user.username.toLowerCase() === updatedUser.username.toLowerCase()
    );

    if (index === -1) return false;

    users[index] = updatedUser;
    saveUsers(users);

    return true;
}

/* =========================================================
   PASSWORD HASH
========================================================= */

async function hashPassword(password) {
    const encoder = new TextEncoder();

    const data = encoder.encode(password);

    const hash = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

/* =========================================================
   PROFILE SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {
    displayName: "",
    bio: "",
    avatar: DEFAULT_AVATAR,
    banner: "",
    profileTheme: "purple",

    backgroundType: "gradient",
    backgroundDirection: "135deg",
    backgroundColors: [
        "#0b0b12",
        "#151529",
        "#21154a"
    ],

    customAppIcon: "",
    useCustomAppIcon: false,

    displayFont: "Inter",
    displayColor: "#ffffff",
    displayEffect: "none"
};

function settingsKey(username) {
    return SETTINGS_PREFIX + username.toLowerCase();
}

function getSettings(username) {
    try {
        const saved = JSON.parse(
            localStorage.getItem(settingsKey(username))
        );

        return {
            ...DEFAULT_SETTINGS,
            ...(saved || {})
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings(username, settings) {
    localStorage.setItem(
        settingsKey(username),
        JSON.stringify(settings)
    );
}

/* =========================================================
   APPLY SETTINGS
========================================================= */

function applyProfileSettings() {
    const user = getCurrentUser();

    if (!user) return;

    const settings = getSettings(user.username);

    const avatars = [
        document.getElementById("dashboardAvatar"),
        document.getElementById("headerAvatar"),
        document.getElementById("profileAvatar"),
        document.getElementById("settingsAvatarPreview")
    ];

    avatars.forEach(img => {
        if (img) {
            img.src = settings.avatar || DEFAULT_AVATAR;
        }
    });

    const displayName =
        settings.displayName?.trim() ||
        user.displayName?.trim() ||
        user.username;

    const names = [
        document.getElementById("dashboardUsername"),
        document.getElementById("headerUsername"),
        document.getElementById("accountUsername"),
        document.getElementById("profileDisplayName")
    ];

    names.forEach(element => {
        if (element) element.textContent = displayName;
    });

    document.documentElement.style.setProperty(
        "--echo-display-color",
        settings.displayColor || "#ffffff"
    );

    document.documentElement.style.setProperty(
        "--echo-display-font",
        `"${settings.displayFont || "Inter"}", sans-serif`
    );

    const profileNames = document.querySelectorAll(
        ".echo-display-name"
    );

    profileNames.forEach(element => {
        element.style.color =
            settings.displayColor || "#ffffff";

        element.style.fontFamily =
            `"${settings.displayFont || "Inter"}", sans-serif`;

        element.classList.remove(
            "echo-effect-glow",
            "echo-effect-pulse",
            "echo-effect-shimmer"
        );

        if (settings.displayEffect !== "none") {
            element.classList.add(
                "echo-effect-" + settings.displayEffect
            );
        }
    });

    applyAppearance(settings);
    applyAppIcon(settings);
}

/* =========================================================
   APP APPEARANCE
========================================================= */

function applyAppearance(settings) {
    const root = document.documentElement;

    const colors = Array.isArray(settings.backgroundColors)
        ? settings.backgroundColors
        : DEFAULT_SETTINGS.backgroundColors;

    const cleanColors = colors
        .filter(Boolean)
        .slice(0, 5);

    while (cleanColors.length < 2) {
        cleanColors.push("#151529");
    }

    let background;

    if (settings.backgroundType === "solid") {
        background = cleanColors[0];
    } else {
        background =
            `linear-gradient(` +
            `${settings.backgroundDirection || "135deg"}, ` +
            `${cleanColors.join(", ")})`;
    }

    root.style.setProperty(
        "--echo-app-background",
        background
    );

    document.body.style.background = background;

    const app = document.querySelector(".app");

    if (app) {
        app.style.background = background;
    }
}

/* =========================================================
   APP ICON
========================================================= */

function applyAppIcon(settings) {
    let icon = DEFAULT_ICON;

    if (
        settings.useCustomAppIcon &&
        settings.customAppIcon
    ) {
        icon = settings.customAppIcon;
    }

    let favicon = document.querySelector(
        'link[data-echo-favicon]'
    );

    if (!favicon) {
        favicon = document.createElement("link");

        favicon.rel = "icon";
        favicon.type = "image/png";
        favicon.dataset.echoFavicon = "true";

        document.head.appendChild(favicon);
    }

    favicon.href = icon;

    let shortcut = document.querySelector(
        'link[data-echo-shortcut]'
    );

    if (!shortcut) {
        shortcut = document.createElement("link");

        shortcut.rel = "shortcut icon";
        shortcut.type = "image/png";
        shortcut.dataset.echoShortcut = "true";

        document.head.appendChild(shortcut);
    }

    shortcut.href = icon;
}

/* =========================================================
   FILE -> DATA URL
========================================================= */

function fileToDataURL(file) {
    return new Promise((resolve, reject) => {

        if (!file) {
            reject(new Error("No file selected."));
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = () => {
            reject(new Error("Could not read the file."));
        };

        reader.readAsDataURL(file);
    });
}

/* =========================================================
   SETTINGS PAGE
========================================================= */

let originalSettings = null;
let pendingSettings = null;

function openSettings() {
    const user = getCurrentUser();

    if (!user) return;

    const existing = document.getElementById(
        "echoSettingsPage"
    );

    if (existing) {
        existing.classList.remove("echo-settings-hidden");
        return;
    }

    originalSettings = structuredClone(
        getSettings(user.username)
    );

    pendingSettings = structuredClone(
        originalSettings
    );

    createSettingsPage();
    loadSettingsIntoUI();
}

/* =========================================================
   CREATE SETTINGS UI
========================================================= */

function createSettingsPage() {

    const page = document.createElement("section");

    page.id = "echoSettingsPage";

    page.innerHTML = `
        <div class="echo-settings-wrapper">

            <div class="echo-settings-header">

                <div>

                    <div class="echo-settings-eyebrow">
                        ECHO SETTINGS
                    </div>

                    <h1>Profile Settings</h1>

                    <p>
                        Customize your Echo profile and application.
                    </p>

                </div>

                <button
                    type="button"
                    id="echoSettingsClose"
                    class="echo-settings-close"
                >
                    ✕
                </button>

            </div>

            <div class="echo-settings-content">

                <section class="echo-settings-section">

                    <div class="echo-section-title">

                        <h2>Profile</h2>

                        <p>
                            Change how people see your Echo profile.
                        </p>

                    </div>

                    <div class="echo-profile-preview">

                        <div
                            id="settingsBannerPreview"
                            class="echo-banner-preview"
                        ></div>

                        <div class="echo-profile-preview-bottom">

                            <img
                                id="settingsAvatarPreview"
                                class="echo-settings-avatar"
                                src=""
                                alt=""
                            >

                            <div>

                                <h3
                                    id="settingsPreviewName"
                                    class="echo-display-name"
                                >
                                    User
                                </h3>

                                <p id="settingsPreviewBio">
                                    Your Echo profile
                                </p>

                            </div>

                        </div>

                    </div>

                    <div class="echo-setting-row">

                        <div>

                            <strong>Profile Picture</strong>

                            <span>
                                Upload a new avatar.
                            </span>

                        </div>

                        <div class="echo-setting-actions">

                            <input
                                id="echoAvatarInput"
                                type="file"
                                accept="image/*"
                                hidden
                            >

                            <button
                                type="button"
                                id="echoAvatarButton"
                                class="echo-secondary-button"
                            >
                                Change Avatar
                            </button>

                        </div>

                    </div>

                    <div class="echo-setting-row">

                        <div>

                            <strong>Profile Banner</strong>

                            <span>
                                Add an image behind your profile.
                            </span>

                        </div>

                        <div>

                            <input
                                id="echoBannerInput"
                                type="file"
                                accept="image/*"
                                hidden
                            >

                            <button
                                type="button"
                                id="echoBannerButton"
                                class="echo-secondary-button"
                            >
                                Upload Banner
                            </button>

                        </div>

                    </div>

                    <div class="echo-setting-field">

                        <label>Display Name</label>

                        <input
                            id="echoDisplayName"
                            type="text"
                            maxlength="32"
                            placeholder="Your display name"
                        >

                    </div>

                    <div class="echo-setting-field">

                        <label>Bio</label>

                        <textarea
                            id="echoBio"
                            maxlength="160"
                            placeholder="Tell people something about yourself..."
                        ></textarea>

                    </div>

                </section>

                <section class="echo-settings-section">

                    <div class="echo-section-title">

                        <h2>Profile Style</h2>

                        <p>
                            Customize the appearance of your profile.
                        </p>

                    </div>

                    <div class="echo-setting-field">

                        <label>Profile Theme</label>

                        <select id="echoProfileTheme">

                            <option value="purple">
                                Purple Glow
                            </option>

                            <option value="blue">
                                Blue Night
                            </option>

                            <option value="pink">
                                Pink Dream
                            </option>

                            <option value="green">
                                Emerald
                            </option>

                            <option value="orange">
                                Sunset
                            </option>

                        </select>

                    </div>

                    <div class="echo-setting-field">

                        <label>Display Name Font</label>

                        <select id="echoDisplayFont">

                            <option value="Inter">
                                Inter
                            </option>

                            <option value="Arial">
                                Arial
                            </option>

                            <option value="Georgia">
                                Georgia
                            </option>

                            <option value="Trebuchet MS">
                                Trebuchet
                            </option>

                            <option value="monospace">
                                Monospace
                            </option>

                        </select>

                    </div>

                    <div class="echo-setting-field">

                        <label>Display Name Color</label>

                        <input
                            id="echoDisplayColor"
                            type="color"
                        >

                    </div>

                    <div class="echo-setting-field">

                        <label>Display Name Effect</label>

                        <select id="echoDisplayEffect">

                            <option value="none">
                                None
                            </option>

                            <option value="glow">
                                Glow
                            </option>

                            <option value="pulse">
                                Pulse
                            </option>

                            <option value="shimmer">
                                Shimmer
                            </option>

                        </select>

                    </div>

                </section>

                <section class="echo-settings-section">

                    <div class="echo-section-title">

                        <h2>Appearance</h2>

                        <p>
                            Customize the background of the Echo app.
                        </p>

                    </div>

                    <div class="echo-setting-field">

                        <label>Background Type</label>

                        <select id="echoBackgroundType">

                            <option value="gradient">
                                Gradient
                            </option>

                            <option value="linear">
                                Linear Gradient
                            </option>

                            <option value="solid">
                                Solid Color
                            </option>

                        </select>

                    </div>

                    <div class="echo-setting-field">

                        <label>Gradient Direction</label>

                        <select id="echoBackgroundDirection">

                            <option value="0deg">Top</option>
                            <option value="45deg">Top Right</option>
                            <option value="90deg">Right</option>
                            <option value="135deg">Bottom Right</option>
                            <option value="180deg">Bottom</option>
                            <option value="225deg">Bottom Left</option>
                            <option value="270deg">Left</option>
                            <option value="315deg">Top Left</option>

                        </select>

                    </div>

                    <div class="echo-colors-title">
                        Background Colors
                    </div>

                    <div
                        id="echoColorControls"
                        class="echo-color-controls"
                    ></div>

                    <p class="echo-small-note">
                        You can use up to 5 colors.
                    </p>

                </section>

                <section class="echo-settings-section">

                    <div class="echo-section-title">

                        <h2>App Icon</h2>

                        <p>
                            This changes the Echo icon itself.
                            It does NOT change the application background.
                        </p>

                    </div>

                    <div class="echo-icon-setting">

                        <div class="echo-icon-preview-box">

                            <img
                                id="echoAppIconPreview"
                                src=""
                                alt="Echo Icon"
                            >

                        </div>

                        <div class="echo-icon-info">

                            <strong>Echo App Icon</strong>

                            <span>
                                Free version uses the official Echo icon.
                            </span>

                            <span>
                                Echo Plus allows a custom icon.
                            </span>

                            <input
                                id="echoAppIconInput"
                                type="file"
                                accept="image/*"
                                hidden
                            >

                            <button
                                type="button"
                                id="echoAppIconButton"
                                class="echo-secondary-button"
                            >
                                Upload Custom Icon
                            </button>

                        </div>

                    </div>

                    <label class="echo-checkbox">

                        <input
                            id="echoUseCustomIcon"
                            type="checkbox"
                        >

                        <span>
                            Use my custom app icon
                            <b>Echo Plus</b>
                        </span>

                    </label>

                </section>

            </div>

        </div>

        <div
            id="echoUnsavedBar"
            class="echo-unsaved-bar"
        >

            <div class="echo-unsaved-text">

                <strong>Careful</strong>

                <span>
                    — you have unsaved changes!
                </span>

            </div>

            <div class="echo-unsaved-actions">

                <button
                    type="button"
                    id="echoResetChanges"
                    class="echo-reset-button"
                >
                    Reset
                </button>

                <button
                    type="button"
                    id="echoSaveChanges"
                    class="echo-save-button"
                >
                    Save Changes
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(page);

    injectSettingsCSS();

    setupSettingsEvents();
}

/* =========================================================
   LOAD UI
========================================================= */

function loadSettingsIntoUI() {

    if (!pendingSettings) return;

    const settings = pendingSettings;

    document.getElementById(
        "echoDisplayName"
    ).value = settings.displayName || "";

    document.getElementById(
        "echoBio"
    ).value = settings.bio || "";

    document.getElementById(
        "echoProfileTheme"
    ).value = settings.profileTheme || "purple";

    document.getElementById(
        "echoDisplayFont"
    ).value = settings.displayFont || "Inter";

    document.getElementById(
        "echoDisplayColor"
    ).value = settings.displayColor || "#ffffff";

    document.getElementById(
        "echoDisplayEffect"
    ).value = settings.displayEffect || "none";

    document.getElementById(
        "echoBackgroundType"
    ).value = settings.backgroundType || "gradient";

    document.getElementById(
        "echoBackgroundDirection"
    ).value =
        settings.backgroundDirection || "135deg";

    document.getElementById(
        "echoUseCustomIcon"
    ).checked =
        !!settings.useCustomAppIcon;

    document.getElementById(
        "settingsAvatarPreview"
    ).src =
        settings.avatar || DEFAULT_AVATAR;

    const icon =
        settings.useCustomAppIcon &&
        settings.customAppIcon
            ? settings.customAppIcon
            : DEFAULT_ICON;

    document.getElementById(
        "echoAppIconPreview"
    ).src = icon;

    renderColorControls();

    updateSettingsPreview();

    hideUnsavedBar();
}

/* =========================================================
   COLOR CONTROLS
========================================================= */

function renderColorControls() {

    const container =
        document.getElementById(
            "echoColorControls"
        );

    if (!container) return;

    container.innerHTML = "";

    const colors =
        pendingSettings.backgroundColors || [];

    for (let i = 0; i < 5; i++) {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "echo-color-control";

        wrapper.innerHTML = `
            <span>${i + 1}</span>

            <input
                type="color"
                value="${colors[i] || "#151529"}"
                data-color-index="${i}"
            >

            <button
                type="button"
                data-remove-color="${i}"
            >
                ×
            </button>
        `;

        container.appendChild(wrapper);
    }

    container
        .querySelectorAll("[data-color-index]")
        .forEach(input => {

            input.addEventListener(
                "input",
                event => {

                    const index =
                        Number(
                            event.target.dataset.colorIndex
                        );

                    if (
                        !Array.isArray(
                            pendingSettings.backgroundColors
                        )
                    ) {
                        pendingSettings.backgroundColors = [];
                    }

                    pendingSettings.backgroundColors[index] =
                        event.target.value;

                    pendingSettings.backgroundColors =
                        pendingSettings.backgroundColors
                            .filter(Boolean)
                            .slice(0, 5);

                    markUnsaved();
                    updateSettingsPreview();
                }
            );
        });

    container
        .querySelectorAll("[data-remove-color]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.removeColor
                        );

                    pendingSettings.backgroundColors.splice(
                        index,
                        1
                    );

                    if (
                        pendingSettings.backgroundColors.length < 2
                    ) {
                        pendingSettings.backgroundColors.push(
                            "#151529"
                        );
                    }

                    renderColorControls();

                    markUnsaved();
                    updateSettingsPreview();
                }
            );
        });
}

/* =========================================================
   SETTINGS EVENTS
========================================================= */

function setupSettingsEvents() {

    const closeButton =
        document.getElementById(
            "echoSettingsClose"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                const page =
                    document.getElementById(
                        "echoSettingsPage"
                    );

                if (page) {
                    page.classList.add(
                        "echo-settings-hidden"
                    );
                }
            }
        );
    }

    const displayName =
        document.getElementById(
            "echoDisplayName"
        );

    const bio =
        document.getElementById(
            "echoBio"
        );

    const profileTheme =
        document.getElementById(
            "echoProfileTheme"
        );

    const displayFont =
        document.getElementById(
            "echoDisplayFont"
        );

    const displayColor =
        document.getElementById(
            "echoDisplayColor"
        );

    const displayEffect =
        document.getElementById(
            "echoDisplayEffect"
        );

    const backgroundType =
        document.getElementById(
            "echoBackgroundType"
        );

    const backgroundDirection =
        document.getElementById(
            "echoBackgroundDirection"
        );

    if (displayName) {

        displayName.addEventListener(
            "input",
            () => {

                pendingSettings.displayName =
                    displayName.value;

                markUnsaved();
                updateSettingsPreview();
            }
        );
    }

    if (bio) {

        bio.addEventListener(
            "input",
            () => {

                pendingSettings.bio =
                    bio.value;

                markUnsaved();
                updateSettingsPreview();
            }
        );
    }

    if (profileTheme) {

        profileTheme.addEventListener(
            "change",
            () => {

                pendingSettings.profileTheme =
                    profileTheme.value;

                markUnsaved();
                updateSettingsPreview();
            }
        );
    }

    if (displayFont) {

        displayFont.addEventListener(
            "change",
            () => {

                pendingSettings.displayFont =
                    displayFont.value;

                markUnsaved();
                updateSettingsPreview();
            }
        );
    }

    if (displayColor) {

        displayColor.addEventListener(
            "input",
            () => {

                pendingSettings.displayColor =
                    displayColor.value;

                markUnsaved();
                updateSettingsPreview();
            }
        );
    }

    if (displayEffect) {

        displayEffect.addEventListener(
            "change",
            () => {

                pendingSettings.displayEffect =
                    displayEffect.value;

                markUnsaved();
                updateSettingsPreview();
            }
        );
    }

    if (backgroundType) {

        backgroundType.addEventListener(
            "change",
            () => {

                pendingSettings.backgroundType =
                    backgroundType.value;

                markUnsaved();
                updateSettingsPreview();
            }
        );
    }

    if (backgroundDirection) {

        backgroundDirection.addEventListener(
            "change",
            () => {

                pendingSettings.backgroundDirection =
                    backgroundDirection.value;

                markUnsaved();
                updateSettingsPreview();
            }
        );
    }

    /* =====================================================
       PROFILE AVATAR UPLOAD
    ===================================================== */

    const avatarButton =
        document.getElementById(
            "echoAvatarButton"
        );

    const avatarInput =
        document.getElementById(
            "echoAvatarInput"
        );

    if (avatarButton && avatarInput) {

        avatarButton.addEventListener(
            "click",
            () => {
                avatarInput.click();
            }
        );

        avatarInput.addEventListener(
            "change",
            async event => {

                const file =
                    event.target.files?.[0];

                if (!file) return;

                if (!file.type.startsWith("image/")) {

                    alert(
                        "Please select an image file."
                    );

                    event.target.value = "";
                    return;
                }

                try {

                    const data =
                        await fileToDataURL(file);

                    pendingSettings.avatar =
                        data;

                    const preview =
                        document.getElementById(
                            "settingsAvatarPreview"
                        );

                    if (preview) {
                        preview.src = data;
                    }

                    markUnsaved();
                    updateSettingsPreview();

                } catch (error) {

                    console.error(
                        "Avatar upload error:",
                        error
                    );

                    alert(
                        "Could not load that profile picture."
                    );
                }

                event.target.value = "";
            }
        );
    }

    /* =====================================================
       BANNER UPLOAD
    ===================================================== */

    const bannerButton =
        document.getElementById(
            "echoBannerButton"
        );

    const bannerInput =
        document.getElementById(
            "echoBannerInput"
        );

    if (bannerButton && bannerInput) {

        bannerButton.addEventListener(
            "click",
            () => {
                bannerInput.click();
            }
        );

        bannerInput.addEventListener(
            "change",
            async event => {

                const file =
                    event.target.files?.[0];

                if (!file) return;

                if (!file.type.startsWith("image/")) {

                    alert(
                        "Please select an image file."
                    );

                    event.target.value = "";
                    return;
                }

                try {

                    const data =
                        await fileToDataURL(file);

                    pendingSettings.banner =
                        data;

                    updateSettingsPreview();

                    markUnsaved();

                } catch (error) {

                    console.error(
                        "Banner upload error:",
                        error
                    );

                    alert(
                        "Could not load that banner."
                    );
                }

                event.target.value = "";
            }
        );
    }

    /* =====================================================
       APP ICON UPLOAD
    ===================================================== */

    const appIconButton =
        document.getElementById(
            "echoAppIconButton"
        );

    const appIconInput =
        document.getElementById(
            "echoAppIconInput"
        );

    if (appIconButton && appIconInput) {

        appIconButton.addEventListener(
            "click",
            () => {
                appIconInput.click();
            }
        );

        appIconInput.addEventListener(
            "change",
            async event => {

                const file =
                    event.target.files?.[0];

                if (!file) return;

                if (!file.type.startsWith("image/")) {

                    alert(
                        "Please select an image file."
                    );

                    event.target.value = "";
                    return;
                }

                try {

                    const data =
                        await fileToDataURL(file);

                    pendingSettings.customAppIcon =
                        data;

                    pendingSettings.useCustomAppIcon =
                        true;

                    const checkbox =
                        document.getElementById(
                            "echoUseCustomIcon"
                        );

                    if (checkbox) {
                        checkbox.checked = true;
                    }

                    const preview =
                        document.getElementById(
                            "echoAppIconPreview"
                        );

                    if (preview) {
                        preview.src = data;
                    }

                    markUnsaved();

                } catch (error) {

                    console.error(
                        "App icon upload error:",
                        error
                    );

                    alert(
                        "Could not load that app icon."
                    );
                }

                event.target.value = "";
            }
        );
    }

    const customIconCheckbox =
        document.getElementById(
            "echoUseCustomIcon"
        );

    if (customIconCheckbox) {

        customIconCheckbox.addEventListener(
            "change",
            () => {

                pendingSettings.useCustomAppIcon =
                    customIconCheckbox.checked;

                markUnsaved();

                const icon =
                    pendingSettings.useCustomAppIcon &&
                    pendingSettings.customAppIcon
                        ? pendingSettings.customAppIcon
                        : DEFAULT_ICON;

                const preview =
                    document.getElementById(
                        "echoAppIconPreview"
                    );

                if (preview) {
                    preview.src = icon;
                }
            }
        );
    }

    const resetButton =
        document.getElementById(
            "echoResetChanges"
        );

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            () => {

                pendingSettings =
                    structuredClone(
                        originalSettings
                    );

                loadSettingsIntoUI();
            }
        );
    }

    const saveButton =
        document.getElementById(
            "echoSaveChanges"
        );

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            () => {
                saveSettingsFromUI();
            }
        );
    }
}

/* =========================================================
   SETTINGS PREVIEW
========================================================= */

function updateSettingsPreview() {

    if (!pendingSettings) return;

    const settings =
        pendingSettings;

    const user =
        getCurrentUser();

    const previewName =
        document.getElementById(
            "settingsPreviewName"
        );

    const previewBio =
        document.getElementById(
            "settingsPreviewBio"
        );

    const previewAvatar =
        document.getElementById(
            "settingsAvatarPreview"
        );

    const previewBanner =
        document.getElementById(
            "settingsBannerPreview"
        );

    if (previewName) {

        previewName.textContent =
            settings.displayName ||
            user?.username ||
            "User";

        previewName.style.color =
            settings.displayColor ||
            "#ffffff";

        previewName.style.fontFamily =
            `"${settings.displayFont || "Inter"}", sans-serif`;

        previewName.classList.remove(
            "echo-effect-glow",
            "echo-effect-pulse",
            "echo-effect-shimmer"
        );

        if (settings.displayEffect !== "none") {

            previewName.classList.add(
                "echo-effect-" +
                settings.displayEffect
            );
        }
    }

    if (previewBio) {

        previewBio.textContent =
            settings.bio ||
            "Your Echo profile";
    }

    if (previewAvatar) {

        previewAvatar.src =
            settings.avatar ||
            DEFAULT_AVATAR;
    }

    if (previewBanner) {

        if (settings.banner) {

            previewBanner.style.backgroundImage =
                `url("${settings.banner}")`;

            previewBanner.style.backgroundSize =
                "cover";

            previewBanner.style.backgroundPosition =
                "center";

        } else {

            previewBanner.style.backgroundImage =
                "";
        }
    }
}

/* =========================================================
   UNSAVED CHANGES
========================================================= */

function markUnsaved() {

    const bar =
        document.getElementById(
            "echoUnsavedBar"
        );

    if (bar) {
        bar.classList.add(
            "echo-unsaved-visible"
        );
    }
}

function hideUnsavedBar() {

    const bar =
        document.getElementById(
            "echoUnsavedBar"
        );

    if (bar) {
        bar.classList.remove(
            "echo-unsaved-visible"
        );
    }
}

/* =========================================================
   SAVE SETTINGS
========================================================= */

function saveSettingsFromUI() {

    const user =
        getCurrentUser();

    if (!user || !pendingSettings) return;

    try {

        saveSettings(
            user.username,
            pendingSettings
        );

        user.avatar =
            pendingSettings.avatar;

        user.displayName =
            pendingSettings.displayName;

        saveCurrentUser(user);

        originalSettings =
            structuredClone(
                pendingSettings
            );

        applyProfileSettings();

        hideUnsavedBar();

    } catch (error) {

        console.error(
            "Could not save settings:",
            error
        );

        alert(
            "Could not save your changes. The image may be too large for browser storage."
        );
    }
}

/* =========================================================
   SETTINGS CSS
========================================================= */

function injectSettingsCSS() {

    if (
        document.getElementById(
            "echoSettingsInjectedCSS"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "echoSettingsInjectedCSS";

    style.textContent = `

        #echoSettingsPage {
            position: fixed;
            inset: 0;
            z-index: 9999;
            overflow-y: auto;
            background: var(--echo-app-background, #0b0b12);
            color: white;
            padding: 40px;
        }

        #echoSettingsPage.echo-settings-hidden {
            display: none;
        }

        .echo-settings-wrapper {
            width: min(1000px, 100%);
            margin: 0 auto;
        }

        .echo-settings-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 30px;
        }

        .echo-settings-eyebrow {
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 2px;
            opacity: .65;
            margin-bottom: 8px;
        }

        .echo-settings-header h1 {
            margin: 0;
            font-size: 34px;
        }

        .echo-settings-header p {
            margin: 8px 0 0;
            opacity: .65;
        }

        .echo-settings-close {
            border: 0;
            width: 42px;
            height: 42px;
            border-radius: 12px;
            cursor: pointer;
            background: rgba(255,255,255,.08);
            color: white;
            font-size: 18px;
        }

        .echo-settings-content {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .echo-settings-section {
            background: rgba(255,255,255,.05);
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 18px;
            padding: 24px;
        }

        .echo-section-title {
            margin-bottom: 20px;
        }

        .echo-section-title h2 {
            margin: 0 0 6px;
        }

        .echo-section-title p {
            margin: 0;
            opacity: .6;
        }

        .echo-profile-preview {
            overflow: hidden;
            border-radius: 16px;
            background: rgba(0,0,0,.25);
            margin-bottom: 20px;
        }

        .echo-banner-preview {
            height: 150px;
            background:
                linear-gradient(
                    135deg,
                    #5865f2,
                    #21154a
                );
            background-size: cover;
            background-position: center;
        }

        .echo-profile-preview-bottom {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 18px;
        }

        .echo-settings-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid rgba(0,0,0,.4);
        }

        .echo-profile-preview-bottom h3 {
            margin: 0 0 5px;
        }

        .echo-profile-preview-bottom p {
            margin: 0;
            opacity: .6;
        }

        .echo-setting-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            padding: 16px 0;
            border-bottom: 1px solid rgba(255,255,255,.07);
        }

        .echo-setting-row:last-child {
            border-bottom: 0;
        }

        .echo-setting-row strong,
        .echo-setting-row span {
            display: block;
        }

        .echo-setting-row span {
            margin-top: 4px;
            opacity: .55;
            font-size: 14px;
        }

        .echo-setting-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 18px;
        }

        .echo-setting-field label {
            font-weight: 700;
            font-size: 14px;
        }

        .echo-setting-field input,
        .echo-setting-field textarea,
        .echo-setting-field select {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid rgba(255,255,255,.1);
            background: rgba(0,0,0,.25);
            color: white;
            border-radius: 10px;
            padding: 12px;
            outline: none;
        }

        .echo-setting-field textarea {
            min-height: 100px;
            resize: vertical;
        }

        .echo-setting-actions {
            display: flex;
            gap: 10px;
        }

        .echo-secondary-button,
        .echo-save-button,
        .echo-reset-button {
            border: 0;
            border-radius: 10px;
            padding: 11px 16px;
            cursor: pointer;
            font-weight: 700;
        }

        .echo-secondary-button {
            background: rgba(255,255,255,.09);
            color: white;
        }

        .echo-secondary-button:hover {
            background: rgba(255,255,255,.14);
        }

        .echo-colors-title {
            font-weight: 700;
            margin-top: 20px;
            margin-bottom: 12px;
        }

        .echo-color-controls {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .echo-color-control {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .echo-color-control span {
            width: 25px;
            opacity: .6;
        }

        .echo-color-control input {
            width: 55px;
            height: 38px;
            border: 0;
            background: transparent;
            cursor: pointer;
        }

        .echo-color-control button {
            border: 0;
            background: rgba(255,255,255,.08);
            color: white;
            width: 35px;
            height: 35px;
            border-radius: 8px;
            cursor: pointer;
        }

        .echo-small-note {
            opacity: .5;
            font-size: 13px;
        }

        .echo-icon-setting {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .echo-icon-preview-box {
            width: 100px;
            height: 100px;
            border-radius: 20px;
            overflow: hidden;
            background: rgba(255,255,255,.05);
        }

        .echo-icon-preview-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .echo-icon-info {
            display: flex;
            flex-direction: column;
            gap: 7px;
        }

        .echo-icon-info span {
            opacity: .55;
            font-size: 13px;
        }

        .echo-checkbox {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 20px;
            cursor: pointer;
        }

        .echo-unsaved-bar {
            position: fixed;
            left: 50%;
            bottom: 20px;
            transform: translate(-50%, 150px);
            width: min(900px, calc(100% - 40px));
            box-sizing: border-box;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            padding: 15px 18px;
            background: #18181f;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 14px;
            box-shadow: 0 20px 60px rgba(0,0,0,.45);
            transition: transform .25s ease;
        }

        .echo-unsaved-bar.echo-unsaved-visible {
            transform: translate(-50%, 0);
        }

        .echo-unsaved-text {
            display: flex;
            gap: 6px;
        }

        .echo-unsaved-text span {
            opacity: .6;
        }

        .echo-unsaved-actions {
            display: flex;
            gap: 8px;
        }

        .echo-reset-button {
            background: rgba(255,255,255,.08);
            color: white;
        }

        .echo-save-button {
            background: #5865f2;
            color: white;
        }

        .echo-effect-glow {
            text-shadow:
                0 0 5px currentColor,
                0 0 15px currentColor;
        }

        .echo-effect-pulse {
            animation: echoPulse 1.5s ease-in-out infinite;
        }

        .echo-effect-shimmer {
            background: linear-gradient(
                90deg,
                currentColor 20%,
                white 50%,
                currentColor 80%
            );
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: echoShimmer 2s linear infinite;
        }

        @keyframes echoPulse {
            0%, 100% {
                opacity: 1;
            }

            50% {
                opacity: .55;
            }
        }

        @keyframes echoShimmer {
            to {
                background-position: 200% center;
            }
        }

        @media (max-width: 700px) {

            #echoSettingsPage {
                padding: 20px;
            }

            .echo-setting-row {
                flex-direction: column;
                align-items: stretch;
            }

            .echo-icon-setting {
                flex-direction: column;
                align-items: flex-start;
            }

            .echo-unsaved-bar {
                flex-direction: column;
                align-items: stretch;
            }

        }

    `;

    document.head.appendChild(style);
}

/* =========================================================
   LOGIN / SIGNUP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const loginForm =
            document.getElementById("loginForm");

        const signupForm =
            document.getElementById("signupForm");

        /* =================================================
           FIXED SIGNUP PROFILE PICTURE UPLOAD
        ================================================= */

        const profilePicture =
            document.getElementById("profilePicture");

        const avatarPreview =
            document.getElementById("avatarPreview");

        const avatarPlaceholder =
            document.getElementById("avatarPlaceholder");

        if (profilePicture) {

            profilePicture.addEventListener(
                "change",
                async event => {

                    const file =
                        event.target.files?.[0];

                    if (!file) return;

                    if (!file.type.startsWith("image/")) {

                        alert(
                            "Please select an image file."
                        );

                        event.target.value = "";
                        return;
                    }

                    try {

                        const data =
                            await fileToDataURL(file);

                        if (avatarPreview) {

                            avatarPreview.src =
                                data;

                            avatarPreview.style.display =
                                "block";
                        }

                        if (avatarPlaceholder) {

                            avatarPlaceholder.style.display =
                                "none";
                        }

                    } catch (error) {

                        console.error(
                            "Profile picture upload error:",
                            error
                        );

                        if (avatarPreview) {

                            avatarPreview.removeAttribute(
                                "src"
                            );

                            avatarPreview.style.display =
                                "";
                        }

                        if (avatarPlaceholder) {

                            avatarPlaceholder.style.display =
                                "";
                        }

                        event.target.value = "";

                        alert(
                            "Could not load that profile picture."
                        );
                    }
                }
            );
        }

        /* =================================================
           SHOW / HIDE LOGIN
        ================================================= */

        const showLogin =
            document.getElementById(
                "showLogin"
            );

        const showSignup =
            document.getElementById(
                "showSignup"
            );

        if (showLogin) {

            showLogin.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    if (loginForm) {
                        loginForm.style.display =
                            "block";
                    }

                    if (signupForm) {
                        signupForm.style.display =
                            "none";
                    }
                }
            );
        }

        if (showSignup) {

            showSignup.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    if (loginForm) {
                        loginForm.style.display =
                            "none";
                    }

                    if (signupForm) {
                        signupForm.style.display =
                            "block";
                    }
                }
            );
        }

        /* =================================================
           PASSWORD TOGGLES
        ================================================= */

        document
            .querySelectorAll(
                ".password-toggle"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const targetId =
                            button.dataset.target;

                        const input =
                            document.getElementById(
                                targetId
                            );

                        if (!input) return;

                        if (
                            input.type ===
                            "password"
                        ) {

                            input.type =
                                "text";

                            button.textContent =
                                "🙈";

                        } else {

                            input.type =
                                "password";

                            button.textContent =
                                "👁";
                        }
                    }
                );
            });

        /* =================================================
           SIGNUP
        ================================================= */

        if (signupForm) {

            signupForm.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();

                    const usernameInput =
                        document.getElementById(
                            "signupUsername"
                        );

                    const passwordInput =
                        document.getElementById(
                            "signupPassword"
                        );

                    const avatarInput =
                        document.getElementById(
                            "profilePicture"
                        );

                    const username =
                        usernameInput?.value.trim();

                    const password =
                        passwordInput?.value;

                    if (!username || !password) {

                        alert(
                            "Please enter a username and password."
                        );

                        return;
                    }

                    const users =
                        getUsers();

                    const exists =
                        users.some(
                            user =>
                                user.username
                                    .toLowerCase() ===
                                username.toLowerCase()
                        );

                    if (exists) {

                        alert(
                            "That username is already taken."
                        );

                        return;
                    }

                    try {

                        const hash =
                            await hashPassword(
                                password
                            );

                        let avatar =
                            DEFAULT_AVATAR;

                        if (
                            avatarInput &&
                            avatarInput.files?.[0]
                        ) {

                            avatar =
                                await fileToDataURL(
                                    avatarInput.files[0]
                                );
                        }

                        const user = {

                            username,

                            displayName:
                                username,

                            passwordHash:
                                hash,

                            avatar
                        };

                        users.push(user);

                        saveUsers(users);

                        saveSettings(
                            username,
                            {
                                ...DEFAULT_SETTINGS,
                                avatar,
                                displayName:
                                    username
                            }
                        );

                        setSession(
                            username
                        );

                        showDashboard();

                    } catch (error) {

                        console.error(
                            "Signup error:",
                            error
                        );

                        alert(
                            "Could not create the account. The selected image may be too large."
                        );
                    }
                }
            );
        }

        /* =================================================
           LOGIN
        ================================================= */

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();

                    const usernameInput =
                        document.getElementById(
                            "loginUsername"
                        );

                    const passwordInput =
                        document.getElementById(
                            "loginPassword"
                        );

                    const username =
                        usernameInput?.value.trim();

                    const password =
                        passwordInput?.value;

                    if (!username || !password) {

                        alert(
                            "Please enter your username and password."
                        );

                        return;
                    }

                    const users =
                        getUsers();

                    const user =
                        users.find(
                            item =>
                                item.username
                                    .toLowerCase() ===
                                username.toLowerCase()
                        );

                    if (!user) {

                        alert(
                            "Invalid username or password."
                        );

                        return;
                    }

                    const hash =
                        await hashPassword(
                            password
                        );

                    if (
                        hash !==
                        user.passwordHash
                    ) {

                        alert(
                            "Invalid username or password."
                        );

                        return;
                    }

                    setSession(
                        user.username
                    );

                    showDashboard();
                }
            );
        }

        /* =================================================
           LOGOUT
        ================================================= */

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                () => {

                    clearSession();

                    location.reload();
                }
            );
        }

        /* =================================================
           SETTINGS BUTTON
        ================================================= */

        const settingsButton =
            document.getElementById(
                "settingsButton"
            );

        if (settingsButton) {

            settingsButton.addEventListener(
                "click",
                () => {
                    openSettings();
                }
            );
        }

        /* =================================================
           INITIAL STATE
        ================================================= */

        if (getSession()) {
            showDashboard();
        } else {
            showAuth();
        }

    }
);

/* =========================================================
   AUTH / DASHBOARD VISIBILITY
========================================================= */

function showAuth() {

    const auth =
        document.getElementById(
            "auth"
        );

    const dashboard =
        document.getElementById(
            "dashboard"
        );

    if (auth) {
        auth.style.display =
            "flex";
    }

    if (dashboard) {
        dashboard.style.display =
            "none";
    }
}

function showDashboard() {

    const auth =
        document.getElementById(
            "auth"
        );

    const dashboard =
        document.getElementById(
            "dashboard"
        );

    if (auth) {
        auth.style.display =
            "none";
    }

    if (dashboard) {
        dashboard.style.display =
            "block";
    }

    const user =
        getCurrentUser();

    if (!user) {

        clearSession();

        showAuth();

        return;
    }

    const settings =
        getSettings(
            user.username
        );

    const usernameElements = [
        document.getElementById(
            "dashboardUsername"
        ),
        document.getElementById(
            "headerUsername"
        ),
        document.getElementById(
            "accountUsername"
        )
    ];

    const displayName =
        settings.displayName ||
        user.displayName ||
        user.username;

    usernameElements.forEach(
        element => {

            if (element) {
                element.textContent =
                    displayName;
            }
        }
    );

    applyProfileSettings();
}
