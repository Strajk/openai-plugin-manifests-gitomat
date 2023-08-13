import * as fs from 'node:fs'

if (!process.env.OPENAI_TOKEN) throw new Error(`🚨 OPENAI_TOKEN env var is required`)

const now = new Date().toISOString() // static for the whole run
const limit = 32 // default is 8, 32 works fine, more is maybe possible but let's be nice
let offset = 0
let total = null // set after first request

const results = []
async function scrape () {
  const res = await fetch(`https://chat.openai.com/backend-api/aip/p/approved?offset=${offset}&limit=${limit}&search=`, {
    headers: {
      authorization: `Bearer ${process.env.OPENAI_TOKEN}`,
      "cache-control": `no-cache`,
      "content-type": `application/json`,
    },
    referrer: `https://chat.openai.com/`,
  })
  const data = await res.json()
  const { count, items } = data
  for (const item of items) {
    item.__scrapedAt = now // maybe will be useful later
    delete item.user_settings // related to the authed user, not the plugin
  } 

  if (total && count < total) console.log(`🧐 Suspicious, count got smaller: ${total} » ${count}`)
  total = count
  offset += limit
  results.push(...items)
  console.log(`⛏️ Scraped ${results.length}/${count}`)
  await new Promise(resolve => setTimeout(resolve, 500)) // wait to not overload the API
}

// Commence scraping!
await scrape()
while (offset < total) await scrape()
console.log(`🎉 Done, scraped ${results.length} items, saving...`)

// Save as array
fs.writeFileSync(`resultsArray.json`, JSON.stringify(results, null, 2))
console.log(`💾 Saved as resultsArray.json`)

// Save as object indexed by "name_for_model"
const resultsIndexedByName = results.reduce((acc, item) => {
  const slug = itemToSlug(item)
  if (acc[slug]) console.log(`🧐 Suspicious, duplicate name_for_model: ${slug}`)
  acc[slug] = item
  return acc
}, {})
fs.writeFileSync(`resultsIndexed.json`, JSON.stringify(resultsIndexedByName, null, 2))
console.log(`💾 Saved as resultsIndexed.json`)

// Save as file per plugin
for (const item of results) {
  const slug = itemToSlug(item)
  fs.writeFileSync(`results/${slug}.json`, JSON.stringify(item, null, 2))
}
console.log(`💾 Saved as results/*.json`)

// Helpers
// ===
function itemToSlug (item) {
  const { manifest, domain } = item
  const { name_for_model } = manifest
  return domain.replace(/\./g, `_`) + `__` + name_for_model
}
