class File {
  /**
   * Constructor for File
   * @param {string} name - File name
   * @param {string} content - File content
   * @param {Object} metadata - File metadata
   */
  constructor(name, content = "", metadata = {}) {
    this.name = name;
    this.content = content;
    this.metadata = Object.assign(
      {
        created: new Date(),
        modified: new Date(),
        type: "text/plain",
        size: 0,
        permissions: {
          read: true,
          write: true,
          execute: false,
        },
      },
      metadata
    );
    this.updateSize();
  }

  /**
   * Update file content
   * @param {string} content - New content
   */
  updateContent(content) {
    this.content = content;
    this.metadata.modified = new Date();
    this.updateSize();
  }

  /**
   * Update file size based on content
   */
  updateSize() {
    this.metadata.size = this.content.length;
  }

  /**
   * Get file info
   * @returns {Object} file info
   */
  getInfo() {
    return {
      name: this.name,
      metadata: this.metadata,
    };
  }
}

/**
 * Directory class represents a directory in the virtual file system
 */
class Directory {
  /**
   * Constructor for Directory
   * @param {string} name - Directory name
   * @param {Object} metadata - Directory metadata
   */
  constructor(name, metadata = {}) {
    this.name = name;
    this.metadata = Object.assign(
      {
        created: new Date(),
        modified: new Date(),
        permissions: {
          read: true,
          write: true,
          execute: true,
        },
      },
      metadata
    );
    this.children = new Map();
  }

  /**
   * Add a child (file or directory) to this directory
   * @param {File|Directory} child - Child to add
   */
  addChild(child) {
    this.children.set(child.name, child);
    this.metadata.modified = new Date();
  }

  /**
   * Remove a child by name
   * @param {string} name - Name of child to remove
   * @returns {boolean} success
   */
  removeChild(name) {
    const result = this.children.delete(name);
    if (result) {
      this.metadata.modified = new Date();
    }
    return result;
  }

  /**
   * Get a child by name
   * @param {string} name - Name of child to get
   * @returns {File|Directory|undefined} child
   */
  getChild(name) {
    return this.children.get(name);
  }

  /**
   * Check if a child exists
   * @param {string} name - Name of child to check
   * @returns {boolean} exists
   */
  hasChild(name) {
    return this.children.has(name);
  }

  /**
   * List all children
   * @returns {Array} array of child names
   */
  list() {
    return Array.from(this.children.keys());
  }

  /**
   * Get directory info
   * @returns {Object} directory info
   */
  getInfo() {
    return {
      name: this.name,
      metadata: this.metadata,
      children: this.list(),
    };
  }
}

/**
 * FileSystem class for managing the virtual file system
 */
class FileSystem {
  /**
   * Constructor for FileSystem
   */
  constructor() {
    // Root directory
    this.root = new Directory("");
    this.currentPath = "/home/john_pork";

    // Create basic file structure
    this.initializeFileSystem();
  }

  /**
   * Initialize basic file system structure
   */
  initializeFileSystem() {
    // Create basic directories
    this.mkdir("/home");
    this.mkdir("/home/john_pork");
    this.mkdir("/etc");
    this.mkdir("/bin");
    this.mkdir("/usr");
    this.mkdir("/var");
    this.mkdir("/tmp");

    // Create about directory with content
    this.mkdir("/home/john_pork/about");
    this.writeFile(
      "/home/john_pork/about/intro.txt",
      "Welcome to John Pork's portfolio!\n\nThis is a simulated Arch Linux environment running Hyprland window manager. Feel free to explore using terminal commands."
    );

    // Create projects directory
    this.mkdir("/home/john_pork/projects");

    // Create skills directory
    this.mkdir("/home/john_pork/skills");

    // Create a welcome file
    this.writeFile(
      "/home/john_pork/welcome.txt",
      'Welcome to John Pork\'s Hyprfolio!\n\nType "help" to see available commands or try "about", "projects", or "skills" to learn more.'
    );

    // Create a resume file
    this.writeFile(
      "/home/john_pork/resume.txt",
      "JOHN PORK\n==========\n\nContact: john.pork@porkfolio.com | github.com/johnpork\n\nEDUCATION\n---------\nBachelor of Science in Computer Science\nUniversity of Porkland, 2018-2022\n\nEXPERIENCE\n---------\nFrontend Developer - PorkTech Inc. (2022-Present)\n- Working on modern web applications using React and TypeScript\n- Developing accessible and responsive user interfaces\n- Contributing to open source projects\n\nWeb Development Intern - Pork Studio (2021)\n- Assisted in developing responsive websites for clients\n- Worked on improving SEO and performance\n\nSKILLS\n------\n- Frontend: HTML, CSS, JavaScript, React, TypeScript\n- Backend: Node.js, Python, SQL, MongoDB\n- Tools: Git, Linux, Docker, CI/CD pipelines\n"
    );
  }

  /**
   * Resolve a path to an absolute path
   * @param {string} path - Path to resolve
   * @returns {string} absolute path
   */
  resolvePath(path) {
    // If path is absolute (starts with /)
    if (path.startsWith("/")) {
      return this.normalizePath(path);
    }

    // If path is relative
    return this.normalizePath(`${this.currentPath}/${path}`);
  }

  /**
   * Normalize a path (resolve . and .., remove duplicate slashes)
   * @param {string} path - Path to normalize
   * @returns {string} normalized path
   */
  normalizePath(path) {
    // Split path into components
    const components = path.split("/").filter((c) => c !== "");
    const result = [];

    for (const component of components) {
      if (component === ".") {
        // Current directory, do nothing
      } else if (component === "..") {
        // Parent directory, remove last component
        if (result.length > 0) {
          result.pop();
        }
      } else {
        // Regular component
        result.push(component);
      }
    }

    return "/" + result.join("/");
  }

  /**
   * Find a node (file or directory) at a given path
   * @param {string} path - Path to find
   * @returns {File|Directory|null} node
   */
  findNode(path) {
    path = this.resolvePath(path);

    // Handle root directory
    if (path === "/") {
      return this.root;
    }

    // Split path into components
    const components = path.split("/").filter((c) => c !== "");

    // Start at root
    let current = this.root;

    // Traverse path
    for (const component of components) {
      if (!current.hasChild(component)) {
        return null;
      }
      current = current.getChild(component);
    }

    return current;
  }

  /**
   * Change current directory
   * @param {string} path - New directory path
   * @returns {boolean} success
   */
  cd(path) {
    // Resolve path
    const resolvedPath = this.resolvePath(path);

    // Find target directory
    const target = this.findNode(resolvedPath);

    if (!target || !(target instanceof Directory)) {
      return false;
    }

    // Update current path
    this.currentPath = resolvedPath;

    // Dispatch event to notify terminal of directory change
    document.dispatchEvent(new CustomEvent("directory-changed"));

    return true;
  }

  /**
   * List directory contents
   * @param {string} path - Path to list
   * @returns {Array|null} array of items or null if path doesn't exist
   */
  ls(path = this.currentPath) {
    path = this.resolvePath(path);

    const node = this.findNode(path);

    if (!node || !(node instanceof Directory)) {
      return null;
    }

    return Array.from(node.children.entries()).map(([name, child]) => {
      return {
        name,
        isDirectory: child instanceof Directory,
        metadata: child.metadata,
      };
    });
  }

  /**
   * Create a directory
   * @param {string} path - Path to create
   * @returns {boolean} success
   */
  mkdir(path) {
    path = this.resolvePath(path);

    // Get parent directory and new directory name
    const lastSlashIndex = path.lastIndexOf("/");
    const parentPath = path.substring(0, lastSlashIndex) || "/";
    const dirName = path.substring(lastSlashIndex + 1);

    // Cannot create root
    if (dirName === "") {
      return false;
    }

    // Get parent directory
    const parent = this.findNode(parentPath);

    if (!parent || !(parent instanceof Directory)) {
      return false;
    }

    // Check if directory already exists
    if (parent.hasChild(dirName)) {
      return false;
    }

    // Create new directory
    const newDir = new Directory(dirName);
    parent.addChild(newDir);

    return true;
  }

  /**
   * Read a file
   * @param {string} path - Path to read
   * @returns {string|null} file content or null if path doesn't exist
   */
  readFile(path) {
    path = this.resolvePath(path);

    const node = this.findNode(path);

    if (!node || !(node instanceof File)) {
      return null;
    }

    return node.content;
  }

  /**
   * Write to a file
   * @param {string} path - Path to write
   * @param {string} content - Content to write
   * @returns {boolean} success
   */
  writeFile(path, content) {
    path = this.resolvePath(path);

    // Get parent directory and file name
    const lastSlashIndex = path.lastIndexOf("/");
    const parentPath = path.substring(0, lastSlashIndex) || "/";
    const fileName = path.substring(lastSlashIndex + 1);

    // Cannot create empty file name
    if (fileName === "") {
      return false;
    }

    // Get parent directory
    const parent = this.findNode(parentPath);

    if (!parent || !(parent instanceof Directory)) {
      return false;
    }

    // If file exists, update content
    if (parent.hasChild(fileName)) {
      const file = parent.getChild(fileName);
      if (file instanceof File) {
        file.updateContent(content);
        return true;
      }
      return false;
    }

    // Create new file
    const newFile = new File(fileName, content);
    parent.addChild(newFile);

    return true;
  }

  /**
   * Remove a file or directory
   * @param {string} path - Path to remove
   * @returns {boolean} success
   */
  rm(path) {
    path = this.resolvePath(path);

    // Cannot remove root
    if (path === "/") {
      return false;
    }

    // Get parent directory and name
    const lastSlashIndex = path.lastIndexOf("/");
    const parentPath = path.substring(0, lastSlashIndex) || "/";
    const name = path.substring(lastSlashIndex + 1);

    // Get parent directory
    const parent = this.findNode(parentPath);

    if (!parent || !(parent instanceof Directory)) {
      return false;
    }

    // Check if exists
    if (!parent.hasChild(name)) {
      return false;
    }

    return parent.removeChild(name);
  }

  /**
   * Get current directory
   * @returns {string} current directory
   */
  pwd() {
    return this.currentPath;
  }
}

/**
 * Initialize the file system
 * @returns {Object} file system interface
 */
export function initializeFileSystem() {
  console.log("Initializing custom file system implementation");
  const fs = new FileSystem();

  // Trigger directory-changed event after initialization
  document.dispatchEvent(new CustomEvent("directory-changed"));

  // Public API
  return {
    // Directory operations
    cd: (path) => fs.cd(path),
    ls: (path) => fs.ls(path),
    pwd: () => fs.pwd(),
    mkdir: (path) => fs.mkdir(path),

    // File operations
    readFile: (path) => fs.readFile(path),
    writeFile: (path, content) => fs.writeFile(path, content),
    rm: (path) => fs.rm(path),

    // Path utilities
    resolvePath: (path) => fs.resolvePath(path),

    // Get file or directory info
    stat: (path) => {
      const node = fs.findNode(path);
      return node ? node.getInfo() : null;
    },
  };
}
