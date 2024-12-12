import type { InferGetServerSidePropsType, GetServerSideProps } from "next";
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

import {
  useAlbertCollections,
  getSearch,
  addFileToCollection,
  getPromptWithRagResults,
} from "../../lib/albert";

const ALBERT_API_KEY = process.env.ALBERT_API_KEY;
const API_URL = "/api/albert"; //https://albert.api.etalab.gouv.fr";
const LANGUAGE_MODEL = "AgentPublic/llama3-instruct-8b"; // see https://albert.api.etalab.gouv.fr/v1/models
const EMBEDDING_MODEL = "BAAI/bge-m3";

import { mdxComponents } from "../../../mdx-components";
import { cp } from "fs";
import pAll from "p-all";

// const albertApi = ({
//   path,
//   method = "POST",
//   body,
// }: {
//   path: string;
//   method?: "POST" | "GET";
//   body?: string;
// }) =>
//   fetch(`${API_URL}/v1${path}`, {
//     method,
//     headers: {
//       // Authorization: `Bearer ${ALBERT_API_KEY}`,
//       "Content-Type": "application/json",
//     },
//     body,
//   }).then((r) => r.json());

// type AlbertCollection = {
//   id: string;
//   name: string;
//   type: "public" | "private";
//   model: "string"; // "BAAI/bge-m3";
//   user: string;
//   description: string;
//   created_at: number;
//   documents: null | number;
// };

// const useAlbertCollections = () => {
//   const [collections, setCollections] = useState<AlbertCollection[]>([]);
//   const loadCollections = async () => {
//     const collections = await albertApi({
//       path: "/collections",
//       method: "GET",
//     });
//     return collections;
//   };
//   useEffect(() => {
//     loadCollections().then((res) => {
//       setCollections(res.data);
//     });
//   }, []);
//   return [collections];
// };

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

export function Chat({
  messages,
  handleSubmit,
  handleInputChange,
  input,
  isLoading,
  hintText,
}) {
  return (
    <div style={{ width: "100%", marginBottom: 40 }}>
      <div style={{ height: "100%", minHeight: 300 }}>
        {messages.map((m) => (
          <div key={m.id} className={fr.cx("fr-mb-2w")}>
            {m.role === "user" ? (
              <i className={fr.cx("fr-icon--md", "ri-user-fill", "fr-mr-1w")} />
            ) : (
              <i
                className={fr.cx("fr-icon--md", "ri-robot-2-fill", "fr-mr-1w")}
              />
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
        {isLoading && <div className={fr.cx("fr-mb-2w")}>...</div>}
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          //className={fr.cx("fr-input-group")} //fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          style={{ width: "100%" }}
          hintText={hintText}
          label=""
          nativeInputProps={{
            value: input,
            placeholder: "Posez une question à Albert",
            onChange: handleInputChange,
          }}
        />
        <br />
      </form>
    </div>
  );
}

const CollectionPage: NextPage<{ collectionId: string }> = ({
  collectionId,
}) => {
  const { query } = useRouter();

  // store message overrides to update messages status
  const [messagesOverrides, setMessagesOverrides] = useState<
    Record<string, any>
  >({});

  const { collections, reloadCollections } = useAlbertCollections();
  const collection = collections.find((c) => c.id === collectionId);

  //console.log("collection", collection);

  const overrideMessage = (id: string, data: any) => {
    setMessagesOverrides((o) => ({
      ...o,
      [id]: data,
    }));
  };
  console.log("router", query, collectionId);
  const uuid = query.id;
  const onDrop = async (acceptedFiles: File[]) => {
    console.log("onDrop", acceptedFiles, uuid);

    // let collectionId = await createCollection({
    //   name: uuid,
    // });
    // if (!collectionId) collectionId = uuid;

    console.log("collectionId", collectionId);

    await pAll(
      acceptedFiles.map((file) => async () => {
        const uploadId = "upload-" + Math.random();
        setMessages((messages) => [
          ...messages,
          {
            role: "assistant",
            id: uploadId,
            content: `Je traite le fichier : ${file.name}... ⏳`,
          },
        ]);
        const uploaded = await addFileToCollection({
          file,
          fileName: file.name,
          collectionId,
        });
        console.log("uploaded", uploaded);

        if (uploaded.detail) {
          overrideMessage(uploadId, {
            content: `Souci avec le fichier : ${file.name}: ${uploaded.detail} ❌`,
          });
        } else {
          overrideMessage(uploadId, {
            content: `J'ai traité le fichier : ${file.name}... ✅`,
          });
        }
      })
    );
    reloadCollections();
  };

  const myHandleSubmit = async (event) => {
    event.preventDefault();
    console.log("myHandleSubmit", event, input);
    // get relevant RAG informations
    const searchResults = await getSearch({
      collections: [collectionId],
      query: input,
    });
    console.log("searchResults", searchResults);

    const prompt = getPromptWithRagResults({ input, results: searchResults });

    console.log("prompt", prompt);

    const ragId = "rag-" + Math.random();

    // we need to override the displayed message so the user dont see the real prompt
    overrideMessage(ragId, {
      content: input,
    });

    setTimeout(() => {
      // TODO: hack to prevent non overriden message to show up
      append({
        id: ragId,
        role: "user",
        content: prompt,
      });
      setInput("");
    });
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    setInput,
    isLoading,
    append,
  } = useChat({
    api: `${API_URL}/v1/chat/completions`,
    headers: {
      Authorization: `Bearer ${ALBERT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: {
      model: LANGUAGE_MODEL,
    },
    initialMessages: [
      {
        role: "assistant",
        id: "initial",
        content:
          "Déposez des fichiers PDF, Markdown, HTML ou JSON et j'essaierai de répondre à vos questions.",
      },
    ],
    onResponse: async (message) => {
      console.log("onResponse", message);
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
  console.log({
    fixed: messages.map((m) => ({
      ...m,
      ...(messagesOverrides[m.id]?.data || {}),
    })),
    messages,
    messagesOverrides,
  });
  return (
    <div className="fr-container">
      <MyDropzone onDrop={onDrop}>
        <div className={fr.cx("fr-grid-row")}>
          <Chat
            isLoading={isLoading}
            messages={messages.map((m) => ({
              ...m,
              ...(messagesOverrides[m.id] || {}),
            }))}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={myHandleSubmit}
            hintText={
              collection &&
              `Albert cherchera parmi les ${collection.documents} documents de votre collection "${collection.name}"`
            }
          />
        </div>
      </MyDropzone>
    </div>
  );
};

export const getServerSideProps = (async (req) => {
  // Fetch data from external API
  //const res = await fetch('https://api.github.com/repos/vercel/next.js')
  //const repo: Repo = await res.json()
  // Pass data to the page via props

  return {
    props: {
      collectionId: Array.isArray(req.query.id)
        ? req.query.id[0]
        : req.query.id || "random",
    },
  };
}) satisfies GetServerSideProps<{ collectionId: string }>;

export default function Page({
  collectionId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <CollectionPage collectionId={collectionId} />;
}
