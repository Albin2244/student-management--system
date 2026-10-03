const Database = require('better-sqlite3');
try {
  const db = new Database(':memory:');
  const row = db.prepare('SELECT 1 + 1 AS solution').get();
  console.log('SUCCESS: SQLite is functional! Solution is:', row.solution);
} catch (err) {
  console.error('ERROR running better-sqlite3:', err);
}
