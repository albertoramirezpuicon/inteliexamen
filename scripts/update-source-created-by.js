const mysql = require('mysql2/promise');

async function updateSourceCreatedBy() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Add your password if needed
    database: 'inteli_exam'
  });

  try {
    // Update the source with ID 3 to have created_by = 1
    const [result] = await connection.execute(
      'UPDATE inteli_sources SET created_by = 1 WHERE id = 3',
      []
    );

    console.log('Update result:', result);

    // Verify the update
    const [rows] = await connection.execute(
      'SELECT id, title, created_by FROM inteli_sources WHERE id = 3',
      []
    );

    console.log('Updated source:', rows[0]);

  } catch (error) {
    console.error('Error updating source:', error);
  } finally {
    await connection.end();
  }
}

updateSourceCreatedBy(); 