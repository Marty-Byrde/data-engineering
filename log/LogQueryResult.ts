import { QueryResult } from 'pg'

export default function logQueryResults(result: Array<QueryResult>, prefix: string, filePath: string){
  console.log(`Successfully inserted ${result.reduce((currentValue, result) => !!result.rowCount ? currentValue + result.rowCount : currentValue , 0)} ${prefix || 'elements'} from ${filePath.split("/").pop()}`)
}

export function logQueryResult(result: QueryResult, prefix: string, filePath?: string){
  console.log(`Successfully inserted ${result.rowCount && result.rowCount} ${prefix || 'elements'} ${filePath?.includes("/") ? "from "+filePath.split("/").pop() : ''}`)
}