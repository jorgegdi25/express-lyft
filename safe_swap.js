const fs = require('fs')

let content = fs.readFileSync('app/hotel/[slug]/page.tsx', 'utf8')

function extractBlock(startStr, openChar, closeChar) {
  const startIndex = content.indexOf(startStr)
  if (startIndex === -1) return null

  let count = 0
  let inside = false
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === openChar) {
      count++
      inside = true
    } else if (content[i] === closeChar) {
      count--
    }
    
    if (inside && count === 0) {
      return {
        text: content.substring(startIndex, i + 1),
        start: startIndex,
        end: i + 1
      }
    }
  }
  return null
}

const fleetDetails = extractBlock('<summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base text-white hover:text-[#D4AF37] list-none">\n                <div className="flex items-center gap-3">\n                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="22" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>\n                  Our Fleet', '<details', '</details>')

const servicesDetails = extractBlock('<summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base text-white hover:text-[#D4AF37] list-none">\n                <div className="flex items-center gap-3">\n                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>\n                  Our Services', '<details', '</details>')

// Wait, the start string doesn't start with `<details`. Let's just find the closest `<details` before the match.

const fleetIndex = content.indexOf('Our Fleet\n                </div>')
const servicesIndex = content.indexOf('Our Services\n                </div>')

const fleetStart = content.lastIndexOf('<details name="explore-accordion"', fleetIndex)
const servicesStart = content.lastIndexOf('<details name="explore-accordion"', servicesIndex)

function getBlock(startIndex) {
  let count = 0
  let inside = false
  for (let i = startIndex; i < content.length; i++) {
    // A bit rudimentary but fast for our known structure:
    if (content.substr(i, 8) === '<details') {
      count++
      inside = true
    } else if (content.substr(i, 10) === '</details>') {
      count--
    }
    
    if (inside && count === 0) {
      return content.substring(startIndex, i + 10)
    }
  }
}

const fleetBlockStr = getBlock(fleetStart)
const servicesBlockStr = getBlock(servicesStart)

// Now replace them!
// Because fleet comes first:
if (fleetStart < servicesStart) {
  const beforeFleet = content.substring(0, fleetStart)
  const between = content.substring(fleetStart + fleetBlockStr.length, servicesStart)
  const afterServices = content.substring(servicesStart + servicesBlockStr.length)
  
  const newContent = beforeFleet + servicesBlockStr + between + fleetBlockStr + afterServices
  fs.writeFileSync('app/hotel/[slug]/page.tsx.swapped', newContent)
  console.log("Swapped successfully")
}

