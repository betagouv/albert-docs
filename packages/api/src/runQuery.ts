import { albertApi, AlbertApiSearchResult, getSearch } from "albert-ts";

const LANGUAGE_MODEL =
  process.env.ALBERT_LANGUAGE_MODEL || "AgentPublic/llama3-instruct-8b"; // see https://albert.api.etalab.gouv.fr/v1/models

const collections: Record<string, string> = {
  "373652af-6c53-458c-ad7a-86411fa7f11c": "members",
  "d0e585d4-8c76-4efa-a134-1ffd1288385e": "startups",
  "57a8824e-d4fd-4ab2-8580-65c007030e81": "doc",
};

const getSourceUrl = (hit: AlbertApiSearchResult["data"][number]) => {
  const collectionName = collections[hit.chunk.metadata.collection_id];
  if (collectionName === "members") {
    return `https://espace-membre.incubateur.net/community/${hit.chunk.metadata.document_name.replace(
      /\.md$/,
      ""
    )}`;
  } else if (collectionName === "startups") {
    return `https://beta.gouv.fr/startups/${hit.chunk.metadata.document_name.replace(
      /\.md$/,
      ""
    )}`;
  } else if (collectionName === "doc") {
    return `https://doc.incubateur.net/communaute?q=${encodeURIComponent(
      hit.chunk.metadata.document_name.replace(/\.md$/, "")
    )}`;
  }
};

export const getPromptWithRagResults = ({
  results,
  input,
}: {
  input: string;
  results: AlbertApiSearchResult;
}) => {
  return `Réponds à la question suivante en utilisant un format markdown bien lisible et en te basant sur le contexte ci-dessous uniquement et en fournissant toutes les informations nécessaires. Commence directement par ta réponse et cite tes sources en conclusion;
  
## Question: ${input}
            
## Contexte
  
${results.data
  .map(
    (hit) => `### ${
      (hit.chunk.metadata.title &&
        hit.chunk.metadata.title.replace(/^#+/, "")) ||
      hit.chunk.metadata.document_name
    } (score=${hit.score})
${hit.chunk.content}\n\n`
  )
  .join("\n")}

## Sources

${results.data
  .map(
    (hit) =>
      ` -  [${
        (hit.chunk.metadata.title &&
          hit.chunk.metadata.title.replace(/^#+/, "")) ||
        hit.chunk.metadata.document_name
      }](${getSourceUrl(hit)})`
  )
  .join("\n")}

`;
};

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
