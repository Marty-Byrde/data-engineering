import { logQueryResult } from '../log/LogQueryResult'
import importConfig from '../importConfig'

/**
 * Checks whether a student that is identified by his matricelnumber (matno) exists
 * @param matno The property that realtes to the studentkey
 * @param name The name that is used to insert the student in case he does not exist
 * @param client The database-client
 */
export async function validateStudent(matno: string, name: string, client: importConfig['client']){
  const result = await client.query(`Select name from student where studentkey = '${matno}'`)

  if(!!result.rowCount) return true;

  // Otherwise create insert student
  const args = [matno, name]
  const query = `INSERT INTO student (studentkey, name) VALUES (${args.map(el => `'${el}'`).join(', ')})`
  const queryResult = await client.query(query)
  logQueryResult(queryResult, "student");
}