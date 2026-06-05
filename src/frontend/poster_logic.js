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
const swapColorsBtn = document.getElementById("swap_colors_btn");

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
// 3.2. Swap Colors Action
// ==========================================
if (swapColorsBtn) {
    swapColorsBtn.addEventListener("click", () => {
        const tempColor = fgColorInput.value;
        fgColorInput.value = bgColorInput.value;
        bgColorInput.value = tempColor;
        
        updateHexText(fgColorInput, fgHexText);
        updateHexText(bgColorInput, bgHexText);
    });
}

// ==========================================
// 3.5. Parse URL parameters on load
// ==========================================
function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    const locationParam = params.get("location");
    if (locationParam) {
        locationInput.value = locationParam;
        toggleClearBtn();
    }
    
    const distanceParam = params.get("distance");
    if (distanceParam) {
        updateDistance(distanceParam);
    }
    
    const fgParam = params.get("fg_color") || params.get("fg");
    if (fgParam) {
        const formattedFg = fgParam.startsWith("#") ? fgParam : `#${fgParam}`;
        fgColorInput.value = formattedFg;
        updateHexText(fgColorInput, fgHexText);
    }
    
    const bgParam = params.get("bg_color") || params.get("bg");
    if (bgParam) {
        const formattedBg = bgParam.startsWith("#") ? bgParam : `#${bgParam}`;
        bgColorInput.value = formattedBg;
        updateHexText(bgColorInput, bgHexText);
    }
}
parseUrlParams();

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

    const loc = locationInput.value;
    const fg = fgColorInput.value;
    const bg = bgColorInput.value;
    const dist = distanceInput.value;

    // Create and insert skeleton card
    const skeletonCard = document.createElement("div");
    skeletonCard.classList.add("skeleton-card");

    const shimmerImage = document.createElement("div");
    shimmerImage.classList.add("shimmer-image");

    const progressIcon = document.createElement("div");
    progressIcon.classList.add("progress-icon");
    progressIcon.textContent = "🧭";

    const progressStatus = document.createElement("div");
    progressStatus.classList.add("progress-status");
    progressStatus.textContent = "🛰️ Fetching map data from OpenStreetMap...";

    shimmerImage.appendChild(progressIcon);
    shimmerImage.appendChild(progressStatus);

    const bar1 = document.createElement("div");
    bar1.classList.add("shimmer-bar", "w-60");

    const bar2 = document.createElement("div");
    bar2.classList.add("shimmer-bar", "w-40");

    skeletonCard.appendChild(shimmerImage);
    skeletonCard.appendChild(bar1);
    skeletonCard.appendChild(bar2);

    // Insert at start of list
    posterContainerList.insertBefore(skeletonCard, posterContainerList.firstChild);
    checkOnboarding();

    // Helper mapping for SSE status milestones
    const statusMessages = {
        fetching: "🛰️ Fetching map data from OpenStreetMap...",
        parsing: "📈 Parsing road networks...",
        plotting: "🎨 Plotting vectors...",
        cropping: "✂️ Cropping and centering layout...",
        finalizing: "✨ Finalizing print coordinates..."
    };

    function cleanupLoading() {
        generateBtn.disabled = false;
        generateBtn.querySelector(".spinner").style.display = "none";
        generateBtn.querySelector(".btn-text").textContent = "Generate Poster";
    }

    const sseUrl = `/poster/generate?${params.toString()}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.status === "error") {
                eventSource.close();
                showErrorCard(skeletonCard, data.message || "An unknown error occurred");
                cleanupLoading();
            } else if (data.status === "done") {
                eventSource.close();
                replaceWithPosterCard(skeletonCard, data.image_url, data.coords, loc, fg, bg, dist);
                cleanupLoading();
            } else {
                const msg = statusMessages[data.status] || `Generating: ${data.status}...`;
                progressStatus.textContent = msg;
            }
        } catch (err) {
            eventSource.close();
            showErrorCard(skeletonCard, "Failed to parse update from server");
            cleanupLoading();
        }
    };

    eventSource.onerror = (err) => {
        eventSource.close();
        showErrorCard(skeletonCard, "Connection lost or server error occurred");
        cleanupLoading();
    };
}

function replaceWithPosterCard(skeletonCard, imageUrl, coords, loc, fg, bg, dist) {
    const card = document.createElement("div");
    card.classList.add("poster-card");

    const imgWrapper = document.createElement("div");
    imgWrapper.classList.add("poster-img-wrapper");

    const img = document.createElement("img");
    img.src = imageUrl;
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

    // Format coordinates if returned by geocoder
    let coordsDisplay = `${dist}m radius`;
    if (coords && Array.isArray(coords) && coords.length === 2) {
        const lat = coords[0];
        const lon = coords[1];
        if (typeof lat === "number" && typeof lon === "number") {
            const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
            const lonStr = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;
            coordsDisplay = `${latStr}, ${lonStr}`;
        }
    }

    const coordsSpan = document.createElement("span");
    coordsSpan.classList.add("poster-coords");
    coordsSpan.textContent = coordsDisplay;

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

    // Action Buttons
    const actions = document.createElement("div");
    actions.classList.add("poster-actions");

    const downloadBtn = document.createElement("button");
    downloadBtn.classList.add("card-btn");
    downloadBtn.innerHTML = "📥 Download";
    downloadBtn.addEventListener("click", () => {
        downloadPoster(imageUrl, loc, dist);
    });

    const shareBtn = document.createElement("button");
    shareBtn.classList.add("card-btn");
    shareBtn.innerHTML = "🔗 Share";
    shareBtn.addEventListener("click", () => {
        sharePoster(imageUrl, loc, dist, fg, bg);
    });

    actions.appendChild(downloadBtn);
    actions.appendChild(shareBtn);
    card.appendChild(actions);

    // Swap cards
    skeletonCard.replaceWith(card);
    checkOnboarding();
}

function downloadPoster(imageUrl, loc, dist) {
    const sanitizedLoc = loc
        .trim()
        .replace(/[^a-zA-Z0-9\s-_,]/g, "")
        .replace(/[\s,]+/g, "-");
    const filename = `${sanitizedLoc}_${dist}m.png`;

    fetch(imageUrl)
        .then(response => {
            if (!response.ok) throw new Error("Could not download file from server");
            return response.blob();
        })
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        })
        .catch(err => {
            alert(`Download failed: ${err.message}`);
        });
}

function sharePoster(imageUrl, loc, dist, fg, bg) {
    const sanitizedLoc = loc
        .trim()
        .replace(/[^a-zA-Z0-9\s-_,]/g, "")
        .replace(/[\s,]+/g, "-");
    const filename = `${sanitizedLoc}_${dist}m.png`;

    fetch(imageUrl)
        .then(response => {
            if (!response.ok) throw new Error("Could not fetch file for sharing");
            return response.blob();
        })
        .then(blob => {
            const file = new File([blob], filename, { type: "image/png" });
            const shareData = {
                files: [file],
                title: `Map2Poster - ${loc}`,
                text: `Custom road map poster of ${loc}`
            };

            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                return navigator.share(shareData);
            } else {
                throw new Error("Web Share for files not supported");
            }
        })
        .catch(err => {
            if (err.name !== "AbortError") {
                sharePosterLink(loc, dist, fg, bg);
            }
        });
}

function sharePosterLink(loc, dist, fg, bg) {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("location", loc);
    url.searchParams.set("distance", dist);
    url.searchParams.set("fg_color", fg);
    url.searchParams.set("bg_color", bg);
    copyToClipboard(url.toString());
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast("🔗 Link copied to clipboard!");
        })
        .catch(() => {
            alert("Could not copy link to clipboard. Please copy manually: " + text);
        });
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "share-toast";
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2500);
}

function showErrorCard(skeletonCard, message) {
    const card = document.createElement("div");
    card.classList.add("poster-card", "error-card");

    const content = document.createElement("div");
    content.classList.add("error-content");

    const header = document.createElement("div");
    header.classList.add("error-header");

    const dismissBtn = document.createElement("button");
    dismissBtn.className = "error-close-btn";
    dismissBtn.innerHTML = "&times;";
    dismissBtn.title = "Dismiss";
    dismissBtn.addEventListener("click", () => {
        card.remove();
        checkOnboarding();
    });

    header.appendChild(dismissBtn);
    content.appendChild(header);

    const icon = document.createElement("div");
    icon.classList.add("error-badge-icon");
    icon.textContent = "⚠️";
    content.appendChild(icon);

    const title = document.createElement("div");
    title.classList.add("error-card-title");
    title.textContent = "Generation Failed";
    content.appendChild(title);

    const desc = document.createElement("div");
    desc.classList.add("error-description");
    desc.textContent = message;
    content.appendChild(desc);

    card.appendChild(content);

    skeletonCard.replaceWith(card);
    checkOnboarding();
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