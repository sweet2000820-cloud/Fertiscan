const fs = require('fs')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="230" fill="#0A5C6B"/>
  <rect x="280" y="200" width="460" height="80" rx="40" fill="white"/>
  <rect x="280" y="340" width="340" height="80" rx="40" fill="white"/>
  <rect x="280" y="200" width="80" height="580" rx="40" fill="white"/>
</svg>`

fs.writeFileSync('assets/icon.svg', svg)
console.log('SVG 已建立')