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
  let rootFolder: string
  let buildFolder: string
  let devFolder: string

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await watcher?.close()
    if (await pathExists(devFolder)) {
      await remove(devFolder)
    }
  })

  describe('when with next.config', () => {
    beforeEach(async () => {
      rootFolder = path.resolve(__dirname, './fixtures/bad-config')
      buildFolder = path.resolve(rootFolder, '.blitz')
      devFolder = path.resolve(rootFolder, '.blitz')
    })

    it('should fail when passed a next.config.js', (done) => {
      dev({rootFolder, buildFolder, devFolder, writeManifestFile: false})
        .then((w) => {
          watcher = w
        })
        .catch((err) => {
          expect(err.name).toBe('ConfigurationError')
          done()
        })
    })
  })

  describe('when run normally', () => {
    beforeEach(async () => {
      rootFolder = path.resolve(__dirname, './fixtures/dev')
      buildFolder = path.resolve(rootFolder, '.blitz')
      devFolder = path.resolve(rootFolder, '.blitz-dev')
      watcher = await dev({rootFolder, buildFolder, devFolder, writeManifestFile: false})
    })

    it('should copy the correct files to the dev folder', async () => {
      const tree = directoryTree(rootFolder)
      expect(tree).toEqual({
        children: [
          {
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
                extension: '',
                name: 'one',
                path: path.join(devFolder, 'one'),
                size: 0,
                type: 'file',
              },
              {
                extension: '',
                name: 'two',
                path: path.join(devFolder, 'two'),
                size: 0,
                type: 'file',
              },
            ],
            name: '.blitz-dev',
            path: `${devFolder}`,
            size: 150,
            type: 'directory',
          },
          {
            extension: '',
            name: '.now',
            path: path.join(rootFolder, '.now'),
            size: 18,
            type: 'file',
          },
          {
            extension: '',
            name: 'one',
            path: path.join(rootFolder, 'one'),
            size: 0,
            type: 'file',
          },
          {
            extension: '',
            name: 'two',
            path: path.join(rootFolder, 'two'),
            size: 0,
            type: 'file',
          },
        ],
        name: 'dev',
        path: `${rootFolder}`,
        size: 168,
        type: 'directory',
      })
    })

    it('calls spawn with the patched next cli bin', () => {
      const nextPatched = path.join(rootFolder, 'node_modules', '.bin', 'next-patched')
      const blitzDev = path.join(rootFolder, '.blitz-dev')
      expect(nextUtilsMock.nextStartDev.mock.calls[0][0]).toBe(nextPatched)
      expect(nextUtilsMock.nextStartDev.mock.calls[0][1]).toBe(blitzDev)
    })
  })
})
