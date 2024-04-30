import type { Client } from 'pg'

export default interface importConfig {
  path: string
  client: Client
}