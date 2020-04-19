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
import {resolve} from 'path'
import {remove, pathExists} from 'fs-extra'
import directoryTree from 'directory-tree'

describe.skip('Dev command', () => {
  const rootFolder = resolve(__dirname, './fixtures/rules')
  const buildFolder = resolve(rootFolder, '.blitz')
  const devFolder = resolve(rootFolder, '.blitz-rules')

  beforeEach(async () => {
    jest.clearAllMocks()
    await dev({rootFolder, buildFolder, devFolder, writeManifestFile: false})
  })

  afterEach(async () => {
    if (await pathExists(devFolder)) {
      await remove(devFolder)
    }
  })

  it('should copy the correct files to the dev folder', async () => {
    const tree = directoryTree(devFolder)
    expect(tree).toEqual({
      path: `${devFolder}`,
      name: '.blitz-rules',
      children: [
        {
          path: `${devFolder}/pages`,
          name: 'pages',
          children: [
            {
              path: `${devFolder}/pages/bar.tsx`,
              name: 'bar.tsx',
              size: 60,
              extension: '.tsx',
              type: 'file',
            },
            {
              path: `${devFolder}/pages/foo.tsx`,
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
      size: 120,
      type: 'directory',
    })
  })
})
