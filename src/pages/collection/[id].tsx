import type { NextPage } from "next";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fr } from "@codegouvfr/react-dsfr";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useQueryState } from "nuqs";
import { useChat } from "ai/react";
import { useDropzone } from "react-dropzone";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ALBERT_API_KEY = process.env.ALBERT_API_KEY;
const API_URL = "/api/albert"; //https://albert.api.etalab.gouv.fr";
const LANGUAGE_MODEL = "AgentPublic/llama3-instruct-8b"; // see https://albert.api.etalab.gouv.fr/v1/models

import { mdxComponents } from "../../../mdx-components";

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

function MyDropzone({ children, onDrop }) {
  const onDropFiles = useCallback((acceptedFiles) => {
    console.log("acceptedFiles", acceptedFiles);
    // Do something with the files
    onDrop(acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropFiles,
    noClick: true,
  });
  const style = {
    border: isDragActive ? "2px dotted var(--grey-425-625) " : "none",
    backgroundColor: isDragActive
      ? fr.colors.decisions.background.actionLow.blueFrance.default
      : "transparent",
  };
  if (isDragActive) {
  }
  return (
    <div {...getRootProps()} style={style} className={fr.cx("fr-p-1w")}>
      <input {...getInputProps()} />
      {children}
    </div>
  );
}

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat({
      api: "/api/albert/v1/chat/completions",
      headers: {
        Authorization: `Bearer ${ALBERT_API_KEY}`,
      },
      body: {
        model: LANGUAGE_MODEL,
      },
      initialMessages: [
        {
          role: "assistant",
          id: "initial",
          content:
            "Bonjour, déposez des fichiers dans cette fenêtre et j'essaierai de répondre à vos questions",
        },
      ],
      onResponse: async (message) => {
        const m = await message.json();

        setMessages((messages) => [
          ...messages,
          {
            role: "assistant",
            id: m.id,
            content: m.choices[0].message.content,
          },
        ]);
      },
    });

  return (
    <div style={{ width: "100%", marginBottom: 30 }}>
      <div style={{ height: "100%", minHeight: 300 }}>
        {messages.map((m) => (
          <div key={m.id} className={fr.cx("fr-mb-2w")}>
            {m.role === "user" ? (
              <>
                <i className={fr.cx("fr-icon--md", "ri-user-fill")} /> :{" "}
              </>
            ) : (
              <>
                <i className={fr.cx("fr-icon--md", "ri-robot-2-fill")} /> :{" "}
              </>
            )}
            <Markdown
              components={mdxComponents}
              className="chat-markdown"
              remarkPlugins={[remarkGfm]}
            >
              {m.content}
            </Markdown>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          //className={fr.cx("fr-input-group")} //fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          style={{ width: "100%" }}
          label=""
          nativeInputProps={{
            defaultValue: input,
            placeholder: "Posez une question à Albert",
            onChange: handleInputChange,
          }}
        />
        <br />
      </form>
    </div>
  );
}
const CollectionPage: NextPage = (props) => {
  //const route = useRouter();
  const [collections] = useAlbertCollections();
  const [currentCollectionId, setCurrentCollectionId] = useQueryState("name");
  console.log("Page", collections);
  const onDrop = (acceptedFiles) => {
    console.log("onDrop", acceptedFiles);
  };
  return (
    <>
      <div className="fr-container">
        <MyDropzone onDrop={onDrop}>
          <div className={fr.cx("fr-grid-row")}>
            <Chat />
          </div>
        </MyDropzone>
      </div>
    </>
  );
};

export default CollectionPage;
