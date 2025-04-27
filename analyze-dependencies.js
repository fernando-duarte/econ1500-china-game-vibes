const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// Skip these directories
const SKIP_DIRS = ['node_modules', '.git', '.venv'];
// Analyze only these file extensions
const FILE_EXTENSIONS = ['.js'];

// Dependency patterns to match
const REQUIRE_PATTERN = /require\(['"]([^'"]+)['"]\)/g;
const IMPORT_PATTERN = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;

// Complexity patterns
const FUNCTION_PATTERN = /function\s+\w+\s*\(|=>|class\s+\w+|constructor\s*\(/g;
const IF_PATTERN = /if\s*\(/g;
const ELSE_IF_PATTERN = /else\s+if\s*\(/g;
const ELSE_PATTERN = /else\s*{/g;
const SWITCH_PATTERN = /switch\s*\(/g;
const CASE_PATTERN = /case\s+.+:/g;
const FOR_PATTERN = /for\s*\(/g;
const WHILE_PATTERN = /while\s*\(/g;
const DO_PATTERN = /do\s*{/g;
const TERNARY_PATTERN = /\?.*:/g;
const LOGICAL_AND_PATTERN = /&&/g;
const LOGICAL_OR_PATTERN = /\|\|/g;
const TRY_PATTERN = /try\s*{/g;
const CATCH_PATTERN = /catch\s*\(/g;

// Store dependencies
const dependencies = {};
const fileDetails = {};
const moduleDependencies = new Map();
const complexityMetrics = {};

async function isDirectory(filePath) {
  try {
    const stats = await statAsync(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

function normalizePath(importPath, currentFile) {
  // Skip native Node.js modules
  if (
    !importPath.startsWith('./') &&
    !importPath.startsWith('../') &&
    !importPath.startsWith('/')
  ) {
    return importPath;
  }

  // Get absolute path
  const absolutePath = path.resolve(path.dirname(currentFile), importPath);

  // Handle JS extensions (Node.js allows omitting .js extension in requires)
  const pathWithPossibleExt = !path.extname(absolutePath)
    ? `${absolutePath}.js`
    : absolutePath;

  // Try to simplify the path relative to project root
  let normalizedPath = pathWithPossibleExt;
  try {
    normalizedPath = path.relative(process.cwd(), pathWithPossibleExt);
  } catch {
    // If relative path calculation fails, use the absolute path
  }

  return normalizedPath;
}

function calculateComplexity(content) {
  // Basic calculation of cyclomatic complexity
  const functionMatches = (content.match(FUNCTION_PATTERN) || []).length;
  const ifMatches = (content.match(IF_PATTERN) || []).length;
  const elseIfMatches = (content.match(ELSE_IF_PATTERN) || []).length;
  const elseMatches = (content.match(ELSE_PATTERN) || []).length;
  const switchMatches = (content.match(SWITCH_PATTERN) || []).length;
  const caseMatches = (content.match(CASE_PATTERN) || []).length;
  const forMatches = (content.match(FOR_PATTERN) || []).length;
  const whileMatches = (content.match(WHILE_PATTERN) || []).length;
  const doMatches = (content.match(DO_PATTERN) || []).length;
  const ternaryMatches = (content.match(TERNARY_PATTERN) || []).length;
  const logicalAndMatches = (content.match(LOGICAL_AND_PATTERN) || []).length;
  const logicalOrMatches = (content.match(LOGICAL_OR_PATTERN) || []).length;
  const tryMatches = (content.match(TRY_PATTERN) || []).length;
  const catchMatches = (content.match(CATCH_PATTERN) || []).length;

  // Count decision points (each decision point adds one to complexity)
  const decisionPoints =
    ifMatches +
    elseIfMatches +
    caseMatches +
    forMatches +
    whileMatches +
    doMatches +
    ternaryMatches +
    logicalAndMatches +
    logicalOrMatches +
    catchMatches;

  // Calculate average complexity per function (if there are functions)
  const averageComplexityPerFunction =
    functionMatches > 0
      ? parseFloat((decisionPoints / functionMatches).toFixed(2))
      : 0;

  return {
    totalComplexity: decisionPoints,
    functionCount: functionMatches,
    decisionPoints: {
      if: ifMatches,
      elseIf: elseIfMatches,
      else: elseMatches,
      switch: switchMatches,
      case: caseMatches,
      for: forMatches,
      while: whileMatches,
      do: doMatches,
      ternary: ternaryMatches,
      logicalOperators: logicalAndMatches + logicalOrMatches,
      tryCatch: tryMatches + catchMatches,
    },
    averageComplexityPerFunction: averageComplexityPerFunction,
  };
}

async function extractDependencies(filePath) {
  const content = await readFileAsync(filePath, 'utf8');
  const fileSize = content.length;
  const lineCount = content.split('\n').length;

  const deps = new Set();

  // Extract require() dependencies
  let match;
  while ((match = REQUIRE_PATTERN.exec(content)) !== null) {
    deps.add(match[1]);
  }

  // Extract import dependencies
  REQUIRE_PATTERN.lastIndex = 0; // Reset regex
  while ((match = IMPORT_PATTERN.exec(content)) !== null) {
    deps.add(match[1]);
  }

  // Calculate code complexity
  const complexity = calculateComplexity(content);

  // Normalize paths
  const normalizedDeps = Array.from(deps).map((dep) =>
    normalizePath(dep, filePath)
  );

  // Add to dependencies map
  const relativePath = path.relative(process.cwd(), filePath);
  dependencies[relativePath] = normalizedDeps;
  fileDetails[relativePath] = { size: fileSize, lines: lineCount };
  complexityMetrics[relativePath] = complexity;

  // Add to module dependencies mapping
  normalizedDeps.forEach((dep) => {
    if (!moduleDependencies.has(dep)) {
      moduleDependencies.set(dep, new Set());
    }
    moduleDependencies.get(dep).add(relativePath);
  });

  return normalizedDeps;
}

async function exploreDirectory(dirPath) {
  const results = [];

  const files = await readdirAsync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);

    // Skip directories we don't want to analyze
    if (SKIP_DIRS.includes(file)) {
      continue;
    }

    if (await isDirectory(filePath)) {
      const subResults = await exploreDirectory(filePath);
      results.push(...subResults);
    } else {
      // Only analyze files with specified extensions
      const ext = path.extname(file);
      if (FILE_EXTENSIONS.includes(ext)) {
        results.push(filePath);
        await extractDependencies(filePath);
      }
    }
  }

  return results;
}

function generateModuleDescription(moduleName) {
  // A simple function to generate descriptions based on file paths
  if (moduleName.includes('constants.js')) {
    return 'Central configuration module with game parameters, UI text, and error messages';
  } else if (moduleName.includes('gameState.js')) {
    return 'Primary state management module for game data';
  } else if (moduleName.includes('model.js')) {
    return 'Economic model calculations for the Solow growth model';
  } else if (moduleName.includes('events.js')) {
    return 'Socket.IO event setup and routing';
  } else if (moduleName.includes('index.js')) {
    return 'Main server entrypoint with Express and Socket.IO setup';
  } else if (moduleName.includes('roundManager.js')) {
    return 'Facade module for round-related operations';
  } else if (moduleName.includes('dom.js')) {
    return 'UI DOM manipulation module';
  } else if (moduleName.includes('socket.js')) {
    return 'Socket communication handlers';
  } else if (moduleName.includes('endRound.js')) {
    return 'Round ending logic and cleanup';
  } else if (moduleName.includes('startRound.js')) {
    return 'Round initialization and setup';
  } else {
    // Generic description
    const parts = moduleName.split('/');
    return `${parts[parts.length - 1].replace('.js', '')} module`;
  }
}

async function analyzeProject() {
  try {
    await exploreDirectory(process.cwd());

    // Find core modules (most depended upon)
    const coreModules = Array.from(moduleDependencies.entries())
      .map(([module, dependents]) => ({
        module,
        dependencyCount: dependents.size,
        description: generateModuleDescription(module),
      }))
      .filter((m) => m.dependencyCount > 0) // Only include modules that are depended on
      .sort((a, b) => b.dependencyCount - a.dependencyCount)
      .slice(0, 3);

    // Find modules with most dependencies
    const mostDependentModules = Object.entries(dependencies)
      .map(([module, deps]) => ({
        module,
        dependencies: deps.length,
        description: generateModuleDescription(module),
      }))
      .sort((a, b) => b.dependencies - a.dependencies)
      .slice(0, 3);

    // Find largest files
    const largestModules = Object.entries(fileDetails)
      .map(([file, details]) => ({
        module: file,
        lines: details.lines,
        description: generateModuleDescription(file),
      }))
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 3);

    // Find most complex modules
    const mostComplexModules = Object.entries(complexityMetrics)
      .map(([module, metrics]) => ({
        module,
        totalComplexity: metrics.totalComplexity,
        averageComplexityPerFunction: metrics.averageComplexityPerFunction,
        functionCount: metrics.functionCount,
        description: generateModuleDescription(module),
      }))
      .sort((a, b) => b.totalComplexity - a.totalComplexity)
      .slice(0, 5);

    // Create circular dependency analysis
    const circularDependencies = [];
    for (const [module, deps] of Object.entries(dependencies)) {
      for (const dep of deps) {
        if (dependencies[dep] && dependencies[dep].includes(module)) {
          // Check if we already have the reverse dependency
          const existingPair = circularDependencies.find(
            (cd) =>
              (cd.modules[0] === dep && cd.modules[1] === module) ||
              (cd.modules[0] === module && cd.modules[1] === dep)
          );

          if (!existingPair) {
            circularDependencies.push({
              modules: [module, dep],
              reason: `Circular dependency between ${module} and ${dep}`,
            });
          }
        }
      }
    }

    // Identify architectural layers based on directory structure
    const layers = [
      {
        name: 'Core',
        modules: ['gameState.js', 'constants.js', 'model.js'],
      },
      {
        name: 'Lifecycle Management',
        modules: ['gameLifecycle.js', 'gameLifecycleUtils/*'],
      },
      {
        name: 'Round Management',
        modules: ['roundManager.js', 'roundUtils/*'],
      },
      {
        name: 'Socket Handling',
        modules: ['events.js', 'socketHandlers/*'],
      },
      {
        name: 'User Interface',
        modules: ['client/modules/*'],
      },
    ];

    // Identify common design patterns
    const patterns = [
      {
        name: 'Facade Pattern',
        examples: ['gameLifecycle.js', 'roundManager.js'],
        description: 'Simplifies access to underlying implementation modules',
      },
      {
        name: 'Dependency Injection',
        examples: ['socketHandlers/*'],
        description:
          'Socket handlers receive dependencies via function parameters',
      },
      {
        name: 'Lazy Loading',
        examples: ['roundUtils/endRound.js'],
        description: 'Used to handle circular dependencies via dynamic imports',
      },
    ];

    // Calculate overall project complexity metrics
    const overallComplexity = {
      totalFiles: Object.keys(complexityMetrics).length,
      totalFunctions: Object.values(complexityMetrics).reduce(
        (sum, metric) => sum + metric.functionCount,
        0
      ),
      totalComplexityPoints: Object.values(complexityMetrics).reduce(
        (sum, metric) => sum + metric.totalComplexity,
        0
      ),
      averageFileComplexity: (
        Object.values(complexityMetrics).reduce(
          (sum, metric) => sum + metric.totalComplexity,
          0
        ) / Object.keys(complexityMetrics).length
      ).toFixed(2),
      averageFunctionComplexity: (
        Object.values(complexityMetrics).reduce(
          (sum, metric) =>
            sum + metric.functionCount * metric.averageComplexityPerFunction,
          0
        ) /
        Object.values(complexityMetrics).reduce(
          (sum, metric) => sum + metric.functionCount,
          0
        )
      ).toFixed(2),
    };

    // Output results
    const result = {
      metrics: ['complexity', 'dependencies'],
      dependencies: {
        summary: {
          totalModules: Object.keys(dependencies).length,
          coreModules,
          mostDependentModules,
          largestModules,
          circularDependencies,
        },
        architecture: {
          layers,
          patterns,
        },
      },
      complexity: {
        summary: overallComplexity,
        mostComplexModules,
        detailedMetrics: Object.entries(complexityMetrics)
          .map(([module, metrics]) => ({
            module,
            metrics,
          }))
          .sort(
            (a, b) => b.metrics.totalComplexity - a.metrics.totalComplexity
          ),
      },
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error analyzing project:', err);
  }
}

analyzeProject();
