import { describe, it, expect } from 'vitest'
import { classifyNode, CLUSTERS, summarizeFolderClusters } from '../utils/archClassify.js'

const file   = (name, path) => ({ name, path: path ?? `/${name}`, type: 'file' })
const folder = (name, path) => ({ name, path: path ?? `/${name}`, type: 'folder' })

describe('CLUSTERS', () => {
  it('has all 9 cluster keys', () => {
    expect(Object.keys(CLUSTERS)).toEqual(
      expect.arrayContaining(['tests', 'config', 'docs', 'scripts', 'assets', 'data', 'backend', 'frontend', 'other'])
    )
    expect(Object.keys(CLUSTERS)).toHaveLength(9)
  })

  it('each cluster has color and label', () => {
    for (const c of Object.values(CLUSTERS)) {
      expect(c.color).toMatch(/^#/)
      expect(typeof c.label).toBe('string')
    }
  })
})

describe('classifyNode — tests', () => {
  it('classifies __tests__ folder', () => {
    expect(classifyNode(folder('__tests__'))).toMatchObject({ cluster: 'tests' })
  })
  it('classifies .test.js file', () => {
    expect(classifyNode(file('Button.test.js'))).toMatchObject({ cluster: 'tests' })
  })
  it('classifies .spec.ts file', () => {
    expect(classifyNode(file('api.spec.ts'))).toMatchObject({ cluster: 'tests' })
  })
  it('classifies test_ prefix Python file', () => {
    expect(classifyNode(file('test_api.py'))).toMatchObject({ cluster: 'tests' })
  })
  it('classifies file inside tests/ directory', () => {
    expect(classifyNode(file('helpers.js', '/project/tests/helpers.js'))).toMatchObject({ cluster: 'tests' })
  })
  it('classifies spec/ folder', () => {
    expect(classifyNode(folder('spec'))).toMatchObject({ cluster: 'tests' })
  })
})

describe('classifyNode — config', () => {
  it('classifies package.json', () => {
    expect(classifyNode(file('package.json'))).toMatchObject({ cluster: 'config' })
  })
  it('classifies tsconfig.json', () => {
    expect(classifyNode(file('tsconfig.json'))).toMatchObject({ cluster: 'config' })
  })
  it('classifies .yaml file', () => {
    expect(classifyNode(file('ci.yml'))).toMatchObject({ cluster: 'config' })
  })
  it('classifies .toml file', () => {
    expect(classifyNode(file('pyproject.toml'))).toMatchObject({ cluster: 'config' })
  })
  it('classifies config/ folder', () => {
    expect(classifyNode(folder('config'))).toMatchObject({ cluster: 'config' })
  })
})

describe('classifyNode — docs', () => {
  it('classifies .md file', () => {
    expect(classifyNode(file('README.md'))).toMatchObject({ cluster: 'docs' })
  })
  it('classifies docs/ folder', () => {
    expect(classifyNode(folder('docs'))).toMatchObject({ cluster: 'docs' })
  })
  it('classifies file with changelog prefix', () => {
    expect(classifyNode(file('CHANGELOG'))).toMatchObject({ cluster: 'docs' })
  })
  it('classifies license file', () => {
    expect(classifyNode(file('LICENSE'))).toMatchObject({ cluster: 'docs' })
  })
})

describe('classifyNode — scripts', () => {
  it('classifies .sh file', () => {
    expect(classifyNode(file('install.sh'))).toMatchObject({ cluster: 'scripts' })
  })
  it('classifies scripts/ folder', () => {
    expect(classifyNode(folder('scripts'))).toMatchObject({ cluster: 'scripts' })
  })
  it('classifies Dockerfile', () => {
    expect(classifyNode(file('Dockerfile'))).toMatchObject({ cluster: 'scripts' })
  })
  it('classifies bin/ folder', () => {
    expect(classifyNode(folder('bin'))).toMatchObject({ cluster: 'scripts' })
  })
})

describe('classifyNode — assets', () => {
  it('classifies .png file', () => {
    expect(classifyNode(file('logo.png'))).toMatchObject({ cluster: 'assets' })
  })
  it('classifies .svg file', () => {
    expect(classifyNode(file('icon.svg'))).toMatchObject({ cluster: 'assets' })
  })
  it('classifies assets/ folder', () => {
    expect(classifyNode(folder('assets'))).toMatchObject({ cluster: 'assets' })
  })
  it('classifies public/ folder', () => {
    expect(classifyNode(folder('public'))).toMatchObject({ cluster: 'assets' })
  })
  it('classifies .woff2 font file', () => {
    expect(classifyNode(file('font.woff2'))).toMatchObject({ cluster: 'assets' })
  })
})

describe('classifyNode — data', () => {
  it('classifies .csv file', () => {
    expect(classifyNode(file('export.csv'))).toMatchObject({ cluster: 'data' })
  })
  it('classifies migrations/ folder', () => {
    expect(classifyNode(folder('migrations'))).toMatchObject({ cluster: 'data' })
  })
  it('classifies file inside data/ directory', () => {
    expect(classifyNode(file('records.json', '/project/data/records.json'))).toMatchObject({ cluster: 'data' })
  })
  it('classifies .sql file', () => {
    expect(classifyNode(file('schema.sql'))).toMatchObject({ cluster: 'data' })
  })
})

describe('classifyNode — backend', () => {
  it('classifies .py file', () => {
    expect(classifyNode(file('api.py'))).toMatchObject({ cluster: 'backend' })
  })
  it('classifies backend/ folder', () => {
    expect(classifyNode(folder('backend'))).toMatchObject({ cluster: 'backend' })
  })
  it('classifies .go file', () => {
    expect(classifyNode(file('server.go'))).toMatchObject({ cluster: 'backend' })
  })
  it('classifies .rs file', () => {
    expect(classifyNode(file('main.rs'))).toMatchObject({ cluster: 'backend' })
  })
  it('classifies file inside api/ directory', () => {
    expect(classifyNode(file('users.js', '/project/api/users.js'))).toMatchObject({ cluster: 'backend' })
  })
})

describe('classifyNode — frontend', () => {
  it('classifies .jsx file', () => {
    expect(classifyNode(file('Button.jsx'))).toMatchObject({ cluster: 'frontend' })
  })
  it('classifies .tsx file', () => {
    expect(classifyNode(file('App.tsx'))).toMatchObject({ cluster: 'frontend' })
  })
  it('classifies .css file', () => {
    expect(classifyNode(file('styles.css'))).toMatchObject({ cluster: 'frontend' })
  })
  it('classifies components/ folder', () => {
    expect(classifyNode(folder('components'))).toMatchObject({ cluster: 'frontend' })
  })
  it('classifies src/ folder', () => {
    expect(classifyNode(folder('src'))).toMatchObject({ cluster: 'frontend' })
  })
  it('classifies .js file', () => {
    expect(classifyNode(file('utils.js'))).toMatchObject({ cluster: 'frontend' })
  })
})

describe('classifyNode — other', () => {
  it('classifies unknown extension as other', () => {
    expect(classifyNode(file('random.xyz'))).toMatchObject({ cluster: 'other' })
  })
  it('classifies MANIFEST (no extension, no known prefix) as other', () => {
    expect(classifyNode(file('MANIFEST'))).toMatchObject({ cluster: 'other' })
  })
})

describe('classifyNode — priority', () => {
  it('tests beat backend for Python test files', () => {
    expect(classifyNode(file('test_api.py', '/project/backend/test_api.py'))).toMatchObject({ cluster: 'tests' })
  })
  it('tests beat frontend for JSX test files', () => {
    expect(classifyNode(file('Button.test.jsx', '/project/src/Button.test.jsx'))).toMatchObject({ cluster: 'tests' })
  })
  it('data beats config for JSON inside data/ directory', () => {
    expect(classifyNode(file('records.json', '/project/data/records.json'))).toMatchObject({ cluster: 'data' })
  })
  it('config names beat config extensions', () => {
    const n = classifyNode(file('package.json'))
    expect(n.cluster).toBe('config')
    expect(n.reason).toBe('config file')
  })
})

describe('summarizeFolderClusters', () => {
  it('counts child clusters', () => {
    const node = {
      name: 'project',
      path: '/project',
      type: 'folder',
      children: [
        { name: 'Button.jsx',    path: '/project/Button.jsx',    type: 'file' },
        { name: 'api.py',        path: '/project/api.py',        type: 'file' },
        { name: 'api2.py',       path: '/project/api2.py',       type: 'file' },
        { name: '__tests__',     path: '/project/__tests__',     type: 'folder' },
      ],
    }
    const summary = summarizeFolderClusters(node)
    expect(summary.frontend).toBe(1)
    expect(summary.backend).toBe(2)
    expect(summary.tests).toBe(1)
  })

  it('returns empty object for node with no children', () => {
    expect(summarizeFolderClusters({ children: [] })).toEqual({})
  })
})
