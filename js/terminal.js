class Terminal {
  /**
   * Constructor for Terminal
   * @param {Object} container - DOM element to render terminal in
   * @param {Object} options - Terminal options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = Object.assign(
      {
        rows: 24,
        cols: 80,
        cursorBlink: true,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 14,
        theme: {
          background: "var(--color-bg-tertiary)",
          foreground: "var(--color-fg-primary)",
          cursor: "var(--color-fg-primary)",
          selection: "var(--color-selection)",
          black: "var(--color-terminal-black)",
          red: "var(--color-terminal-red)",
          green: "var(--color-terminal-green)",
          yellow: "var(--color-terminal-yellow)",
          blue: "var(--color-terminal-blue)",
          magenta: "var(--color-terminal-magenta)",
          cyan: "var(--color-terminal-cyan)",
          white: "var(--color-terminal-white)",
          brightBlack: "var(--color-terminal-bright-black)",
          brightRed: "var(--color-terminal-bright-red)",
          brightGreen: "var(--color-terminal-bright-green)",
          brightYellow: "var(--color-terminal-bright-yellow)",
          brightBlue: "var(--color-terminal-bright-blue)",
          brightMagenta: "var(--color-terminal-bright-magenta)",
          brightCyan: "var(--color-terminal-bright-cyan)",
          brightWhite: "var(--color-terminal-bright-white)",
        },
      },
      options
    );

    this.element = document.createElement("div");
    this.element.className = "terminal";
    this.container.appendChild(this.element);

    this.screen = document.createElement("pre");
    this.screen.className = "terminal-screen";
    this.element.appendChild(this.screen);

    this.input = document.createElement("div");
    this.input.className = "terminal-input";

    this.cursor = document.createElement("span");
    this.cursor.className = "terminal-cursor";
    this.cursor.textContent = "█";
    this.input.appendChild(this.cursor);

    this.element.appendChild(this.input);

    this.history = [];
    this.historyIndex = -1;
    this.currentInput = "";
    this.currentLine = "";
    this.prompt = "john_pork@hyprfolio:/home/john_pork$ "; // Set a default full prompt to ensure it always shows
    this.commandHandler = null;
    this.active = true;
    this.fileSystem = null; // Store fileSystem reference for tab completion

    this.setupStyles();
    this.setupEventListeners();
    this.writePrompt();

    if (this.options.cursorBlink) {
      setInterval(() => {
        if (this.active) {
          this.cursor.style.visibility =
            this.cursor.style.visibility === "hidden" ? "visible" : "hidden";
        }
      }, 500);
    }
  }

  /**
   * Set up terminal styles
   */
  setupStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .terminal {
        height: 100%;
        width: 100%;
        padding: 8px;
        overflow-y: auto;
        color: ${this.options.theme.foreground};
        background-color: ${this.options.theme.background};
        font-family: ${this.options.fontFamily};
        font-size: ${this.options.fontSize}px;
        line-height: 1.2;
        display: flex;
        flex-direction: column;
      }
      
      .terminal-screen {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        flex: 1 1 auto;
        overflow-y: auto;
        padding-bottom: 40px; /* Add padding to ensure text doesn't hit bottom */
      }
      
      .terminal-input {
        display: flex;
        white-space: pre;
        position: relative;
        padding: 2px 0;
        width: 100%;
      }
      
      .terminal-cursor {
        color: ${this.options.theme.cursor};
      }
      
      /* Add styles for terminal scrollbar */
      .terminal::-webkit-scrollbar {
        width: 8px;
      }
      
      .terminal::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
      }
      
      .terminal::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
      }
      
      .terminal::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Set up event listeners for keyboard input
   */
  setupEventListeners() {
    console.log("Setting up terminal event listeners");

    this.element.addEventListener("keydown", this.handleKeyDown.bind(this));

    this.element.tabIndex = -1;
    this.element.focus();

    this.element.addEventListener("click", () => {
      this.element.focus();
    });
  }

  /**
   * Handle keyboard input
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    // Only process if terminal is active
    if (
      !this.active ||
      (!this.container.contains(document.activeElement) &&
        document.activeElement !== document.body)
    ) {
      return;
    }

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        this.handleEnter();
        break;
      case "Backspace":
        e.preventDefault();
        this.handleBackspace();
        break;
      case "ArrowUp":
        e.preventDefault();
        this.navigateHistory(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        this.navigateHistory(1);
        break;
      case "Tab":
        e.preventDefault();
        this.handleTabCompletion();
        break;
      case "c":
        if (e.ctrlKey) {
          e.preventDefault();
          this.handleCtrlC();
        } else {
          this.handleInput(e.key);
        }
        break;
      case "l":
        if (e.ctrlKey) {
          e.preventDefault();
          this.handleCtrlL();
        } else {
          this.handleInput(e.key);
        }
        break;
      default:
        if (!e.ctrlKey && !e.altKey && e.key.length === 1) {
          e.preventDefault();
          this.handleInput(e.key);
        }
    }
  }

  handleEnter() {
    this.writeLine(this.prompt + this.currentInput);

    if (this.currentInput.trim() !== "") {
      this.history.push(this.currentInput.trim());
      this.historyIndex = this.history.length;

      if (this.commandHandler) {
        const command = this.currentInput.trim();
        this.processCommand(command);
      } else {
        this.writeLine(`Command not implemented: ${this.currentInput.trim()}`);
        this.writePrompt();
      }
    } else {
      this.writePrompt();
    }

    this.currentInput = "";
    this.renderInput();
  }

  /**
   * Process command using the command handler
   * @param {string} command - Command to process
   */
  async processCommand(command) {
    try {
      const result = await this.commandHandler(command);
      if (result) {
        this.writeLine(this.parseANSI(result));
      }
    } catch (error) {
      this.writeLine(`Error: ${error.message}`);
    }
    this.writePrompt();
  }

  /**
   * Parse ANSI color codes in text
   * @param {string} text - Text with ANSI codes
   * @returns {string} HTML with appropriate CSS classes
   */
  parseANSI(text) {
    const colorMap = {
      30: "terminal-color-black",
      31: "terminal-color-red",
      32: "terminal-color-green",
      33: "terminal-color-yellow",
      34: "terminal-color-blue",
      35: "terminal-color-magenta",
      36: "terminal-color-cyan",
      37: "terminal-color-white",
      90: "terminal-color-bright-black",
      91: "terminal-color-bright-red",
      92: "terminal-color-bright-green",
      93: "terminal-color-bright-yellow",
      94: "terminal-color-bright-blue",
      95: "terminal-color-bright-magenta",
      96: "terminal-color-bright-cyan",
      97: "terminal-color-bright-white",
    };

    // Process text to handle ANSI escape sequences
    let processedText = text;

    // Replace all ANSI escape sequences with spans
    // Updated pattern to handle combined codes like 1;34m
    const pattern = /\x1b\[([0-9;]+)m/g;
    let match;
    let lastIndex = 0;
    let result = "";

    while ((match = pattern.exec(processedText)) !== null) {
      result += processedText.substring(lastIndex, match.index);

      // Handle multiple codes separated by semicolons
      const codes = match[1].split(";").map((code) => parseInt(code));

      for (const colorCode of codes) {
        const colorClass = colorMap[colorCode] || "";

        if (colorCode === 0) {
          // Reset - close any open spans
          result += "</span>";
        } else if (colorClass) {
          result += `<span class="${colorClass}">`;
        } else if (colorCode === 1) {
          // Bold text
          result += `<span style="font-weight: bold;">`;
        }
      }

      lastIndex = pattern.lastIndex;
    }

    result += processedText.substring(lastIndex);

    // clean up any potential unmatched spans
    if (result.includes("<span")) {
      // check if all spans are correctly closed
      const openTags = (result.match(/<span/g) || []).length;
      const closeTags = (result.match(/<\/span>/g) || []).length;

      if (openTags > closeTags) {
        // Add missing closing tags
        for (let i = 0; i < openTags - closeTags; i++) {
          result += "</span>";
        }
      }
    }

    return result;
  }

  /**
   * Handle Backspace key press
   */
  handleBackspace() {
    if (this.currentInput.length > 0) {
      this.currentInput = this.currentInput.slice(0, -1);
      this.renderInput();
    }
  }

  /**
   * Handle Ctrl+C key press
   */
  handleCtrlC() {
    this.writeLine(this.prompt + this.currentInput);
    this.writeLine("^C");
    this.currentInput = "";
    this.writePrompt();
  }

  /**
   * Handle Ctrl+L key press (clear screen)
   */
  handleCtrlL() {
    this.clear();
    this.writePrompt();
  }

  /**
   * Clear the terminal screen
   */
  clear() {
    while (this.screen.firstChild) {
      this.screen.removeChild(this.screen.firstChild);
    }
  }

  /**
   * Navigate command history
   * @param {number} direction - Direction to navigate (1 = down, -1 = up)
   */
  navigateHistory(direction) {
    if (this.history.length === 0) return;

    this.historyIndex += direction;

    if (this.historyIndex < 0) {
      this.historyIndex = 0;
    } else if (this.historyIndex >= this.history.length) {
      this.historyIndex = this.history.length;
      this.currentInput = "";
    } else {
      this.currentInput = this.history[this.historyIndex];
    }

    this.renderInput();
  }

  /**
   * Handle normal text input
   * @param {string} char - Character to add
   */
  handleInput(char) {
    this.currentInput += char;
    this.renderInput();
  }

  /**
   * Render the current input line
   */
  renderInput() {
    // Remove everything except the cursor
    while (this.input.childNodes.length > 1) {
      this.input.removeChild(this.input.firstChild);
    }

    // Add prompt and current input
    const promptSpan = document.createElement("span");
    promptSpan.textContent = this.prompt;
    this.input.insertBefore(promptSpan, this.cursor);

    const inputSpan = document.createElement("span");
    inputSpan.textContent = this.currentInput;
    this.input.insertBefore(inputSpan, this.cursor);
  }

  /**
   * Write a line of text to the terminal
   * @param {string} text - Text to write
   */
  writeLine(text) {
    // Check if text contains HTML (from ANSI parsing)
    if (text.includes("<span")) {
      const line = document.createElement("div");
      line.innerHTML = text;
      this.screen.appendChild(line);
    } else {
      const line = document.createElement("div");
      line.textContent = text;
      this.screen.appendChild(line);
    }

    // Use a longer delay to ensure content is rendered before scrolling
    setTimeout(() => {
      this.scrollToBottom();
    }, 30);
  }

  /**
   * Write raw text to the terminal
   * @param {string} text - Text to write
   */
  write(text) {
    const lines = text.split("\n");
    lines.forEach((line) => this.writeLine(line));
  }

  /**
   * Write the prompt
   */
  writePrompt() {
    this.currentInput = "";
    this.renderInput();
    this.scrollToBottom();
  }

  /**
   * Scroll to the bottom of the terminal
   */
  scrollToBottom() {
    this._performScroll();

    // Add multiple delays and try again to handle any rendering delays
    setTimeout(() => this._performScroll(), 10);
    setTimeout(() => this._performScroll(), 50);
    setTimeout(() => this._performScroll(), 150);
    setTimeout(() => this._performScroll(), 300);
  }

  /**
   * Helper function to perform the actual scroll operation
   * @private
   */
  _performScroll() {
    if (!this.screen) return;

    this.screen.scrollTop = this.screen.scrollHeight;
    this.element.scrollTop = this.element.scrollHeight;

    // If there is a parent container, ensure it's scrolled too
    let parent = this.element.parentNode;
    while (parent) {
      if (parent.scrollHeight > parent.clientHeight) {
        parent.scrollTop = parent.scrollHeight;
      }
      parent = parent.parentNode;
    }
  }

  /**
   * Set the prompt
   * @param {string} prompt - New prompt
   */
  setPrompt(prompt) {
    this.prompt = prompt;
    this.renderInput();
  }

  /**
   * Register command handler
   * @param {function} handler - Command handler function
   */
  registerCommandHandler(handler) {
    this.commandHandler = handler;
  }

  /**
   * Activate or deactivate the terminal
   * @param {boolean} isActive - Whether the terminal should be active
   */
  setActive(isActive) {
    this.active = isActive;
    if (isActive) {
      this.cursor.style.visibility = "visible";
    } else {
      this.cursor.style.visibility = "hidden";
    }
  }

  /**
   * Handle tab completion for commands and file paths
   */
  handleTabCompletion() {
    if (!this.fileSystem) return;

    const input = this.currentInput.trim();

    if (input === "") return;

    const tokens = input.split(/\s+/);

    // If this is the start of the line (first token), try to complete command names
    if (tokens.length === 1 && !input.endsWith(" ")) {
      this.completeCommand(tokens[0]);
    } else {
      const lastToken = tokens[tokens.length - 1];
      // Everything before the last token
      const prefix = tokens.slice(0, tokens.length - 1).join(" ") + " ";

      this.completeFilePath(prefix, lastToken);
    }
  }

  /**
   * Complete a command name
   * @param {string} partial - Partial command to complete
   */
  completeCommand(partial) {
    // This is a bit of a hack :D XD
    const commonCommands = [
      "ls",
      "cd",
      "pwd",
      "echo",
      "cat",
      "clear",
      "help",
      "exit",
      "mkdir",
      "rm",
      "touch",
      "neofetch",
      "about",
      "projects",
      "skills",
      "contact",
      "resume",
    ];

    const matches = commonCommands.filter((cmd) =>
      cmd.startsWith(partial.toLowerCase())
    );

    if (matches.length === 1) {
      this.currentInput = matches[0];
      this.renderInput();
    }
    else if (matches.length > 1) {
      this.writeLine(this.prompt + this.currentInput);
      this.writeLine(matches.join("  "));
      this.writePrompt();
      this.currentInput = partial;
      this.renderInput();
    }
  }

  /**
   * Complete a file or directory path
   * @param {string} prefix - Command and arguments before the path
   * @param {string} partial - Partial path to complete
   */
  completeFilePath(prefix, partial) {
    // Resolve path relative to current directory
    let dirPath = ".";
    let baseName = partial;

    // If the partial path contains slashes, split into directory and basename
    if (partial.includes("/")) {
      const parts = partial.split("/");
      baseName = parts.pop();
      dirPath = parts.join("/") || "/";
      if (dirPath === "") dirPath = ".";
    }

    try {
      const listing = this.fileSystem.ls(dirPath);

      if (!listing) return;

      const matches = listing.filter((item) => item.name.startsWith(baseName));

      if (matches.length === 0) return;

      if (matches.length === 1) {
        const match = matches[0];
        let completedPath =
          dirPath === "." ? match.name : `${dirPath}/${match.name}`;

        // Add a trailing slash for directories
        if (match.isDirectory) completedPath += "/";

        this.currentInput = prefix + completedPath;
        this.renderInput();
      }
      else {
        this.writeLine(this.prompt + this.currentInput);
        this.writeLine(
          matches.map((m) => (m.isDirectory ? m.name + "/" : m.name)).join("  ")
        );
        this.writePrompt();
        this.currentInput = prefix + partial;
        this.renderInput();
      }
    } catch (error) {
      console.error("Tab completion error:", error);
    }
  }

  /**
   * Set file system for tab completion
   * @param {Object} fileSystem - File system instance
   */
  setFileSystem(fileSystem) {
    this.fileSystem = fileSystem;
  }

  /**
   * Execute a command programmatically
   * @param {string} command - Command to execute
   */
  executeCommand(command) {
    // Display the command as if it was typed
    this.currentInput = command;
    this.handleEnter();
  }
}

/**
 * Initialize the terminal
 * @param {Object} appState - App state
 * @param {Object} fileSystem - File system
 * @returns {Object} terminal interface
 */
export function initializeTerminal(appState, fileSystem) {
  console.log("Initializing terminal");
  let terminals = {};
  let commandHandler = null;

  // Set up terminal event listeners
  document.addEventListener("initialize-terminal", (e) => {
    const { windowId, container } = e.detail;
    createTerminal(container, windowId);
  });

  const createTerminal = (container, id) => {
    const terminal = new Terminal(container);

    terminal.setFileSystem(fileSystem);

    updatePrompt(id);

    if (commandHandler) {
      terminal.registerCommandHandler(commandHandler);
    }

    terminals[id] = terminal;

    return terminal;
  };

  // Update terminal prompt with current directory
  const updatePrompt = (terminalId) => {
    const terminal = terminals[terminalId];
    if (!terminal) return;

    const username = appState.user.name;
    const hostname = appState.user.hostname;
    const cwd = fileSystem.pwd();
    const home = `/home/${username}`;

    // Replace home directory with ~
    const displayPath = cwd.startsWith(home) ? cwd.replace(home, "~") : cwd;

    terminal.setPrompt(`${username}@${hostname}:${displayPath}$ `);
    console.log(
      `Updated terminal prompt: ${username}@${hostname}:${displayPath}$ `
    );
  };

  // Register handler to update all terminal prompts when directory changes
  document.addEventListener("directory-changed", () => {
    Object.keys(terminals).forEach((id) => {
      updatePrompt(id);
    });
  });

  // Create command handler for terminal
  const handler = async (command) => {
    return await window.commandHandler(command);
  };

  // Register handler with window registry
  document.dispatchEvent(
    new CustomEvent("register-terminal-handler", {
      detail: { handler },
    })
  );

  commandHandler = handler;

  return {
    createTerminal,
    getTerminal: (id) => terminals[id],
    updatePrompt,
    registerCommandHandler: (handler) => {
      commandHandler = handler;
      // Update all terminals with the new handler
      Object.values(terminals).forEach((terminal) => {
        terminal.registerCommandHandler(handler);
      });
    },
  };
}
