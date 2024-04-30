
import { importConfig } from '../index'
import { readFileSync } from 'fs'
import { existsSync, readdirSync } from 'node:fs'
import { QueryResult } from 'pg'
import { array, object, string, z } from 'zod'
import { validateTime } from './time'
import { validateStudent } from './students'
import logQueryResults from '../log/LogQueryResult'

const schema = z.object({
  course: string(),
  examinator: string(),
  date: string(),
  results: array(object({
    matno: string(),
    name: string(),
    grade: string(),
    studyplan: string()
  }))
})

type ResultsJson = z.infer<typeof schema>


/**
 * Inserts new facts from a directory that has files inside of it that match the structure of the ResultJson interface
 * @param path The path to the directory
 * @param client The database-client
 */
export async function importResults({path, client}: importConfig){
  if(!existsSync(path)) throw new ReferenceError(`Folder at ${path} not found.`)
  const fileNames = readdirSync(path)

  for(let file of fileNames){
    await importResult({path: path+`/${file}`, client})
  }
}


/**
 * Inserts new facts based on the results of a given file that matches the structure of the ResultsJson interface
 * @param path The path to the file
 * @param client The database-client
 */
export async function importResult({path, client}: importConfig){
  const file = readFileSync(path, 'utf-8')
  const data: ResultsJson = JSON.parse(file)

  const {success} = schema.safeParse(data)
  if(!success) throw new SyntaxError("The given json-structure is different than expected.")

  await validateTime(data.date, client)

  const promises: Array<Promise<QueryResult>> = []

  for(let result of data.results){
    await validateStudent(result.matno, result.name, client)

    // Insert fact
    const args = [parseInt(result.grade), data.examinator, data.course, data.date, result.matno, result.studyplan]
    const query = `INSERT INTO facts (grade, lecturerkey, coursekey, timekey, studentkey, studyplankey) VALUES (${args.map(el => typeof el === 'string' ? `'${el}'`: el).join(', ')})`

    promises.push(client.query(query))
  }

  const factResults = await Promise.all(promises)
  logQueryResults(factResults, "facts", path)
}