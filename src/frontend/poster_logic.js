// DOM Elements
const form = document.getElementById("generate_form");
const posterContainerList = document.getElementById("poster_list_container");
const locationInput = document.getElementById("location");
const clearLocationBtn = document.getElementById("clear_location_btn");
const distanceSlider = document.getElementById("distance_slider");
const distanceInput = document.getElementById("distance");
const distanceValDisplay = document.getElementById("distance_val_display");
const fgColorInput = document.getElementById("fg_color");
const bgColorInput = document.getElementById("bg_color");
const fgHexText = document.getElementById("fg_hex_text");
const bgHexText = document.getElementById("bg_hex_text");
const generateBtn = document.getElementById("generate_btn");
const onboardingCard = document.getElementById("onboarding_card");

// ==========================================
// 1. Bidirectional Distance Synchronization
// ==========================================
function updateDistance(val) {
    let clampedVal = Math.max(500, Math.min(10000, parseInt(val) || 2000));
    distanceSlider.value = clampedVal;
    distanceInput.value = clampedVal;
    distanceValDisplay.textContent = `${clampedVal}m`;
}

distanceSlider.addEventListener("input", (e) => {
    updateDistance(e.target.value);
});

distanceInput.addEventListener("change", (e) => {
    updateDistance(e.target.value);
});

// Initialize distance
updateDistance(distanceInput.value);

// ==========================================
// 2. Location Inputs (Suggestions & Clear)
// ==========================================
function toggleClearBtn() {
    if (locationInput.value.length > 0) {
        clearLocationBtn.style.display = "block";
    } else {
        clearLocationBtn.style.display = "none";
    }
}

locationInput.addEventListener("input", toggleClearBtn);

clearLocationBtn.addEventListener("click", () => {
    locationInput.value = "";
    toggleClearBtn();
    locationInput.focus();
});

// ==========================================
// 3. Color Picker Hex Sync
// ==========================================
function updateHexText(picker, textSpan) {
    textSpan.textContent = picker.value.toUpperCase();
}

fgColorInput.addEventListener("input", () => updateHexText(fgColorInput, fgHexText));
bgColorInput.addEventListener("input", () => updateHexText(bgColorInput, bgHexText));

// Initialize color tags
updateHexText(fgColorInput, fgHexText);
updateHexText(bgColorInput, bgHexText);

// ==========================================
// 4. Onboarding Card Toggling
// ==========================================
function checkOnboarding() {
    const cards = posterContainerList.querySelectorAll(".poster-card, .skeleton-card");
    if (cards.length > 0) {
        onboardingCard.style.display = "none";
    } else {
        onboardingCard.style.display = "block";
    }
}

// ==========================================
// 5. Generate Poster Submissions
// ==========================================
form.addEventListener("submit", generatePoster);

function generatePoster(e) {
    e.preventDefault();

    // Disable form fields during submission to prevent duplicate actions
    generateBtn.disabled = true;
    generateBtn.querySelector(".spinner").style.display = "inline-block";
    generateBtn.querySelector(".btn-text").textContent = "Generating...";

    const formData = new FormData(form);
    const params = new URLSearchParams(formData);
    const imageUrl = `/poster?${params.toString()}`;

    const loc = locationInput.value;
    const fg = fgColorInput.value;
    const bg = bgColorInput.value;
    const dist = distanceInput.value;

    fetch(imageUrl)
        .then(response => {
            if (!response.ok) throw new Error("Server error occurred");
            return response.blob();
        })
        .then(blob => {
            // Create modern poster card
            const card = document.createElement("div");
            card.classList.add("poster-card");

            const imgWrapper = document.createElement("div");
            imgWrapper.classList.add("poster-img-wrapper");

            const img = document.createElement("img");
            img.src = URL.createObjectURL(blob);
            img.classList.add("poster_img");
            img.alt = `Road network map of ${loc}`;

            imgWrapper.appendChild(img);
            card.appendChild(imgWrapper);

            // Metadata info
            const info = document.createElement("div");
            info.classList.add("poster-info");

            const title = document.createElement("div");
            title.classList.add("poster-title");
            title.textContent = loc.toUpperCase();

            const subtitle = document.createElement("div");
            subtitle.classList.add("poster-sub");

            const coordsSpan = document.createElement("span");
            coordsSpan.classList.add("poster-coords");
            coordsSpan.textContent = `${dist}m radius`;

            const swatches = document.createElement("div");
            swatches.classList.add("swatch-group");

            const swatchFg = document.createElement("div");
            swatchFg.classList.add("color-swatch-circle");
            swatchFg.style.backgroundColor = fg;
            swatchFg.title = `Foreground: ${fg} (Click to use)`;
            swatchFg.addEventListener("click", (e) => showColorMenu(e, swatchFg, fg));

            const swatchBg = document.createElement("div");
            swatchBg.classList.add("color-swatch-circle");
            swatchBg.style.backgroundColor = bg;
            swatchBg.title = `Background: ${bg} (Click to use)`;
            swatchBg.addEventListener("click", (e) => showColorMenu(e, swatchBg, bg));

            swatches.appendChild(swatchFg);
            swatches.appendChild(swatchBg);

            subtitle.appendChild(coordsSpan);
            subtitle.appendChild(swatches);

            info.appendChild(title);
            info.appendChild(subtitle);
            card.appendChild(info);

            // Action Buttons (Mock/Placeholder for Issue 3 actions)
            const actions = document.createElement("div");
            actions.classList.add("poster-actions");

            const downloadBtn = document.createElement("button");
            downloadBtn.classList.add("card-btn");
            downloadBtn.innerHTML = "📥 Download";

            const shareBtn = document.createElement("button");
            shareBtn.classList.add("card-btn");
            shareBtn.innerHTML = "🔗 Share";

            actions.appendChild(downloadBtn);
            actions.appendChild(shareBtn);
            card.appendChild(actions);

            // Insert at start of list
            posterContainerList.insertBefore(card, posterContainerList.firstChild);
            checkOnboarding();
        })
        .catch(err => {
            alert(`Failed to generate poster: ${err.message}`);
        })
        .finally(() => {
            // Re-enable form fields
            generateBtn.disabled = false;
            generateBtn.querySelector(".spinner").style.display = "none";
            generateBtn.querySelector(".btn-text").textContent = "Generate Poster";
        });
}

// ==========================================
// 6. Interactive Swatch Color Pop-up Menu
// ==========================================
let activeColorMenu = null;

function showColorMenu(e, swatch, color) {
    e.stopPropagation(); // Avoid triggering document click menu close

    if (activeColorMenu) {
        activeColorMenu.remove();
    }

    const menu = document.createElement("div");
    menu.className = "color-popup-menu";
    
    // Position menu below the swatch dynamically
    const rect = swatch.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.top = `${rect.bottom + 6}px`;
    // Align menu horizontal center with swatch
    menu.style.left = `${rect.left + (rect.width / 2) - 65}px`; 

    const useAsFgBtn = document.createElement("button");
    useAsFgBtn.className = "menu-item";
    useAsFgBtn.textContent = "Use as Foreground";
    useAsFgBtn.addEventListener("click", () => {
        fgColorInput.value = color;
        updateHexText(fgColorInput, fgHexText);
        menu.remove();
        activeColorMenu = null;
    });

    const useAsBgBtn = document.createElement("button");
    useAsBgBtn.className = "menu-item";
    useAsBgBtn.textContent = "Use as Background";
    useAsBgBtn.addEventListener("click", () => {
        bgColorInput.value = color;
        updateHexText(bgColorInput, bgHexText);
        menu.remove();
        activeColorMenu = null;
    });

    menu.appendChild(useAsFgBtn);
    menu.appendChild(useAsBgBtn);
    document.body.appendChild(menu);
    activeColorMenu = menu;
}

// Close the active menu when clicking anywhere else
document.addEventListener("click", () => {
    if (activeColorMenu) {
        activeColorMenu.remove();
        activeColorMenu = null;
    }
});