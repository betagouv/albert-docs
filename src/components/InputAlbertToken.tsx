"use client";

import { useSessionStorage } from "usehooks-ts";

import { fr } from "@codegouvfr/react-dsfr";

import { albertApi } from "../lib/albert";
import { Input, InputProps } from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";
import { useRef, useState } from "react";

export const InputAlbertToken = () => {
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useSessionStorage("albert-api-key", "");
  const [status, setStatus] = useState<InputProps["state"]>("default");
  const messages = {
    error: "Le token semble invalide",
    success: "Le token est valide",
    info: "",
    default: "",
  };
  return value ? null : (
    <div className={fr.cx("fr-col-12")}>
      <h3>Token Albert invalide</h3>
      <Input
        label="Saisissez votre token Albert pour continuer"
        ref={input}
        nativeInputProps={{ type: "password" }}
        state={status}
        stateRelatedMessage={status && messages[status]}
        addon={
          <Button
            onClick={async () => {
              // const value = input.current?.value || "";
              const value = input?.current?.querySelector("input")?.value || "";
              console.log("try setAlbertApiKey", value);
              setStatus("default");
              const res = await albertApi({
                path: "/models",
                method: "GET",
                token: value,
              })
                .then((r) => {
                  setStatus("success");
                  setTimeout(() => {
                    console.log("setAlbertApiKey", value);
                    setValue(value);
                  }, 1000);
                })
                .catch((e) => {
                  console.log("error", e);
                  setStatus("error");
                });
              console.log(res);
              // setAlbertApiKey(value);
            }}
          >
            Valider
          </Button>
        }
      />
    </div>
  );
};
