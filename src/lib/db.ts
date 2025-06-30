import mysql from 'mysql2/promise';

// Create connection pool with better configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inteli_exam',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Database error type
interface DatabaseError extends Error {
  code?: string;
}

// Retry function for database operations
async function retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let lastError: DatabaseError | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error as DatabaseError;
      
      // Check if it's a connection error that we should retry
      if (lastError.code === 'ECONNRESET' || 
          lastError.code === 'PROTOCOL_CONNECTION_LOST' || 
          lastError.code === 'ER_CON_COUNT_ERROR' ||
          lastError.code === 'ETIMEDOUT') {
        
        console.log(`Database connection error (attempt ${attempt}/${maxRetries}):`, lastError.code);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // If it's not a retryable error or we've exhausted retries, throw immediately
      throw error;
    }
  }
  
  throw lastError || new Error('Operation failed after all retries');
}

// Export query function for database operations with retry logic
export async function query(sql: string, params: (string | number | boolean | null)[] = []) {
  return retryOperation(async () => {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  });
}

// Export insertQuery function for INSERT operations that return the insert ID
export async function insertQuery(sql: string, params: (string | number | boolean | null)[] = []) {
  return retryOperation(async () => {
    try {
      const [result] = await pool.execute(sql, params);
      return result as mysql.ResultSetHeader;
    } catch (error) {
      console.error('Database insert error:', error);
      throw error;
    }
  });
}

// Health check function to test database connectivity
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection health check failed:', error);
    return false;
  }
}

export default pool; 