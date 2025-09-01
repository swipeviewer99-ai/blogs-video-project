const sql = require('../../node_modules/mssql');

const connectionString = 'Server=tcp:igdataserver.database.windows.net,1433;Initial Catalog=IGDB;Persist Security Info=False;User ID=igdbadmin;Password=Ne@G3##chEm$$9182;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;';


async function getResumeData() {
  try {
    await sql.connect(connectionString);

    const result = await sql.query  `SELECT top 10 B.Title, A.ResumeContent, A.PreviewImageUrl FROM [EF].[ResumeSamplesFinal] A inner join [EF].[JobTitles] B ON A.JobTitleId = B.Id;`;
    
    return result.recordset; 
  } catch (err) {
    console.error('Error querying tables:', err);
  } finally {
    await sql.close();
  }
}

module.exports = {
  getResumeData
}


