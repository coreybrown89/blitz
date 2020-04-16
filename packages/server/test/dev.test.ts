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

describe('Dev command', () => {
  const rootFolder = resolve(__dirname, './fixtures/dev')
  const buildFolder = resolve(rootFolder, '.blitz')
  const devFolder = resolve(rootFolder, '.blitz-dev')

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
    const tree = directoryTree(rootFolder)
    expect(tree).toEqual({
      children: [
        {
          children: [
            {
              extension: '',
              name: 'one',
              path: `${rootFolder}/.blitz-dev/one`,
              size: 0,
              type: 'file',
            },
            {
              extension: '',
              name: 'two',
              path: `${rootFolder}/.blitz-dev/two`,
              size: 0,
              type: 'file',
            },
          ],
          name: '.blitz-dev',
          path: `${rootFolder}/.blitz-dev`,
          size: 0,
          type: 'directory',
        },
        {
          extension: '',
          name: '.now',
          path: `${rootFolder}/.now`,
          size: 18,
          type: 'file',
        },
        {
          extension: '',
          name: 'one',
          path: `${rootFolder}/one`,
          size: 0,
          type: 'file',
        },
        {
          extension: '',
          name: 'two',
          path: `${rootFolder}/two`,
          size: 0,
          type: 'file',
        },
      ],
      name: 'dev',
      path: `${rootFolder}`,
      size: 18,
      type: 'directory',
    })
  })

  it('calls spawn with the patched next cli bin', () => {
    expect(nextUtilsMock.nextStartDev.mock.calls[0][0]).toBe(`${rootFolder}/node_modules/.bin/next-patched`)
    expect(nextUtilsMock.nextStartDev.mock.calls[0][1]).toBe(`${rootFolder}/.blitz-dev`)
  })
})
