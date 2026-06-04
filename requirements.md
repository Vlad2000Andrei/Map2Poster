# Map2Poster - Frontend Requirements Document

This document outlines the features, user interface design, and architectural decisions for the Map2Poster frontend.

---

## 🎨 1. Visual Design & User Experience (UX)

We will adopt a modern **Split-Pane Dashboard Layout** with rich, high-end aesthetics:

### Layout Structure
- **Sidebar (Control Panel - Left)**:
  - Fixed-position sidebar.
  - Customization controls: Location input, Radius input, Foreground & Background color pickers, and the **Generate** button.
  - Premium styling: Glassmorphism (`backdrop-filter: blur()`), thin borders, soft drop shadows, and modern typography (Google Font: **Inter** or **Outfit**).
- **Main Panel (Poster Gallery - Right)**:
  - Scrollable flex grid taking up the remaining viewport space.
  - Displays generated posters in reverse chronological order.
  - Includes a clean onboarding card/graphic when the gallery is empty.

### Styling & Micro-interactions
- **Custom Scrollbars**: Modern, thin, rounded scrollbars that fit the theme.
- **Hover Transitions**: Smooth scale-up and shadow changes for poster cards.
- **Button Animations**: Active states, loading spinners, and hover transitions for control buttons.
- **Color Pickers**: Visual previews showing the selected combination in real-time.

---

## 📋 2. Functional Requirements

### 🔴 MUST-HAVE Features

#### 1. Customize Inputs
- **Location Input**: 
  - Text input with validation, a clear button, and placeholder suggestions (e.g., *"Paris, France"*, *"New York City"*).
- **Radius / Distance Input**:
  - Input field for distance (in meters) coupled with a smooth slider (range: 500m to 10,000m) for fast adjustments.
- **Foreground / Background Color Pickers**:
  - Visual color controls that instantly preview the color choices.
- **Generate Button**:
  - Clear call-to-action button, which disables during active generation to prevent duplicate requests.

#### 2. Poster Gallery
- **Scrollable Display**: All posters generated during the current session are displayed in a grid.
- **Reverse Chronological Order**: The newest posters appear at the top/front.
- **Card Metadata**: Each poster card displays:
  - The location name (capitalized).
  - The exact latitude/longitude coordinates (retrieved from the backend).
  - A small color swatch showing the FG and BG colors used.

---

### 🟢 NICE-TO-HAVE Features

#### 3. Poster Actions (Download & Share)
- **Download Button**:
  - Saves the high-resolution PNG image directly to the user's machine.
  - Automatically names the file based on the location and parameters (e.g., `Paris-France_2000m.png`).
- **Share Button**:
  - **Primary**: Uses the Web Share API (if supported by the browser) to allow native sharing on mobile and desktop OS.
  - **Fallback**: Copies a unique, shareable URL to the clipboard containing query parameters (e.g., `?location=Paris&distance=2000&fg=000000&bg=ffffff`) that loads the web app with those settings preconfigured.

#### 4. Loading States & Progress Feedback
Because poster generation relies on fetching data from OpenStreetMap and rendering heavy vector graphs, the process can take 5–15 seconds. 

- **Immediate Skeleton Card**: As soon as the user clicks "Generate", a placeholder card with a shimmering outline is created at the top of the gallery list.
- **Loading Animation**: A looping loading indicator (e.g., a rotating compass, a growing road network animation, or a sleek pulsing map pin).
- **Status Progress Messaging (Backend-Driven)**:
  - Tracks actual steps of the generator pipeline in real-time.
  - Stages displayed to user:
    1. 🛰️ *Fetching map data from OpenStreetMap...*
    2. 📈 *Parsing road networks...*
    3. 🎨 *Plotting vectors...*
    4. ✂️ *Cropping and centering layout...*
    5. ✨ *Finalizing print coordinates...*

---

## 🛠️ 3. Selected Technical Architecture

To implement the **Backend-Driven Status Updates**, we will use **Server-Sent Events (SSE)**.

### Event Streaming Workflow
1. **Frontend Request**: The frontend initiates generation by calling `/poster/generate` using standard GET parameters.
2. **Server Streaming**: The Flask endpoint streams events (`text/event-stream`) back to the frontend.
3. **Execution Steps**:
   - The map fetcher updates a state variable or calls a callback as it hits different execution segments.
   - At each milestone, the server sends a data event, e.g., `data: {"status": "fetching"}`.
4. **Final Event**: Once complete, the server sends an event containing the generated image's temporary URL, e.g., `data: {"status": "done", "image_url": "/poster/cache/abc-123.png"}`.
5. **Frontend Lifecycle**: The client reads the stream, dynamically updates the status text on the placeholder card, and finally renders the complete image when the `done` event is received.

---

## 🎫 4. Bite-Sized Tickets (GitHub Issues)

We have broken down the requirements into four distinct, bite-sized issues:

### 🔹 Issue 1: [Backend] Refactor Poster Generation Endpoint to Support Async/Streaming (SSE)
- **Tasks**:
  - Add callback to `src/map_handler/map_fetcher.py`'s `make_poster` method.
  - Implement `/poster/generate` SSE route in `src/map_handler/map_controller.py` to stream updates.
  - Cache generated images as uuid files in `/poster/cache/` and add static route to serve them.

### 🔹 Issue 2: [Frontend] Implement Split-Pane Dashboard UI Layout & Sidebar Controls
- **Tasks**:
  - Refactor `index.html` and `style.css` to build left-side controls panel and right-side grid.
  - Design premium Glassmorphism layout & modern typography (Inter/Outfit).
  - Add location input, radius slider + text box sync, color swatches.

### 🔹 Issue 3: [Frontend] Build Poster Card Gallery, Download & Sharing Actions
- **Tasks**:
  - Implement poster card layout displaying title, coordinates, color indicators.
  - Implement Download button saving file with customized name (e.g. `Paris-France_2000m.png`).
  - Implement Share button (Web Share API + fallback URL copy of query settings).

### 🔹 Issue 4: [Frontend] Integrate Server-Sent Events (SSE) Progress & Skeleton Loaders
- **Tasks**:
  - Spawn skeleton loader card in the gallery immediately upon form submission.
  - Establish `EventSource` connection to `/poster/generate`.
  - Update progress messages in the card dynamically.
  - Replace skeleton card with actual poster card on `done`, or show error state if generation fails.


