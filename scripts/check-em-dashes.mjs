import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean)
const extensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.sql', '.svg', '.ts', '.tsx', '.txt', '.yml', '.yaml'])
const offenders = files.filter((file) => extensions.has(file.slice(file.lastIndexOf('.'))) && readFileSync(file, 'utf8').includes('\u2014'))
if (offenders.length) { console.error(`Em dash found in tracked files:\n${offenders.join('\n')}`); process.exit(1) }
console.log('Typography check passed: no em dashes in tracked text files.')
