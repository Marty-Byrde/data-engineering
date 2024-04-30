import { importConfig } from '../index'
import { logQueryResult } from '../log/LogQueryResult'


/**
 * Checks whether a given time exists in the database
 * @param time The date-property of a result file that relates to the time-key
 * @param client The database-client
 */
export async function validateTime(time: string, client: importConfig['client']){
  const result = await client.query(`Select timekey from timefact where timekey = '${time}'`)

  if(!!result.rowCount) return true;

  // Otherwise create insert time
  const date = new Date(Date.parse(time))
  const args = [time, date.getDate(), date.getMonth()+1, date.getFullYear()]
  const query = `INSERT INTO timefact (timekey, day, month, year) VALUES (${args.map(el => typeof el === 'string' ? `'${el}'`: el).join(', ')})`

  const queryResult = await client.query(query)
  logQueryResult(queryResult, "time-fact");
}