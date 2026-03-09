const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

// Allow browser requests from your frontend.
app.use(cors());

// Parse JSON request bodies.
app.use(express.json());

// Health check endpoint for testing whether the API is up.
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Return all services from PostgreSQL.
app.get("/api/services", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM services ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/services failed:", error.message);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// Return one service by slug, such as iphone15, samsung-s24, or repair.
app.get("/api/services/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM services WHERE slug = $1",
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(`GET /api/services/${slug} failed:`, error.message);
    res.status(500).json({ error: "Failed to fetch service" });
  }
});

// Create a repair appointment and save it in PostgreSQL.
app.post("/api/appointments", async (req, res) => {
  const {
    service_slug,
    customer_name,
    customer_phone,
    customer_email,
    device_type,
    issue_description,
    preferred_date,
    preferred_time
  } = req.body;

  // Validate required fields before trying to write to the database.
  if (
    !service_slug ||
    !customer_name ||
    !customer_phone ||
    !device_type ||
    !issue_description ||
    !preferred_date ||
    !preferred_time
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO appointments (
        service_slug,
        customer_name,
        customer_phone,
        customer_email,
        device_type,
        issue_description,
        preferred_date,
        preferred_time
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        service_slug,
        customer_name,
        customer_phone,
        customer_email || null,
        device_type,
        issue_description,
        preferred_date,
        preferred_time
      ]
    );

    res.status(201).json({
      message: "Appointment scheduled successfully",
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error("POST /api/appointments failed:", error.message);
    res.status(500).json({ error: "Failed to schedule appointment" });
  }
});

// Start the API server.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`shopping-api running on port ${PORT}`);
});