/* eslint-disable import/first */

const nextUtilsMock = {
  nextStartDev: jest.fn().mockReturnValue(Promise.resolve()),
}
// Quieten reporter
jest.doMock('../src/reporter', () => ({
  reporter: {copy: jest.fn(), remove: jest.fn()},
}))

// Assume next works
jest.doMock('../src/next-utils', () => nextUtilsMock)

// Import with mocks applied
import {dev} from '../src/dev'
import path from 'path'
import {FSWatcher} from 'chokidar'
import {remove, pathExists} from 'fs-extra'
import directoryTree from 'directory-tree'

describe('Dev command', () => {
  let watcher: FSWatcher

  const rootFolder = path.resolve(__dirname, './fixtures/rules')
  const buildFolder = path.resolve(rootFolder, '.blitz')
  const devFolder = path.resolve(rootFolder, '.blitz-rules')

  beforeEach(async () => {
    jest.clearAllMocks()
    watcher = await dev({rootFolder, buildFolder, devFolder, writeManifestFile: false})
  })

  afterEach(async () => {
    await watcher.close()
    if (await pathExists(devFolder)) {
      await remove(devFolder)
    }
  })

  it('should copy the correct files to the dev folder', async () => {
    const tree = directoryTree(devFolder)
    console.log('tree', tree)
    expect(tree).toEqual({
      path: `${devFolder}`,
      name: '.blitz-rules',
      children: [
        {
          extension: '.js',
          name: 'blitz.config.js',
          path: path.join(devFolder, 'blitz.config.js'),
          size: 20,
          type: 'file',
        },
        {
          extension: '.js',
          name: 'next.config.js',
          path: path.join(devFolder, 'next.config.js'),
          size: 130,
          type: 'file',
        },
        {
          path: path.join(devFolder, 'pages'),
          name: 'pages',
          children: [
            {
              path: path.join(devFolder, 'pages', 'bar.tsx'),
              name: 'bar.tsx',
              size: 60,
              extension: '.tsx',
              type: 'file',
            },
            {
              path: path.join(devFolder, 'pages', 'foo.tsx'),
              name: 'foo.tsx',
              size: 60,
              extension: '.tsx',
              type: 'file',
            },
          ],
          size: 120,
          type: 'directory',
        },
      ],
      size: 270,
      type: 'directory',
    })
  })
})
