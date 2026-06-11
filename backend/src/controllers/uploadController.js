const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from environment variables
// Note: Requires CLOUDINARY_URL or individual CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Convert buffer to base64 for Cloudinary upload
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // Return the base64 string directly for DB storage (no Cloudinary)
    res.status(200).json({
      success: true,
      url: dataURI
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ message: 'Error processing image' });
  }
};

module.exports = {
  uploadImage
};
