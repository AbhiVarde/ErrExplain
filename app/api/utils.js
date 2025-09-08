export function getClientId(request) {
  const clientIdHeader = request.headers.get("x-client-id");
  if (clientIdHeader && clientIdHeader.length >= 16) {
    return clientIdHeader.replace(/[^a-zA-Z0-9]/g, "").substring(0, 20);
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") || "";
  const acceptLanguage = request.headers.get("accept-language") || "";
  const acceptEncoding = request.headers.get("accept-encoding") || "";

  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  const fingerprint = Buffer.from(
    userAgent + ip + acceptLanguage + acceptEncoding
  )
    .toString("base64")
    .slice(0, 16);

  return fingerprint.replace(/[^a-zA-Z0-9]/g, "").substring(0, 20);
}

// Updated validation function to match client-side logic exactly
export function isValidError(text) {
  if (!text || text.trim().length < 8) return false;

  const cleanText = text.trim();
  let score = 0;

  // Comprehensive patterns matching client-side validation
  const patterns = [
    // Generic error patterns
    /\b(error|exception|failed|failure)\s*[:]/i,
    /\b(unhandled exception)\b/i,
    /\bnullreferenceexception\b/i,
    /\bargument(exception|outofrange)\b/i,
    /\bvalue does not fall within\b/i,

    // JavaScript/Python/Java/PHP common errors
    /\b(typeerror|referenceerror|syntaxerror|nameerror|valueerror|keyerror|importerror)\b/i,
    /at\s+.*:\d+:\d+/i,
    /line\s+\d+/i,
    /:\d+:\d+/,
    /cannot\s+(read|find|resolve|access)/i,
    /is\s+not\s+(defined|found|a\s+function)/i,
    /unexpected\s+(token|end)/i,
    /module\s+not\s+found/i,

    // Compiler/runtime error codes
    /\bCS\d{4}\b/i, // C# compiler error codes
    /\.cs\(\d+,\d+\)/i, // C# file + line
    /\.java:\d+/i,
    /\.py[\s:"]/i,
    /\.php.*line\s+\d+/i,
    /\.cpp:\d+/i,
    /\.ts(x)?:\d+/i,

    // HTTP/server errors
    /\b(404|500|502|503)\b/i,

    // File extensions in error context
    /\.(js|py|java|php|cpp|cs|rb|go|rs|swift|kt|sql|html|css)[\s:"]/i,

    // C# specific patterns
    /system\.\w+exception/i,
    /program\.cs:\s*line\s*\d+/i,
    /string\.isnullorempty/i,

    // Ruby specific
    /\.rb:\d+/i,
    /undefined method.*for/i,
    /nomethoderror/i,
    /loaderror.*cannot load/i,
    /nameerror.*undefined local variable/i,

    // Go specific
    /\.go:\d+/i,
    /panic:/i,
    /goroutine \d+/i,
    /undefined:.*fmt\./i,
    /cannot use.*as type/i,

    // SQL specific
    /ERROR \d+/i,
    /duplicate entry/i,
    /syntax error.*near/i,
    /table.*doesn.*exist/i,

    // Linux/Bash specific
    /permission denied/i,
    /command not found/i,
    /segmentation fault/i,
    /bash:.*command not found/i,
    /usr\/bin\/env/i,
    /mkdir:.*permission denied/i,

    // Docker specific
    /failed to solve/i,
    /dockerfile/i,
    /executor failed running/i,
    /pull access denied/i,
    /killed by sigkill/i,

    // Git specific
    /fatal:.*git/i,
    /not a git repository/i,
    /local changes would be overwritten/i,
    /conflict.*content/i,
    /automatic merge failed/i,

    // Swift specific
    /thread.*fatal error/i,
    /viewcontroller\.swift/i,
    /exc_bad_access/i,
    /index out of range/i,
    /appdelegate\.swift/i,

    // Appwrite specific
    /appwriteexception/i,
    /document.*not.*found/i,
    /collection.*not.*found/i,

    // Rust specific - IMPORTANT: This was missing in original server-side validation
    /\berror\[E\d+\]/i,
    /\.rs:\d+/i,
    /thread.*panicked/i,
    /cargo.*error/i,
    /borrow of moved value/i,
    /mismatched types/i,
    /expected.*found/i,
  ];

  patterns.forEach((pattern) => {
    if (pattern.test(cleanText)) score++;
  });

  // If we found at least one strong pattern, it's likely a valid error
  return score >= 1;
}

// Simple language detection from error
export function detectLanguage(errorText) {
  const indicators = {
    // Check more specific languages first
    Appwrite: [
      /appwriteexception/i,
      /document.*not.*found/i,
      /collection.*not.*found/i,
      /function.*execution.*failed/i,
      /users\.get\(\)/i,
      /database\.getcollection\(\)/i,
    ],
    "C#": [
      /\.cs\(\d+,\d+\)/i,
      /\bCS\d{4}\b/i,
      /system\.\w+exception/i,
      /program\.cs.*line/i,
      /string\.isnullorempty/i,
      /argumentnullexception/i,
    ],
    Ruby: [
      /\.rb:\d+/i,
      /nomethoderror.*undefined method/i,
      /nameerror.*undefined local variable/i,
      /loaderror.*cannot load such file/i,
      /from.*\.rb:\d+.*in/i,
    ],
    Go: [
      /\.go:\d+/i,
      /panic:.*runtime error/i,
      /goroutine \d+.*running/i,
      /undefined:.*fmt\./i,
      /cannot use.*as type.*in assignment/i,
    ],
    Swift: [
      /\.swift:\d+/i,
      /thread.*fatal error.*index out of range/i,
      /exc_bad_access/i,
      /viewcontroller\.swift/i,
      /appdelegate\.swift/i,
    ],
    SQL: [
      /ERROR \d{4}.*\(\w+\)/i,
      /table.*doesn.*exist/i,
      /syntax error.*near.*from/i,
      /duplicate entry.*for key/i,
      /select.*from.*where/i,
    ],
    Docker: [
      /failed to solve.*executor failed/i,
      /dockerfile:\d+/i,
      /docker:.*error response from daemon/i,
      /container exited with code/i,
      /pull access denied/i,
    ],
    Git: [
      /fatal:.*not a git repository/i,
      /error:.*local changes would be overwritten/i,
      /conflict.*content.*merge conflict/i,
      /automatic merge failed/i,
      /git pull.*git status/i,
    ],
    Linux: [
      /bash:.*command not found/i,
      /usr\/bin\/env.*no such file/i,
      /permission denied.*cannot create directory/i,
      /segmentation fault.*core dumped/i,
      /mkdir:.*permission denied/i,
    ],
    Python: [
      /\.py[\s:"]/i,
      /traceback.*most recent call last/i,
      /^\s*(file\s+|  File\s+)/im,
      /\b(nameerror|keyerror|valueerror|indentationerror|importerror|attributeerror|indexerror|zerodivisionerror)\b/i,
      /\^\s*$/m,
    ],
    Java: [
      /\.java:\d+/i,
      /exception in thread/i,
      /\b(nullpointerexception|classnotfoundexception|arrayindexoutofboundsexception|illegalargumentexception)\b/i,
      /\bat\s+[\w.$]+\(/i,
      /caused by:/i,
    ],
    TypeScript: [
      /\.ts:\d+/i,
      /\bts\d{4}:/i,
      /property.*does not exist on type/i,
      /type.*is not assignable to type/i,
      /\.tsx:\d+/i,
    ],
    React: [
      /warning.*each child.*unique.*key/i,
      /hooks can only be called/i,
      /cannot update.*component.*while rendering/i,
      /react.*error/i,
      /\.jsx:\d+/i,
    ],
    "Next.js": [
      /next.*error/i,
      /getStaticProps|getServerSideProps/i,
      /_app\.js|_document\.js/i,
      /next\/\w+/i,
    ],
    "Node.js": [
      /\benoent\b/i,
      /cannot find module/i,
      /error.*node_modules/i,
      /\bnode:\w+/i,
    ],
    JavaScript: [
      /\.js:\d+/i,
      /\b(typeerror|referenceerror|syntaxerror)\b.*\b(cannot read|is not defined|unexpected token)/i,
      /\bat\s+.*\.js:/i,
    ],
    PHP: [
      /\.php.*line\s+\d+/i,
      /fatal error.*php/i,
      /parse error.*php/i,
      /\$\w+.*undefined/i,
      /call to undefined function/i,
    ],
    "C++": [
      /\.cpp:\d+/i,
      /\.h:\d+/i,
      /\berror.*expected.*before/i,
      /segmentation fault/i,
      /core dumped/i,
    ],
    Rust: [
      /\.rs:\d+/i,
      /\berror\[E\d+\]/i,
      /thread.*panicked/i,
      /cargo.*error/i,
      /borrow of moved value/i,
      /mismatched types/i,
      /expected.*found/i,
    ],
    Kotlin: [
      /\.kt:\d+/i,
      /kotlinnullpointerexception/i,
      /kotlin.*error/i,
      /mainactivity\.kt/i,
      /unresolved reference.*println/i,
    ],
    "HTML/CSS": [
      /\.html:\d+/i,
      /\.css:\d+/i,
      /css.*error/i,
      /html.*validation.*error/i,
    ],
  };

  // Score each language based on indicators found
  const scores = {};
  for (const [lang, patterns] of Object.entries(indicators)) {
    scores[lang] = patterns.reduce(
      (score, pattern) => score + (pattern.test(errorText) ? 1 : 0),
      0
    );
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return null;

  return Object.keys(scores).find((lang) => scores[lang] === maxScore);
}

// Language-specific sample errors
export function getSampleErrors(language) {
  const samples = {
    JavaScript: [
      "TypeError: Cannot read property 'map' of undefined\n    at TodoList.render (App.js:42:18)\n    at React.createElement",
      "ReferenceError: $ is not defined\n    at main.js:15:5\n    at Module.eval (main.js:20:1)",
      "SyntaxError: Unexpected token '}' in JSON at position 156\n    at JSON.parse (<anonymous>)",
    ],
    TypeScript: [
      "Property 'id' does not exist on type '{}'. TS2339\n    at UserProfile.tsx:28:15\n    const userId = user.id;",
      "Type 'string | undefined' is not assignable to type 'string'. TS2322\n    at utils.ts:45:8",
      "Cannot find module 'react' or its corresponding type declarations. TS2307\n    at App.tsx:1:1",
    ],
    React: [
      'Warning: Each child in a list should have a unique "key" prop.\n    at TodoItem (TodoList.jsx:15:8)\n    at TodoList',
      "Error: Cannot update a component while rendering a different component\n    at App.js:67:12",
      "TypeError: Cannot read property 'setState' of undefined\n    at onClick (Button.jsx:8:5)",
    ],
    "Next.js": [
      "Error: getStaticProps can only be exported from a page. Read more: https://nextjs.org/docs\n    at pages/component.js:1:1",
      "Module not found: Can't resolve 'next/image'\n    at webpack (pages/_app.js:3:1)",
      "TypeError: Cannot read property 'query' of undefined\n    at getServerSideProps (pages/user/[id].js:12:8)",
    ],
    "Node.js": [
      "Error: Cannot find module 'express'\n    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:636:15)\n    at server.js:1:1",
      "ENOENT: no such file or directory, open './config.json'\n    at Object.openSync (fs.js:458:3)",
      "TypeError: app.listen is not a function\n    at Object.<anonymous> (server.js:15:5)",
    ],
    Python: [
      "NameError: name 'pandas' is not defined\n  File \"analysis.py\", line 12, in <module>\n    import pandas as pd\nNameError: name 'pandas' is not defined",
      "KeyError: 'missing_key'\n  File \"processor.py\", line 45, in process_data\n    value = data['missing_key']\nKeyError: 'missing_key'",
      "IndentationError: expected an indented block\n  File \"main.py\", line 23\n    print('hello')\n    ^\nIndentationError: expected an indented block",
    ],
    Java: [
      "java.lang.NullPointerException\n\tat com.example.Main.processData(Main.java:45)\n\tat com.example.Main.main(Main.java:12)",
      "java.lang.ClassNotFoundException: com.mysql.jdbc.Driver\n\tat java.net.URLClassLoader.findClass(URLClassLoader.java:381)",
      "java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 3\n\tat DataProcessor.process(DataProcessor.java:23)",
    ],
    "C++": [
      "error: expected ';' before '}' token\n  main.cpp:25:1:\n   25 | }\n      | ^",
      "Segmentation fault (core dumped)\n    at main.cpp:15 in function processArray()",
      "error: 'cout' was not declared in this scope\n  main.cpp:10:5:\n   10 |     cout << \"Hello\";\n      |     ^~~~",
    ],
    "C#": [
      "System.NullReferenceException: Object reference not set to an instance of an object.\n   at Program.Main(String[] args) in Program.cs:line 15",
      "CS0103: The name 'Console' does not exist in the current context\n  Program.cs(12,13): error CS0103",
      "System.ArgumentNullException: Parameter name: value\n   at String.IsNullOrEmpty(String value)",
    ],
    PHP: [
      "Fatal error: Uncaught Error: Call to undefined function mysqli_connect()\n  in database.php on line 12\nStack trace:\n#0 {main}",
      "Parse error: syntax error, unexpected '}', expecting ',' or ';'\n  in config.php on line 25",
      "Notice: Undefined variable: username in login.php on line 15",
    ],
    Ruby: [
      "NoMethodError: undefined method 'size' for nil:NilClass\n  from users.rb:23:in 'get_user_count'\n  from app.rb:15:in '<main>'",
      "NameError: undefined local variable or method 'user_name'\n  from models/user.rb:45:in 'display_info'",
      "LoadError: cannot load such file -- 'missing_gem'\n  from Gemfile:5:in '<top (required)>'",
    ],
    Go: [
      "panic: runtime error: invalid memory address or nil pointer dereference\n  goroutine 1 [running]:\n  main.processData()\n    main.go:15 +0x20",
      'undefined: fmt.Printf\n  main.go:10:2:\n   10 |   fmt.Printf("Hello")\n      |   ^',
      './main.go:25:12: cannot use "string" (type string) as type int in assignment',
    ],
    Rust: [
      'error[E0382]: borrow of moved value: `data`\n  --> src/main.rs:15:20\n   15 |     println!("{}", data);\n      |                    ^^^^ value borrowed here after move',
      "thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 5'\n  src/main.rs:23:5",
      'error[E0308]: mismatched types\n  --> src/main.rs:10:13\n   10 |     let x: i32 = "hello";\n      |        ---   ^^^^^^^ expected `i32`, found `&str`',
    ],
    Swift: [
      "Thread 1: Fatal error: Index out of range\n  ViewController.swift:45:21\n   45 |         let item = items[index]\n      |                          ^",
      "error: value of type 'String' has no member 'count'\n  main.swift:12:15\n   12 |     let len = str.count\n      |               ~~~ ^~~~~",
      "Thread 1: EXC_BAD_ACCESS (code=1, address=0x0)\n  AppDelegate.swift:25",
    ],
    Kotlin: [
      "kotlin.KotlinNullPointerException\n\tat MainActivity.onCreate(MainActivity.kt:15)\n\tat android.app.Activity.performCreate",
      'error: unresolved reference: println\n  Main.kt:5:5\n   5 |     println("Hello")\n      |     ^~~~~~~',
      "Type mismatch: inferred type is String but Int was expected\n  Main.kt:10:17",
    ],
    SQL: [
      "ERROR 1146 (42S02): Table 'database.users' doesn't exist\n  at line 1: SELECT * FROM users WHERE id = 1;",
      "ERROR 1064 (42000): You have an error in your SQL syntax near 'FROM users' at line 1\n  SELECT * users WHERE id = 1;",
      "ERROR 1062 (23000): Duplicate entry 'john@email.com' for key 'users.email'",
    ],
    "HTML/CSS": [
      "Uncaught ReferenceError: $ is not defined\n    at index.html:15:5\n  <script>$(document).ready(function() {",
      "CSS Error: Expected RBRACE at line 25, col 1\n  styles.css:25:1\n   25 | .container {\n      |            ^",
      "HTML Validation Error: End tag 'div' seen, but there were open elements.\n  index.html:45:1",
    ],
    Docker: [
      "ERROR: failed to solve: executor failed running [/bin/sh -c npm install]: exit code: 1\n  Dockerfile:15\n   15 | RUN npm install",
      "docker: Error response from daemon: pull access denied for myimage, repository does not exist\n  docker run myimage:latest",
      "Container exited with code 137 (killed by SIGKILL)\n  docker logs container_id",
    ],
    Git: [
      "fatal: not a git repository (or any of the parent directories): .git\n  git status",
      "error: Your local changes would be overwritten by merge.\n  Aborting.\n  git pull origin main",
      "CONFLICT (content): Merge conflict in src/main.js\n  Automatic merge failed; fix conflicts and then commit the result.",
    ],
    Linux: [
      "bash: command not found: python3\n  /usr/bin/env: 'python3': No such file or directory",
      "Permission denied: cannot create directory '/var/log/myapp'\n  mkdir: cannot create directory '/var/log/myapp': Permission denied",
    ],
    Appwrite: [
      "AppwriteException: Document with the requested ID could not be found.\n  at Users.get() in users.js:25\n  Error Code: 404",
      "AppwriteException: Collection with the requested ID could not be found.\n  at Database.getCollection() in database.js:15",
      "Function execution failed: Runtime error in function 'processUser'\n  at line 10: TypeError: Cannot read property 'email' of undefined",
    ],
    Other: [
      "Error: An unexpected error occurred during processing\n  at processRequest() in handler.js:42:15",
      "RuntimeError: Operation failed with status code 500\n  at executeOperation() in service.js:28:8",
      "ValidationError: Required field 'name' is missing\n  at validateInput() in validator.js:15:12",
    ],
  };

  return samples[language] || samples["Other"];
}
