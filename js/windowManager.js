class Window {
  /**
   * Constructor for Window
   * @param {string} id - Window ID
   * @param {string} type - Window type (terminal, text, etc.)
   * @param {string} title - Window title
   * @param {Object} options - Window options
   */
  constructor(id, type, title, options = {}) {
    this.id = id;
    this.type = type;
    this.title = title;
    this.options = Object.assign(
      {
        width: 800,
        height: 600,
        x: 0,
        y: 0,
        minWidth: 200,
        minHeight: 150,
        maxWidth: Infinity,
        maxHeight: Infinity,
        resizable: true,
        maximized: false,
        focused: false,
      },
      options
    );

    this.element = document.createElement("div");
    this.element.className = "window";
    this.element.id = `window-${id}`;
    this.element.dataset.type = type;

    this.createWindowElements();
    this.applyStyles();
  }

  /**
   * Create window elements (titlebar, content, etc.)
   */
  createWindowElements() {
    this.titlebar = document.createElement("div");
    this.titlebar.className = "window-titlebar";

    this.titleElement = document.createElement("div");
    this.titleElement.className = "window-title";
    this.titleElement.textContent = this.title;
    this.titlebar.appendChild(this.titleElement);

    this.element.appendChild(this.titlebar);

    this.content = document.createElement("div");
    this.content.className = "window-content";
    this.element.appendChild(this.content);

    this.titlebar.addEventListener("mousedown", this.startDrag.bind(this));
  }

  /**
   * Apply styles to the window
   */
  applyStyles() {
    Object.assign(this.element.style, {
      position: "absolute",
      width: `${this.options.width}px`,
      height: `${this.options.height}px`,
      left: `${this.options.x}px`,
      top: `${this.options.y}px`,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      backgroundColor: "var(--color-bg-secondary)",
      borderRadius: "var(--border-radius-md)",
      boxShadow: "var(--shadow-md)",
      transition: "box-shadow 0.2s ease",
    });

    Object.assign(this.titlebar.style, {
      height: "32px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "var(--color-bg-elevated)",
      borderTopLeftRadius: "var(--border-radius-md)",
      borderTopRightRadius: "var(--border-radius-md)",
      padding: "0 8px",
      cursor: "move",
      userSelect: "none",
    });

    Object.assign(this.content.style, {
      flex: "1",
      overflow: "auto",
      backgroundColor: "var(--color-bg-tertiary)",
      padding: "8px",
    });
  }

  /**
   * Start dragging the window
   * @param {MouseEvent} e - Mouse event
   */
  startDrag(e) {
    e.preventDefault();

    // ensure it's on top with high z-index
    this.focus();
    this.element.style.zIndex = "100"; 

    const startX = e.clientX;
    const startY = e.clientY;

    const startLeft = this.options.x;
    const startTop = this.options.y;

    // Create snap indicators if they don't exist
    try {
      this.createSnapIndicators();
    } catch (err) {
      console.error("Error creating snap indicators:", err);
    }

    // Function to handle mouse movement
    const mouseMoveHandler = (e) => {
      try {
        // Calculate new position
        const newLeft = startLeft + (e.clientX - startX);
        const newTop = startTop + (e.clientY - startY);

        const snapResult = this.checkForSnap(newLeft, newTop);

        // Update window position with snap if needed
        if (snapResult.snapped) {
          this.setPosition(snapResult.x, snapResult.y);
          this.showSnapPreview(snapResult.edge);
        } else {
          this.setPosition(newLeft, newTop);
          this.hideSnapPreviews();
        }
      } catch (err) {
        console.error("Error in mouse move handler:", err);
        // Ensure window is still visible even if there's an error
        this.element.style.display = "flex";
      }
    };

    const mouseUpHandler = () => {
      try {
        // Remove event listeners
        document.removeEventListener("mousemove", mouseMoveHandler);
        document.removeEventListener("mouseup", mouseUpHandler);

        this.hideSnapPreviews();

        // Finalize snap - adjust surrounding windows if needed
        const activeSnapEdge = this.getActiveSnapEdge();
        if (activeSnapEdge) {
          this.finalizeSnap(activeSnapEdge);
        }

        this.element.style.display = "flex";
        this.element.style.visibility = "visible";
        this.element.style.opacity = "1";
        this.element.style.zIndex = "10"; // High z-index to ensure visibility

        // Verify workspace integrity after dragging
        if (
          window.windowManager &&
          window.windowManager.verifyWorkspaceIntegrity
        ) {
          window.windowManager.verifyWorkspaceIntegrity();
        }
      } catch (err) {
        console.error("Error in mouse up handler:", err);
        // Ensure window is still visible even if there's an error
        this.element.style.display = "flex";
      }
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  /**
   * Create snap indicators for the window
   */
  createSnapIndicators() {
    if (!this.snapIndicators) {
      this.snapIndicators = {
        top: document.createElement("div"),
        right: document.createElement("div"),
        bottom: document.createElement("div"),
        left: document.createElement("div"),
      };

      // Get the container (desktop-container)
      const container = this.element.parentNode;

      // Style indicators
      Object.values(this.snapIndicators).forEach((indicator) => {
        indicator.className = "snap-preview";
        indicator.style.position = "absolute";
        indicator.style.backgroundColor =
          "var(--color-accent-blue-transparent)";
        indicator.style.zIndex = "1000"; 
        indicator.style.display = "none";
        container.appendChild(indicator); // Append to container
      });
    }
  }

  /**
   * Check if window should snap to edges or other windows
   * @param {number} x - Proposed x position
   * @param {number} y - Proposed y position
   * @returns {Object} snap result
   */
  checkForSnap(x, y) {
    const result = {
      snapped: false,
      x: x,
      y: y,
      edge: null,
    };

    const snapDistance = 25; // Slightly increase snap distance for better usability
    const windowWidth = this.options.width;
    const windowHeight = this.options.height;

    // Check screen edges first
    const container = this.element.parentNode;
    const screenWidth = container.clientWidth;
    const screenHeight = container.clientHeight;
    const waybarHeight = 0; // Changed from 30 to 0 to fix positioning

    console.log(
      `Checking snap: Window pos (${x}, ${y}), container: ${screenWidth}x${screenHeight}`
    );

    // Left edge
    if (x < snapDistance) {
      result.snapped = true;
      result.x = 0;
      result.edge = "left";
      this.element.classList.add("snapping");
    }

    // Right edge
    else if (x + windowWidth > screenWidth - snapDistance) {
      result.snapped = true;
      result.x = screenWidth - windowWidth;
      result.edge = "right";
      this.element.classList.add("snapping");
    }

    // Top edge
    if (y < snapDistance) {
      result.snapped = true;
      result.y = waybarHeight;
      result.edge = "top";
      this.element.classList.add("snapping");
    }

    // Bottom edge
    else if (y + windowHeight > screenHeight - snapDistance) {
      result.snapped = true;
      result.y = screenHeight - windowHeight - 10; // Keep a 10px margin
      result.edge = "bottom";
      this.element.classList.add("snapping");
    }

    // If not snapped to a screen edge, check other windows
    if (!result.snapped) {
      const thisWindowId = this.id;
      const allWindows = Array.from(
        document.querySelectorAll(".window")
      ).filter((w) => w.id !== `window-${thisWindowId}`);

      for (const otherWindowElem of allWindows) {
        const rect = otherWindowElem.getBoundingClientRect();

        // Check left edge of other window
        if (Math.abs(x + windowWidth - rect.left) < snapDistance) {
          result.snapped = true;
          result.x = rect.left - windowWidth;
          result.edge = "right";
          this.element.classList.add("snapping");
          break;
        }

        // Check right edge of other window
        if (Math.abs(x - (rect.left + rect.width)) < snapDistance) {
          result.snapped = true;
          result.x = rect.left + rect.width;
          result.edge = "left";
          this.element.classList.add("snapping");
          break;
        }

        // Check top edge of other window
        if (Math.abs(y + windowHeight - rect.top) < snapDistance) {
          result.snapped = true;
          result.y = rect.top - windowHeight;
          result.edge = "bottom";
          this.element.classList.add("snapping");
          break;
        }

        // Check bottom edge of other window
        if (Math.abs(y - (rect.top + rect.height)) < snapDistance) {
          result.snapped = true;
          result.y = rect.top + rect.height;
          result.edge = "top";
          this.element.classList.add("snapping");
          break;
        }
      }
    }

    // If not snapping, remove snapping class
    if (!result.snapped) {
      this.element.classList.remove("snapping");
    }

    return result;
  }

  /**
   * Show snap preview for the given edge
   * @param {string} edge - Edge to show preview for
   */
  showSnapPreview(edge) {
    if (!this.snapIndicators) return;

    // Hide all indicators first
    this.hideSnapPreviews();

    if (!edge) return;

    const indicator = this.snapIndicators[edge];
    if (!indicator) return;

    // Get container dimensions
    const container = this.element.parentNode;
    const screenWidth = container.clientWidth;
    const screenHeight = container.clientHeight;
    const waybarHeight = 0; // Using 0 for waybarHeight

    indicator.style.display = "block";

    switch (edge) {
      case "left":
        indicator.style.left = "0";
        indicator.style.top = `${waybarHeight}px`; 
        indicator.style.width = "4px";
        indicator.style.height = `${screenHeight - waybarHeight}px`;
        break;
      case "right":
        indicator.style.left = `${screenWidth - 4}px`;
        indicator.style.top = `${waybarHeight}px`; 
        indicator.style.width = "4px";
        indicator.style.height = `${screenHeight - waybarHeight}px`;
        break;
      case "top":
        indicator.style.left = "0";
        indicator.style.top = `${waybarHeight}px`; 
        indicator.style.width = `${screenWidth}px`;
        indicator.style.height = "4px";
        break;
      case "bottom":
        indicator.style.left = "0";
        indicator.style.top = `${screenHeight - 4}px`;
        indicator.style.width = `${screenWidth}px`;
        indicator.style.height = "4px";
        break;
    }

    // Store active edge for finalization
    this.activeSnapEdge = edge;
  }

  /**
   * Hide all snap previews
   */
  hideSnapPreviews() {
    if (!this.snapIndicators) return;

    Object.values(this.snapIndicators).forEach((indicator) => {
      indicator.style.display = "none";
    });
  }

  /**
   * Get the currently active snap edge
   * @returns {string|null} active edge
   */
  getActiveSnapEdge() {
    return this.activeSnapEdge || null;
  }

  /**
   * Finalize a snap by adjusting this window and potentially others
   * @param {string} edge - Edge to snap to
   */
  finalizeSnap(edge) {
    // Remove active edge reference
    this.activeSnapEdge = null;

    // Calculate screen dimensions using the container element
    const container = this.element.parentNode;
    const screenWidth = container.clientWidth;
    const screenHeight = container.clientHeight;
    const waybarHeight = 0; 

    // Leave a small margin at the bottom
    const safeHeight = screenHeight - 10;

    console.log(
      `Snapping to ${edge}, container size: ${screenWidth}x${screenHeight}`
    );

    this.element.classList.remove(
      "snap-left",
      "snap-right",
      "snap-top",
      "snap-bottom"
    );

    // Store current position and size for logging
    const oldX = this.options.x;
    const oldY = this.options.y;
    const oldWidth = this.options.width;
    const oldHeight = this.options.height;

    switch (edge) {
      case "left":
        // Snap to left half of screen
        this.setPosition(0, waybarHeight, true);
        this.setSize(screenWidth / 2, safeHeight - waybarHeight);
        this.element.classList.add("snap-left");
        break;
      case "right":
        // Snap to right half of screen
        this.setPosition(screenWidth / 2, waybarHeight, true);
        this.setSize(screenWidth / 2, safeHeight - waybarHeight);
        this.element.classList.add("snap-right");
        break;
      case "top":
        // Snap to top half of screen
        this.setPosition(0, waybarHeight, true);
        this.setSize(screenWidth, (safeHeight - waybarHeight) / 2);
        this.element.classList.add("snap-top");
        break;
      case "bottom":
        // Snap to bottom half of screen
        this.setPosition(
          0,
          waybarHeight + (safeHeight - waybarHeight) / 2,
          true
        );
        this.setSize(screenWidth, (safeHeight - waybarHeight) / 2);
        this.element.classList.add("snap-bottom");
        break;
    }

    // Mark window as snapped
    this.element.classList.add("snapped");

    // EXPLICITLY ENSURE WINDOW IS VISIBLE
    this.element.style.display = "flex";
    this.element.style.visibility = "visible";
    this.element.style.opacity = "1";
    this.element.style.zIndex = "10"; 

    // Force reflow
    void this.element.offsetHeight;

    console.log(
      `Window position changed from (${oldX}, ${oldY}) → (${this.options.x}, ${this.options.y})`
    );
    console.log(
      `Window size changed from ${oldWidth}x${oldHeight} → ${this.options.width}x${this.options.height}`
    );

    // Dispatch event to notify that a window has been snapped
    const event = new CustomEvent("window-snapped", {
      detail: {
        windowId: this.id,
        edge: edge,
      },
    });
    document.dispatchEvent(event);
  }

  /**
   * Set window position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {boolean} isSnapping - Whether this position change is part of a snap operation
   */
  setPosition(x, y, isSnapping = false) {
    // Ensure window stays within viewport
    const container = this.element.parentNode;
    const maxX = container.clientWidth - this.options.width;
    const maxY = container.clientHeight - this.options.height;

    this.options.x = Math.max(0, Math.min(x, maxX));
    this.options.y = Math.max(0, Math.min(y, maxY));

    this.element.style.left = `${this.options.x}px`;
    this.element.style.top = `${this.options.y}px`;

    // Ensure the window is visible by setting these additional properties
    this.element.style.visibility = "visible";
    this.element.style.opacity = "1";

    // If this is a manual move (not from snapping), remove the snapped class
    if (!isSnapping) {
      this.element.classList.remove("snapped");
    }
  }

  /**
   * Set window size
   * @param {number} width - Width
   * @param {number} height - Height
   */
  setSize(width, height) {
    // Get container dimensions
    const container = this.element.parentNode;
    const maxWidth = container.clientWidth;
    const maxHeight = container.clientHeight;

    // Enforce min/max constraints
    width = Math.max(
      this.options.minWidth,
      Math.min(width, this.options.maxWidth, maxWidth)
    );
    height = Math.max(
      this.options.minHeight,
      Math.min(height, this.options.maxHeight, maxHeight)
    );

    this.options.width = width;
    this.options.height = height;

    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
  }

  /**
   * Focus the window
   */
  focus() {
    // Get all windows and lower their z-index first
    const allWindows = document.querySelectorAll(".window");
    allWindows.forEach((win) => {
      if (win.id !== `window-${this.id}`) {
        win.style.zIndex = "1";
      }
    });

    // Update z-index to be higher than all other windows
    this.element.style.zIndex = "10";
    this.element.style.boxShadow = "var(--shadow-lg)";
    this.options.focused = true;

    this.element.style.display = "flex";
    this.element.style.visibility = "visible";
    this.element.style.opacity = "1";

    // Dispatch focus event
    const event = new CustomEvent("window-focus", {
      detail: { windowId: this.id },
    });
    document.dispatchEvent(event);
  }

  /**
   * Blur the window
   */
  blur() {
    this.element.style.zIndex = "1";
    this.element.style.boxShadow = "var(--shadow-md)";
    this.options.focused = false;
  }

  /**
   * Minimize the window
   */
  minimize() {
    // For now just hide the window
    this.element.style.display = "none";

    // Dispatch minimize event
    const event = new CustomEvent("window-minimize", {
      detail: { windowId: this.id },
    });
    document.dispatchEvent(event);
  }

  /**
   * Toggle maximize state
   */
  toggleMaximize() {
    if (this.options.maximized) {
      // Restore window
      this.element.style.width = `${this.options.width}px`;
      this.element.style.height = `${this.options.height}px`;
      this.element.style.left = `${this.options.x}px`;
      this.element.style.top = `${this.options.y}px`;
      this.options.maximized = false;
    } else {
      // Maximize window
      const waybarHeight = 0; 

      // Calculate safe dimensions
      const containerHeight = this.element.parentNode.clientHeight;
      const safeHeight = containerHeight - 10; // Keep a 10px margin at the bottom

      this.element.style.width = "100%";
      this.element.style.height = `${safeHeight}px`;
      this.element.style.left = "0";
      this.element.style.top = `${waybarHeight}px`;

      console.log(`Maximized window to height: ${safeHeight}px`);

      this.options.maximized = true;
    }

    // Dispatch maximize event
    const event = new CustomEvent("window-maximize", {
      detail: {
        windowId: this.id,
        maximized: this.options.maximized,
      },
    });
    document.dispatchEvent(event);
  }

  /**
   * Close the window
   */
  close() {
    // Add closing animation
    this.element.classList.add("closing");

    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      // Remove from DOM
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }

      // Dispatch close event
      const event = new CustomEvent("window-close", {
        detail: { windowId: this.id },
      });
      document.dispatchEvent(event);
    }, 200); // Match animation duration from CSS
  }

  /**
   * Set window content
   * @param {HTMLElement} content - Content element
   */
  setContent(content) {
    // Clear current content
    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild);
    }

    // Ensure content fills the entire container
    content.style.width = "100%";
    content.style.height = "100%";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.overflow = "hidden";

    // Add new content
    this.content.appendChild(content);
  }
}

/**
 * WindowManager class for managing windows
 */
class WindowManager {
  /**
   * Constructor for WindowManager
   */
  constructor() {
    this.windows = new Map();
    this.activeWindowId = null;
    this.container = document.getElementById("desktop-container");
    this.nextWindowId = 1;

    // Create separate containers for each workspace (nuclear approach)
    this.workspaceContainers = {};
    for (let ws = 1; ws <= 6; ws++) {
      const container = document.createElement("div");
      container.id = `workspace-container-${ws}`;
      container.className = "workspace-container";
      container.style.position = "absolute";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.display = "none"; // Hide initially
      this.container.appendChild(container);
      this.workspaceContainers[ws] = container;
    }

    // Track windows by workspace
    this.workspaceWindows = {
      1: new Set(), // Workspace 1: Home/Intro
      2: new Set(), // Workspace 2: Projects
      3: new Set(), // Workspace 3: Skills
      4: new Set(), // Workspace 4: Contact
      5: new Set(), // Workspace 5: Contact
      6: new Set(), // Workspace 6: Interactive Terminal
    };

    // Current active workspace
    this.currentWorkspace = 1;

    // Show the first workspace container
    this.workspaceContainers[1].style.display = "block";

    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Handle window focus
    document.addEventListener("window-focus", (e) => {
      const { windowId } = e.detail;

      // Blur all other windows
      this.windows.forEach((window, id) => {
        if (id !== windowId) {
          window.blur();
        }
      });

      this.activeWindowId = windowId;
    });

    // Handle window close
    document.addEventListener("window-close", (e) => {
      const { windowId } = e.detail;

      // Remove from windows map
      this.windows.delete(windowId);

      // If this was the active window, activate another window
      if (this.activeWindowId === windowId) {
        const nextWindow = Array.from(this.windows.values())[0];
        if (nextWindow) {
          nextWindow.focus();
        } else {
          this.activeWindowId = null;
        }
      }
    });

    // Handle window snapping
    document.addEventListener("window-snapped", (e) => {
      const { windowId, edge } = e.detail;
      this.handleWindowSnapped(windowId, edge);
    });
  }

  /**
   * Handle window snapped event
   * This will adjust other windows when one window snaps to an edge.
   * @param {number} windowId - ID of the snapped window
   * @param {string} edge - Edge that was snapped to
   */
  handleWindowSnapped(windowId, edge) {
    const window = this.getWindow(windowId);
    if (!window) return;

    // Add snapped class to the window
    window.element.classList.add("snapped");

    const desktopContainer = document.getElementById("desktop-container");
    const screenWidth = desktopContainer.clientWidth;
    const screenHeight = desktopContainer.clientHeight;
    const waybarHeight = 0;

    // Bottom safety margin
    const safeHeight = screenHeight - 10;

    // Get all other windows
    const otherWindows = Array.from(this.windows.values()).filter(
      (w) => w.id !== windowId
    );

    // Skip if no other windows to adjust
    if (otherWindows.length === 0) return;

    console.log(`Window snapped to ${edge}, adjusting other windows`);

    // Focus on the most recently used other window
    const otherWindow = otherWindows[0];

    switch (edge) {
      case "left":
        // If window snapped to left edge, tile the next active window to the right
        otherWindow.setPosition(screenWidth / 2, waybarHeight, true);
        otherWindow.setSize(screenWidth / 2, safeHeight - waybarHeight);
        otherWindow.element.classList.add("snapped", "snap-right");
        break;

      case "right":
        // If window snapped to right edge, tile the next active window to the left
        otherWindow.setPosition(0, waybarHeight, true);
        otherWindow.setSize(screenWidth / 2, safeHeight - waybarHeight);
        otherWindow.element.classList.add("snapped", "snap-left");
        break;

      case "top":
        // If window snapped to top edge, tile the next active window to the bottom
        otherWindow.setPosition(
          0,
          waybarHeight + (safeHeight - waybarHeight) / 2,
          true
        );
        otherWindow.setSize(screenWidth, (safeHeight - waybarHeight) / 2);
        otherWindow.element.classList.add("snapped", "snap-bottom");
        break;

      case "bottom":
        // If window snapped to bottom edge, tile the next active window to the top
        otherWindow.setPosition(0, waybarHeight, true);
        otherWindow.setSize(screenWidth, (safeHeight - waybarHeight) / 2);
        otherWindow.element.classList.add("snapped", "snap-top");
        break;
    }

    // Ensure the other window is visible
    otherWindow.element.style.display = "flex";
    otherWindow.element.style.visibility = "visible";
    otherWindow.element.style.opacity = "1";
    otherWindow.element.style.zIndex = "5"; // Lower than the main window but still visible

    // Show notification about the snapping
    if (typeof window.showNotification === "function") {
      window.showNotification(`Windows tiled to ${edge} edge`, "info", 1500);
    }
  }

  /**
   * Create a new window
   * @param {string} type - Window type
   * @param {string} title - Window title
   * @param {Object} options - Window options
   * @param {number} workspace - Workspace to add window to (defaults to current)
   * @returns {Window|null} new window or null on error
   */
  createWindow(type, title, options = {}, workspace = null) {
    try {
      // Generate window ID
      const id = this.nextWindowId++;

      // Set default position if not specified
      if (!options.x || !options.y) {
        // If this is not the first window, cascade from the last window
        if (this.windows.size > 0) {
          const lastWindow = Array.from(this.windows.values())[
            this.windows.size - 1
          ];
          options.x = (lastWindow.options.x + 30) % (window.innerWidth - 400);
          options.y = (lastWindow.options.y + 30) % (window.innerHeight - 300);
        } else {
          // First window - center it
          options.x = Math.max(
            0,
            Math.floor((window.innerWidth - (options.width || 800)) / 2)
          );
          options.y = Math.max(
            0,
            Math.floor((window.innerHeight - (options.height || 600)) / 3)
          );
        }
      }

      // Determine target workspace
      const targetWorkspace =
        workspace !== null ? workspace : this.currentWorkspace;

      console.log(
        `Creating window of type ${type} with title "${title}" in workspace ${targetWorkspace}`
      );

      // Create window
      const windowInstance = new Window(id, type, title, options);

      // Get the workspace-specific container
      const workspaceContainer = this.workspaceContainers[targetWorkspace];

      // Add the window to its workspace container
      try {
        workspaceContainer.appendChild(windowInstance.element);
        console.log(
          `Added window ${id} to workspace container ${targetWorkspace}`
        );
      } catch (error) {
        console.error(
          `Error appending window to workspace container: ${error.message}`
        );
        return null;
      }

      // Add to windows map
      this.windows.set(id, windowInstance);

      // Track window by workspace
      this.workspaceWindows[targetWorkspace].add(id);

      console.log(`Added window ${id} to workspace ${targetWorkspace}`);
      console.log(
        `Windows in workspace ${targetWorkspace}:`,
        Array.from(this.workspaceWindows[targetWorkspace])
      );

      // Focus the window if it's in the current workspace
      if (targetWorkspace === this.currentWorkspace) {
        windowInstance.focus();
      }

      // Create content based on window type
      try {
        this.createWindowContent(windowInstance, type);
      } catch (error) {
        console.error(`Error creating window content: ${error.message}`);
        // Add a fallback error message to the window
        const errorElement = document.createElement("div");
        errorElement.className = "window-error";
        errorElement.innerHTML = `
          <div class="error-icon">⚠️</div>
          <h3>Error Loading Content</h3>
          <p>Could not load ${type} content.</p>
          <p class="error-details">${error.message}</p>
        `;
        windowInstance.setContent(errorElement);
      }

      // Add data attribute for workspace tracking
      windowInstance.element.dataset.workspace = targetWorkspace;

      return windowInstance;
    } catch (error) {
      console.error(`Failed to create window: ${error.message}`);
      // Show notification of failure
      if (typeof window.showNotification === "function") {
        window.showNotification(
          `Failed to create ${type} window: ${error.message}`,
          "error"
        );
      }
      return null;
    }
  }

  /**
   * Create content for a window based on its type
   * @param {Window} window - Window object
   * @param {string} type - Window type
   */
  createWindowContent(window, type) {
    let contentElement;
    console.log(`Creating window content for ${type}, window ID: ${window.id}`);

    switch (type) {
      case "terminal":
        // Create terminal element
        const terminalElem = document.createElement("div");
        terminalElem.className = "terminal-container";

        // Ensure terminal container fills the window properly
        terminalElem.style.height = "100%";
        terminalElem.style.display = "flex";
        terminalElem.style.flexDirection = "column";

        window.setContent(terminalElem);
        contentElement = terminalElem;
        break;

      case "text":
        // Create text editor element
        const editorElem = document.createElement("div");
        editorElem.className = "editor-container";
        const textarea = document.createElement("textarea");
        textarea.className = "text-editor";
        editorElem.appendChild(textarea);
        window.setContent(editorElem);
        contentElement = editorElem;
        break;

      default:
        // Create generic content
        const genericElem = document.createElement("div");
        genericElem.textContent = `Window content for type: ${type}`;
        window.setContent(genericElem);
        contentElement = genericElem;
    }

    // Dispatch an event to indicate that the window content is ready
    console.log(
      `Dispatching window-content-ready event for ${type}, window ID: ${window.id}`
    );
    const event = new CustomEvent("window-content-ready", {
      detail: {
        windowId: window.id,
        type: type,
        container: contentElement,
      },
    });
    document.dispatchEvent(event);
  }

  /**
   * Get window by ID
   * @param {string} id - Window ID
   * @returns {Window|undefined} window
   */
  getWindow(id) {
    return this.windows.get(id);
  }

  /**
   * Get the active window
   * @returns {Window|undefined} active window
   */
  getActiveWindow() {
    if (this.activeWindowId === null) {
      return undefined;
    }

    const activeWindow = this.windows.get(this.activeWindowId);

    if (activeWindow) {
      // Safety check - ensure the window is properly positioned
      this._ensureWindowSafePosition(activeWindow);
    }

    return activeWindow;
  }

  /**
   * Ensure window is properly positioned and sized to stay visible
   * @param {Window} window - Window to check
   * @private
   */
  _ensureWindowSafePosition(window) {
    if (!window) return;

    const waybarHeight = 0; 
    const containerHeight = this.container.clientHeight;
    const containerWidth = this.container.clientWidth;

    // Ensure the window isn't positioned below viewport
    if (window.options.y + window.options.height > containerHeight) {
      const newHeight = containerHeight - window.options.y - 10;
      if (newHeight >= window.options.minHeight) {
        window.setSize(window.options.width, newHeight);
      } else {
        window.setPosition(
          window.options.x,
          Math.max(waybarHeight, containerHeight - window.options.height - 10)
        );
      }
    }

    // Ensure maximized windows respect safe sizes
    if (window.options.maximized) {
      const safeHeight = containerHeight - 10;
      window.element.style.height = `${safeHeight}px`;
      window.element.style.top = `${waybarHeight}px`;
    }
  }

  /**
   * Close a window by ID
   * @param {string} id - Window ID
   * @returns {boolean} success
   */
  closeWindow(id) {
    const window = this.windows.get(id);
    if (!window) {
      return false;
    }

    console.log(`Closing window ${id}`);

    // Get the workspace this window belongs to
    let windowWorkspace = null;
    for (const workspace in this.workspaceWindows) {
      if (this.workspaceWindows[workspace].has(id)) {
        windowWorkspace = parseInt(workspace);
        break;
      }
    }

    console.log(`Window ${id} belongs to workspace ${windowWorkspace}`);

    // Only remove from specific workspace
    if (windowWorkspace !== null) {
      this.workspaceWindows[windowWorkspace].delete(id);
      console.log(`Removed window ${id} from workspace ${windowWorkspace}`);
      console.log(
        `Remaining windows in workspace ${windowWorkspace}:`,
        Array.from(this.workspaceWindows[windowWorkspace])
      );
    }

    window.close();

    // Remove from windows map
    setTimeout(() => {
      this.windows.delete(id);
      console.log(`Deleted window ${id} from windows map`);
    }, 250);

    return true;
  }

  /**
   * Arrange windows in a tiling layout
   * @param {string} layout - Layout type (horizontal, vertical, grid)
   */
  tileWindows(layout = "horizontal") {
    const windows = Array.from(this.windows.values());
    const count = windows.length;

    if (count === 0) {
      return;
    }

    // Get container dimensions with proper waybar offset
    const waybarHeight = 0; // Changed from 30 to 0 to fix positioning
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;

    // Keep a small margin at the bottom to prevent windows from going below screen
    const safeHeight = containerHeight - 10;

    console.log(
      `Tiling windows: ${layout}, container: ${containerWidth}x${containerHeight}`
    );

    // Remove any existing snap classes from all windows
    windows.forEach((window) => {
      window.element.classList.remove(
        "snap-left",
        "snap-right",
        "snap-top",
        "snap-bottom"
      );
    });

    switch (layout) {
      case "horizontal":
        // Arrange windows horizontally
        const windowWidth = containerWidth / count;
        windows.forEach((window, index) => {
          window.setPosition(index * windowWidth, waybarHeight, true);
          window.setSize(windowWidth, safeHeight - waybarHeight);

          // Apply appropriate snap classes based on position
          if (index === 0) {
            window.element.classList.add("snap-left");
          } else if (index === count - 1) {
            window.element.classList.add("snap-right");
          }
        });
        break;

      case "vertical":
        // Arrange windows vertically
        const windowHeight = safeHeight / count;
        windows.forEach((window, index) => {
          window.setPosition(0, waybarHeight + index * windowHeight, true);
          window.setSize(containerWidth, windowHeight);

          // Apply appropriate snap classes based on position
          if (index === 0) {
            window.element.classList.add("snap-top");
          } else if (index === count - 1) {
            window.element.classList.add("snap-bottom");
          }
        });
        break;

      case "grid":
        // Arrange windows in a grid
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const gridWidth = containerWidth / cols;
        const gridHeight = (safeHeight - waybarHeight) / rows;

        windows.forEach((window, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          window.setPosition(
            col * gridWidth,
            waybarHeight + row * gridHeight,
            true
          );
          window.setSize(gridWidth, gridHeight);

          // Apply appropriate snap classes for grid edges
          if (col === 0) {
            window.element.classList.add("snap-left");
          } else if (col === cols - 1) {
            window.element.classList.add("snap-right");
          }

          if (row === 0) {
            window.element.classList.add("snap-top");
          } else if (row === rows - 1) {
            window.element.classList.add("snap-bottom");
          }
        });
        break;
    }

    windows.forEach((window) => {
      window.element.classList.add("snapped");
    });
  }

  /**
   * Handle window errors
   * @param {Window} window - Window instance
   * @param {Error} error - Error object
   * @private
   */
  _handleWindowError(window, error) {
    console.error(`Window error (ID ${window.id}): ${error.message}`);

    if (!this.windows.has(window.id)) return;

    window.element.classList.add("window-error-state");

    // Create error message
    const errorMsg = document.createElement("div");
    errorMsg.className = "window-error-message";
    errorMsg.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <p>${error.message}</p>
        <div class="error-actions">
          <button class="error-close">Close Window</button>
          <button class="error-retry">Retry</button>
        </div>
      </div>
    `;

    window.element.appendChild(errorMsg);

    const closeBtn = errorMsg.querySelector(".error-close");
    const retryBtn = errorMsg.querySelector(".error-retry");

    closeBtn.addEventListener("click", () => window.close());
    retryBtn.addEventListener("click", () => {
      window.element.removeChild(errorMsg);
      window.element.classList.remove("window-error-state");

      try {
        this.createWindowContent(window, window.type);
      } catch (e) {
        this._handleWindowError(window, e);
      }
    });
  }

  /**
   * Reinitialize the window manager
   * Call this method if the window manager is in an unusable state
   */
  reinitialize() {
    console.log("Reinitializing window manager");

    // Close all windows
    this.windows.forEach((window) => {
      try {
        if (window.element.parentNode) {
          window.element.parentNode.removeChild(window.element);
        }
      } catch (err) {
        console.error(`Error removing window: ${err.message}`);
      }
    });

    this.windows.clear();

    this.activeWindowId = null;

    if (typeof window.showNotification === "function") {
      window.showNotification("Window manager reinitialized", "info");
    }

    this.createWindow("terminal", "Terminal");
  }

  /**
   * Switch to a workspace with nuclear approach using separate containers
   * @param {number} workspaceId - Workspace ID to switch to
   */
  switchToWorkspace(workspaceId) {
    if (workspaceId < 1 || workspaceId > 6) {
      console.error(`Invalid workspace ID: ${workspaceId}`);
      return;
    }

    console.log(
      `Switching to workspace ${workspaceId} from ${this.currentWorkspace}`
    );

    // hide current workspace container
    this.workspaceContainers[this.currentWorkspace].style.display = "none";

    // show new workspace container
    this.workspaceContainers[workspaceId].style.display = "block";

    this.currentWorkspace = workspaceId;

    // make windows visible in the current workspace
    const workspaceWindowIds = this.workspaceWindows[workspaceId];

    // focus the last focused window in this workspace if any
    if (workspaceWindowIds.size > 0) {
      const lastWindowId = Array.from(workspaceWindowIds).pop();
      const lastWindow = this.windows.get(lastWindowId);
      if (lastWindow) {
        lastWindow.focus();
      }
    }
  }

  /**
   * Initialize workspace with predefined windows and layouts.
   * This creates a terminal window specific to the workspace.
   * @param {number} workspaceId - Workspace ID to initialize
   */
  initializeWorkspace(workspaceId) {
    // clear existing windows in this workspace
    this.workspaceWindows[workspaceId].forEach((windowId) => {
      this.closeWindow(windowId);
    });

    this.workspaceWindows[workspaceId].clear();

    // Terminal commands for each workspace
    const workspaceCommands = {
      1: "neofetch",
      2: "about",
      3: "projects",
      4: "skills",
      5: "contact",
      6: "help",
    };

    // names for each workspace terminal
    const workspaceNames = {
      1: "Welcome to Hyprfolio",
      2: "About Me",
      3: "Projects",
      4: "Skills",
      5: "Contact",
      6: "Interactive Terminal",
    };

    // measure the viewport size correctly using the workspace container
    const waybarHeight = 0;
    const workspaceContainer = this.workspaceContainers[workspaceId];
    const viewportWidth =
      workspaceContainer.clientWidth || this.container.clientWidth;
    const viewportHeight =
      workspaceContainer.clientHeight || this.container.clientHeight;

    // safe area for windows to ensure they stay in view
    const safeHeight = viewportHeight - 10;

    console.log(`Viewport size: ${viewportWidth}x${viewportHeight}`);

    // create a terminal for the workspace
    if (workspaceId >= 1 && workspaceId <= 6) {
      let windowOptions;

      // for workspace 6 (interactive), create a normal sized terminal
      if (workspaceId === 6) {
        windowOptions = {
          width: Math.min(800, viewportWidth - 20),
          height: Math.min(600, safeHeight - waybarHeight),
          x: 10,
          y: waybarHeight + 10,
          maximized: false,
        };
      } else {
        // Ensure exact positioning for all other workspaces (1-5) with restricted height
        windowOptions = {
          width: viewportWidth,
          height: safeHeight,
          x: 0,
          y: waybarHeight,
          maximized: true,
        };
      }

      const terminal = this.createWindow(
        "terminal",
        workspaceNames[workspaceId],
        windowOptions,
        workspaceId
      );

      // Make sure the terminal is visible and properly positioned
      if (terminal && terminal.element) {
        terminal.element.style.display = "flex";
        terminal.element.style.visibility = "visible";
        terminal.element.style.opacity = "1";

        // force correct positioning for non-interactive terminals (workspaces 1-5)
        if (workspaceId !== 6) {
          terminal.element.style.left = "0";
          terminal.element.style.top = `${waybarHeight}px`;
          terminal.element.style.width = "100%";
          terminal.element.style.height = `${safeHeight}px`;

          console.log(
            `Positioned window for workspace ${workspaceId} at height: ${safeHeight}px`
          );

          // ensure the window is truly maximized
          if (!terminal.options.maximized) {
            terminal.options.maximized = true;
          }
        }
      }

      const command = workspaceCommands[workspaceId];

      // function to execute command in the terminal
      const runCommand = () => {
        if (terminal && window.terminal) {
          const terminalObj = window.terminal.getTerminal(terminal.id);
          if (terminalObj) {
            console.log(
              `Running ${command} on workspace ${workspaceId} terminal`
            );
            terminalObj.executeCommand(command);
            return true;
          }
        }
        return false;
      };

      // try to execute command with retry logic
      setTimeout(() => {
        if (!runCommand()) {
          // try again after 1, 2 seconds if first attempt failed
          setTimeout(() => {
            if (!runCommand()) {
              setTimeout(runCommand, 2000);
            }
          }, 1000);
        }
      }, 500);
    }
  }

  /**
   * Force visibility of all windows in the current workspace
   */
  forceWindowVisibility() {
    // Find windows in current workspace
    const workspaceWindowIds = this.workspaceWindows[this.currentWorkspace];

    workspaceWindowIds.forEach((windowId) => {
      const windowInstance = this.windows.get(windowId);
      if (windowInstance) {
        console.log(`Forcing visibility of window ${windowId}`);

        // Make window fully visible with multiple CSS properties
        windowInstance.element.style.display = "flex";
        windowInstance.element.style.visibility = "visible";
        windowInstance.element.style.opacity = "1";
        windowInstance.element.style.zIndex = "2"; // Above default

        windowInstance.element.style.transform = "none";

        const waybarHeight = 0;
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;

        const maxX = containerWidth - windowInstance.options.width;
        const maxY = containerHeight - windowInstance.options.height;

        if (
          windowInstance.options.x < 0 ||
          windowInstance.options.x > maxX ||
          windowInstance.options.y < 0 ||
          windowInstance.options.y > maxY
        ) {
          console.log(`Window ${windowId} was off-screen, repositioning`);
          windowInstance.setPosition(
            Math.max(0, Math.min(windowInstance.options.x, maxX)),
            Math.max(waybarHeight, Math.min(windowInstance.options.y, maxY))
          );
        }
      }
    });
  }

  verifyWorkspaceIntegrity() {
    console.log("Verifying workspace integrity...");

    // check if any window exists in multiple workspaces
    const windowWorkspaces = new Map(); // windowId -> set of workspaces it belongs to

    // create a map of which windows belong to which workspaces
    for (let ws = 1; ws <= 6; ws++) {
      const workspaceWindows = this.workspaceWindows[ws];
      workspaceWindows.forEach((windowId) => {
        if (!windowWorkspaces.has(windowId)) {
          windowWorkspaces.set(windowId, new Set());
        }
        windowWorkspaces.get(windowId).add(ws);
      });
    }

    // check for windows in multiple workspaces and fix
    let fixed = 0;
    windowWorkspaces.forEach((workspaces, windowId) => {
      if (workspaces.size > 1) {
        console.warn(
          `Window ${windowId} exists in multiple workspaces: ${Array.from(
            workspaces
          )}`
        );

        // fix: keep it only in the current workspace or the first workspace it belongs to
        const keepWorkspace = workspaces.has(this.currentWorkspace)
          ? this.currentWorkspace
          : Array.from(workspaces)[0];

        // Remove from all other workspaces
        workspaces.forEach((ws) => {
          if (ws !== keepWorkspace) {
            this.workspaceWindows[ws].delete(windowId);
            console.log(`Removed window ${windowId} from workspace ${ws}`);
            fixed++;
          }
        });
      }
    });

    // check for windows that exist in the windows map but aren't in any workspace
    this.windows.forEach((window, windowId) => {
      if (!windowWorkspaces.has(windowId)) {
        console.warn(
          `Window ${windowId} exists in windows map but is not assigned to any workspace`
        );

        // fix: assign to current workspace
        this.workspaceWindows[this.currentWorkspace].add(windowId);
        console.log(
          `Added window ${windowId} to current workspace ${this.currentWorkspace}`
        );
        fixed++;
      }
    });

    // check for workspace entries that don't exist in the windows map
    for (let ws = 1; ws <= 6; ws++) {
      const workspaceWindows = this.workspaceWindows[ws];
      workspaceWindows.forEach((windowId) => {
        if (!this.windows.has(windowId)) {
          console.warn(
            `Window ${windowId} is assigned to workspace ${ws} but doesn't exist in windows map`
          );

          // Fix: Remove from workspace
          this.workspaceWindows[ws].delete(windowId);
          console.log(
            `Removed non-existent window ${windowId} from workspace ${ws}`
          );
          fixed++;
        }
      });
    }

    if (fixed > 0) {
      console.log(`Fixed ${fixed} workspace integrity issues`);
      // Re-render current workspace to apply fixes
      this.switchToWorkspace(this.currentWorkspace);
    } else {
      console.log("Workspace integrity check completed. No issues found.");
    }
  }

  /**
   * Emergency repair function to fix window manager issues
   * This completely rebuilds all workspaces from scratch
   */
  repairWindowManager() {
    console.log("EMERGENCY REPAIR: Rebuilding window workspaces");

    // save information about existing windows
    const windowInfo = [];
    this.windows.forEach((window, id) => {
      windowInfo.push({
        id,
        type: window.type,
        title: window.title,
        options: { ...window.options },
        workspace: null,
      });

      // Find which workspace this window belongs to
      for (let ws = 1; ws <= 6; ws++) {
        if (this.workspaceWindows[ws].has(id)) {
          windowInfo[windowInfo.length - 1].workspace = ws;
          break;
        }
      }

      // if no workspace found, assign to current
      if (windowInfo[windowInfo.length - 1].workspace === null) {
        windowInfo[windowInfo.length - 1].workspace = this.currentWorkspace;
      }
    });

    console.log("Window info saved:", windowInfo);

    // close all existing windows
    const windowsToClose = Array.from(this.windows.keys());
    windowsToClose.forEach((id) => {
      const window = this.windows.get(id);
      if (window && window.element && window.element.parentNode) {
        window.element.parentNode.removeChild(window.element);
      }
    });

    this.windows.clear();
    for (let ws = 1; ws <= 6; ws++) {
      this.workspaceWindows[ws].clear();
    }

    // recreate windows with correct workspace assignment
    windowInfo.forEach((info) => {
      this.createWindow(info.type, info.title, info.options, info.workspace);
    });

    this.switchToWorkspace(this.currentWorkspace);

    console.log("Window manager repair complete");

    // Show notification if available
    if (typeof window.showNotification === "function") {
      window.showNotification("Window manager repaired", "success", 2000);
    }
  }
}

/**
 * Initialize the window manager
 * @returns {Object} window manager interface
 */
export function initializeWindowManager() {
  console.log("Initializing window manager");
  const wm = new WindowManager();

  //  initialize terminal after content is ready
  let terminalCommandHandler = null;
  document.addEventListener("register-terminal-handler", (e) => {
    terminalCommandHandler = e.detail.handler;
  });

  // Dispatch event when terminal windows are created for other modules to initialize them
  document.addEventListener("window-content-ready", (e) => {
    const { windowId, type, container } = e.detail;
    if (type === "terminal" && terminalCommandHandler) {
      // let the terminal module know it should initialize this terminal
      const event = new CustomEvent("initialize-terminal", {
        detail: {
          windowId,
          container,
          handler: terminalCommandHandler,
        },
      });
      document.dispatchEvent(event);
    }
  });

  // Public API
  return {
    createWindow: (type, title, options, workspace) =>
      wm.createWindow(type, title, options, workspace),
    closeWindow: (id) => wm.closeWindow(id),
    tileWindows: (layout) => wm.tileWindows(layout),
    getActiveWindow: () => wm.getActiveWindow(),
    initializeWorkspace: (id) => wm.initializeWorkspace(id),
    switchToWorkspace: (id) => wm.switchToWorkspace(id),
    getWindow: (id) => wm.getWindow(id),
    forceWindowVisibility: () => wm.forceWindowVisibility(),
    verifyWorkspaceIntegrity: () => wm.verifyWorkspaceIntegrity(),
    repairWindowManager: () => wm.repairWindowManager(),
  };
}
