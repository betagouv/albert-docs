import { AlbertApiWrapperParams, AlbertApiSearchResult } from "albert-ts";
export declare const ALBERT_API_KEY: string | undefined;
export declare const API_URL = "https://albert-api.kube-dev.incubateur.net";
export declare const LANGUAGE_MODEL = "AgentPublic/llama3-instruct-8b";
export declare const EMBEDDING_MODEL = "BAAI/bge-m3";
export declare const albertApi: ({ path, method, body, token, }: AlbertApiWrapperParams) => Promise<any>;
export declare const createCollection: ({ name, model, token, }: {
    name: string;
    model?: string | undefined;
    token?: string | undefined;
}) => Promise<any>;
export declare const addFileToCollection: ({ file, fileName, collectionId, token, }: {
    file: File;
    fileName: string;
    collectionId: string;
    token?: string | undefined;
}) => Promise<{
    detail?: string | undefined;
}>;
export declare const getSearch: ({ collections, query, token, }: {
    collections: string[];
    query: string;
    token?: string | undefined;
}) => Promise<any>;
export declare const getPromptWithRagResults: ({ results, input, }: {
    input: string;
    results: AlbertApiSearchResult;
}) => string;
