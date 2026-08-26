import mysql from 'mysql2/promise';



const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});



const RATE_PER_HOUR = 10; 
const FREE_MINUTES = 15; 



export const handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));

  const { plate_number, operation } = event;


  if (!plate_number || !operation) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'plate_number and operation are required' }),
    };
  }

  const op = operation.toUpperCase();

  if (op !== 'ENTRY' && op !== 'EXIT') {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'operation must be ENTRY or EXIT' }),
    };
  }

  try {



    if (op === 'ENTRY') {
      const entryTime = new Date();

      // Insert entry record
      await db.query(
        'INSERT INTO vehicles (plate_number, operation) VALUES (?, ?)',
        [plate_number, 'ENTRY']
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Vehicle entry recorded successfully',
          plate_number,
          operation: 'ENTRY',
          entry_time: entryTime.toISOString(), 
        }),
      };



    } else if (op === 'EXIT') {

    
      const [entryRows] = await db.query(
        `SELECT * FROM vehicles 
         WHERE plate_number = ? AND operation = 'ENTRY' 
         AND timestamp = (
           SELECT MAX(timestamp) FROM vehicles 
           WHERE plate_number = ? AND operation = 'ENTRY'
           AND timestamp > IFNULL((
             SELECT MAX(timestamp) FROM vehicles 
             WHERE plate_number = ? AND operation = 'EXIT'
           ), '1970-01-01')
         )`,
        [plate_number, plate_number, plate_number]
      );

      if (entryRows.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: 'No active entry found for this vehicle',
            plate_number,
          }),
        };
      }

      const entryTime = new Date(entryRows[0].timestamp);
      const exitTime = new Date();

      
      const durationMs = exitTime - entryTime;
      const durationMinutes = Math.floor(durationMs / 60000);
      const durationHours = durationMs / 3600000;

      // Calculate fee
      let fee = 0;
      if (durationMinutes > FREE_MINUTES) {
        fee = Math.ceil(durationHours * RATE_PER_HOUR);
      }

  
      await db.query(
        'INSERT INTO vehicles (plate_number, operation) VALUES (?, ?)',
        [plate_number, 'EXIT']
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Vehicle exit recorded successfully',
          plate_number,
          operation: 'EXIT',
          entry_time: entryTime.toISOString(),
          exit_time: exitTime.toISOString(),
          duration_minutes: durationMinutes,
          fee_rands: fee,
        }),
      };
    }

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};
