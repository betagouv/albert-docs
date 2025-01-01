import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { UseChatHelpers } from "ai/react";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { mdxComponents } from "../../../mdx-components";

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
