const USERS_KEY = "ECHO_DASHBOARD_USERS";
const SESSION_KEY = "ECHO_DASHBOARD_SESSION";

const DEFAULT_AVATAR =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
            <rect width="120" height="120" rx="60" fill="#252833"/>
            <circle cx="60" cy="45" r="22" fill="#a8abb5"/>
            <path
                d="M23 105c6-25 21-37 37-37s31 12 37 37"
                fill="#a8abb5"
            />
        </svg>
    `);


/* ================= THEMES ================= */

const THEMES = {

    midnight: {
        colors: [
            "#11131a",
            "#292b3d",
            "#45466d",
            "#6657a6",
            "#8a74e8"
        ],
        direction: "to right"
    },

    chroma: {
        colors: [
            "#7c5cff",
            "#ff4ecd",
            "#42d9ff",
            "#6dffbd",
            "#ffc857"
        ],
        direction: "to right"
    },

    ocean: {
        colors: [
            "#142b5c",
            "#166b82",
            "#16b9b2",
            "#5be0ff",
            "#b3f5ff"
        ],
        direction: "to right"
    },

    sunset: {
        colors: [
            "#5b2c83",
            "#b84372",
            "#ff6a5f",
            "#ff9a62",
            "#ffc371"
        ],
        direction: "to right"
    },

    aurora: {
        colors: [
            "#163c45",
            "#2f6d67",
            "#4c9b7d",
            "#7fb85d",
            "#a8d66d"
        ],
        direction: "to right"
    }

};


/* ================= STATE ================= */

let currentUser = null;

let draft = null;

let savedSnapshot = null;


/* ================= HELPERS ================= */

const $ = id => document.getElementById(id);

function getUsers() {
    return JSON.parse(
        localStorage.getItem(USERS_KEY) || "[]"
    );
}

function saveUsers(users) {
    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );
}

function getSession() {
    return localStorage.getItem(SESSION_KEY);
}

function setSession(username) {
    localStorage.setItem(
        SESSION_KEY,
        username
    );
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}


function getUser(username) {

    return getUsers().find(
        user =>
            user.username.toLowerCase() ===
            username.toLowerCase()
    );
}


function normalizeUser(user) {

    return {

        username: user.username || "",

        password: user.password || "",

        avatar:
            user.avatar ||
            DEFAULT_AVATAR,

        displayName:
            user.displayName ||
            user.username ||
            "User",

        bio:
            user.bio ||
            "",

        theme:
            user.theme ||
            "midnight",

        colors:
            user.colors ||
            [...THEMES.midnight.colors],

        direction:
            user.direction ||
            "to right",

        animations:
            user.animations !== false,

        sounds:
            Boolean(user.sounds)

    };
}


/* ================= PASSWORD ================= */

async function hashPassword(password) {

    const data =
        new TextEncoder().encode(password);

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return [
        ...new Uint8Array(hash)
    ]
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");
}


/* ================= IMAGE ================= */

function imageFileToDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            if (
                !file.type.startsWith("image/")
            ) {
                reject(
                    new Error(
                        "Please choose an image."
                    )
                );

                return;
            }


            if (
                file.size >
                4 * 1024 * 1024
            ) {

                reject(
                    new Error(
                        "Please choose an image smaller than 4 MB."
                    )
                );

                return;
            }


            const reader =
                new FileReader();


            reader.onload = () =>
                resolve(reader.result);


            reader.onerror = () =>
                reject(
                    new Error(
                        "Could not read that image."
                    )
                );


            reader.readAsDataURL(file);

        }
    );
}


/* ================= THEME ================= */

function applyTheme(user) {

    const colors =
        user.colors ||
        THEMES.midnight.colors;

    const direction =
        user.direction ||
        "to right";


    document.documentElement.style.setProperty(
        "--accent",
        colors[0]
    );

    document.documentElement.style.setProperty(
        "--accent2",
        colors[1]
    );


    document.documentElement.style.setProperty(
        "--profile-gradient",
        `linear-gradient(
            ${direction},
            ${colors.join(",")}
        )`
    );


    if (
        user.animations === false
    ) {

        document.documentElement.classList.add(
            "no-animations"
        );

    } else {

        document.documentElement.classList.remove(
            "no-animations"
        );

    }
}


/* ================= AUTH ================= */

function showAuth() {

    $("authScreen")
        .classList
        .remove("hidden");

    $("dashboardScreen")
        .classList
        .add("hidden");
}


function showDashboard() {

    $("authScreen")
        .classList
        .add("hidden");

    $("dashboardScreen")
        .classList
        .remove("hidden");


    renderUser();

    showPage("overview");
}


function renderUser() {

    if (!currentUser) {
        return;
    }


    currentUser =
        normalizeUser(currentUser);


    const avatar =
        currentUser.avatar ||
        DEFAULT_AVATAR;


    const displayName =
        currentUser.displayName ||
        currentUser.username;


    $("dashboardAvatar").src =
        avatar;

    $("headerAvatar").src =
        avatar;


    $("dashboardUsername")
        .textContent =
        displayName;


    $("headerUsername")
        .textContent =
        displayName;


    $("accountUsername")
        .textContent =
        currentUser.username;


    $("accountSettingsUsername")
        .textContent =
        currentUser.username;


    $("welcomeTitle")
        .textContent =
        `Welcome, ${displayName}!`;


    applyTheme(currentUser);
}


/* ================= PAGES ================= */

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(
            element =>
                element.classList.add(
                    "hidden"
                )
        );


    const target =
        $(`${page}Page`);


    if (target) {

        target.classList.remove(
            "hidden"
        );

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(
            button =>
                button.classList.toggle(
                    "active",
                    button.dataset.page === page
                )
        );


    if (page === "settings") {

        loadDraft();

    }

}


/* ================= SETTINGS ================= */

function openSettingsTab(tab) {

    document
        .querySelectorAll(".settings-tab")
        .forEach(
            button =>
                button.classList.toggle(
                    "active",
                    button.dataset.settingsTab === tab
                )
        );


    document
        .querySelectorAll(".settings-tab-panel")
        .forEach(
            panel =>
                panel.classList.remove(
                    "active"
                )
        );


    const panel =
        $(`settings-${tab}`);


    if (panel) {

        panel.classList.add(
            "active"
        );

    }


    const titles = {

        profile: [
            "Profile",
            "Control how your Echo profile looks."
        ],

        appearance: [
            "Appearance",
            "Customize Echo's colors and interface."
        ],

        echoPlus: [
            "Echo Plus",
            "See premium customization features."
        ],

        account: [
            "Account",
            "Manage your Echo account."
        ]

    };


    const meta =
        titles[tab];


    if (meta) {

        $("settingsHeading")
            .textContent =
            meta[0];

        $("settingsDescription")
            .textContent =
            meta[1];

    }

}


/* ================= DRAFT ================= */

function makeDraft() {

    return JSON.parse(
        JSON.stringify(
            normalizeUser(currentUser)
        )
    );
}


function loadDraft() {

    if (!currentUser) {
        return;
    }


    draft =
        makeDraft();


    savedSnapshot =
        JSON.parse(
            JSON.stringify(draft)
        );


    $("settingsUsername").value =
        draft.username;


    $("settingsDisplayName").value =
        draft.displayName;


    $("settingsBio").value =
        draft.bio;


    $("bioCount")
        .textContent =
        draft.bio.length;


    $("settingsAvatarPreview").src =
        draft.avatar;


    $("settingsPreviewName")
        .textContent =
        draft.displayName ||
        draft.username;


    $("settingsPreviewUsername")
        .textContent =
        "@" +
        draft.username;


    $("gradientDirection").value =
        draft.direction;


    draft.colors.forEach(
        (color, index) => {

            const input =
                $(`color${index + 1}`);

            if (input) {
                input.value = color;
            }

        }
    );


    $("animationsToggle").checked =
        draft.animations;


    $("soundsToggle").checked =
        draft.sounds;


    updateGradientPreview();

    updateActiveTheme();

    markUnsaved(false);
}


function isDirty() {

    return (
        JSON.stringify(draft) !==
        JSON.stringify(savedSnapshot)
    );

}


function markUnsaved(show) {

    $("unsavedBar")
        .classList
        .toggle(
            "show",
            show
        );

}


function syncDraftFromInputs() {

    if (!draft) {
        return;
    }


    draft.username =
        $("settingsUsername")
            .value
            .trim();


    draft.displayName =
        $("settingsDisplayName")
            .value
            .trim() ||
        draft.username;


    draft.bio =
        $("settingsBio")
            .value;


    draft.direction =
        $("gradientDirection")
            .value;


    draft.colors =
        [
            1,
            2,
            3,
            4,
            5
        ].map(
            number =>
                $(`color${number}`).value
        );


    draft.animations =
        $("animationsToggle")
            .checked;


    draft.sounds =
        $("soundsToggle")
            .checked;


    $("settingsPreviewName")
        .textContent =
        draft.displayName ||
        "User";


    $("settingsPreviewUsername")
        .textContent =
        "@" +
        (
            draft.username ||
            "user"
        );


    $("bioCount")
        .textContent =
        draft.bio.length;


    updateGradientPreview();

    updateActiveTheme();

    applyTheme(draft);

    markUnsaved(
        isDirty()
    );
}


/* ================= GRADIENT ================= */

function updateGradientPreview() {

    const colors =
        [
            1,
            2,
            3,
            4,
            5
        ]
        .map(
            number =>
                $(`color${number}`)?.value
        )
        .filter(Boolean);


    const direction =
        $("gradientDirection")
            ?.value ||
        "to right";


    $("gradientPreview").style.background =
        `linear-gradient(
            ${direction},
            ${colors.join(",")}
        )`;
}


function updateActiveTheme() {

    if (!draft) {
        return;
    }


    document
        .querySelectorAll(".theme-preset")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.theme ===
                draft.theme
            );

        });

}


function chooseTheme(themeName) {

    const theme =
        THEMES[themeName];


    if (!theme) {
        return;
    }


    theme.colors.forEach(
        (color, index) => {

            $(`color${index + 1}`)
                .value =
                color;

        }
    );


    $("gradientDirection")
        .value =
        theme.direction;


    draft.theme =
        themeName;


    syncDraftFromInputs();

}


/* ================= SAVE ================= */

function updateStoredUser(nextUser) {

    const allUsers =
        getUsers();


    const index =
        allUsers.findIndex(
            user =>
                user.username ===
                currentUser.username
        );


    if (index !== -1) {

        allUsers[index] =
            nextUser;

        saveUsers(allUsers);

    }


    currentUser =
        nextUser;
}


async function saveChanges() {

    if (
        !draft ||
        !isDirty()
    ) {
        return;
    }


    const oldUsername =
        currentUser.username;


    if (
        !/^[a-zA-Z0-9_.-]{3,24}$/
            .test(
                draft.username
            )
    ) {

        alert(
            "Username must be 3–24 characters and use only letters, numbers, _, . or -."
        );

        return;
    }


    const conflict =
        getUsers().some(
            user =>
                user.username
                    .toLowerCase() ===
                draft.username
                    .toLowerCase() &&
                user.username !==
                oldUsername
        );


    if (conflict) {

        alert(
            "That username is already in use."
        );

        return;
    }


    const nextUser = {
        ...currentUser,
        ...draft
    };


    updateStoredUser(
        nextUser
    );


    if (
        oldUsername !==
        nextUser.username
    ) {

        setSession(
            nextUser.username
        );

    }


    savedSnapshot =
        JSON.parse(
            JSON.stringify(
                nextUser
            )
        );


    draft =
        JSON.parse(
            JSON.stringify(
                nextUser
            )
        );


    renderUser();


    $("settingsUsername").value =
        nextUser.username;


    $("settingsDisplayName").value =
        nextUser.displayName;


    $("settingsBio").value =
        nextUser.bio;


    $("accountSettingsUsername")
        .textContent =
        nextUser.username;


    markUnsaved(false);


    const saveButton =
        $("saveChanges");


    saveButton.textContent =
        "Saved ✓";


    saveButton.classList.add(
        "saved"
    );


    setTimeout(
        () => {

            saveButton.textContent =
                "Save Changes";

            saveButton.classList.remove(
                "saved"
            );

        },
        900
    );

}


/* ================= RESET ================= */

function resetChanges() {

    if (!savedSnapshot) {
        return;
    }


    draft =
        JSON.parse(
            JSON.stringify(
                savedSnapshot
            )
        );


    loadDraft();

    applyTheme(
        savedSnapshot
    );

}


/* ================= SIGNUP ================= */

async function signup(event) {

    event.preventDefault();


    const username =
        $("signupUsername")
            .value
            .trim();


    const password =
        $("signupPassword")
            .value;


    const confirm =
        $("signupConfirm")
            .value;


    $("signupError")
        .textContent = "";


    if (getUser(username)) {

        $("signupError")
            .textContent =
            "That username is already taken.";

        return;
    }


    if (password !== confirm) {

        $("signupError")
            .textContent =
            "Passwords do not match.";

        return;
    }


    let avatar =
        DEFAULT_AVATAR;


    const file =
        $("profilePicture")
            .files[0];


    if (file) {

        try {

            avatar =
                await imageFileToDataURL(
                    file
                );

        } catch (error) {

            $("signupError")
                .textContent =
                error.message;

            return;
        }

    }


    const user = normalizeUser({

        username,

        password:
            await hashPassword(
                password
            ),

        avatar,

        displayName:
            username,

        bio: ""

    });


    saveUsers([
        ...getUsers(),
        user
    ]);


    setSession(
        user.username
    );


    currentUser =
        user;


    showDashboard();

}


/* ================= LOGIN ================= */

async function login(event) {

    event.preventDefault();


    const username =
        $("loginUsername")
            .value
            .trim();


    const password =
        $("loginPassword")
            .value;


    $("loginError")
        .textContent = "";


    const user =
        getUser(username);


    if (!user) {

        $("loginError")
            .textContent =
            "Invalid username or password.";

        return;
    }


    const passwordHash =
        await hashPassword(
            password
        );


    if (
        user.password !==
        passwordHash
    ) {

        $("loginError")
            .textContent =
            "Invalid username or password.";

        return;
    }


    currentUser =
        normalizeUser(
            user
        );


    setSession(
        currentUser.username
    );


    showDashboard();

}


/* ================= LOGOUT ================= */

function logout() {

    clearSession();

    currentUser = null;

    draft = null;

    savedSnapshot = null;

    showAuth();

}


/* ================= DELETE ACCOUNT ================= */

function deleteAccount() {

    if (!currentUser) {
        return;
    }


    const confirmed =
        confirm(
            "Delete this Echo account? This removes the account and its saved settings from this browser."
        );


    if (!confirmed) {
        return;
    }


    saveUsers(
        getUsers().filter(
            user =>
                user.username !==
                currentUser.username
        )
    );


    logout();

}


/* ================= EVENTS ================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /* LOGIN / SIGNUP */

        $("showSignup").onclick =
            () => {

                $("loginPanel")
                    .classList
                    .add("hidden");

                $("signupPanel")
                    .classList
                    .remove("hidden");

            };


        $("showLogin").onclick =
            () => {

                $("signupPanel")
                    .classList
                    .add("hidden");

                $("loginPanel")
                    .classList
                    .remove("hidden");

            };


        $("loginForm")
            .addEventListener(
                "submit",
                login
            );


        $("signupForm")
            .addEventListener(
                "submit",
                signup
            );


        /* PASSWORD */

        document
            .querySelectorAll(
                ".password-toggle"
            )
            .forEach(
                button => {

                    button.onclick =
                        () => {

                            const input =
                                $(
                                    button.dataset.target
                                );


                            if (
                                input.type ===
                                "password"
                            ) {

                                input.type =
                                    "text";

                                button.textContent =
                                    "Hide";

                            } else {

                                input.type =
                                    "password";

                                button.textContent =
                                    "Show";

                            }

                        };

                }
            );


        /* SIGNUP AVATAR */

        $("profilePicture")
            .addEventListener(
                "change",
                async () => {

                    const file =
                        $("profilePicture")
                            .files[0];


                    if (!file) {
                        return;
                    }


                    try {

                        $("avatarPreview").src =
                            await imageFileToDataURL(
                                file
                            );


                        $("avatarPlaceholder")
                            .style
                            .display =
                            "none";

                    } catch (error) {

                        $("signupError")
                            .textContent =
                            error.message;

                    }

                }
            );


        /* SIDEBAR */

        document
            .querySelectorAll(
                ".nav-item"
            )
            .forEach(
                button => {

                    button.onclick =
                        () =>
                            showPage(
                                button.dataset.page
                            );

                }
            );


        document
            .querySelectorAll(
                "[data-page-jump]"
            )
            .forEach(
                button => {

                    button.onclick =
                        () =>
                            showPage(
                                button.dataset.pageJump
                            );

                }
            );


        $("accountSettingsButton")
            .onclick =
            () =>
                showPage(
                    "settings"
                );


        $("logoutButton")
            .onclick =
            logout;


        /* SETTINGS TABS */

        document
            .querySelectorAll(
                ".settings-tab"
            )
            .forEach(
                button => {

                    button.onclick =
                        () =>
                            openSettingsTab(
                                button.dataset.settingsTab
                            );

                }
            );


        /* SETTINGS AVATAR */

        $("settingsAvatarInput")
            .addEventListener(
                "change",
                async () => {

                    const file =
                        $("settingsAvatarInput")
                            .files[0];


                    if (!file) {
                        return;
                    }


                    try {

                        draft.avatar =
                            await imageFileToDataURL(
                                file
                            );


                        $("settingsAvatarPreview")
                            .src =
                            draft.avatar;


                        syncDraftFromInputs();

                    } catch (error) {

                        alert(
                            error.message
                        );

                    }

                }
            );


        /* SETTINGS INPUTS */

        const settingInputs = [

            "settingsUsername",
            "settingsDisplayName",
            "settingsBio",
            "gradientDirection",
            "animationsToggle",
            "soundsToggle",
            "color1",
            "color2",
            "color3",
            "color4",
            "color5"

        ];


        settingInputs.forEach(
            id => {

                const element =
                    $(id);


                if (!element) {
                    return;
                }


                element.addEventListener(
                    "input",
                    syncDraftFromInputs
                );


                element.addEventListener(
                    "change",
                    syncDraftFromInputs
                );

            }
        );


        /* PRESET THEMES */

        document
            .querySelectorAll(
                ".theme-preset"
            )
            .forEach(
                button => {

                    button.onclick =
                        () =>
                            chooseTheme(
                                button.dataset.theme
                            );

                }
            );


        /* SAVE / RESET */

        $("saveChanges")
            .onclick =
            saveChanges;


        $("resetChanges")
            .onclick =
            resetChanges;


        /* ACCOUNT */

        $("settingsLogout")
            .onclick =
            logout;


        $("deleteAccountButton")
            .onclick =
            deleteAccount;


        $("plusButton")
            .onclick =
            () =>
                alert(
                    "Echo Plus is coming soon."
                );


        /* SESSION */

        const rememberedSession =
            getSession();


        if (rememberedSession) {

            const user =
                getUser(
                    rememberedSession
                );


            if (user) {

                currentUser =
                    normalizeUser(
                        user
                    );

                showDashboard();

                return;
            }

        }


        showAuth();

    }
);
