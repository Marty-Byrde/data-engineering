import { importCourses } from './utils/course'
import { Client } from 'pg'
import { importMetadata } from './utils/metadata'
import { importResults } from './utils/results'
import * as dotenv from 'dotenv'
import { z } from 'zod'
import clearTables from './utils/reset'

dotenv.config()
const envSchema = z.object({
  dataPath: z.string().optional(),
  databaseHost: z.string(),
  databasePort: z.string(),
  databaseName: z.string(),
  databaseUser: z.string(),
  databasePassword: z.string()
})

export const env = envSchema.parse(process.env)


main()
async function main(){
  const client = new Client({
    host: env.databaseHost,
    port: parseInt(env.databasePort),
    database: env.databaseName,
    user: env.databaseUser,
    password: env.databasePassword
  })

  const path = env.dataPath || "./data"
  console.log("Using data from:", path)

  try{
    await client.connect()
    console.log('Successfully connected to the database')
  }catch(err){
    throw err
  }

  await clearTables(client)
  await importCourses({path: `${path}/aau_corses.json`, client})
  await importMetadata({path: `${path}/aau_metadata.json`, client})
  await importResults({ path: `${path}/results`, client })


  await client.end()
}