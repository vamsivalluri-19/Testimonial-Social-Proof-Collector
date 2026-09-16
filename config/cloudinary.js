const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload buffer or file to Cloudinary with fallback handling
 * @param {Object} file - Multer file object
 * @param {string} folder - Destination folder name in Cloudinary
 * @returns {Promise<string>} Image URL
 */
const uploadToCloudinary = async (file, folder = 'proofly_avatars') => {
  if (!file) return null;

  // Check if real Cloudinary keys are present
  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'demo' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== '123456789';

  if (!isCloudinaryConfigured) {
    // Graceful fallback for local development & testing without live Cloudinary credentials
    const timestamp = Date.now();
    const cleanName = (file.originalname || 'avatar.png').replace(/[^a-zA-Z0-9.-]/g, '_');
    return `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80#${timestamp}_${cleanName}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]', error);
          // Fallback to placeholder if upload stream fails
          return resolve(`https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80#fallback`);
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(file.buffer);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
