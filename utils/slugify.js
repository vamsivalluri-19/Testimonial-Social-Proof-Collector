const slugify = require('slugify');

/**
 * Generate clean URL-safe slug from text
 * @param {string} text - Input text
 * @returns {string} Clean slug
 */
const generateSlug = (text) => {
  if (!text) return `space-${Date.now()}`;
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
};

module.exports = generateSlug;
