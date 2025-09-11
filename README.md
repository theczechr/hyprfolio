# Hyprfolio

An interactive portfolio website that simulates an Arch Linux environment with the Hyprland window manager.

## 🚀 Features

### Desktop Environment
- **Authentic Boot Sequence**: Realistic Linux boot messages and login screen
- **Window Manager**: Fully functional window management with drag, resize, and snap capabilities
- **Workspaces**: 6 independent workspaces switchable via Alt+[1-6]
- **Waybar**: Status bar with workspace indicators and real-time clock
- **Theme Support**: Toggle between dark and light themes (Alt+T)

### Terminal Emulator
- Full terminal emulation with ANSI color support
- Command history navigation (arrow keys)
- Tab completion for commands and file paths
- Multiple terminal instances support
- Custom prompt with current directory display

### Virtual File System
- Complete Unix-like file system implementation
- Standard commands: `ls`, `cd`, `pwd`, `mkdir`, `rm`, `cat`, `echo`
- Pre-populated portfolio content in `/home/john_pork/`

### Portfolio Commands
- `neofetch` - Display system info in Arch Linux style
- `about` - Learn about John Pork
- `projects` - Browse portfolio projects
- `skills` - View technical skills with visual progress bars
- `contact` - Get contact information
- `resume` - View resume content
- `help` - List all available commands

## 🎮 Keyboard Shortcuts

### Workspaces
| Shortcut | Action |
|----------|--------|
| Alt + 1 | Switch to workspace 1 (Intro) |
| Alt + 2 | Switch to workspace 2 (Projects) |
| Alt + 3 | Switch to workspace 3 (Skills) |
| Alt + 4 | Switch to workspace 4 (About) |
| Alt + 5 | Switch to workspace 5 (Contact) |
| Alt + 6 | Switch to workspace 6 (Interactive) |

### Terminal
| Shortcut | Action |
|----------|--------|
| Alt + Enter | Open new terminal |
| Ctrl + C | Cancel command |
| Ctrl + L | Clear terminal |
| ↑/↓ | Navigate history |
| Tab | Complete command/path |

### Window Management
| Shortcut | Action |
|----------|--------|
| Alt + Q | Close window |
| Alt + F | Maximize/restore window |
| Alt + H | Tile horizontally |
| Alt + V | Tile vertically |
| Alt + G | Tile in grid |

### System
| Shortcut | Action |
|----------|--------|
| Alt + T | Toggle theme |
| Alt + M | Toggle mobile view |
| Alt + R | Emergency repair (fixes window issues) |
| Alt + Shift + V | Force window visibility |
| F1 | Show/hide help |

## 💻 Usage

Simply run a python http server in this folder, no packages required, pure Javascript, no libraries.


## 📱 Mobile Support

The site is fully responsive with:
- Touch gestures for window manipulation
- Mobile-optimized menu
- Simplified view toggle for smaller screens

## 🛠️ Technical Details

### Built With
- Pure HTML5, CSS3, and vanilla JavaScript
- ES6 modules for clean architecture
- No external dependencies or frameworks
- Custom implementations of all features

### Architecture
- **Modular Design**: Separated into window manager, terminal, file system, and command modules
- **Event-Driven**: Components communicate via custom events
- **State Management**: Centralized app state with localStorage persistence
- **Performance Optimized**: Efficient DOM manipulation and event delegation

## 📁 Project Structure

```
xjarusr00/
├── index.html          # Main HTML file
├── css/
│   ├── main.css       # Core styles
│   ├── terminal.css   # Terminal-specific styles
│   ├── windows.css    # Window manager styles
│   ├── responsive.css # Mobile responsiveness
│   └── themes/        # Theme files
├── js/
│   ├── main.js        # Application entry point
│   ├── terminal.js    # Terminal emulator
│   ├── windowManager.js # Window management
│   ├── fileSystem.js  # Virtual file system
│   └── commands.js    # Terminal commands
└── README.md          # This file
```

## 🎨 Customization

To customize the portfolio content:
1. Edit the file system structure in `js/fileSystem.js`
2. Modify portfolio commands in `js/commands.js`
3. Update personal information throughout the codebase

## 📄 License

This project is open source and available under the MIT License.

*Built with ❤️ and a lot of ☕ to showcase both technical skills and creativity*
