import { useEffect, useState } from "react";

export const ALBERT_API_KEY = process.env.ALBERT_API_KEY;
export const API_URL = "/api/albert"; //https://albert.api.etalab.gouv.fr";
export const LANGUAGE_MODEL = "AgentPublic/llama3-instruct-8b"; // see https://albert.api.etalab.gouv.fr/v1/models
export const EMBEDDING_MODEL = "BAAI/bge-m3";

export const albertApi = ({
  path,
  method = "POST",
  body,
}: {
  path: string;
  method?: "POST" | "GET";
  body?: string;
}) =>
  fetch(`${API_URL}/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ALBERT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body,
  }).then((r) => r.json());

type AlbertCollection = {
  id: string;
  name: string;
  type: "public" | "private";
  model: "string"; // "BAAI/bge-m3";
  user: string;
  description: string;
  created_at: number;
  documents: null | number;
};

export const useAlbertCollections = () => {
  const [collections, setCollections] = useState<AlbertCollection[]>([]);

  const reloadCollections = async () => {
    const collections = await albertApi({
      path: "/collections",
      method: "GET",
    });
    setCollections(collections.data || []);
  };

  useEffect(() => {
    reloadCollections();
  }, [reloadCollections]);

  return { collections, reloadCollections };
};

export const createCollection = ({
  name,
  model = EMBEDDING_MODEL,
}: {
  name: string;
  model?: string;
}) =>
  fetch(`${API_URL}/v1/collections`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ALBERT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, model }),
  })
    .then((r) => r.json())
    .then((d) => {
      console.log(d);
      return d;
    })
    .then((d) => d.id);

export const addFileToCollection = async ({
  file,
  fileName,
  collectionId,
}: {
  file: File;
  fileName: string;
  collectionId: string;
}) => {
  const formData = new FormData();
  formData.append("file", file, fileName);
  formData.append("request", JSON.stringify({ collection: collectionId }));
  return fetch(`${API_URL}/v1/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ALBERT_API_KEY}`,
      //"Content-Type": "multipart/form-data",
    },
    body: formData,
  }).then(async (r) => {
    //console.log(r);
    if (r.status !== 200) {
      console.log("Cannot upload document", r.statusText);
      return {
        detail: r.statusText,
      };
    }
    if (r.statusText === "OK") {
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
      detail: "plop",
    };
  });
};

export const getSearch = ({
  collections,
  query,
}: {
  collections: string[];
  query: string;
}) => {
  console.log({ url: `${API_URL}/v1/search`, query });
  return fetch(`${API_URL}/v1/search`, {
    cache: "no-cache",
    method: "POST",
    headers: {
      Authorization: `Bearer ${ALBERT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ collections, k: 6, prompt: query }),
  })
    .then((r) => {
      console.log(r);
      return r.json();
    })
    .catch((r) => {
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
      chunk: {
        content: string;
        metadata: { title: string; document_name: string };
      };
    }[];
  };
}) => `Réponds à la question suivante au format markdown sans mettre de titre et en te basant sur le contexte fourni uniquement.

  ## Question: ${input}
          
  ## Contexte
          
  ${results.data
    .map(
      (hit) => `${hit.chunk.metadata.title} ${hit.chunk.metadata.document_name} 
          
  ${hit.chunk.content}
          `
    )
    .join("\n")}
          `;
