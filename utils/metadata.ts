import importConfig from '../importConfig'
import { readFileSync } from 'fs'
import { existsSync } from 'node:fs'
import getKeys from './Keys'
import { QueryResult } from 'pg'
import {z} from "zod"
import logQueryResults from '../log/LogQueryResult'

const schema = z.object({
  id: z.string(),
  name: z.string(),
  state: z.string(),
  city: z.string(),
  street: z.string(),
  zip: z.string(),
  bachelor_study_plans: z.array(z.object({
    id: z.string(),
    name: z.string(),
    branch: z.string(),
  })),

  master_study_plans: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    branch: z.string(),
  })),
  lecturers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    department: z.string(),
  })),
})

type MetadataJson = {
  id: string
  name: string
  state: string
  city: string
  street: string
  zip: string
  bachelor_study_plans: Array<{
    id: string
    name: string
    branch: string
  }>
  master_study_plans: Array<{
    id: string
    name: string
    type: "Master"
    branch: string
  }>
  lecturers: Array<{
    id: string
    name: string
    department: string
  }>
};


export async function importMetadata({path, client}: importConfig){
  if(!existsSync(path)) throw new ReferenceError(`File at ${path} not found.`)

  const file = readFileSync(path, 'utf-8')
  const data: MetadataJson = JSON.parse(file)

  const {success} = schema.safeParse(data)
  if(!success) throw new SyntaxError("The given json-structure is different than expected.")


  const _promises: {bachelorPlans: Array<Promise<QueryResult>>, masterPlans: Array<Promise<QueryResult>>, lecturer: Array<Promise<QueryResult>>} = {
    bachelorPlans: [],
    masterPlans: [],
    lecturer: []
  }
  const promises: Array<Promise<QueryResult>> = []

  for (let plan of data.bachelor_study_plans){
    const args = [plan.id, plan.name, "bachelor", plan.branch]
    const query = `INSERT INTO studyplan (studyplankey, title, degree, branch) VALUES (${args.map(el => typeof el === 'string' ? `'${el}'`: el).join(', ')})`
    _promises.bachelorPlans.push(client.query(query))
  }

  for (let plan of data.master_study_plans){
    const args = [plan.id, plan.name, plan.type, plan.branch]
    const query = `INSERT INTO studyplan (studyplankey, title, degree, branch) VALUES (${args.map(el => typeof el === 'string' ? `'${el}'`: el).join(', ')})`
    _promises.masterPlans.push(client.query(query))
  }

  for(let lecturer of data.lecturers){
    const rank = lecturer.name.split(" ").at(0) // e.g. Assoc.Prof
    if(!!rank) lecturer.name = lecturer.name.replace(rank, '')


    const title = lecturer.name.split(".").slice(0, lecturer.name.split(".").length-1).join(" ") // DI Dr

    const name = lecturer.name.split(".").pop()

    const args = [lecturer.id, name, rank, title, lecturer.department, data.name]
    const query = `INSERT INTO lecturer (lecturerkey, name, rank, title, department, university) VALUES (${args.map(el => typeof el === 'string' ? `'${el}'`: el).join(', ')})`
    _promises.lecturer.push(client.query(query))
  }


  const bachelorResults = await Promise.all(_promises.bachelorPlans)
  logQueryResults(bachelorResults, "bachelor-studyplans", path)

  const masterResults = await Promise.all(_promises.masterPlans)
  logQueryResults(masterResults, "master-studyplans", path)

  const lecturerResults = await Promise.all(_promises.lecturer)
  logQueryResults(lecturerResults, "lecturers", path)

}