/* eslint-disable import/first */

const nextUtilsMock = {
  nextBuild: jest.fn().mockReturnValue(Promise.resolve()),
}
// Quieten reporter
jest.doMock('../src/reporter', () => ({
  reporter: {copy: jest.fn(), remove: jest.fn()},
}))

// Assume next works
jest.doMock('../src/next-utils', () => nextUtilsMock)

// Import with mocks applied
import {build} from '../src/build'
import path from 'path'
import {remove, pathExists} from 'fs-extra'
import directoryTree from 'directory-tree'

describe('Build command', () => {
  const rootFolder = path.resolve(__dirname, './fixtures/build')
  const buildFolder = path.resolve(rootFolder, '.blitz-build')
  const devFolder = path.resolve(rootFolder, '.blitz')

  beforeEach(async () => {
    jest.clearAllMocks()
    await build({rootFolder, buildFolder, devFolder, writeManifestFile: false})
  })

  afterEach(async () => {
    const nextFolder = path.resolve(rootFolder, '.next')

    if (await pathExists(nextFolder)) {
      await remove(nextFolder)
    }

    if (await pathExists(buildFolder)) {
      await remove(buildFolder)
    }
  })

  it('should copy the correct files to the build folder', async () => {
    const tree = directoryTree(rootFolder)
    expect(tree).toEqual({
      children: [
        {
          children: [
            {
              extension: '.js',
              name: 'blitz.config.js',
              path: path.join(buildFolder, 'blitz.config.js'),
              size: 20,
              type: 'file',
            },
            {
              extension: '.js',
              name: 'next.config.js',
              path: path.join(buildFolder, 'next.config.js'),
              size: 130,
              type: 'file',
            },
            {
              extension: '',
              name: 'one',
              path: path.join(buildFolder, 'one'),
              size: 0,
              type: 'file',
            },
            {
              extension: '',
              name: 'two',
              path: path.join(buildFolder, 'two'),
              size: 0,
              type: 'file',
            },
          ],
          name: '.blitz-build',
          path: buildFolder,
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
      name: 'build',
      path: `${rootFolder}`,
      size: 168,
      type: 'directory',
    })
  })
})
