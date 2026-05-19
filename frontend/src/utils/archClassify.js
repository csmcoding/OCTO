export const CLUSTERS = {
  tests:    { color: '#fb923c', label: 'Tests'    },
  config:   { color: '#8b5cf6', label: 'Config'   },
  docs:     { color: '#f472b6', label: 'Docs'     },
  scripts:  { color: '#fbbf24', label: 'Scripts'  },
  assets:   { color: '#d946ef', label: 'Assets'   },
  data:     { color: '#22d3ee', label: 'Data'     },
  backend:  { color: '#34d399', label: 'Backend'  },
  frontend: { color: '#60a5fa', label: 'Frontend' },
  other:    { color: '#94a3b8', label: 'Other'    },
}

const lc = (s) => (s ?? '').toLowerCase()
function extOf(name) {
  const i = (name ?? '').lastIndexOf('.')
  return i > 0 ? lc((name ?? '').slice(i)) : ''
}

const TEST_DIRS     = new Set(['__tests__', '__mocks__', '__snapshots__', 'test', 'tests', 'spec', 'specs', 'e2e', 'integration', 'unit'])
const CONFIG_DIRS   = new Set(['config', 'configs', 'conf', 'configuration', '.github', '.husky', '.vscode', '.idea'])
const DOC_DIRS      = new Set(['docs', 'doc', 'documentation', 'wiki', 'guides', 'manuals'])
const SCRIPT_DIRS   = new Set(['scripts', 'bin', 'tools', 'ci'])
const ASSET_DIRS    = new Set(['assets', 'static', 'public', 'images', 'img', 'icons', 'fonts', 'media', 'svgs', 'videos'])
const DATA_DIRS     = new Set(['data', 'migrations', 'seeds', 'fixtures', 'datasets', 'db', 'database'])
const BACKEND_DIRS  = new Set(['backend', 'api', 'server', 'routes', 'controllers', 'services', 'models', 'middleware', 'handlers', 'workers', 'jobs', 'tasks', 'repositories'])
const FRONTEND_DIRS = new Set(['frontend', 'client', 'ui', 'web', 'src', 'app', 'components', 'pages', 'views', 'hooks', 'layouts', 'widgets', 'styles', 'theme', 'themes', 'store', 'redux', 'context'])

const CONFIG_EXTS   = new Set(['.yaml', '.yml', '.toml', '.ini', '.cfg', '.lock', '.properties', '.json'])
const DOC_EXTS      = new Set(['.md', '.rst', '.adoc', '.txt'])
const SCRIPT_EXTS   = new Set(['.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd'])
const ASSET_EXTS    = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff', '.ttf', '.woff', '.woff2', '.otf', '.eot', '.mp4', '.mp3', '.wav', '.ogg'])
const DATA_EXTS     = new Set(['.csv', '.sql', '.parquet', '.sqlite', '.sqlite3', '.db', '.ndjson', '.jsonl', '.tsv'])
const BACKEND_EXTS  = new Set(['.py', '.rb', '.go', '.java', '.rs', '.php', '.cs', '.scala', '.clj', '.ex', '.exs', '.erl', '.hs', '.kt'])
const FRONTEND_EXTS = new Set(['.jsx', '.tsx', '.css', '.scss', '.sass', '.less', '.vue', '.svelte', '.js', '.ts', '.mjs', '.cjs'])

const CONFIG_NAMES = new Set([
  'package.json', 'package-lock.json', 'yarn.lock',
  'tsconfig.json', 'jsconfig.json',
  '.eslintrc', '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs',
  '.babelrc', '.prettierrc', '.prettierignore', '.editorconfig',
  'vite.config.js', 'vite.config.ts', 'webpack.config.js', 'rollup.config.js',
  'jest.config.js', 'vitest.config.js', 'vitest.config.ts',
  'pyproject.toml', 'setup.py', 'setup.cfg', 'requirements.txt',
  'pipfile', 'pipfile.lock', 'poetry.lock',
  'cargo.toml', 'cargo.lock',
  'go.mod', 'go.sum',
  '.gitignore', '.gitattributes',
  '.env', '.env.local', '.env.example', '.env.test',
  'docker-compose.yml', 'docker-compose.yaml', '.dockerignore',
  'makefile', 'gemfile', 'gemfile.lock',
  'composer.json', 'composer.lock',
  'pom.xml', 'build.gradle', 'settings.gradle',
])

const DOC_PREFIXES = ['readme', 'changelog', 'contributing', 'license', 'authors', 'history', 'notice', 'copying']

export function classifyNode(node) {
  const name     = lc(node.name ?? '')
  const segs     = (node.path ?? '').split('/').filter(Boolean).map(lc)
  const ext      = extOf(node.name ?? '')
  const isFolder = node.type === 'folder'

  const inDataDir = segs.some(s => DATA_DIRS.has(s))

  // 1. Tests — highest priority; test files can appear anywhere in the tree
  if (isFolder && TEST_DIRS.has(name))
    return { cluster: 'tests', reason: 'test directory' }
  if (!isFolder && (name.includes('.test.') || name.includes('.spec.')))
    return { cluster: 'tests', reason: `test file (${ext || name})` }
  if (!isFolder && name.startsWith('test_'))
    return { cluster: 'tests', reason: 'Python test file' }
  if (!isFolder && (name.endsWith('_test.go') || name.endsWith('_test.rb') || name.endsWith('_test.py')))
    return { cluster: 'tests', reason: 'test file' }
  if (segs.some(s => TEST_DIRS.has(s)))
    return { cluster: 'tests', reason: 'in test directory' }

  // 2. Config — well-known filenames beat all path heuristics
  if (CONFIG_NAMES.has(name))
    return { cluster: 'config', reason: 'config file' }
  if (isFolder && CONFIG_DIRS.has(name))
    return { cluster: 'config', reason: 'config directory' }

  // 3. Docs
  if (isFolder && DOC_DIRS.has(name))
    return { cluster: 'docs', reason: 'docs directory' }
  if (DOC_EXTS.has(ext))
    return { cluster: 'docs', reason: `doc (${ext})` }
  if (DOC_PREFIXES.some(p => name.startsWith(p)))
    return { cluster: 'docs', reason: 'documentation file' }

  // 4. Scripts / build
  if (isFolder && SCRIPT_DIRS.has(name))
    return { cluster: 'scripts', reason: 'scripts directory' }
  if (SCRIPT_EXTS.has(ext))
    return { cluster: 'scripts', reason: `script (${ext})` }
  if (name === 'makefile' || /^dockerfile/.test(name))
    return { cluster: 'scripts', reason: 'build file' }

  // 5. Assets / static
  if (isFolder && ASSET_DIRS.has(name))
    return { cluster: 'assets', reason: 'assets directory' }
  if (ASSET_EXTS.has(ext))
    return { cluster: 'assets', reason: `asset (${ext})` }

  // 6. Data — check before config extensions (files in data/ dirs aren't config)
  if (isFolder && DATA_DIRS.has(name))
    return { cluster: 'data', reason: 'data directory' }
  if (inDataDir)
    return { cluster: 'data', reason: 'in data directory' }
  if (DATA_EXTS.has(ext))
    return { cluster: 'data', reason: `data (${ext})` }

  // 6b. Config extensions — after data check so data/ folder JSON isn't misclassified
  if (CONFIG_EXTS.has(ext))
    return { cluster: 'config', reason: `config (${ext})` }

  // 7. Backend — dir name, then path segs, then extension
  if (isFolder && BACKEND_DIRS.has(name))
    return { cluster: 'backend', reason: 'backend directory' }
  if (segs.some(s => BACKEND_DIRS.has(s)))
    return { cluster: 'backend', reason: 'in backend directory' }
  if (BACKEND_EXTS.has(ext))
    return { cluster: 'backend', reason: `backend (${ext})` }

  // 8. Frontend — dir name, then path segs, then extension
  if (isFolder && FRONTEND_DIRS.has(name))
    return { cluster: 'frontend', reason: 'frontend directory' }
  if (segs.some(s => FRONTEND_DIRS.has(s)))
    return { cluster: 'frontend', reason: 'in frontend directory' }
  if (FRONTEND_EXTS.has(ext))
    return { cluster: 'frontend', reason: `frontend (${ext})` }

  return { cluster: 'other', reason: 'unclassified' }
}

export function summarizeFolderClusters(node) {
  const counts = {}
  for (const child of node.children ?? []) {
    const { cluster } = classifyNode(child)
    counts[cluster] = (counts[cluster] ?? 0) + 1
  }
  return counts
}
