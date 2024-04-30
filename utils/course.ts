import importConfig from '../importConfig'
import { readFileSync } from 'fs'
import { existsSync } from 'node:fs'
import getKeys from './Keys'
import { QueryResult } from 'pg'
import {z} from "zod"
import logQueryResults from '../log/LogQueryResult'

const schema = z.object({
  bachelor: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.string(),
    lecturer: z.string(),
    ECTS: z.string(),
    department: z.string()
  })),
  master: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.string(),
    lecturer: z.string(),
    ECTS: z.string(),
    department: z.string()
  }))
})

type CoursesJson = {
  [key in 'bachelor' | 'master']: Array<{
    id: string
    title: string
    type: string
    lecturer: string
    ECTS: string
    department: string
  }>
};


export async function importCourses({path, client}: importConfig){
  if(!existsSync(path)) throw new ReferenceError(`File at ${path} not found.`)

  const file = readFileSync(path, 'utf-8')
  const courses: CoursesJson = JSON.parse(file)

  const {success} = schema.safeParse(courses)
  if(!success) throw new SyntaxError("The given json-structure is different than expected.")



  const promises: Array<Promise<QueryResult>> = []

  for (let key of getKeys(courses)){
    for(let course of courses[key]){
      const args = [course.id, course.title, course.type, parseInt(course.ECTS), key, course.department, '']
      const query = `INSERT INTO course (coursekey, title, type, ects, level, department, universityname)  VALUES (${args.map(el => typeof el === 'string' ? `'${el}'`: el).join(', ')})`

      promises.push(client.query(query))
    }
  }

  const results = await Promise.all(promises)
  logQueryResults(results, "courses", path)
}