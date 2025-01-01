import { albertApi, getSearch, getPromptWithRagResults } from "albert-ts";

const LANGUAGE_MODEL =
  process.env.ALBERT_LANGUAGE_MODEL || "AgentPublic/llama3-instruct-8b"; // see https://albert.api.etalab.gouv.fr/v1/models

export const runQuery = async (query: string, collections: string[]) => {
  // get results from RAG
  const searchResults = await getSearch({
    collections: collections,
    query,
  });

  // create custom prompt with RAG results
  const prompt = getPromptWithRagResults({
    input: query,
    results: searchResults,
  });

  // ask Albert to complete the prompt
  return albertApi({
    path: "/chat/completions",
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      model: LANGUAGE_MODEL,
    }),
  }).then((r) => r.choices[0].message);
};
