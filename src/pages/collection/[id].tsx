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

const ALBERT_API_KEY = process.env.ALBERT_API_KEY;
const API_URL = "/api/albert"; //https://albert.api.etalab.gouv.fr";
const LANGUAGE_MODEL = "AgentPublic/llama3-instruct-8b"; // see https://albert.api.etalab.gouv.fr/v1/models
const EMBEDDING_MODEL = "BAAI/bge-m3";

import { mdxComponents } from "../../../mdx-components";
import { cp } from "fs";

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

export function Chat({ messages, handleSubmit, handleInputChange, input }) {
  return (
    <div style={{ width: "100%", marginBottom: 30 }}>
      <div style={{ height: "100%", minHeight: 300 }}>
        {messages.map((m) => (
          <div key={m.id} className={fr.cx("fr-mb-2w")}>
            {m.role === "user" ? (
              <>
                <i
                  className={fr.cx("fr-icon--md", "ri-user-fill", "fr-mr-1w")}
                />
              </>
            ) : (
              <>
                <i
                  className={fr.cx(
                    "fr-icon--md",
                    "ri-robot-2-fill",
                    "fr-mr-1w"
                  )}
                />
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

const createCollection = ({ name, model = EMBEDDING_MODEL }) =>
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

const addFileToCollection = async ({ file, fileName, collectionId }) => {
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
    console.log(r);
    return r.text();
  });
};

const getSearch = ({
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

const CollectionPage: NextPage<{ collectionId: string }> = ({
  collectionId,
}) => {
  const { query } = useRouter();
  //const [collections] = useAlbertCollections();
  //const [currentCollectionId, setCurrentCollectionId] = useQueryState("name");
  //console.log("Page", collections);
  console.log("router", query, collectionId);
  const uuid = query.id;
  const onDrop = async (acceptedFiles: File[]) => {
    console.log("onDrop", acceptedFiles, uuid);

    // let collectionId = await createCollection({
    //   name: uuid,
    // });
    // if (!collectionId) collectionId = uuid;

    console.log("collectionId", collectionId);

    setMessages((messages) => [
      ...messages,
      {
        role: "assistant",
        id: "upload-" + Math.random(),
        content: `Je traite les fichiers : ${acceptedFiles.map(
          (f) => f.name
        )}...`,
      },
    ]);

    //addFileToCollection
    acceptedFiles.forEach(async (file) => {
      await addFileToCollection({ file, fileName: file.name, collectionId });
    });

    setMessages((messages) => [
      ...messages,
      {
        role: "assistant",
        id: "upload-" + Math.random(),
        content: `C'est tout bon, je suis prêt :)`,
      },
    ]);
  };

  const myHandleSubmit = async (event) => {
    console.log("myHandleSubmit", event, input);
    //getSearch;
    // get relevant RAG informations
    const data = undefined;
    const searchResults = await getSearch({
      collections: [collectionId],
      query: input,
    });
    console.log("searchResults", searchResults);
    handleSubmit(event);
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
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
    <>
      <div className="fr-container">
        <MyDropzone onDrop={onDrop}>
          <div className={fr.cx("fr-grid-row")}>
            <Chat
              messages={messages}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={myHandleSubmit}
            />
          </div>
        </MyDropzone>
      </div>
    </>
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
