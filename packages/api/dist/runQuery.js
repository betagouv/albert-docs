var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { albertApi, getSearch, getPromptWithRagResults } from "albert-ts";
const LANGUAGE_MODEL = process.env.ALBERT_LANGUAGE_MODEL || "AgentPublic/llama3-instruct-8b"; // see https://albert.api.etalab.gouv.fr/v1/models
export const runQuery = (query, collections) => __awaiter(void 0, void 0, void 0, function* () {
    // get results from RAG
    const searchResults = yield getSearch({
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
});
//# sourceMappingURL=runQuery.js.map