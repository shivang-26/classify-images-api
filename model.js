const express = require("express");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // For loading environment variables from a .env file

const app = express();
const port = process.env.PORT || 3030;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize the Google Generative AI with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_KEY);

// Configure multer for handling form-data (including file uploads)
const upload = multer();

// Converts file information to a GoogleGenerativeAI.Part object
function fileToGenerativePart(file) {
  return {
    inlineData: {
      data: file.buffer.toString("base64"),
      mimeType: file.mimetype,
    },
  };
}

// POST endpoint to classify an image
app.post("/classify-image", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    // Classification prompt
    const prompt = "Classify the image into one of the following categories: overcrowded, coach_cleanliness, toilet_cleanliness, or window_damaged.";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const filePart = fileToGenerativePart(file);
    const result = await model.generateContent([prompt, filePart]);

    const response = await result.response;
    const text = await response.text();

    res.json({ classification: text });
  } catch (error) {
    console.error("Error classifying image:", error);
    res
      .status(500)
      .json({ error: "An error occurred while classifying the image" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
