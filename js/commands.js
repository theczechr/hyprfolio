const commands = {};

/**
 * Register a command
 * @param {string} name - Command name
 * @param {Object} command - Command object
 */
function registerCommand(name, command) {
  commands[name] = command;
}

/**
 * Process a command
 * @param {string} input - Command input
 * @param {Object} terminal - Terminal instance
 * @param {Object} fileSystem - File system
 * @param {Object} windowManager - Window manager
 * @param {Object} appState - Application state
 * @returns {Promise<string>} command result
 */
async function processCommand(
  input,
  terminal,
  fileSystem,
  windowManager,
  appState
) {
  // Parse command and arguments
  const args = input.trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  // Check if command exists
  if (!(commandName in commands)) {
    return `Command not found: ${commandName}. Type 'help' for a list of commands.`;
  }

  try {
    const result = await commands[commandName].execute(args, {
      terminal,
      fileSystem,
      windowManager,
      appState,
    });
    return result || "";
  } catch (error) {
    return `Error executing command: ${error.message}`;
  }
}

/**
 * Register commands
 * @param {Object} terminal - Terminal instance
 * @param {Object} fileSystem - File system
 * @param {Object} windowManager - Window manager
 * @param {Object} appState - Application state
 */
export function registerCommands(
  terminal,
  fileSystem,
  windowManager,
  appState
) {
  console.log("Registering commands");

  // Register all commands
  registerAllCommands();

  // Create command handler function to process commands
  const commandHandler = async (input) => {
    console.log(`Processing command: ${input}`);
    return await processCommand(
      input,
      terminal,
      fileSystem,
      windowManager,
      appState
    );
  };

  // Register command handler with terminal
  terminal.registerCommandHandler(commandHandler);

  // Make window.commandHandler available globally
  window.commandHandler = commandHandler;
}

/**
 * Register all available commands
 */
function registerAllCommands() {
  // Neofetch command - display system info
  registerCommand("neofetch", {
    description: "Display system information in a stylized format",
    usage: "neofetch",
    execute: async (args, { appState }) => {
      const username = appState.user.name;
      const hostname = appState.user.hostname;

      // Get current date for "uptime"
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");

      // Custom Hyprfolio 'H' logo (colored blue)
      const archLogo = [
        "\x1b[34m                   -`                 \x1b[0m",
        "\x1b[34m                  .o+`                \x1b[0m",
        "\x1b[34m                 `ooo/                \x1b[0m",
        "\x1b[34m                `+oooo:               \x1b[0m",
        "\x1b[34m               `+oooooo:              \x1b[0m",
        "\x1b[34m               -+oooooo+:             \x1b[0m",
        "\x1b[34m             `/:-:++oooo+:            \x1b[0m",
        "\x1b[34m            `/++++/+++++++:           \x1b[0m",
        "\x1b[34m           `/++++++++++++++:          \x1b[0m",
        "\x1b[34m          `/+++ooooooooooooo/`        \x1b[0m",
        "\x1b[34m         ./ooosssso++osssssso+`       \x1b[0m",
        "\x1b[34m        .oossssso-````/ossssss+`      \x1b[0m",
        "\x1b[34m       -osssssso.      :ssssssso.     \x1b[0m",
        "\x1b[34m      :osssssss/        osssso+++.    \x1b[0m",
        "\x1b[34m     /ossssssss/        +ssssooo/-    \x1b[0m",
        "\x1b[34m   `/ossssso+/:-        -:/+osssso+-  \x1b[0m",
        "\x1b[34m  `+sso+:-`                 `.-/+oso: \x1b[0m",
        "\x1b[34m `++:.                           `-/+/\x1b[0m",
        "\x1b[34m .`                                 `/\x1b[0m",
      ];

      // System information (right side)
      const systemInfo = [
        `\x1b[31m${username}\x1b[0m\x1b[97m@\x1b[0m\x1b[34m${hostname}\x1b[0m`,
        `\x1b[31m--------------\x1b[0m`,
        `\x1b[31mOS\x1b[0m: Hyprfolio Linux x86_64`,
        `\x1b[31mHost\x1b[0m: Web Browser`,
        `\x1b[31mKernel\x1b[0m: HTML5 + JavaScript`,
        `\x1b[31mUptime\x1b[0m: ${hours}:${minutes}`,
        `\x1b[31mPackages\x1b[0m: 4 (portfolio)`,
        `\x1b[31mShell\x1b[0m: hypersh 1.0.0`,
        `\x1b[31mResolution\x1b[0m: ${window.innerWidth}x${window.innerHeight}`,
        `\x1b[31mDE\x1b[0m: Hyprland`,
        `\x1b[31mWM\x1b[0m: Hyprland`,
        `\x1b[31mWM Theme\x1b[0m: Hyprfolio-${appState.theme}`,
        `\x1b[31mTerminal\x1b[0m: HyprTerm`,
        `\x1b[31mTerminal Font\x1b[0m: JetBrains Mono`,
        `\x1b[31mCPU\x1b[0m: Browser Engine`,
        `\x1b[31mGPU\x1b[0m: WebGL`,
        `\x1b[31mMemory\x1b[0m: Dynamic Allocation`,
        ``,
        `\x1b[30m███\x1b[0m\x1b[31m███\x1b[0m\x1b[32m███\x1b[0m\x1b[33m███\x1b[0m\x1b[34m███\x1b[0m\x1b[35m███\x1b[0m\x1b[36m███\x1b[0m\x1b[37m███\x1b[0m`,
      ];

      // Combine ASCII art with system info
      const maxLogoLength =
        Math.max(...archLogo.map((line) => line.length)) + 5;
      let result = "";

      // Combine lines
      const maxLines = Math.max(archLogo.length, systemInfo.length);
      for (let i = 0; i < maxLines; i++) {
        const logoLine = i < archLogo.length ? archLogo[i] : "";
        const infoLine = i < systemInfo.length ? systemInfo[i] : "";

        // Pad logo line to align system info
        const paddedLogoLine = logoLine.padEnd(maxLogoLength, " ");
        result += paddedLogoLine + infoLine + "\n";
      }

      // Add welcome message
      result += "\n\x1b[1mWelcome to Hyprfolio!\x1b[0m\n";
      result +=
        "This portfolio is designed to simulate an Arch Linux environment with Hyprland window manager.\n";
      result +=
        "Navigate using Alt+[1-5] to switch between workspaces or use the buttons at the top.\n";
      result += "\nTry these commands to explore:\n";
      result += "  \x1b[32mabout\x1b[0m      - View information about me\n";
      result += "  \x1b[32mprojects\x1b[0m   - Browse my projects\n";
      result += "  \x1b[32mskills\x1b[0m     - See my technical skills\n";
      result += "  \x1b[32mcontact\x1b[0m    - Get my contact information\n";
      result += "  \x1b[32mhelp\x1b[0m       - Show all available commands\n";

      return result;
    },
  });

  // About command - display information about the portfolio owner
  registerCommand("about", {
    description: "Display information about me",
    usage: "about",
    execute: async (args, { windowManager }) => {
      // ASCII art for the about section
      const aboutArt = [
        "\x1b[34m   ___  _                 _     __  __      \x1b[0m",
        "\x1b[34m  / _ \\| |__   ___  _   _| |_  |  \\/  | ___ \x1b[0m",
        "\x1b[34m / /_\\/| '_ \\ / _ \\| | | | __| | |\\/| |/ _ \\\x1b[0m",
        "\x1b[34m/ /_\\\\ | |_) | (_) | |_| | |_  | |  | |  __/\x1b[0m",
        "\x1b[34m\\____/ |_.__/ \\___/ \\__,_|\\__| |_|  |_|\\___|\x1b[0m",
        "\x1b[34m                                            \x1b[0m",
      ];

      // About information
      let result = aboutArt.join("\n") + "\n\n";
      result += "\x1b[1mAbout Me\x1b[0m\n";
      result += "───────────────────────────────────────────────────────\n\n";
      result +=
        "I'm John Pork, a software developer and technology enthusiast with a passion for\n";
      result +=
        "creating unique and innovative web experiences. My background includes\n";
      result +=
        "expertise in frontend and backend development, with a special interest\n";
      result += "in creating immersive user interfaces.\n\n";

      result += "\x1b[1mEducation\x1b[0m\n";
      result += "───────────────────────────────────────────────────────\n";
      result += "🎓 Bachelor of Science in Computer Science\n";
      result += "   University of Porkland, 2018-2022\n\n";

      result += "\x1b[1mExperience\x1b[0m\n";
      result += "───────────────────────────────────────────────────────\n";
      result += "💼 Frontend Developer - PorkTech Inc. (2022-Present)\n";
      result +=
        "   Working on modern web applications using React and TypeScript\n\n";
      result += "💼 Web Development Intern - Pork Studio (2021)\n";
      result += "   Assisted in developing responsive websites for clients\n\n";

      result += "\x1b[1mInterests\x1b[0m\n";
      result += "───────────────────────────────────────────────────────\n";
      result += "• Linux customization and open-source software\n";
      result += "• UI/UX design and animation\n";
      result += "• Modern web technologies\n";
      result += "• Hiking and outdoor photography\n\n";

      result +=
        "Want to know more? Try \x1b[32mskills\x1b[0m, \x1b[32mprojects\x1b[0m, or \x1b[32mcontact\x1b[0m commands.\n";

      return result;
    },
  });

  // Projects command - display portfolio projects
  registerCommand("projects", {
    description: "Browse my projects",
    usage: "projects [project-name]",
    execute: async (args, { windowManager }) => {
      // Define project data
      const projects = {
        hyprfolio: {
          name: "Hyprfolio",
          description:
            "Interactive portfolio website simulating Arch Linux with Hyprland window manager",
          tech: [
            "HTML5",
            "CSS3",
            "JavaScript",
            "Custom Terminal",
            "Window Manager",
          ],
          repo: "github.com/johnpork/hyprfolio",
          details: [
            "● Implemented a complete window management system with tiling support",
            "● Created a fully functional terminal emulator with command history",
            "● Built a virtual file system for content organization",
            "● Added responsive design with mobile optimization",
          ],
        },
        ecommerce: {
          name: "E-Commerce Platform",
          description:
            "Full-featured online store with shopping cart and payment processing",
          tech: ["React", "Node.js", "MongoDB", "Stripe API"],
          repo: "github.com/johnpork/ecommerce-platform",
          details: [
            "● Developed a responsive UI with React and styled-components",
            "● Implemented secure payment processing with Stripe",
            "● Created a robust product management system",
            "● Built RESTful API with Node.js and Express",
          ],
        },
        weatherapp: {
          name: "Weather Application",
          description:
            "Real-time weather tracking application with location-based forecasts",
          tech: ["JavaScript", "Weather API", "Geolocation", "CSS Animations"],
          repo: "github.com/johnpork/weather-app",
          details: [
            "● Integrated with OpenWeatherMap API for real-time data",
            "● Implemented geolocation for automatic local weather",
            "● Created smooth transitions and weather animations",
            "● Added offline support with service workers",
          ],
        },
      };

      // If a specific project is requested
      if (args.length > 0) {
        const projectName = args[0].toLowerCase();
        const project = projects[projectName];

        if (!project) {
          return `Project not found: ${projectName}\nTry: ${Object.keys(
            projects
          ).join(", ")}`;
        }

        // Display detailed project information with better ANSI formatting
        let result = "";
        // Project name header with proper reset
        result += `\x1b[1;34m${project.name}\x1b[0m\n`;
        result += "═".repeat(project.name.length + 10) + "\n\n";

        // Description with proper reset
        result += "\x1b[1mDescription:\x1b[0m ";
        result += `${project.description}\n\n`;

        // Technologies with proper reset
        result += "\x1b[1mTechnologies:\x1b[0m ";
        result += `${project.tech.join(", ")}\n\n`;

        // Repository with proper reset
        result += "\x1b[1mRepository:\x1b[0m ";
        result += `${project.repo}\n\n`;

        // Key features with proper reset
        result += "\x1b[1mKey Features:\x1b[0m\n";
        project.details.forEach((detail) => {
          result += `${detail}\n`;
        });
        result += "\n";

        return result;
      }

      // Had some trouble with the project art, it never wanted to display correctly
      // https://patorjk.com/ doesn't seem to work either. I CBA to fix it. PROIECTS IT IS.
      const projectArt = [
        "\x1b[33m  _____  _____    ____      _ ______  _____ _______ _____  \x1b[0m",
        "\x1b[33m |  __ \\|  __ \\  / __ \\    | |  ____|/ ____|__   __/ ____| \x1b[0m",
        "\x1b[33m | |__) | |__) || |  | |   | | |__  | |       | | | (___   \x1b[0m",
        "\x1b[33m |  ___/|  _  / | |  | |   | |  __| | |       | |  \\___ \\  \x1b[0m",
        "\x1b[33m | |    | | \\ \\ | |__| |   | | |____| |____   | |  ____) | \x1b[0m",
        "\x1b[33m |_|    |_|  \\_\\\\____/    |_|______|\\_____|  |_| |_____/  \x1b[0m",
        "\x1b[33m                                                           \x1b[0m",
      ];

      let result = projectArt.join("\n") + "\n\n";
      result += "For detailed information about a specific project, type:\n";
      result += "\x1b[32mprojects [project-name]\x1b[0m\n\n";
      result += "Available Projects:\n";
      result += "───────────────────────────────────────────────────────\n\n";

      // List all projects
      Object.entries(projects).forEach(([key, project]) => {
        // Use combined ANSI codes now that the parser supports them
        result +=
          "\x1b[1;34m" +
          project.name +
          "\x1b[0m - " +
          project.description +
          "\n";
        result +=
          "Technologies: \x1b[33m" + project.tech.join(", ") + "\x1b[0m\n";
        result += "View details: \x1b[32mprojects " + key + "\x1b[0m\n\n";
      });

      return result;
    },
  });

  // Skills command - display technical skills
  registerCommand("skills", {
    description: "View my technical skills",
    usage: "skills",
    execute: async (args, { windowManager }) => {
      // ASCII art for skills
      const skillsArt = [
        "\x1b[32m   ____  _    _ _ _      \x1b[0m",
        "\x1b[32m  / ___|| | _(_) | |___  \x1b[0m",
        "\x1b[32m  \\___ \\| |/ / | | / __| \x1b[0m",
        "\x1b[32m   ___) |   <| | | \\__ \\ \x1b[0m",
        "\x1b[32m  |____/|_|\\_\\_|_|_|___/ \x1b[0m",
        "\x1b[32m                          \x1b[0m",
      ];

      // Skill ratings (out of 10)
      const frontendSkills = [
        { name: "HTML/CSS", level: 9 },
        { name: "JavaScript", level: 9 },
        { name: "React", level: 8 },
        { name: "TypeScript", level: 7 },
        { name: "UI/UX Design", level: 7 },
      ];

      const backendSkills = [
        { name: "Node.js", level: 8 },
        { name: "Python", level: 7 },
        { name: "SQL", level: 6 },
        { name: "MongoDB", level: 7 },
        { name: "RESTful APIs", level: 8 },
      ];

      const otherSkills = [
        { name: "Git", level: 8 },
        { name: "Linux", level: 9 },
        { name: "Docker", level: 6 },
        { name: "CI/CD", level: 6 },
        { name: "Agile/Scrum", level: 7 },
      ];

      // Render skill bars
      const renderSkillBar = (skill) => {
        const fullBar = "█".repeat(skill.level);
        const emptyBar = "░".repeat(10 - skill.level);
        return `${skill.name.padEnd(15)} [${fullBar}${emptyBar}] ${
          skill.level
        }/10`;
      };

      let result = skillsArt.join("\n") + "\n\n";

      result += "\x1b[1mFrontend Development\x1b[0m\n";
      result += "───────────────────────────────────────────────────────\n";
      frontendSkills.forEach((skill) => {
        result += `\x1b[34m${renderSkillBar(skill)}\x1b[0m\n`;
      });

      result += "\n\x1b[1mBackend Development\x1b[0m\n";
      result += "───────────────────────────────────────────────────────\n";
      backendSkills.forEach((skill) => {
        result += `\x1b[33m${renderSkillBar(skill)}\x1b[0m\n`;
      });

      result += "\n\x1b[1mOther Skills\x1b[0m\n";
      result += "───────────────────────────────────────────────────────\n";
      otherSkills.forEach((skill) => {
        result += `\x1b[32m${renderSkillBar(skill)}\x1b[0m\n`;
      });

      result += "\n\x1b[1mCertifications & Training\x1b[0m\n";
      result += "───────────────────────────────────────────────────────\n";
      result += "● AWS Certified Developer - Associate\n";
      result += "● React Advanced Patterns Workshop\n";
      result += "● Full Stack Web Development Bootcamp\n";

      return result;
    },
  });

  // Contact command - display contact information
  registerCommand("contact", {
    description: "View my contact information",
    usage: "contact",
    execute: async (args, { windowManager }) => {
      // ASCII art for contact
      const contactArt = [
        "\x1b[35m   ______            __             __ \x1b[0m",
        "\x1b[35m  / ____/___  ____  / /_____ ______/ /_\x1b[0m",
        "\x1b[35m / /   / __ \\/ __ \\/ __/ __ `/ ___/ __/\x1b[0m",
        "\x1b[35m/ /___/ /_/ / / / / /_/ /_/ / /__/ /_  \x1b[0m",
        "\x1b[35m\\____/\\____/_/ /_/\\__/\\__,_/\\___/\\__/  \x1b[0m",
        "\x1b[35m                                        \x1b[0m",
      ];

      let result = contactArt.join("\n") + "\n\n";

      result += "\x1b[1mGet In Touch\x1b[0m\n";
      result += "───────────────────────────────────────────────────────\n\n";

      result += "📧 \x1b[1mEmail:\x1b[0m      john.pork@porkfolio.com\n";
      result += "🌐 \x1b[1mWebsite:\x1b[0m    https://www.johnpork.dev\n";
      result += "📱 \x1b[1mLinkedIn:\x1b[0m   linkedin.com/in/johnpork\n";
      result += "💻 \x1b[1mGitHub:\x1b[0m     github.com/johnpork\n";
      result += "🐦 \x1b[1mTwitter:\x1b[0m    @johnpork\n\n";

      result += "\x1b[1mFeel free to reach out!\x1b[0m\n";
      result += "───────────────────────────────────────────────────────\n";
      result +=
        "I'm open to freelance opportunities, collaborations, and just chatting about tech.\n";
      result += "The best way to reach me is via email or LinkedIn.\n\n";

      result += "\x1b[1mAvailability\x1b[0m\n";
      result += "───────────────────────────────────────────────────────\n";
      result += "Currently accepting new projects and opportunities.\n";
      result += "Response time: Usually within 24-48 hours.\n";

      return result;
    },
  });

  // Help command
  registerCommand("help", {
    description: "Display help information",
    usage: "help [command]",
    execute: async (args, { terminal }) => {
      if (args.length > 0) {
        const commandName = args[0].toLowerCase();
        if (commandName in commands) {
          return `${commandName}: ${commands[commandName].description}\nUsage: ${commands[commandName].usage}`;
        } else {
          return `Command not found: ${commandName}`;
        }
      }

      // Display all commands
      let result = "Available commands:\n";
      Object.keys(commands)
        .sort()
        .forEach((name) => {
          result += `  ${name} - ${commands[name].description}\n`;
        });
      return result;
    },
  });

  // Echo command
  registerCommand("echo", {
    description: "Display a message",
    usage: "echo [message]",
    execute: async (args) => {
      return args.join(" ");
    },
  });

  // Pwd command
  registerCommand("pwd", {
    description: "Print working directory",
    usage: "pwd",
    execute: async (args, { fileSystem }) => {
      return fileSystem.pwd();
    },
  });

  // Ls command
  registerCommand("ls", {
    description: "List directory contents",
    usage: "ls [path]",
    execute: async (args, { fileSystem }) => {
      const path = args.length > 0 ? args[0] : ".";
      const items = fileSystem.ls(path);

      if (items === null) {
        return `ls: cannot access '${path}': No such file or directory`;
      }

      if (items.length === 0) {
        return "";
      }

      // Format output
      const output = items
        .map((item) => {
          const isDir = item.isDirectory;
          const name = isDir ? `\x1b[34m${item.name}/\x1b[0m` : item.name;
          return name;
        })
        .join("  ");

      return output;
    },
  });

  // Cd command
  registerCommand("cd", {
    description: "Change directory",
    usage: "cd [path]",
    execute: async (args, { fileSystem, terminal }) => {
      const path = args.length > 0 ? args[0] : "/home/john_pork";

      if (fileSystem.cd(path)) {
        // Update terminal prompt after cd
        terminal.updatePrompt();
        return "";
      } else {
        return `cd: no such directory: ${path}`;
      }
    },
  });

  // Cat command
  registerCommand("cat", {
    description: "Display file contents",
    usage: "cat <file>",
    execute: async (args, { fileSystem }) => {
      if (args.length === 0) {
        return "cat: missing file operand";
      }

      const content = fileSystem.readFile(args[0]);

      if (content === null) {
        return `cat: ${args[0]}: No such file or directory`;
      }

      return content;
    },
  });

  // Clear command
  registerCommand("clear", {
    description: "Clear the terminal screen",
    usage: "clear",
    execute: async (args, { terminal, windowManager }) => {
      // Get the active window's ID
      const activeWindow = windowManager.getActiveWindow();
      if (activeWindow && activeWindow.id) {
        // Get the terminal instance for the active window
        const terminalInstance = terminal.getTerminal(activeWindow.id);
        if (terminalInstance) {
          // Clear the screen directly using the DOM
          const screen = terminalInstance.screen;
          if (screen) {
            while (screen.firstChild) {
              screen.removeChild(screen.firstChild);
            }
          }
        }
      }
      return "";
    },
  });

  // Mkdir command
  registerCommand("mkdir", {
    description: "Create a directory",
    usage: "mkdir <directory>",
    execute: async (args, { fileSystem }) => {
      if (args.length === 0) {
        return "mkdir: missing operand";
      }

      if (fileSystem.mkdir(args[0])) {
        return "";
      } else {
        return `mkdir: cannot create directory '${args[0]}': File exists or invalid path`;
      }
    },
  });

  // Resume command
  registerCommand("resume", {
    description: "Display my resume",
    usage: "resume",
    execute: async (args, { fileSystem }) => {
      const content = fileSystem.readFile("/home/john_pork/resume.txt");
      if (content) {
        return content;
      } else {
        return "Creating a resume file...\n\nJohn Pork\nEmail: john.pork@porkfolio.com\nGitHub: github.com/johnpork\n\nExperience and skills will be added soon.";
      }
    },
  });

  // Theme command
  registerCommand("theme", {
    description: "Switch between dark and light theme",
    usage: "theme [dark|light]",
    execute: async (args, { appState }) => {
      if (args.length > 0) {
        const theme = args[0].toLowerCase();
        if (theme === "dark" || theme === "light") {
          appState.theme = theme;
          document.getElementById(
            "theme-stylesheet"
          ).href = `css/themes/${theme}.css`;
          return `Theme switched to ${theme} mode`;
        } else {
          return "Invalid theme. Use 'dark' or 'light'";
        }
      } else {
        return `Current theme: ${appState.theme}`;
      }
    },
  });
}
