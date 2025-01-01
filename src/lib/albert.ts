import { useEffect, useState } from "react";

export const ALBERT_API_KEY = process.env.ALBERT_API_KEY;
export const API_URL = "https://albert-api.kube-dev.incubateur.net"; //https://albert.api.etalab.gouv.fr"; // "/api/albert"
export const LANGUAGE_MODEL = "AgentPublic/llama3-instruct-8b"; // see https://albert.api.etalab.gouv.fr/v1/models
export const EMBEDDING_MODEL = "BAAI/bge-m3";

export const albertApi = ({
  path,
  method = "POST",
  body,
  token = ALBERT_API_KEY,
}: {
  path: string;
  method?: "POST" | "GET";
  body?: string;
  token?: string;
}) =>
  fetch(`${API_URL}/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  }).then((r) => r.json());

export type AlbertCollection = {
  id: string;
  name: string;
  type: "public" | "private";
  model: "string"; // "BAAI/bge-m3";
  user: string;
  description: string;
  created_at: number;
  documents: null | number;
};

export const useAlbertCollections = (albertToken: string) => {
  const [collections, setCollections] = useState<AlbertCollection[]>([]);

  const reloadCollections = async () => {
    if (!albertToken) {
      return;
    }
    const collections = await albertApi({
      path: "/collections",
      method: "GET",
      token: albertToken,
    });
    setCollections(collections.data || []);
  };

  useEffect(() => {
    if (!collections.length) {
      reloadCollections();
    }
  }, [reloadCollections, albertToken]);

  return { collections, reloadCollections };
};

export const createCollection = ({
  name,
  model = EMBEDDING_MODEL,
  token = ALBERT_API_KEY,
}: {
  name: string;
  model?: string;
  token?: string;
}) =>
  albertApi({
    path: "/collections",
    body: JSON.stringify({ name, model }),
    token,
  }).then((d) => d.id);

export const addFileToCollection = async ({
  file,
  fileName,
  collectionId,
  token = ALBERT_API_KEY,
}: {
  file: File;
  fileName: string;
  collectionId: string;
  token?: string;
}) => {
  const formData = new FormData();
  formData.append("file", file, fileName);
  formData.append("request", JSON.stringify({ collection: collectionId }));
  return fetch(`${API_URL}/v1/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      //"Content-Type": "multipart/form-data",
    },
    body: formData,
  }).then(async (r) => {
    console.log("addFileToCollection", r.status, r.statusText);
    if (r.status !== 200) {
      console.log("Cannot upload document", r.statusText);
      return {
        detail: r.statusText,
      };
    }
    if (r.statusText === "OK" || r.statusText === "") {
      let json: { detail?: string } = {};
      try {
        json = await r.json();
      } catch (e) {}
      if (json && json.detail) {
        console.log("Cannot upload document", json.detail);
        return {
          detail: json.detail,
        };
      }
      return json;
    }
    return {
      detail: "erreur",
    };
  });
};

export const getSearch = ({
  collections,
  query,
  token = ALBERT_API_KEY,
}: {
  collections: string[];
  query: string;
  token?: string;
}) => {
  console.log({ url: `${API_URL}/v1/search`, query });
  return albertApi({
    path: "/search",
    token,
    body: JSON.stringify({ collections, k: 6, prompt: query }),
  }).catch((r) => {
    console.error(r);
    throw r;
  });
};

export const getPromptWithRagResults = ({
  results,
  input,
}: {
  input: string;
  results: {
    data: {
      score: number;
      chunk: {
        content: string;
        metadata: {
          title: string;
          document_name: string;
          collection_id: string;
        };
      };
    }[];
  };
}) => {
  return `Réponds à la question suivante en utilisant un format markdown bien lisible et en te basant sur le contexte ci-dessous uniquement et en fournissant toutes les informations nécessaires.Commence directement par ta réponse et cite tes sources en conclusion;

## Question: ${input}
          
## Contexte

## Sources:
${results.data
  .map(
    (hit) => ` - [${
      (hit.chunk.metadata.title &&
        hit.chunk.metadata.title.replace(/^#+/, "")) ||
      hit.chunk.metadata.document_name
    }](https://espace-membre.incubateur.net/doc/${
      hit.chunk.metadata.collection_id
    }/${hit.chunk.metadata.document_name}) (score=${hit.score})
${hit.chunk.content}\n\n`
  )
  .join("\n")}`;
};
