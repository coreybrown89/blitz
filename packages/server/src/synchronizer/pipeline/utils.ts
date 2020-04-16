import File from 'vinyl'

export function isSourceFile(file: File) {
  return file.hash.indexOf(':') === -1
}
