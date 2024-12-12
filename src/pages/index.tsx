import * as React from "react";
import Head from "next/head";
import { NextPage } from "next";
import Stack from "@mui/material/Stack";
import Link from "next/link";

import { push as matomoPush } from "@socialgouv/matomo-next";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr";
import { useEffect, useState } from "react";
import Card from "@codegouvfr/react-dsfr/Card";

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

const Home: NextPage = () => {
  const onClick1 = () => {
    throw new Error("Hello, sentry");
  };
  const [collections] = useAlbertCollections();

  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx()}>
          <h1>albert-docs</h1>
          Intérroger rapidement des documents avec Albert
        </div>
      </div>
      <div className={fr.cx("fr-grid-row", "fr-mt-3w", "fr-grid-row--gutters")}>
        <Card
          enlargeLink
          className={fr.cx("fr-col-4")}
          background
          border
          desc={`Ajouter des fichiers et les intérroger`}
          linkProps={{
            href: `#`,
            onClick: () => {
              const name = prompt("Nom de la collection à créer ?");
              if (name) {
                // create collection
              }
            },
          }}
          size="small"
          title={"Nouveau"}
          titleAs="h3"
        />
        {collections.map((coll) => (
          <Card
            enlargeLink
            key={coll.id}
            className={fr.cx("fr-col-4")}
            background
            border
            desc={`${
              coll.documents ? `${coll.documents} documents` : "Aucun document"
            }`}
            linkProps={{
              href: `/collection/${coll.id}`,
            }}
            size="small"
            title={coll.name}
            titleAs="h3"
          />
        ))}
      </div>
    </>
  );
};

export default Home;
