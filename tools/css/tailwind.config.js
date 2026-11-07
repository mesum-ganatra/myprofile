// Scans the public blog pages and their scripts for Tailwind class names.
// If you add new Tailwind classes to these files, rebuild: cd tools/css && npm install && npm run build
module.exports = {
  darkMode: 'class',
  content: [
    '../../blog.html',
    '../../post.html',
    '../../assets/site-shell.js',
    '../../assets/blog.js',
    '../../assets/post.js',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
    },
  },
};
