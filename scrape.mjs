import * as fs from 'node:fs'

if (!process.env.OPENAI_TOKEN) throw new Error(`🚨 OPENAI_TOKEN env var is required`)

const startedAt = new Date().toISOString() // static for the whole run
let results = []

async function downloadPluginManifests() {
  const limit = 32 // default is 8, 32 works fine, more is maybe possible but let's be nice
  let offset = 0
  let total = null // set after first request

  async function scrape () {
    const res = await fetch(`https://chat.openai.com/backend-api/aip/p/approved?offset=${offset}&limit=${limit}&search=`, {
      headers: {
        authorization: `Bearer ${process.env.OPENAI_TOKEN}`,
        "cache-control": `no-cache`,
        "content-type": `application/json`,
      },
      referrer: `https://chat.openai.com/`,
    })
    if (!res.ok) throw new Error(`🚨 ${res.status} ${res.statusText}`)
    const data = await res.json()
    const { count, items } = data
    if (!items?.length) throw new Error(`🚨 No items in response, check the response headers for errors`)
    for (const item of items) {
      item.__scrapedAt = startedAt // maybe will be useful later
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
}

async function downloadPluginApiManifests({ onlyMissing = false }) {
  // when debugging, we may not run the whole scrape, so potentially use the existing results from disk
  if (!results.length) results = JSON.parse(fs.readFileSync(`resultsArray.json`, `utf8`))
  for (const item of results) {
    const slug = itemToSlug(item)
    if (onlyMissing && fileStartingWithExists(`results`, `${slug}.api.`)) continue
    console.log(`📥 Downloading ${itemToSlug(item)}.api.*`)
    try {
      await downloadApiManifest(item)
      console.log(`   ✅`)
    } catch (e) {
      console.log(`   ❌ ${e.message}`)
      logProblemToFile(`Failed to download API manifest for ${item.domain}/${item.manifest.name_for_model}:\n${e.message}`)
    }
  }
}

// Main flow – for easier debugging divide into two independent steps
await downloadPluginManifests()
await downloadPluginApiManifests({ onlyMissing: false }) // set onlyMissing for easier debugging

// Helpers
// ===
function itemToSlug (item) {
  const { manifest, domain } = item
  const { name_for_model } = manifest
  return domain.replace(/\./g, `_`) + `__` + name_for_model
}

function fileStartingWithExists (dir = `results`, needle) {
  return fs.readdirSync(dir).some(filename => filename.startsWith(needle))
}

async function downloadApiManifest(item) {
  const slug = itemToSlug(item)
  const { manifest } = item
  const { api } = manifest
  
  let ext // url may not end with file extension, fallback to response content-type 
  const  { type, url } = api
  if (url.endsWith(`.json`)) ext = `json`
  else if (url.endsWith(`.yaml`)) ext = `yaml`
  const res = await fetch(url)
  const contentType = res.headers.get(`content-type`)
  if (!ext) {
    if (contentType.includes(`json`)) ext = `json`
    else if (contentType.includes(`yaml`)) ext = `yaml`
    else {
      console.log(`🧐 Suspicious, unknown content-type: ${contentType} for ${url}`)
      ext = `txt`
    }
  }
  const filename = `${slug}.api.${ext}`
  const text = await res.text()
  let formattedText
  if (ext === `json`) formattedText = JSON.stringify(JSON.parse(text), null, 2)
  else if (ext === `yaml`) formattedText = text // TODO: normalize yaml?
  fs.writeFileSync(`results/${filename}`, formattedText)
}

function logProblemToFile(problem) {
  if (!fs.existsSync(`problems.txt`)) fs.writeFileSync(`problems.txt`, ``)
  fs.appendFileSync(`problems.txt`, `${new Date().toISOString()}: ${problem}\n`)
}
