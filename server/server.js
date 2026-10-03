const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Student Management System API Server running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔒 Authentication: JWT Role-Based Protection`);
  console.log(`💾 Database: SQLite (database.sqlite)`);
  console.log(`===============================================`);
});
