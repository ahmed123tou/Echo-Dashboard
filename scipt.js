/* =========================================================
ECHO DASHBOARD
FULL SCRIPT
Profile Settings + Appearance + App Icon
\========================================================= */

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
\========================================================= */

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

    return (
        users.find(
            user =>
                user.username.toLowerCase() ===
                username.toLowerCase()
        ) || null
    );
}

function saveCurrentUser(updatedUser) {
    const users = getUsers();

    const index = users.findIndex(
        user =>
            user.username.toLowerCase() ===
            updatedUser.username.toLowerCase()
    );

    if (index === -1) return false;

    users[index] = updatedUser;

    saveUsers(users);

    return true;
}

/* =========================================================
PASSWORD HASH
\========================================================= */

async function hashPassword(password) {
    const encoder = new TextEncoder();

    const data = encoder.encode(password);

    const hash = await crypto.subtle.digest(
        "SHA-256",
        data
    );

    return Array.from(new Uint8Array(hash))
        .map(byte =>
            byte.toString(16).padStart(2, "0")
        )
        .join("");
}

/* =========================================================
PROFILE SETTINGS
\========================================================= */

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
    return (
        SETTINGS_PREFIX +
        username.toLowerCase()
    );
}

function getSettings(username) {
    try {
        const saved = JSON.parse(
            localStorage.getItem(
                settingsKey(username)
            )
        );

        return {
            ...DEFAULT_SETTINGS,
            ...(saved || {})
        };
    } catch {
        return {
            ...DEFAULT_SETTINGS,
            backgroundColors: [
                ...DEFAULT_SETTINGS.backgroundColors
            ]
        };
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
\========================================================= */

function applyProfileSettings() {
    const user = getCurrentUser();

    if (!user) return;

    const settings =
        getSettings(user.username);

    /* -------------------------
       AVATAR
    ------------------------- */

    const avatar =
        settings.avatar ||
        user.avatar ||
        DEFAULT_AVATAR;

    const avatars = [
        document.getElementById("dashboardAvatar"),
        document.getElementById("headerAvatar"),
        document.getElementById("profileAvatar"),
        document.getElementById("settingsAvatarPreview")
    ];

    avatars.forEach(img => {
        if (img) {
            img.src = avatar;
        }
    });

    /* Also update common avatar images
       already belonging to the logged-in profile. */

    document
        .querySelectorAll(
            "[data-user-avatar], .user-avatar, .profile-avatar"
        )
        .forEach(img => {
            if (
                img.tagName === "IMG" &&
                !img.closest("#echoSettingsPage")
            ) {
                img.src = avatar;
            }
        });

    /* -------------------------
       DISPLAY NAME
    ------------------------- */

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
        if (element) {
            element.textContent = displayName;
        }
    });

    /* -------------------------
       DISPLAY STYLE
    ------------------------- */

    document.documentElement.style.setProperty(
        "--echo-display-color",
        settings.displayColor || "#ffffff"
    );

    document.documentElement.style.setProperty(
        "--echo-display-font",
        `"${settings.displayFont || "Inter"}", sans-serif`
    );

    document
        .querySelectorAll(".echo-display-name")
        .forEach(element => {
            element.style.color =
                settings.displayColor || "#ffffff";

            element.style.fontFamily =
                `"${settings.displayFont || "Inter"}", sans-serif`;

            element.classList.remove(
                "echo-effect-glow",
                "echo-effect-pulse",
                "echo-effect-shimmer"
            );

            if (
                settings.displayEffect &&
                settings.displayEffect !== "none"
            ) {
                element.classList.add(
                    "echo-effect-" +
                    settings.displayEffect
                );
            }
        });

    /* -------------------------
       APP BACKGROUND
    ------------------------- */

    applyAppearance(settings);

    /* -------------------------
       APP ICON
    ------------------------- */

    applyAppIcon(settings);
}

/* =========================================================
APP APPEARANCE
\========================================================= */

function applyAppearance(settings) {
    const root =
        document.documentElement;

    let colors =
        Array.isArray(
            settings.backgroundColors
        )
            ? settings.backgroundColors
            : [
                ...DEFAULT_SETTINGS.backgroundColors
            ];

    colors = colors
        .filter(
            color =>
                typeof color === "string" &&
                /^#[0-9a-fA-F]{6}$/.test(color)
        )
        .slice(0, 5);

    while (colors.length < 2) {
        colors.push("#151529");
    }

    let background;

    if (
        settings.backgroundType ===
        "solid"
    ) {
        background = colors[0];
    } else {
        background =
            `linear-gradient(` +
            `${settings.backgroundDirection || "135deg"}, ` +
            `${colors.join(", ")})`;
    }

    root.style.setProperty(
        "--echo-app-background",
        background
    );

    document.body.style.background =
        background;

    const app =
        document.querySelector(".app");

    if (app) {
        app.style.background =
            background;
    }

    const dashboard =
        document.getElementById(
            "dashboardScreen"
        );

    if (dashboard) {
        dashboard.style.background =
            background;
    }
}

/* =========================================================
APP ICON
\========================================================= */

function applyAppIcon(settings) {
    let icon = DEFAULT_ICON;

    if (
        settings.useCustomAppIcon &&
        settings.customAppIcon
    ) {
        icon = settings.customAppIcon;
    }

    let favicon =
        document.querySelector(
            'link[data-echo-favicon]'
        );

    if (!favicon) {
        favicon =
            document.createElement("link");

        favicon.rel = "icon";
        favicon.type = "image/png";
        favicon.dataset.echoFavicon =
            "true";

        document.head.appendChild(
            favicon
        );
    }

    favicon.href = icon;

    let shortcut =
        document.querySelector(
            'link[data-echo-shortcut]'
        );

    if (!shortcut) {
        shortcut =
            document.createElement("link");

        shortcut.rel = "shortcut icon";
        shortcut.type = "image/png";
        shortcut.dataset.echoShortcut =
            "true";

        document.head.appendChild(
            shortcut
        );
    }

    shortcut.href = icon;
}

/* =========================================================
IMAGE -> DATA URL
Small/compressed so localStorage does not break
\========================================================= */

function fileToDataURL(file) {
    return new Promise(
        (resolve, reject) => {

            if (!file) {
                reject(
                    new Error(
                        "No file selected."
                    )
                );
                return;
            }

            if (
                !file.type ||
                !file.type.startsWith(
                    "image/"
                )
            ) {
                reject(
                    new Error(
                        "Please select an image file."
                    )
                );
                return;
            }

            const MAX_FILE_SIZE =
                20 * 1024 * 1024;

            if (
                file.size >
                MAX_FILE_SIZE
            ) {
                reject(
                    new Error(
                        "Image is too large."
                    )
                );
                return;
            }

            const reader =
                new FileReader();

            reader.onload = () => {
                const source =
                    reader.result;

                const image =
                    new Image();

                image.onload = () => {
                    try {

                        const MAX_DIMENSION =
                            900;

                        const largest =
                            Math.max(
                                image.naturalWidth,
                                image.naturalHeight
                            );

                        const scale =
                            Math.min(
                                1,
                                MAX_DIMENSION /
                                largest
                            );

                        const width =
                            Math.max(
                                1,
                                Math.round(
                                    image.naturalWidth *
                                    scale
                                )
                            );

                        const height =
                            Math.max(
                                1,
                                Math.round(
                                    image.naturalHeight *
                                    scale
                                )
                            );

                        const canvas =
                            document.createElement(
                                "canvas"
                            );

                        canvas.width =
                            width;

                        canvas.height =
                            height;

                        const context =
                            canvas.getContext(
                                "2d"
                            );

                        if (!context) {
                            resolve(source);
                            return;
                        }

                        context.drawImage(
                            image,
                            0,
                            0,
                            width,
                            height
                        );

                        /*
                         Always convert uploaded
                         pictures to JPEG.

                         This is important because
                         PNG files can be enormous
                         when stored in localStorage.
                        */

                        const compressed =
                            canvas.toDataURL(
                                "image/jpeg",
                                0.78
                            );

                        if (
                            compressed.length <
                            source.length
                        ) {
                            resolve(
                                compressed
                            );
                        } else {
                            /*
                             Even if the JPEG is
                             slightly larger, use it
                             when the original is huge.
                            */

                            if (
                                file.size >
                                1000000
                            ) {
                                resolve(
                                    compressed
                                );
                            } else {
                                resolve(
                                    source
                                );
                            }
                        }

                    } catch (error) {
                        reject(error);
                    }
                };

                image.onerror = () => {
                    reject(
                        new Error(
                            "Could not load the image."
                        )
                    );
                };

                image.src = source;
            };

            reader.onerror = () => {
                reject(
                    new Error(
                        "Could not read the file."
                    )
                );
            };

            reader.readAsDataURL(file);
        }
    );
}

/* =========================================================
SETTINGS PAGE
\========================================================= */

let originalSettings = null;
let pendingSettings = null;

function openSettings() {
    const user =
        getCurrentUser();

    if (!user) return;

    const existing =
        document.getElementById(
            "echoSettingsPage"
        );

    if (existing) {
        originalSettings =
            structuredClone(
                getSettings(
                    user.username
                )
            );

        pendingSettings =
            structuredClone(
                originalSettings
            );

        existing.classList.remove(
            "echo-settings-hidden"
        );

        loadSettingsIntoUI();

        return;
    }

    originalSettings =
        structuredClone(
            getSettings(
                user.username
            )
        );

    pendingSettings =
        structuredClone(
            originalSettings
        );

    createSettingsPage();

    loadSettingsIntoUI();
}

/* =========================================================
CREATE SETTINGS UI
\========================================================= */

function createSettingsPage() {

    const page =
        document.createElement(
            "section"
        );

    page.id =
        "echoSettingsPage";

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

                            <strong>
                                Profile Picture
                            </strong>

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

                            <strong>
                                Profile Banner
                            </strong>

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

                        <label>
                            Display Name
                        </label>

                        <input
                            id="echoDisplayName"
                            type="text"
                            maxlength="32"
                            placeholder="Your display name"
                        >

                    </div>

                    <div class="echo-setting-field">

                        <label>
                            Bio
                        </label>

                        <textarea
                            id="echoBio"
                            maxlength="160"
                            placeholder="Tell people something about yourself..."
                        ></textarea>

                    </div>

                </section>

                <section class="echo-settings-section">

                    <div class="echo-section-title">

                        <h2>
                            Profile Style
                        </h2>

                        <p>
                            Customize the appearance of your profile.
                        </p>

                    </div>

                    <div class="echo-setting-field">

                        <label>
                            Profile Theme
                        </label>

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

                        <label>
                            Display Name Font
                        </label>

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

                        <label>
                            Display Name Color
                        </label>

                        <input
                            id="echoDisplayColor"
                            type="color"
                        >

                    </div>

                    <div class="echo-setting-field">

                        <label>
                            Display Name Effect
                        </label>

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

                        <h2>
                            Appearance
                        </h2>

                        <p>
                            Customize the background of the Echo app.
                        </p>

                    </div>

                    <div class="echo-setting-field">

                        <label>
                            Background Type
                        </label>

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

                        <label>
                            Gradient Direction
                        </label>

                        <select id="echoBackgroundDirection">

                            <option value="0deg">
                                Top
                            </option>

                            <option value="45deg">
                                Top Right
                            </option>

                            <option value="90deg">
                                Right
                            </option>

                            <option value="135deg">
                                Bottom Right
                            </option>

                            <option value="180deg">
                                Bottom
                            </option>

                            <option value="225deg">
                                Bottom Left
                            </option>

                            <option value="270deg">
                                Left
                            </option>

                            <option value="315deg">
                                Top Left
                            </option>

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

                        <h2>
                            App Icon
                        </h2>

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

                            <strong>
                                Echo App Icon
                            </strong>

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

                <strong>
                    Careful
                </strong>

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
\========================================================= */

function loadSettingsIntoUI() {

    if (!pendingSettings) return;

    const settings =
        pendingSettings;

    const displayName =
        settings.displayName ||
        getCurrentUser()?.username ||
        "User";

    document.getElementById(
        "echoDisplayName"
    ).value =
        settings.displayName || "";

    document.getElementById(
        "echoBio"
    ).value =
        settings.bio || "";

    document.getElementById(
        "echoProfileTheme"
    ).value =
        settings.profileTheme ||
        "purple";

    document.getElementById(
        "echoDisplayFont"
    ).value =
        settings.displayFont ||
        "Inter";

    document.getElementById(
        "echoDisplayColor"
    ).value =
        settings.displayColor ||
        "#ffffff";

    document.getElementById(
        "echoDisplayEffect"
    ).value =
        settings.displayEffect ||
        "none";

    document.getElementById(
        "echoBackgroundType"
    ).value =
        settings.backgroundType ||
        "gradient";

    document.getElementById(
        "echoBackgroundDirection"
    ).value =
        settings.backgroundDirection ||
        "135deg";

    document.getElementById(
        "echoUseCustomIcon"
    ).checked =
        !!settings.useCustomAppIcon;

    document.getElementById(
        "settingsAvatarPreview"
    ).src =
        settings.avatar ||
        DEFAULT_AVATAR;

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
\========================================================= */

function renderColorControls() {

    const container =
        document.getElementById(
            "echoColorControls"
        );

    if (!container) return;

    container.innerHTML = "";

    if (
        !Array.isArray(
            pendingSettings.backgroundColors
        )
    ) {
        pendingSettings.backgroundColors =
            [
                ...DEFAULT_SETTINGS.backgroundColors
            ];
    }

    const colors =
        pendingSettings.backgroundColors;

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const wrapper =
            document.createElement(
                "div"
            );

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

        container.appendChild(
            wrapper
        );
    }

    container
        .querySelectorAll(
            "[data-color-index]"
        )
        .forEach(input => {

            input.addEventListener(
                "input",
                () => {

                    const index =
                        Number(
                            input.dataset
                                .colorIndex
                        );

                    if (
                        !Array.isArray(
                            pendingSettings
                                .backgroundColors
                        )
                    ) {
                        pendingSettings
                            .backgroundColors =
                            [];
                    }

                    pendingSettings
                        .backgroundColors[
                            index
                        ] =
                        input.value;

                    markUnsaved();

                    previewAppearance();
                }
            );
        });

    container
        .querySelectorAll(
            "[data-remove-color]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset
                                .removeColor
                        );

                    pendingSettings
                        .backgroundColors
                        .splice(
                            index,
                            1
                        );

                    while (
                        pendingSettings
                            .backgroundColors
                            .length < 2
                    ) {
                        pendingSettings
                            .backgroundColors
                            .push(
                                "#151529"
                            );
                    }

                    renderColorControls();

                    markUnsaved();

                    previewAppearance();
                }
            );
        });
}

/* =========================================================
SETTINGS EVENTS
\========================================================= */

function setupSettingsEvents() {

    const page =
        document.getElementById(
            "echoSettingsPage"
        );

    if (!page) return;

    /* CLOSE */

    document.getElementById(
        "echoSettingsClose"
    ).addEventListener(
        "click",
        () => {

            if (
                page.classList.contains(
                    "echo-settings-dirty"
                )
            ) {

                const leave =
                    confirm(
                        "You have unsaved changes. Leave without saving?"
                    );

                if (!leave) return;
            }

            closeSettings();
        }
    );

    /* =====================================================
       AVATAR
    ===================================================== */

    const avatarButton =
        document.getElementById(
            "echoAvatarButton"
        );

    const avatarInput =
        document.getElementById(
            "echoAvatarInput"
        );

    if (
        avatarButton &&
        avatarInput
    ) {

        avatarButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                avatarInput.click();
            }
        );

        avatarInput.addEventListener(
            "change",
            async event => {

                const file =
                    event.target.files?.[0];

                if (!file) return;

                try {

                    const data =
                        await fileToDataURL(
                            file
                        );

                    if (
                        !pendingSettings
                    ) {
                        return;
                    }

                    pendingSettings.avatar =
                        data;

                    const preview =
                        document.getElementById(
                            "settingsAvatarPreview"
                        );

                    if (preview) {
                        preview.src =
                            data;
                    }

                    markUnsaved();

                    updateSettingsPreview();

                } catch (error) {

                    console.error(
                        "Avatar upload error:",
                        error
                    );

                    alert(
                        "Could not load that profile picture. Please choose another image."
                    );

                } finally {

                    event.target.value = "";
                }
            }
        );
    }

    /* =====================================================
       BANNER
    ===================================================== */

    const bannerButton =
        document.getElementById(
            "echoBannerButton"
        );

    const bannerInput =
        document.getElementById(
            "echoBannerInput"
        );

    if (
        bannerButton &&
        bannerInput
    ) {

        bannerButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                bannerInput.click();
            }
        );

        bannerInput.addEventListener(
            "change",
            async event => {

                const file =
                    event.target.files?.[0];

                if (!file) return;

                try {

                    const data =
                        await fileToDataURL(
                            file
                        );

                    pendingSettings.banner =
                        data;

                    markUnsaved();

                    updateSettingsPreview();

                } catch (error) {

                    console.error(
                        "Banner upload error:",
                        error
                    );

                    alert(
                        "Could not load that banner. Please choose another image."
                    );

                } finally {

                    event.target.value = "";
                }
            }
        );
    }

    /* =====================================================
       APP ICON
    ===================================================== */

    const appIconButton =
        document.getElementById(
            "echoAppIconButton"
        );

    const appIconInput =
        document.getElementById(
            "echoAppIconInput"
        );

    if (
        appIconButton &&
        appIconInput
    ) {

        appIconButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                appIconInput.click();
            }
        );

        appIconInput.addEventListener(
            "change",
            async event => {

                const file =
                    event.target.files?.[0];

                if (!file) return;

                try {

                    const data =
                        await fileToDataURL(
                            file
                        );

                    pendingSettings
                        .customAppIcon =
                        data;

                    pendingSettings
                        .useCustomAppIcon =
                        true;

                    document.getElementById(
                        "echoUseCustomIcon"
                    ).checked = true;

                    document.getElementById(
                        "echoAppIconPreview"
                    ).src = data;

                    markUnsaved();

                } catch (error) {

                    console.error(
                        "App icon upload error:",
                        error
                    );

                    alert(
                        "Could not load that app icon."
                    );

                } finally {

                    event.target.value = "";
                }
            }
        );
    }

    /* =====================================================
       CUSTOM ICON CHECKBOX
    ===================================================== */

    document.getElementById(
        "echoUseCustomIcon"
    ).addEventListener(
        "change",
        event => {

            pendingSettings
                .useCustomAppIcon =
                event.target.checked;

            const icon =
                pendingSettings
                    .useCustomAppIcon &&
                pendingSettings
                    .customAppIcon
                    ? pendingSettings
                        .customAppIcon
                    : DEFAULT_ICON;

            document.getElementById(
                "echoAppIconPreview"
            ).src = icon;

            markUnsaved();
        }
    );

    /* =====================================================
       TEXT / SELECT SETTINGS
    ===================================================== */

    const controls = [
        "echoDisplayName",
        "echoBio",
        "echoProfileTheme",
        "echoDisplayFont",
        "echoDisplayColor",
        "echoDisplayEffect",
        "echoBackgroundType",
        "echoBackgroundDirection"
    ];

    controls.forEach(id => {

        const element =
            document.getElementById(
                id
            );

        if (!element) return;

        element.addEventListener(
            "input",
            settingsControlChanged
        );

        element.addEventListener(
            "change",
            settingsControlChanged
        );
    });

    /* =====================================================
       RESET
    ===================================================== */

    document.getElementById(
        "echoResetChanges"
    ).addEventListener(
        "click",
        () => {

            pendingSettings =
                structuredClone(
                    originalSettings
                );

            loadSettingsIntoUI();

            applyAppearance(
                pendingSettings
            );

            hideUnsavedBar();
        }
    );

    /* =====================================================
       SAVE
    ===================================================== */

    document.getElementById(
        "echoSaveChanges"
    ).addEventListener(
        "click",
        saveSettingsFromUI
    );
}

/* =========================================================
SETTINGS CONTROL CHANGED
\========================================================= */

function settingsControlChanged() {

    if (!pendingSettings) return;

    pendingSettings.displayName =
        document.getElementById(
            "echoDisplayName"
        ).value;

    pendingSettings.bio =
        document.getElementById(
            "echoBio"
        ).value;

    pendingSettings.profileTheme =
        document.getElementById(
            "echoProfileTheme"
        ).value;

    pendingSettings.displayFont =
        document.getElementById(
            "echoDisplayFont"
        ).value;

    pendingSettings.displayColor =
        document.getElementById(
            "echoDisplayColor"
        ).value;

    pendingSettings.displayEffect =
        document.getElementById(
            "echoDisplayEffect"
        ).value;

    pendingSettings.backgroundType =
        document.getElementById(
            "echoBackgroundType"
        ).value;

    pendingSettings.backgroundDirection =
        document.getElementById(
            "echoBackgroundDirection"
        ).value;

    markUnsaved();

    updateSettingsPreview();

    previewAppearance();
}

/* =========================================================
PREVIEW
\========================================================= */

function updateSettingsPreview() {

    if (!pendingSettings) return;

    const user =
        getCurrentUser();

    const name =
        pendingSettings.displayName ||
        user?.username ||
        "User";

    const avatar =
        pendingSettings.avatar ||
        DEFAULT_AVATAR;

    const avatarPreview =
        document.getElementById(
            "settingsAvatarPreview"
        );

    if (avatarPreview) {
        avatarPreview.src =
            avatar;
    }

    const nameElement =
        document.getElementById(
            "settingsPreviewName"
        );

    if (nameElement) {

        nameElement.textContent =
            name;

        nameElement.style.color =
            pendingSettings.displayColor ||
            "#ffffff";

        nameElement.style.fontFamily =
            `"${pendingSettings.displayFont || "Inter"}", sans-serif`;
    }

    const bio =
        document.getElementById(
            "settingsPreviewBio"
        );

    if (bio) {

        bio.textContent =
            pendingSettings.bio ||
            "Your Echo profile";
    }

    const banner =
        document.getElementById(
            "settingsBannerPreview"
        );

    if (!banner) return;

    if (pendingSettings.banner) {

        banner.style.background =
            "#1b1b27";

        banner.style.backgroundImage =
            `url("${pendingSettings.banner}")`;

        banner.style.backgroundSize =
            "cover";

        banner.style.backgroundPosition =
            "center";

    } else {

        banner.style.backgroundImage =
            "none";

        banner.style.background =
            getProfileTheme(
                pendingSettings.profileTheme
            );
    }
}

/* =========================================================
PROFILE THEMES
\========================================================= */

function getProfileTheme(theme) {

    const themes = {

        purple:
            "linear-gradient(135deg,#6d28d9,#312e81)",

        blue:
            "linear-gradient(135deg,#2563eb,#172554)",

        pink:
            "linear-gradient(135deg,#db2777,#581c87)",

        green:
            "linear-gradient(135deg,#059669,#064e3b)",

        orange:
            "linear-gradient(135deg,#f97316,#7c2d12)"
    };

    return (
        themes[theme] ||
        themes.purple
    );
}

function previewAppearance() {

    if (!pendingSettings) return;

    applyAppearance(
        pendingSettings
    );
}

/* =========================================================
SAVE SETTINGS
\========================================================= */

function saveSettingsFromUI() {

    const user =
        getCurrentUser();

    if (!user) return;

    if (!pendingSettings) return;

    /* Read all normal settings */

    pendingSettings.displayName =
        document.getElementById(
            "echoDisplayName"
        ).value.trim();

    pendingSettings.bio =
        document.getElementById(
            "echoBio"
        ).value.trim();

    pendingSettings.profileTheme =
        document.getElementById(
            "echoProfileTheme"
        ).value;

    pendingSettings.displayFont =
        document.getElementById(
            "echoDisplayFont"
        ).value;

    pendingSettings.displayColor =
        document.getElementById(
            "echoDisplayColor"
        ).value;

    pendingSettings.displayEffect =
        document.getElementById(
            "echoDisplayEffect"
        ).value;

    pendingSettings.backgroundType =
        document.getElementById(
            "echoBackgroundType"
        ).value;

    pendingSettings.backgroundDirection =
        document.getElementById(
            "echoBackgroundDirection"
        ).value;

    pendingSettings.useCustomAppIcon =
        document.getElementById(
            "echoUseCustomIcon"
        ).checked;

    /* Make absolutely sure colors exist */

    if (
        !Array.isArray(
            pendingSettings.backgroundColors
        )
    ) {
        pendingSettings.backgroundColors =
            [
                ...DEFAULT_SETTINGS.backgroundColors
            ];
    }

    pendingSettings.backgroundColors =
        pendingSettings
            .backgroundColors
            .filter(Boolean)
            .slice(0, 5);

    while (
        pendingSettings
            .backgroundColors
            .length < 2
    ) {
        pendingSettings
            .backgroundColors
            .push("#151529");
    }

    /* =====================================================
       SAVE PROFILE SETTINGS
    ===================================================== */

    try {

        saveSettings(
            user.username,
            pendingSettings
        );

    } catch (error) {

        console.error(
            "Could not save Echo settings:",
            error
        );

        alert(
            "Could not save the changes. Your uploaded image may be too large."
        );

        return;
    }

    /* =====================================================
       SAVE PROFILE DATA
    ===================================================== */

    const savedAvatar =
        pendingSettings.avatar ||
        DEFAULT_AVATAR;

    user.avatar =
        savedAvatar;

    user.displayName =
        pendingSettings.displayName ||
        user.username;

    if (
        !saveCurrentUser(user)
    ) {

        alert(
            "Could not save your profile."
        );

        return;
    }

    /* =====================================================
       UPDATE CURRENT UI
    ===================================================== */

    originalSettings =
        structuredClone(
            pendingSettings
        );

    applyProfileSettings();

    updateSettingsPreview();

    hideUnsavedBar();

    showSavedAnimation();
}

/* =========================================================
UNSAVED BAR
\========================================================= */

function markUnsaved() {

    const bar =
        document.getElementById(
            "echoUnsavedBar"
        );

    if (!bar) return;

    bar.classList.add(
        "echo-unsaved-visible"
    );

    const page =
        document.getElementById(
            "echoSettingsPage"
        );

    if (page) {

        page.classList.add(
            "echo-settings-dirty"
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

    const page =
        document.getElementById(
            "echoSettingsPage"
        );

    if (page) {

        page.classList.remove(
            "echo-settings-dirty"
        );
    }
}

/* =========================================================
SAVE ANIMATION
\========================================================= */

function showSavedAnimation() {

    const button =
        document.getElementById(
            "echoSaveChanges"
        );

    if (!button) return;

    const oldText =
        button.textContent;

    button.textContent =
        "✓ Saved!";

    button.classList.add(
        "echo-save-success"
    );

    setTimeout(
        () => {

            button.textContent =
                oldText;

            button.classList.remove(
                "echo-save-success"
            );

        },
        1400
    );
}

/* =========================================================
CLOSE SETTINGS
\========================================================= */

function closeSettings() {

    const page =
        document.getElementById(
            "echoSettingsPage"
        );

    if (!page) return;

    page.classList.add(
        "echo-settings-closing"
    );

    setTimeout(
        () => {

            page.classList.add(
                "echo-settings-hidden"
            );

            page.classList.remove(
                "echo-settings-closing"
            );

        },
        180
    );
}

/* =========================================================
SETTINGS CSS
\========================================================= */

function injectSettingsCSS() {

    if (
        document.getElementById(
            "echo-settings-styles"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "echo-settings-styles";

    style.textContent = `

        #echoSettingsPage {
            position: fixed;
            inset: 0;
            z-index: 9999;
            overflow-y: auto;
            background: #0b0b12;
            color: #fff;
            animation: echoSettingsOpen .22s ease;
        }

        .echo-settings-hidden {
            display: none !important;
        }

        .echo-settings-closing {
            animation: echoSettingsClose .18s ease forwards;
        }

        @keyframes echoSettingsOpen {

            from {
                opacity: 0;
                transform: translateY(12px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes echoSettingsClose {

            from {
                opacity: 1;
                transform: translateY(0);
            }

            to {
                opacity: 0;
                transform: translateY(12px);
            }
        }

        .echo-settings-wrapper {
            width: min(1000px, calc(100% - 40px));
            margin: 0 auto;
            padding: 55px 0 150px;
        }

        .echo-settings-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 35px;
        }

        .echo-settings-eyebrow {
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 2px;
            opacity: .55;
            margin-bottom: 8px;
        }

        .echo-settings-header h1 {
            margin: 0;
            font-size: 32px;
        }

        .echo-settings-header p {
            color: #9292a4;
            margin-top: 8px;
        }

        .echo-settings-close {
            border: 0;
            background: #20202c;
            color: white;
            width: 42px;
            height: 42px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 17px;
            transition: .2s;
        }

        .echo-settings-close:hover {
            background: #303041;
            transform: rotate(4deg);
        }

        .echo-settings-section {
            background: #14141d;
            border: 1px solid #252532;
            border-radius: 18px;
            padding: 26px;
            margin-bottom: 20px;
        }

        .echo-section-title {
            margin-bottom: 22px;
        }

        .echo-section-title h2 {
            margin: 0;
            font-size: 20px;
        }

        .echo-section-title p {
            color: #858596;
            margin: 6px 0 0;
        }

        .echo-profile-preview {
            overflow: hidden;
            border-radius: 16px;
            background: #1b1b27;
            border: 1px solid #292938;
            margin-bottom: 24px;
        }

        .echo-banner-preview {
            height: 150px;
            background-size: cover;
            background-position: center;
        }

        .echo-profile-preview-bottom {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px;
        }

        .echo-settings-avatar {
            width: 76px;
            height: 76px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid #14141d;
            margin-top: -45px;
            background: #22222e;
        }

        .echo-profile-preview-bottom h3 {
            margin: 0;
            font-size: 20px;
        }

        .echo-profile-preview-bottom p {
            margin: 4px 0 0;
            color: #898999;
        }

        .echo-setting-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            padding: 18px 0;
            border-bottom: 1px solid #252532;
        }

        .echo-setting-row:last-child {
            border-bottom: 0;
        }

        .echo-setting-row strong,
        .echo-setting-row span {
            display: block;
        }

        .echo-setting-row span {
            color: #858596;
            font-size: 13px;
            margin-top: 5px;
        }

        .echo-setting-field {
            margin-top: 20px;
        }

        .echo-setting-field label {
            display: block;
            font-weight: 700;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .echo-setting-field input[type="text"],
        .echo-setting-field textarea,
        .echo-setting-field select {
            width: 100%;
            box-sizing: border-box;
            background: #0e0e16;
            border: 1px solid #2b2b3a;
            border-radius: 10px;
            color: white;
            padding: 12px 13px;
            outline: none;
        }

        .echo-setting-field textarea {
            min-height: 90px;
            resize: vertical;
        }

        .echo-setting-field input:focus,
        .echo-setting-field textarea:focus,
        .echo-setting-field select:focus {
            border-color: #5865f2;
        }

        .echo-secondary-button {
            border: 0;
            background: #252532;
            color: white;
            padding: 10px 15px;
            border-radius: 9px;
            cursor: pointer;
            font-weight: 700;
            transition: .18s;
        }

        .echo-secondary-button:hover {
            background: #353547;
            transform: translateY(-1px);
        }

        .echo-colors-title {
            font-weight: 700;
            margin-top: 24px;
            margin-bottom: 12px;
        }

        .echo-color-controls {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
        }

        .echo-color-control {
            background: #0e0e16;
            border: 1px solid #292938;
            padding: 10px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .echo-color-control span {
            color: #858596;
            font-size: 12px;
        }

        .echo-color-control input {
            width: 35px;
            height: 35px;
            padding: 0;
            border: 0;
            background: none;
            cursor: pointer;
        }

        .echo-color-control button {
            margin-left: auto;
            background: transparent;
            border: 0;
            color: #777787;
            cursor: pointer;
            font-size: 18px;
        }

        .echo-small-note {
            color: #737383;
            font-size: 12px;
            margin-top: 10px;
        }

        .echo-icon-setting {
            display: flex;
            gap: 20px;
            align-items: center;
            background: #0e0e16;
            border: 1px solid #292938;
            padding: 18px;
            border-radius: 14px;
        }

        .echo-icon-preview-box {
            width: 90px;
            height: 90px;
            border-radius: 22px;
            overflow: hidden;
            flex-shrink: 0;
            background: #20202c;
        }

        .echo-icon-preview-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .echo-icon-info strong,
        .echo-icon-info span {
            display: block;
        }

        .echo-icon-info span {
            color: #858596;
            font-size: 13px;
            margin: 5px 0;
        }

        .echo-icon-info button {
            margin-top: 10px;
        }

        .echo-checkbox {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-top: 18px;
            cursor: pointer;
        }

        .echo-checkbox input {
            width: 18px;
            height: 18px;
        }

        .echo-checkbox span {
            color: #aaaaba;
        }

        .echo-checkbox b {
            color: #a78bfa;
            margin-left: 5px;
        }

        .echo-unsaved-bar {
            position: fixed;
            left: 50%;
            bottom: 18px;
            transform: translate(-50%, 130px);
            width: min(720px, calc(100% - 30px));
            box-sizing: border-box;
            background: #3f404b;
            border-radius: 9px;
            padding: 9px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            box-shadow: 0 12px 35px rgba(0,0,0,.4);
            z-index: 10000;
            transition:
                transform .28s cubic-bezier(.2,.8,.2,1),
                opacity .2s ease;
            opacity: 0;
        }

        .echo-unsaved-visible {
            transform: translate(-50%, 0);
            opacity: 1;
        }

        .echo-unsaved-text {
            padding-left: 10px;
            font-size: 13px;
        }

        .echo-unsaved-text strong {
            font-weight: 800;
        }

        .echo-unsaved-actions {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .echo-reset-button {
            border: 0;
            background: transparent;
            color: #aeb0c2;
            text-decoration: underline;
            cursor: pointer;
            font-weight: 700;
        }

        .echo-save-button {
            border: 0;
            background: #00a86b;
            color: white;
            padding: 8px 14px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 800;
            transition: .2s;
        }

        .echo-save-button:hover {
            background: #08bd7b;
        }

        .echo-save-success {
            transform: scale(1.04);
        }

        .echo-effect-glow {
            text-shadow: 0 0 14px currentColor;
        }

        .echo-effect-pulse {
            animation: echoPulse 1.4s infinite ease-in-out;
        }

        .echo-effect-shimmer {
            background: linear-gradient(
                90deg,
                currentColor,
                white,
                currentColor
            );
            background-size: 200% auto;
            color: transparent;
            background-clip: text;
            animation: echoShimmer 2s linear infinite;
        }

        @keyframes echoPulse {

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

            .echo-settings-wrapper {
                width: calc(100% - 24px);
                padding-top: 25px;
            }

            .echo-setting-row {
                flex-direction: column;
                align-items: flex-start;
            }

            .echo-color-controls {
                grid-template-columns: repeat(2, 1fr);
            }

            .echo-unsaved-bar {
                align-items: stretch;
                flex-direction: column;
            }

            .echo-unsaved-actions {
                justify-content: flex-end;
            }
        }
    `;

    document.head.appendChild(
        style
    );
}

/* =========================================================
LOGIN / SIGNUP
\========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        const signupForm =
            document.getElementById(
                "signupForm"
            );

        /* =================================================
           SIGNUP PROFILE PICTURE PREVIEW
        ================================================= */

        const profilePicture =
            document.getElementById(
                "profilePicture"
            );

        const avatarPreview =
            document.getElementById(
                "avatarPreview"
            );

        const avatarPlaceholder =
            document.getElementById(
                "avatarPlaceholder"
            );

        if (profilePicture) {

            profilePicture.addEventListener(
                "change",
                async event => {

                    const file =
                        event.target.files?.[0];

                    if (!file) return;

                    try {

                        const data =
                            await fileToDataURL(
                                file
                            );

                        if (avatarPreview) {

                            avatarPreview.src =
                                data;

                            avatarPreview.style.display =
                                "block";
                        }

                        if (
                            avatarPlaceholder
                        ) {

                            avatarPlaceholder.style.display =
                                "none";
                        }

                    } catch (error) {

                        console.error(
                            "Profile picture upload error:",
                            error
                        );

                        if (
                            avatarPreview
                        ) {

                            avatarPreview.removeAttribute(
                                "src"
                            );

                            avatarPreview.style.display =
                                "";
                        }

                        if (
                            avatarPlaceholder
                        ) {

                            avatarPlaceholder.style.display =
                                "";
                        }

                        alert(
                            "Could not load that profile picture. Please choose another image."
                        );

                    } finally {

                        /*
                         Do NOT clear the input here.
                         The signup form still needs the
                         selected file when submitted.
                        */
                    }
                }
            );
        }

        const showSignup =
            document.getElementById(
                "showSignup"
            );

        const showLogin =
            document.getElementById(
                "showLogin"
            );

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );

        const settingsButton =
            document.getElementById(
                "accountSettingsButton"
            );

        /* =================================================
           LOGIN
        ================================================= */

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();

                    const username =
                        document.getElementById(
                            "loginUsername"
                        ).value.trim();

                    const password =
                        document.getElementById(
                            "loginPassword"
                        ).value;

                    const error =
                        document.getElementById(
                            "loginError"
                        );

                    const users =
                        getUsers();

                    const user =
                        users.find(
                            u =>
                                u.username
                                    .toLowerCase() ===
                                username
                                    .toLowerCase()
                        );

                    if (!user) {

                        error.textContent =
                            "Invalid username or password.";

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

                        error.textContent =
                            "Invalid username or password.";

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
           SIGNUP
        ================================================= */

        if (signupForm) {

            signupForm.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();

                    const username =
                        document.getElementById(
                            "signupUsername"
                        ).value.trim();

                    const password =
                        document.getElementById(
                            "signupPassword"
                        ).value;

                    const confirm =
                        document.getElementById(
                            "signupConfirm"
                        ).value;

                    const error =
                        document.getElementById(
                            "signupError"
                        );

                    if (
                        password !==
                        confirm
                    ) {

                        error.textContent =
                            "Passwords do not match.";

                        return;
                    }

                    const users =
                        getUsers();

                    if (
                        users.some(
                            user =>
                                user.username
                                    .toLowerCase() ===
                                username
                                    .toLowerCase()
                        )
                    ) {

                        error.textContent =
                            "That username is already taken.";

                        return;
                    }

                    try {

                        const hash =
                            await hashPassword(
                                password
                            );

                        const avatarInput =
                            document.getElementById(
                                "profilePicture"
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

                        users.push(
                            user
                        );

                        saveUsers(
                            users
                        );

                        saveSettings(
                            username,
                            {
                                ...DEFAULT_SETTINGS,

                                backgroundColors:
                                    [
                                        ...DEFAULT_SETTINGS
                                            .backgroundColors
                                    ],

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
                            "Could not create the account. Please choose a smaller image."
                        );
                    }
                }
            );
        }

        /* =================================================
           LOGIN / SIGNUP SWITCH
        ================================================= */

        if (showSignup) {

            showSignup.addEventListener(
                "click",
                () => {

                    document
                        .getElementById(
                            "loginPanel"
                        )
                        ?.classList.add(
                            "hidden"
                        );

                    document
                        .getElementById(
                            "signupPanel"
                        )
                        ?.classList.remove(
                            "hidden"
                        );
                }
            );
        }

        if (showLogin) {

            showLogin.addEventListener(
                "click",
                () => {

                    document
                        .getElementById(
                            "signupPanel"
                        )
                        ?.classList.add(
                            "hidden"
                        );

                    document
                        .getElementById(
                            "loginPanel"
                        )
                        ?.classList.remove(
                            "hidden"
                        );
                }
            );
        }

        /* =================================================
           LOGOUT
        ================================================= */

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
           SETTINGS
        ================================================= */

        if (settingsButton) {

            settingsButton.addEventListener(
                "click",
                openSettings
            );
        }

        /* =================================================
           SIDEBAR SETTINGS BUTTON
        ================================================= */

        document
            .querySelectorAll(
                ".nav-item"
            )
            .forEach(button => {

                if (
                    button.textContent
                        .toLowerCase()
                        .includes(
                            "settings"
                        )
                ) {

                    button.addEventListener(
                        "click",
                        openSettings
                    );
                }
            });

        /* =================================================
           PASSWORD SHOW / HIDE
        ================================================= */

        document
            .querySelectorAll(
                ".password-toggle"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const target =
                            document.getElementById(
                                button.dataset
                                    .target
                            );

                        if (!target) return;

                        if (
                            target.type ===
                            "password"
                        ) {

                            target.type =
                                "text";

                            button.textContent =
                                "Hide";

                        } else {

                            target.type =
                                "password";

                            button.textContent =
                                "Show";
                        }
                    }
                );
            });

        /* =================================================
           START
        ================================================= */

        if (getSession()) {

            showDashboard();

        } else {

            showAuth();
        }
    }
);

/* =========================================================
SHOW AUTH
\========================================================= */

function showAuth() {

    document
        .getElementById(
            "authScreen"
        )
        ?.classList.remove(
            "hidden"
        );

    document
        .getElementById(
            "dashboardScreen"
        )
        ?.classList.add(
            "hidden"
        );
}

/* =========================================================
SHOW DASHBOARD
\========================================================= */

function showDashboard() {

    const user =
        getCurrentUser();

    if (!user) {

        showAuth();

        return;
    }

    document
        .getElementById(
            "authScreen"
        )
        ?.classList.add(
            "hidden"
        );

    document
        .getElementById(
            "dashboardScreen"
        )
        ?.classList.remove(
            "hidden"
        );

    /*
     Make sure old accounts that have an
     avatar on the user object also get
     that avatar copied into settings.
    */

    const settings =
        getSettings(
            user.username
        );

    if (
        user.avatar &&
        (
            !settings.avatar ||
            settings.avatar ===
            DEFAULT_AVATAR
        )
    ) {

        settings.avatar =
            user.avatar;

        saveSettings(
            user.username,
            settings
        );
    }

    applyProfileSettings();
}

/* =========================================================
END
\========================================================= */
