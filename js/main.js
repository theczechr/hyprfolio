// I  use Arch btw
// Import other modules
import { initializeTerminal } from "./terminal.js";
import { initializeFileSystem } from "./fileSystem.js";
import { initializeWindowManager } from "./windowManager.js";
import { registerCommands } from "./commands.js";

// App state
const AppState = {
  isBooted: false,
  isLoggedIn: false,
  theme: "dark",
  mobileSimplified: false,
  user: {
    name: "john_pork",
    hostname: "hyprfolio",
  },
  activeKeybindings: {},
  currentWorkspace: null,
};

/**
 * Initialize Waybar (top status bar)
 */
function initializeWaybar() {
  // Update clock
  const clockElement = document.querySelector("#waybar .clock");
  updateClock();

  // Update clock every second
  setInterval(updateClock, 1000);

  // Initialize workspaces
  const workspaceButtons = document.querySelector("#waybar .workspace-buttons");
  for (let i = 1; i <= 6; i++) {
    const workspace = document.createElement("div");
    workspace.classList.add("workspace");
    workspace.textContent = i;
    workspace.dataset.id = i;
    workspace.addEventListener("click", () => switchWorkspace(i));
    workspaceButtons.appendChild(workspace);
  }

  // Set first workspace as active
  workspaceButtons.querySelector(".workspace").classList.add("active");

  // Make brand name clickable to go to home workspace (Workspace 1)
  const brandNameElement = document.getElementById("waybar-brand-name");
  if (brandNameElement) {
    brandNameElement.addEventListener("click", () => {
      switchWorkspace(1);
    });
  }
}

/**
 * Update the clock in the waybar
 */
function updateClock() {
  const clockElement = document.querySelector("#waybar .clock");
  if (clockElement) {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
}

/**
 * Switch to a different workspace
 */
function switchWorkspace(id) {
  // Update active workspace in waybar
  const workspaces = document.querySelectorAll("#waybar .workspace");
  workspaces.forEach((ws) => {
    ws.classList.toggle("active", ws.dataset.id == id);
  });

  // Store current workspace ID in AppState
  AppState.currentWorkspace = id;

  // Switch workspaces in the window manager
  if (window.windowManager) {
    // First verify integrity to fix any issues
    if (window.windowManager.verifyWorkspaceIntegrity) {
      window.windowManager.verifyWorkspaceIntegrity();
    }

    window.windowManager.switchToWorkspace(id);

    // Show notification about workspace change
    showNotification(`Switched to workspace ${id}`, "info", 1500);
  }
}

/**
 * Display a notification
 */
function showNotification(message, type = "info", duration = 5000) {
  const notificationsContainer = document.getElementById(
    "notifications-container"
  );

  // Create notifications container if it doesn't exist
  if (!notificationsContainer) {
    const container = document.createElement("div");
    container.id = "notifications-container";
    container.style.position = "fixed";
    container.style.top = "40px";
    container.style.right = "10px";
    container.style.zIndex = "1000";
    container.style.width = "300px";
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.classList.add("notification");
  notification.classList.add(type);
  notification.textContent = message;

  // Add notification to container
  document.getElementById("notifications-container").appendChild(notification);

  // Remove notification after duration
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

/**
 * Simulates boot sequence
 */
function simulateBootSequence() {
  const bootScreen = document.getElementById("boot-screen");
  const bootLog = document.querySelector(".boot-log");
  const loginScreen = document.getElementById("login-screen");

  bootScreen.classList.add("active");

  // Boot animation
  const bootLogo = document.createElement("div");
  bootLogo.className = "boot-logo";
  bootLogo.innerHTML = `
    <div class="arch-logo">
      <svg viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32.5 5.5L7.5 55.5H57.5L32.5 5.5Z" stroke="currentColor" stroke-width="2"/>
        <path d="M32.5 16L16 48H49L32.5 16Z" stroke="currentColor" stroke-width="2"/>
      </svg>
    </div>
    <div class="boot-text">HYPRFOLIO</div>
  `;
  bootScreen.insertBefore(bootLogo, bootLog.parentElement);

  // Boot log messages - more realistic Linux boot messages
  const bootMessages = [
    { text: "Booting Hyprfolio Linux on HTML5...", delay: 500 },
    { text: "[ OK ] Reached target Local File Systems.", delay: 200 },
    { text: "[ OK ] Started User Manager for UID 1000.", delay: 100 },
    { text: "[ OK ] Created slice User Slice of user.", delay: 100 },
    { text: "[ OK ] Started Session c1 of user.", delay: 300 },
    { text: "hyprfolio-kernel: Initializing CPU cores...", delay: 300 },
    {
      text: "hyprfolio-kernel: CPU features: sse2 avx2 html5 webgl",
      delay: 200,
    },
    { text: "[ OK ] Found device /dev/localhost:8000", delay: 150 },
    { text: "[ OK ] Started Apply Kernel Variables.", delay: 100 },
    { text: "[ OK ] Mounted Javascript Virtual Filesystem.", delay: 200 },
    { text: "[ OK ] Started D-Bus System Message Bus.", delay: 150 },
    {
      text: "NetworkManager[341]: <info> NetworkManager (version 1.30.0) starting...",
      delay: 200,
    },
    {
      text: "NetworkManager[341]: <info> Web hardware radio set enabled",
      delay: 100,
    },
    { text: "Starting Hyprland Window Manager...", delay: 400 },
    { text: "[ OK ] Started Hyprland Window Manager.", delay: 500 },
    { text: "Loading virtual filesystem...", delay: 300 },
    { text: "Optimizing Window Manager for browser rendering...", delay: 200 },
    { text: "Preparing user interface components...", delay: 200 },
    { text: "Loading terminal environment...", delay: 300 },
    { text: "[ OK ] Reached target Graphical Interface.", delay: 300 },
    { text: "Starting Show Plymouth Boot Screen...", delay: 200 },
    { text: "Starting Forward Password Requests to Plymouth...", delay: 100 },
    {
      text: "[ OK ] Started Forward Password Requests to Plymouth.",
      delay: 100,
    },
    { text: "[ OK ] Started Show Plymouth Boot Screen.", delay: 200 },
    { text: "System initialization complete.", delay: 400 },
  ];

  // Function to type out a message with a typewriter effect
  function typeMessage(message, element, callback) {
    let i = 0;
    const text = message;
    const speed = 10; // typing speed in milliseconds

    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        if (callback) callback();
      }
    }

    element.textContent = "";
    type();
  }

  // Display boot messages with progressive typing effect
  let currentMessageIndex = 0;

  function displayNextMessage() {
    if (currentMessageIndex >= bootMessages.length) {
      // All messages displayed, show login screen after a delay
      setTimeout(() => {
        bootScreen.classList.add("fade-out");
        setTimeout(() => {
          bootScreen.classList.remove("active", "fade-out");
          loginScreen.classList.add("active");
          setupLoginScreen();
        }, 1000);
      }, 500);
      return;
    }

    const message = bootMessages[currentMessageIndex];
    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";
    bootLog.appendChild(logEntry);

    // Type out the message
    typeMessage(message.text, logEntry, () => {
      // After typing is complete, wait for the delay and display the next message
      setTimeout(() => {
        currentMessageIndex++;
        bootLog.scrollTop = bootLog.scrollHeight;
        displayNextMessage();
      }, message.delay);
    });
  }

  // Start displaying messages after a short delay
  setTimeout(displayNextMessage, 800);
}

/**
 * Setup login screen event handlers
 */
function setupLoginScreen() {
  const loginButton = document.getElementById("login-button");
  const passwordInput = document.getElementById("login-password");
  const loginScreen = document.getElementById("login-screen");
  const desktop = document.getElementById("desktop");

  // Login on button click or Enter key
  const handleLogin = () => {
    loginScreen.classList.remove("active");
    desktop.style.display = "block";
    AppState.isLoggedIn = true;

    // Initialize the desktop environment
    initializeDesktop();
  };

  loginButton.addEventListener("click", handleLogin);
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  });

  // Auto-focus password input
  passwordInput.focus();
}

/**
 * Initialize the desktop environment
 */
function initializeDesktop() {
  // Initialize subsystems
  initializeWaybar();

  // Initialize in the correct order: file system first, then window manager, then terminal
  const fileSystem = initializeFileSystem();
  window.fileSystem = fileSystem; // Make available globally

  const windowManager = initializeWindowManager();
  window.windowManager = windowManager; // Make available globally

  const terminal = initializeTerminal(AppState, fileSystem);
  window.terminal = terminal; // Make available globally

  // Register commands
  registerCommands(terminal, fileSystem, windowManager, AppState);

  // Initialize mobile functionality
  setupMobileSupport(windowManager);

  // Set initial workspace
  AppState.currentWorkspace = 1;

  // Create a custom event for systems initialized
  const systemsReady = () => {
    console.log("All systems initialized, setting up workspaces");

    // Debug check if the methods exist
    console.log("Window manager methods:", {
      initializeWorkspace:
        typeof windowManager.initializeWorkspace === "function",
      switchToWorkspace: typeof windowManager.switchToWorkspace === "function",
      createWindow: typeof windowManager.createWindow === "function",
    });

    // Initialize all workspaces
    for (let i = 1; i <= 6; i++) {
      console.log(`Initializing workspace ${i}`);
      windowManager.initializeWorkspace(i);
    }

    // Switch to workspace 1
    windowManager.switchToWorkspace(1);

    // Show welcome notification
    setTimeout(() => {
      showNotification("Welcome to Hyprfolio!", "success");
    }, 1000);
  };

  // Wait a moment to ensure all systems are initialized
  setTimeout(systemsReady, 500);
}

/**
 * Set up mobile-specific functionality
 */
function setupMobileSupport(windowManager) {
  const mobileToggle = document.getElementById("mobile-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  // Check if user is on mobile
  const isMobile = window.innerWidth < 768;

  // Initialize mobile view based on saved preference or device type
  const savedSimplifiedMode = localStorage.getItem(
    "hyprfolio-mobile-simplified"
  );
  if (
    savedSimplifiedMode === "true" ||
    (savedSimplifiedMode === null && isMobile)
  ) {
    toggleMobileSimplified(true);
  }

  // Mobile toggle button handler with ripple effect
  if (mobileToggle) {
    // Add ripple class for mobile interactions
    mobileToggle.classList.add("mobile-ripple");

    mobileToggle.addEventListener("click", (e) => {
      // Add ripple effect on click
      const rect = mobileToggle.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement("span");
      ripple.classList.add("ripple");
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      mobileToggle.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);

      // Toggle mobile view
      toggleMobileSimplified(!AppState.mobileSimplified);
    });
  }

  // Ensure workspace buttons are visible in mobile view
  const workspaceButtons = document.querySelector("#waybar .workspace-buttons");
  if (workspaceButtons) {
    // Make workspace buttons more touch-friendly on mobile
    const workspaces = workspaceButtons.querySelectorAll(".workspace");
    workspaces.forEach((workspace) => {
      workspace.classList.add("mobile-ripple");

      // Ensure proper touch handling
      workspace.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const workspaceId = parseInt(workspace.dataset.id);
        if (workspaceId) {
          switchWorkspace(workspaceId);
        }
      });
    });
  }

  // Handle orientation changes
  window.addEventListener("orientationchange", () => {
    // Adjust layout based on new orientation
    setTimeout(() => {
      if (AppState.mobileSimplified) {
        // Re-tile windows in a better layout for the new orientation
        const orientation =
          window.innerHeight > window.innerWidth ? "portrait" : "landscape";

        if (orientation === "portrait") {
          // Reset any landscape-specific adjustments
          document.body.classList.remove("landscape");
          document.body.classList.add("portrait");
        } else {
          // Apply landscape optimizations
          document.body.classList.remove("portrait");
          document.body.classList.add("landscape");
        }

        // After orientation classes are applied, retile windows
        if (window.windowManager) {
          window.windowManager.tileWindows("grid");
        }
      }
    }, 300); // Small delay to let the browser finish orientation change
  });

  // Disable double-tap to zoom on mobile for better interaction
  const preventZoom = (e) => {
    if (isMobile) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }
  };

  document.addEventListener("touchstart", preventZoom, { passive: false });

  // Add swipe to minimize/maximize windows on mobile
  document.addEventListener("touchstart", handleTouchStart, false);
  document.addEventListener("touchmove", handleTouchMove, false);

  let xDown = null;
  let yDown = null;

  function handleTouchStart(evt) {
    const target = evt.target.closest(".window-titlebar");
    if (!target) return;

    const firstTouch = evt.touches[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
  }

  function handleTouchMove(evt) {
    if (!xDown || !yDown) return;

    const target = evt.target.closest(".window");
    if (!target) {
      xDown = null;
      yDown = null;
      return;
    }

    const windowId = target.id.replace("window-", "");
    const windowObj = window.windowManager.getWindow(parseInt(windowId));
    if (!windowObj) return;

    const xUp = evt.touches[0].clientX;
    const yUp = evt.touches[0].clientY;

    const xDiff = xDown - xUp;
    const yDiff = yDown - yUp;

    if (Math.abs(yDiff) > Math.abs(xDiff) && yDiff > 50) {
      // Swipe up - maximize
      windowObj.toggleMaximize();
    } else if (Math.abs(yDiff) > Math.abs(xDiff) && yDiff < -50) {
      // Swipe down - minimize
      windowObj.minimize();
    }

    xDown = null;
    yDown = null;
  }
}

/**
 * Toggle mobile simplified view
 */
function toggleMobileSimplified(enable) {
  AppState.mobileSimplified = enable;

  if (enable) {
    document.body.classList.add("mobile-simplified");
  } else {
    document.body.classList.remove("mobile-simplified");
  }

  // Save preference
  localStorage.setItem("hyprfolio-mobile-simplified", enable);

  // Notify user
  const message = enable
    ? "Switched to simplified mobile view"
    : "Switched to desktop view";

  showNotification(message, "info");
}

/**
 * Handle theme switching
 */
function setupThemeSwitching() {
  // Setup theme switch based on user preference or time of day
  const themeStylesheet = document.getElementById("theme-stylesheet");

  // Check user preference from localStorage
  const savedTheme = localStorage.getItem("hyprfolio-theme");
  if (savedTheme) {
    AppState.theme = savedTheme;
    themeStylesheet.href = `css/themes/${savedTheme}.css`;
  }

  // Function to toggle theme
  window.toggleTheme = () => {
    AppState.theme = AppState.theme === "dark" ? "light" : "dark";
    themeStylesheet.href = `css/themes/${AppState.theme}.css`;
    localStorage.setItem("hyprfolio-theme", AppState.theme);
    showNotification(`Switched to ${AppState.theme} theme`, "info");
  };

  // Register keyboard shortcut for theme switching
  registerKeyboardShortcut("Alt+t", () => {
    window.toggleTheme();
  });
}

/**
 * Custom keyboard shortcut handler
 */
function registerKeyboardShortcut(shortcut, callback) {
  // Store shortcut directly in the map with the callback
  AppState.activeKeybindings[shortcut.toLowerCase()] = callback;
}

/**
 * Check if a keyboard event matches a registered shortcut
 */
function matchesKeyboardShortcut(event, shortcutString) {
  const keys = shortcutString.toLowerCase().split("+");

  // Check for required modifier keys
  const needsAlt = keys.includes("alt");
  const needsCtrl = keys.includes("ctrl");
  const needsShift = keys.includes("shift");
  const needsMeta = keys.includes("meta");

  // Check if the modifiers match the event
  if (needsAlt !== event.altKey) return false;
  if (needsCtrl !== event.ctrlKey) return false;
  if (needsShift !== event.shiftKey) return false;
  if (needsMeta !== event.metaKey) return false;

  // Get the main key (the last one that's not a modifier)
  const mainKey = keys.find(
    (k) => !["alt", "ctrl", "shift", "meta"].includes(k)
  );

  // Handle special cases for number keys and function keys
  if (mainKey && /^[0-9]$/.test(mainKey)) {
    // For number keys, check both the key and code
    return (
      event.key === mainKey ||
      event.code === `Digit${mainKey}` ||
      event.code === `Numpad${mainKey}`
    );
  }

  if (mainKey && /^f[0-9]{1,2}$/.test(mainKey)) {
    // For function keys (F1-F12)
    return (
      event.key.toLowerCase() === mainKey ||
      event.code.toLowerCase() === mainKey
    );
  }

  // For regular keys, do case-insensitive comparison
  return mainKey === event.key.toLowerCase();
}

/**
 * Handle keyboard events
 */
function handleKeyboardEvents() {
  document.addEventListener("keydown", (e) => {
    // Skip if in input field
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable
    ) {
      return;
    }

    // Check for registered keyboard shortcuts
    for (const shortcut in AppState.activeKeybindings) {
      if (matchesKeyboardShortcut(e, shortcut)) {
        e.preventDefault();
        AppState.activeKeybindings[shortcut](e);
      }
    }

    // Handle workspace switching with number keys
    if (!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      const workspaceKeys = {
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
      };

      if (workspaceKeys[e.key]) {
        switchWorkspace(workspaceKeys[e.key]);
      }
    }

    // Alt+Shift+v to force window visibility (debug feature)
    if (e.altKey && e.shiftKey && e.key.toLowerCase() === "v") {
      console.log("Force window visibility triggered with Alt+Shift+v");
      if (window.windowManager && window.windowManager.forceWindowVisibility) {
        window.windowManager.forceWindowVisibility();
        showNotification("Force-fixed window visibility", "info", 1500);
      }
    }
  });
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  // Register shortcut for opening terminal
  registerKeyboardShortcut("Alt+Enter", () => {
    if (window.windowManager) {
      window.windowManager.createWindow(
        "terminal",
        "Terminal",
        {
          width: 800,
          height: 500,
        },
        AppState.currentWorkspace
      );
      showNotification("Terminal opened", "info", 1500);
    }
  });

  // Workspace switching shortcuts
  for (let i = 1; i <= 6; i++) {
    registerKeyboardShortcut(`Alt+${i}`, () => {
      switchWorkspace(i);
    });
  }

  // Add shortcut for help overlay
  registerKeyboardShortcut("F1", () => {
    showHelpOverlay();
  });

  // Add shortcut for mobile simplified view
  registerKeyboardShortcut("Alt+m", () => {
    toggleMobileSimplified(!AppState.mobileSimplified);
  });

  // Add shortcut for theme switching
  registerKeyboardShortcut("Alt+t", () => {
    window.toggleTheme();
    showNotification(`Switched to ${AppState.theme} theme`, "info", 1500);
  });

  // Emergency repair shortcut (Alt+R)
  registerKeyboardShortcut("Alt+r", () => {
    if (window.windowManager && window.windowManager.repairWindowManager) {
      window.windowManager.repairWindowManager();
      showNotification(
        "Window Manager Emergency Repair completed",
        "warning",
        3000
      );
    }
  });

  // Close window (Alt+Q)
  registerKeyboardShortcut("Alt+q", () => {
    const activeWindow =
      window.windowManager && window.windowManager.getActiveWindow();
    if (activeWindow) {
      window.windowManager.closeWindow(activeWindow.id);
      showNotification("Window closed", "info", 1500);
    }
  });

  // Toggle maximize window (Alt+F)
  registerKeyboardShortcut("Alt+f", () => {
    const activeWindow =
      window.windowManager && window.windowManager.getActiveWindow();
    if (activeWindow) {
      activeWindow.toggleMaximize();
      showNotification(
        activeWindow.options.maximized ? "Window maximized" : "Window restored",
        "info",
        1500
      );
    }
  });

  // Tile windows horizontally (Alt+H)
  registerKeyboardShortcut("Alt+h", () => {
    if (window.windowManager) {
      window.windowManager.tileWindows("horizontal");
      showNotification("Windows tiled horizontally", "info", 1500);
    }
  });

  // Tile windows vertically (Alt+V)
  registerKeyboardShortcut("Alt+v", () => {
    if (window.windowManager) {
      window.windowManager.tileWindows("vertical");
      showNotification("Windows tiled vertically", "info", 1500);
    }
  });

  // Tile windows in grid (Alt+G)
  registerKeyboardShortcut("Alt+g", () => {
    if (window.windowManager) {
      window.windowManager.tileWindows("grid");
      showNotification("Windows tiled in grid", "info", 1500);
    }
  });
}

/**
 * Show help overlay with keyboard shortcuts
 */
function showHelpOverlay() {
  // Remove existing overlay if any
  const existingOverlay = document.getElementById("help-overlay");
  if (existingOverlay) {
    document.body.removeChild(existingOverlay);
    return;
  }

  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "help-overlay";
  overlay.className = "help-overlay";

  // Create content
  overlay.innerHTML = `
    <div class="help-content">
      <h2>Keyboard Shortcuts</h2>
      <div class="shortcuts-grid">
        <div class="shortcut-group">
          <h3>Workspaces</h3>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">1</span> <span class="description">Switch to workspace 1 (Intro)</span></div>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">2</span> <span class="description">Switch to workspace 2 (Projects)</span></div>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">3</span> <span class="description">Switch to workspace 3 (Skills)</span></div>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">4</span> <span class="description">Switch to workspace 4 (About)</span></div>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">5</span> <span class="description">Switch to workspace 5 (Contact)</span></div>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">6</span> <span class="description">Switch to workspace 6 (Interactive)</span></div>
        </div>
        
        <div class="shortcut-group">
          <h3>Terminal</h3>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">Enter</span> <span class="description">Open new terminal</span></div>
          <div class="shortcut"><span class="key">Ctrl</span> + <span class="key">C</span> <span class="description">Cancel command</span></div>
          <div class="shortcut"><span class="key">Ctrl</span> + <span class="key">L</span> <span class="description">Clear terminal</span></div>
          <div class="shortcut"><span class="key">↑</span> / <span class="key">↓</span> <span class="description">Navigate history</span></div>
          <div class="shortcut"><span class="key">Tab</span> <span class="description">Complete command/path</span></div>
        </div>
        
        <div class="shortcut-group">
          <h3>Window Management</h3>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">Q</span> <span class="description">Close window</span></div>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">F</span> <span class="description">Maximize/restore window</span></div>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">H</span> <span class="description">Tile horizontally</span></div>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">V</span> <span class="description">Tile vertically</span></div>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">G</span> <span class="description">Tile in grid</span></div>
        </div>
        
        <div class="shortcut-group">
          <h3>System</h3>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">T</span> <span class="description">Toggle theme</span></div>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">M</span> <span class="description">Toggle mobile view</span></div>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">R</span> <span class="description">Emergency repair (fixes window issues)</span></div>
          <div class="shortcut"><span class="key">Alt</span> + <span class="key">Shift</span> + <span class="key">V</span> <span class="description">Force window visibility</span></div>
          <div class="shortcut"><span class="key">F1</span> <span class="description">Show/hide this help</span></div>
        </div>
      </div>
      
      <div class="help-footer">
        <p>Press <span class="key">Esc</span> or click anywhere to close</p>
      </div>
    </div>
  `;

  // Add to body
  document.body.appendChild(overlay);

  // Close on click or Escape key
  overlay.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      const overlay = document.getElementById("help-overlay");
      if (overlay) {
        document.body.removeChild(overlay);
        document.removeEventListener("keydown", escHandler);
      }
    }
  });
}

/**
 * Initialize mobile workspace tabs to ensure proper appearance on mobile devices
 */
function initializeMobileWorkspaceTabs() {
  const workspaceButtons = document.querySelector("#waybar .workspace-buttons");

  if (workspaceButtons) {
    workspaceButtons.style.display = "flex";

    // add mobile classes to workspace buttons for better touch handling
    const workspaces = workspaceButtons.querySelectorAll(".workspace");
    workspaces.forEach((workspace) => {
      workspace.classList.add("mobile-friendly");
    });
  }
}

/**
 * Initialize application
 */
function initApp() {
  handleKeyboardEvents();
  setupThemeSwitching();
  setupKeyboardShortcuts();
  initializeMobileWorkspaceTabs();

  // Debug event monitor
  document.addEventListener("window-content-ready", (e) => {
    console.log("DEBUG [window-content-ready]:", e.detail);
  });

  // Development mode - set to true to skip boot sequence
  const devMode = false; // Set to true during development

  if (devMode) {
    console.log("DEV MODE: Skipping boot sequence");
    document.getElementById("boot-screen").classList.remove("active");
    document.getElementById("login-screen").classList.remove("active");
    document.getElementById("desktop").style.display = "block";
    AppState.isLoggedIn = true;
    initializeDesktop();
  } else {
    // Start boot sequence
    simulateBootSequence();
  }
}

// Initialize the application when DOM is ready
document.addEventListener("DOMContentLoaded", initApp);

// Handle window resize events
window.addEventListener("resize", () => {
  // Update any size-dependent components
});

// Export globally accessible functions and state
window.AppState = AppState;
window.showNotification = showNotification;
window.toggleMobileSimplified = toggleMobileSimplified;
