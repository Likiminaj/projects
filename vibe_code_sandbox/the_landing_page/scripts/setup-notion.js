import { main } from './sync-notion-env.js'

main().catch((err) => {
  console.error('Setup failed:', err.message)
  process.exit(1)
})
