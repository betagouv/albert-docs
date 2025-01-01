var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const ALBERT_API_KEY = process.env.ALBERT_API_KEY;
export const API_URL = "https://albert-api.kube-dev.incubateur.net"; //https://albert.api.etalab.gouv.fr"; // "/api/albert"
export const LANGUAGE_MODEL = "AgentPublic/llama3-instruct-8b"; // see https://albert.api.etalab.gouv.fr/v1/models
export const EMBEDDING_MODEL = "BAAI/bge-m3";
export const albertApi = ({ path, method = "POST", body, token = ALBERT_API_KEY, }) => fetch(`${API_URL}/v1${path}`, {
    method,
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    },
    body,
}).then((r) => r.json());
export const createCollection = ({ name, model = EMBEDDING_MODEL, token = ALBERT_API_KEY, }) => albertApi({
    path: "/collections",
    body: JSON.stringify({ name, model }),
    token,
}).then((d) => d.id);
export const addFileToCollection = (_a) => __awaiter(void 0, [_a], void 0, function* ({ file, fileName, collectionId, token = ALBERT_API_KEY, }) {
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
    }).then((r) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("addFileToCollection", r.status, r.statusText);
        if (r.status !== 200) {
            console.log("Cannot upload document", r.statusText);
            return {
                detail: r.statusText,
            };
        }
        if (r.statusText === "OK" || r.statusText === "") {
            let json = {};
            try {
                json = yield r.json();
            }
            catch (e) { }
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
    }));
});
export const getSearch = ({ collections, query, token = ALBERT_API_KEY, }) => {
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
export const getPromptWithRagResults = ({ results, input, }) => {
    return `Réponds à la question suivante en utilisant un format markdown bien lisible et en te basant sur le contexte ci-dessous uniquement et en fournissant toutes les informations nécessaires. Commence directement par ta réponse et cite tes sources en conclusion;

## Question: ${input}
          
## Contexte

${results.data
        .map((hit) => `### [${(hit.chunk.metadata.title &&
        hit.chunk.metadata.title.replace(/^#+/, "")) ||
        hit.chunk.metadata.document_name}](https://espace-membre.incubateur.net/doc/${hit.chunk.metadata.collection_id}/${hit.chunk.metadata.document_name}) (score=${hit.score})
${hit.chunk.content}\n\n`)
        .join("\n")}`;
};
//# sourceMappingURL=index.js.map