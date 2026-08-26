import mysql from 'mysql2/promise';


const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});



export const handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));

  try {
  
    const queryParams = event.queryStringParameters || {};
    const { plate_number, date } = queryParams;

   

    let query = `
      SELECT 
        e.id AS entry_id,
        e.plate_number,
        e.timestamp AS entry_time,
        x.timestamp AS exit_time,
        TIMESTAMPDIFF(MINUTE, e.timestamp, x.timestamp) AS duration_minutes,
        CASE 
          WHEN TIMESTAMPDIFF(MINUTE, e.timestamp, x.timestamp) <= 15 THEN 0
          ELSE CEIL((TIMESTAMPDIFF(MINUTE, e.timestamp, x.timestamp) / 60) * 10)
        END AS fee_rands,
        CASE
          WHEN x.timestamp IS NULL THEN 'ACTIVE'
          ELSE 'COMPLETED'
        END AS status
      FROM vehicles e
      LEFT JOIN vehicles x 
        ON x.plate_number = e.plate_number 
        AND x.operation = 'EXIT'
        AND x.timestamp = (
          SELECT MIN(timestamp) FROM vehicles
          WHERE plate_number = e.plate_number
          AND operation = 'EXIT'
          AND timestamp > e.timestamp
        )
      WHERE e.operation = 'ENTRY'
    `;

    const params = [];


    if (plate_number) {
      query += ` AND e.plate_number = ?`;
      params.push(plate_number.toUpperCase());
    }

    // ✅ Filter by date if provided (format: YYYY-MM-DD)
    if (date) {
      query += ` AND DATE(e.timestamp) = ?`;
      params.push(date);
    }


    query += ` ORDER BY e.timestamp DESC`;



    const [rows] = await db.query(query, params);

    console.log(`Found ${rows.length} sessions`);

   

    const sessions = rows.map((row) => ({
      entry_id: row.entry_id,
      plate_number: row.plate_number,
      entry_time: row.entry_time,
      exit_time: row.exit_time || null,
      duration_minutes: row.duration_minutes || null,
      fee_rands: row.fee_rands || null,
      status: row.status,
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:5173',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,GET',
      },
      body: JSON.stringify({
        message: 'Sessions retrieved successfully',
        total: sessions.length,
        sessions,
      }),
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:5173',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,GET',
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message,
      }),
    };
  }
};
