const { pool } = require("../config/database");
const fs = require("fs");
const path = require("path");

async function addHtmlContentField() {
  const client = await pool.connect();
  
  try {
    console.log("Starting migration: Adding html_content field to legal_documents table...");
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, "..", "..", "add_html_content_field.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");
    
    // Execute the migration
    await client.query(sqlContent);
    
    console.log("Migration completed successfully!");
    console.log("Added html_content field to legal_documents table");
    
    // Verify the field was added
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'legal_documents' 
      AND column_name = 'html_content'
    `);
    
    if (result.rows.length > 0) {
      console.log("Field verification successful:");
      console.log("Column:", result.rows[0].column_name);
      console.log("Data type:", result.rows[0].data_type);
      console.log("Nullable:", result.rows[0].is_nullable);
    } else {
      console.log("Warning: Field verification failed");
    }
    
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addHtmlContentField()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = { addHtmlContentField };
