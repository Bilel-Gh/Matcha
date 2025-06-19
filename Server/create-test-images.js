const fs = require('fs');
const path = require('path');

// Create uploads directory structure
const uploadsDir = path.join(__dirname, 'uploads', 'photos');

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads/photos directory');
}

// Create simple placeholder SVG images
const createPlaceholderImage = (name, color) => {
  return `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${color}"/>
    <text x="200" y="200" font-family="Arial" font-size="20" fill="white" text-anchor="middle" dy=".3em">${name}</text>
  </svg>`;
};

// Test images data
const testImages = [
  { filename: 'admin_profile.jpg', name: 'Admin', color: '#4CAF50' },
  { filename: 'admin_photo2.jpg', name: 'Admin 2', color: '#45a049' },
  { filename: 'john_profile.jpg', name: 'John', color: '#2196F3' },
  { filename: 'john_sport.jpg', name: 'John Sport', color: '#1976D2' },
  { filename: 'john_travel.jpg', name: 'John Travel', color: '#1565C0' },
  { filename: 'jane_profile.jpg', name: 'Jane', color: '#E91E63' },
  { filename: 'jane_cooking.jpg', name: 'Jane Cook', color: '#C2185B' },
  { filename: 'jane_art.jpg', name: 'Jane Art', color: '#AD1457' },
  // From browsing_test_seeds.sql
  { filename: 'pierre.jpg', name: 'Pierre', color: '#FF9800' },
  { filename: 'marie.jpg', name: 'Marie', color: '#9C27B0' },
  { filename: 'luc.jpg', name: 'Luc', color: '#607D8B' },
  { filename: 'sophie.jpg', name: 'Sophie', color: '#795548' },
  { filename: 'thomas.jpg', name: 'Thomas', color: '#009688' },
  { filename: 'camille.jpg', name: 'Camille', color: '#8BC34A' },
];

// Create the placeholder images
testImages.forEach(image => {
  const svgContent = createPlaceholderImage(image.name, image.color);
  const filePath = path.join(uploadsDir, image.filename);

  // Convert filename to SVG (we'll keep them as SVG for simplicity)
  const svgFilePath = filePath.replace('.jpg', '.svg');

  fs.writeFileSync(svgFilePath, svgContent);
  console.log(`Created ${svgFilePath}`);
});

console.log('\n✅ All test images created successfully!');
console.log('📝 Note: These are SVG placeholder images for development testing.');
console.log('🔧 In production, users will upload real images through the API.');
console.log('\n🚀 You can now test the interactions system with proper profile pictures!');
