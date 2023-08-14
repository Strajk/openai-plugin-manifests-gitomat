# All OpenAI Plugin manifests, in git, updated daily

Fetch OpenAI Plugin manifests and their API spec, store in git in nice format, repeat every day.

🥷 *Note that only API definitions which are not behind authentication are fetched. But vast majority of them are public.*

💾 *Plugins are identified by unique randomly generated UUIDs, which aren't practical for human use. I decided to use combination of the plugin's domain and name for the filename where the plugin's data is stored.* 

Stored as:

- array in [resultsArray.json](./resultsArray.json) (only plugin manifests)
- object indexed by plugin name in [resultsIndexed.json](./resultsIndexed.json) (only plugin manifests)
- separate file per plugin name in [results/](./results) folder (both plugin manifest and API spec)
  - 💡TIP: Press `t` to open file finder on GitHub

Examples:

- Kiwi.com [Plugin](./results/chatgpt-plugin_kiwi_com__kiwicom_assistant_and_flights_search.json), [API](./results/chatgpt-plugin_kiwi_com__kiwicom_assistant_and_flights_search.api.json)
- Ai PDF [Plugin](./results/plugin-3c56b9d4c8a6465998395f28b6a445b2-jexkai4vea-uc_a_run_app__Ai_PDF.json), [API](./results/plugin-3c56b9d4c8a6465998395f28b6a445b2-jexkai4vea-uc_a_run_app__Ai_PDF.api.yaml)
- Wikipedia [Plugin](./results/chatgptplugin_enterprise_wikimedia_com__wikipedia.json), [API](./results/chatgptplugin_enterprise_wikimedia_com__wikipedia.api.json)
- Wolfram [Plugin](./results/wolframalpha_com__Wolfram.json), [API](./results/wolframalpha_com__Wolfram.api.json)
- Zapier [Plugin](./results/zapier_com__Zapier.json), [API](./results/zapier_com__Zapier.api.json)
 
### Why

- to see how the plugin ecosystem evolves over time
- to discover newly created plugins – types, categories, and authors
- to analyze model prompts patterns & best practices
- to have it tracked by good old git 🤓

### Example

#### Example of Plugin definition

```json
{
  "id": "plugin-abc12345-7f59-4bc9-9f3e-36f5ca12d8ef",
  "domain": "chatgpt.example.com",
  "namespace": "foo_calculator",
  "status": "approved",
  "manifest": {
    "schema_version": "v1",
    "name_for_model": "foo_calculator",
    "name_for_human": "Foo Calculator",
    "description_for_model": "THE REALLY INTERESTING PART!",
    "description_for_human": "",
    "auth": { ... },
    "api": {
      "type": "openapi",
      "url": "https://chatgpt.example.com/openapi.json"
    },
    "logo_url": "https://chatgpt.example.com/logo.png",
    "contact_email": "chatgpt@foo.com",
    "legal_info_url": "https://chatgpt.example.com/legal",
  },
  "oauth_client_id": null,
  "categories": [
    { "id": "newly_added", "title": "New" }
  ]
}
```

#### Example of Plugin API definition

```yaml
info:
  title: Calculator Chat
  description: A plugin that allows users to do math in chat.
  version: 1.0.0
servers:
  - url: https://chatgpt.example.com
paths:
  /calculate:
    post:
      summary: Calculate a math expression
      operationId: calculate
      description: ...
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                expression:
                  type: string
                  description: The math expression to calculate
                  example: 2 + 2
      responses:
        200:
          description: The result of the calculation
          content:
            application/json:
              schema:
                type: object
                properties:
                  result:
                    type: number
                    description: The result of the calculation
```

#### Resources

- https://platform.openai.com/docs/plugins/introduction

#### Acknowledgements

- https://simonwillison.net/2020/Oct/9/git-scraping/ 
