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
      // 'cyan' and 'teal' are remapped to the site's orange (Ember) accent colours
      colors: { cyan: {50:'#fff3ef',100:'#ffe3da',200:'#ffc6b5',300:'#ffa58c',400:'#ff7a52',500:'#ff4d2e',600:'#e63a1c',700:'#bf2f16',800:'#992816',900:'#7a2417',950:'#430f08'}, teal: {50:'#fffaeb',100:'#fff1c6',200:'#ffe08a',300:'#ffc94d',400:'#ffb04d',500:'#ff9a2e',600:'#e87d12',700:'#c25e0c',800:'#9b4a10',900:'#7c3d11',950:'#451e06'} },
    },
  },
};
