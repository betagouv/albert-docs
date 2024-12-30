import React, {
  ReactChildren,
  ReactElement,
  ReactNode,
  useCallback,
  useState,
} from "react";
import type {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSideProps,
} from "next";
import { useRouter } from "next/router";
import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useChat, UseChatHelpers } from "ai/react";
import { useDropzone } from "react-dropzone";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import pAll from "p-all";

import {
  useAlbertCollections,
  getSearch,
  addFileToCollection,
  getPromptWithRagResults,
  ALBERT_API_KEY,
  API_URL,
  LANGUAGE_MODEL,
} from "../lib/albert";

import { mdxComponents } from "../../mdx-components";
import { useQueryState } from "nuqs";
import { useSessionStorage } from "usehooks-ts";
import { InputAlbertToken } from "../components/InputAlbertToken";

function MyDropzone({
  children,
  onDrop,
}: {
  children: ReactNode;
  onDrop: (arg: File[]) => void;
}) {
  const onDropFiles = useCallback(
    (acceptedFiles: File[]) => {
      // Do something with the files
      onDrop(acceptedFiles);
    },
    [onDrop]
  );
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
}: {
  messages: UseChatHelpers["messages"];
  handleSubmit: UseChatHelpers["handleSubmit"];
  handleInputChange: UseChatHelpers["handleInputChange"];
  input: UseChatHelpers["input"];
  isLoading: UseChatHelpers["isLoading"];
  hintText?: string;
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
              // @ts-ignore TODO
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
  const [albertApiKey] = useSessionStorage("albert-api-key", "");
  const { collections, reloadCollections } = useAlbertCollections(albertApiKey);
  const collection = collections.find((c) => c.id === collectionId);

  const overrideMessage = (id: string, data: any) => {
    setMessagesOverrides((o) => ({
      ...o,
      [id]: data,
    }));
  };
  const onDrop = async (acceptedFiles: File[]) => {
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
          token: albertApiKey,
          file,
          fileName: file.name,
          collectionId,
        });

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

  const myHandleSubmit = async (event: any) => {
    event.preventDefault();
    // get relevant RAG informations
    const searchResults = await getSearch({
      collections: [collectionId],
      query: input,
      token: albertApiKey,
    });

    const prompt = getPromptWithRagResults({ input, results: searchResults });

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
      Authorization: `Bearer ${albertApiKey}`,
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
    <div className="fr-container">
      <InputAlbertToken />
      {albertApiKey && (
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
      )}
    </div>
  );
};

// export const getServerSideProps = (async (req) => {
//   return {
//     props: {
//       collectionId: Array.isArray(req.query.id)
//         ? req.query.id[0]
//         : req.query.id || "random",
//     },
//   };
// }) satisfies GetServerSideProps<{ collectionId: string }>;

export default function Page() {
  const [collectionId, setCollectionId] = useQueryState("id", {
    defaultValue: "",
  });
  return <CollectionPage collectionId={collectionId} />;
}
