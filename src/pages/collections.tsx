import React, { useCallback, useState } from "react";
import type { NextPage } from "next";
import { fr } from "@codegouvfr/react-dsfr";
import { useChat } from "ai/react";
import pAll from "p-all";

import {
  useAlbertCollections,
  getSearch,
  addFileToCollection,
  getPromptWithRagResults,
  API_URL,
  LANGUAGE_MODEL,
} from "../lib/albert";

import { useQueryState } from "nuqs";
import { useSessionStorage } from "usehooks-ts";
import { InputAlbertToken } from "../components/InputAlbertToken";
import { DropZone } from "../components/Chat/DropZone";
import { Chat } from "../components/Chat/Chat";

const sum = (arr: number[]) => arr.reduce((a, c) => a + c, 0);

const CollectionsPage: NextPage<{ collections: string[] }> = ({
  collections,
}) => {
  // store message overrides to update messages status
  const [messagesOverrides, setMessagesOverrides] = useState<
    Record<string, any>
  >({});
  const [albertApiKey] = useSessionStorage("albert-api-key", "");
  const { collections: albertCollections, reloadCollections } =
    useAlbertCollections(albertApiKey);

  const selectedCollections = albertCollections.filter((c) =>
    collections.includes(c.id)
  );

  const canDrop = selectedCollections.length === 1;

  const overrideMessage = (id: string, data: any) => {
    setMessagesOverrides((o) => ({
      ...o,
      [id]: data,
    }));
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!canDrop) return;
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
            collectionId: collections[0],
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
    },
    [canDrop]
  );

  const myHandleSubmit = async (event: any) => {
    event.preventDefault();
    // get relevant RAG informations
    const searchResults = await getSearch({
      collections: collections,
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

  let initialContent =
    (selectedCollections &&
      selectedCollections.length &&
      `Bonjour! je dispose de  ${sum(
        selectedCollections.map((c) => c.documents || 0)
      )} documents pour tenter de répondre à vos questions (${selectedCollections
        .map((s) => s.name)
        .join(", ")})`) ||
    "Déposez des fichiers PDF, Markdown, HTML ou JSON et j'essaierai de répondre à vos questions.";

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
        content: initialContent,
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
        <DropZone onDrop={onDrop} canDrop={canDrop}>
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
            />
          </div>
        </DropZone>
      )}
    </div>
  );
};

export default function Page() {
  const [collections, setCollections] = useQueryState("id", {
    defaultValue: "",
  });
  return (
    <CollectionsPage collections={collections.split(",").filter(Boolean)} />
  );
}
