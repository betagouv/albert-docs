declare module "albert-ts" {
  interface AlbertApiWrapperParams {
    path: string;
    method?: "POST" | "GET" | "DELETE";
    body?: string | FormData;
    json?: boolean;
    token?: string;
  }

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

  interface AlbertApiSearchParams {
    collections: string[];
    query: string;
  }

  interface AlbertApiChunk {
    content: string;
    metadata: { document_name: string; title: string; collection_id: string };
  }

  interface AlbertApiSearchResult {
    data: { score: number; chunk: AlbertApiChunk }[];
  }

  interface AlbertApiCollectionsResult {
    object: "list";
    data: AlbertCollection[];
  }

  type AlbertEmbeddingModel = "BAAI/bge-m3" | "intfloat/multilingual-e5-large";
}

export {
  API_URL,
  albertApi,
  createCollection,
  addFileToCollection,
  getSearch,
  getPromptWithRagResults,
} from "./src/index";
