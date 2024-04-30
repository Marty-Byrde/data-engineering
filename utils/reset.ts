import importConfig from '../importConfig'

export default async function clearTables(client: importConfig['client']){
  await client.query("DELETE FROM facts;")
  await client.query("DELETE FROM course;")
  await client.query("DELETE FROM student;")
  await client.query("DELETE FROM studyplan;")
  await client.query("DELETE FROM lecturer;")
  await client.query("DELETE FROM timefact;")
}