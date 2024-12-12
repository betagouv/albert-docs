import type { NextPage } from "next";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fr } from "@codegouvfr/react-dsfr";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { useQueryState } from "nuqs";
import { useChat } from "ai/react";

const ALBERT_API_KEY = process.env.ALBERT_API_KEY;
const API_URL = "/api/albert"; //https://albert.api.etalab.gouv.fr";
const LANGUAGE_MODEL = "AgentPublic/llama3-instruct-8b"; // see https://albert.api.etalab.gouv.fr/v1/models

const albertApi = ({
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
      // Authorization: `Bearer ${ALBERT_API_KEY}`,
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

const useAlbertCollections = () => {
  const [collections, setCollections] = useState<AlbertCollection[]>([]);
  const loadCollections = async () => {
    const collections = await albertApi({
      path: "/collections",
      method: "GET",
    });
    return collections;
  };
  useEffect(() => {
    loadCollections().then((res) => {
      setCollections(res.data);
    });
  }, []);
  return [collections];
};

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map((m) => (
        <div key={m.id} className="whitespace-pre-wrap">
          {m.role === "user" ? "User: " : "AI: "}
          {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
const CollectionPage: NextPage = (props) => {
  const route = useRouter();
  const [collections] = useAlbertCollections();
  const [currentCollectionId, setCurrentCollectionId] = useQueryState("name");
  console.log("Page", collections);

  return (
    <>
      <div className="fr-container">
        <div className={fr.cx("fr-grid-row")}>
          <div className={fr.cx("fr-col-3")}>
            <Table
              fixed
              headers={[
                <>
                  Collections{" "}
                  <i
                    className={fr.cx(
                      "fr-ml-1w",
                      "fr-icon--sm",
                      "fr-icon-add-circle-fill"
                    )}
                  />
                </>,
              ]}
              data={collections.map((collection) => [
                <>
                  <div
                    className={`${
                      collection.id === currentCollectionId
                        ? fr.cx("fr-text--bold")
                        : ""
                    }`}
                    onClick={() => setCurrentCollectionId(collection.id)}
                  >
                    {collection.id === currentCollectionId && (
                      <i
                        className={fr.cx(
                          "fr-icon--sm",
                          "fr-icon-arrow-right-line"
                        )}
                      />
                    )}
                    {collection.name}
                  </div>
                </>,
              ])}
            />
          </div>
          <div className={fr.cx("fr-col-9")}>
            <Chat />
          </div>
        </div>
      </div>
    </>
  );
};

export default CollectionPage;
