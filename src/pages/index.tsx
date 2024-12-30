"use client";

import * as React from "react";
import { NextPage } from "next";
import { useSessionStorage } from "usehooks-ts";

import { fr } from "@codegouvfr/react-dsfr";
import { Card } from "@codegouvfr/react-dsfr/Card";

import {
  useAlbertCollections,
  createCollection,
  AlbertCollection,
} from "../lib/albert";
import { useRouter } from "next/router";

import { InputAlbertToken } from "../components/InputAlbertToken";

const CollectionCard = ({ collection }: { collection: AlbertCollection }) => (
  <Card
    enlargeLink
    className={fr.cx("fr-col-4")}
    background
    desc={
      <>
        {collection.documents
          ? `${collection.documents} documents`
          : "Aucun document"}
        <span className={fr.cx("fr-hint-text")}>{collection.description}</span>
      </>
    }
    linkProps={{
      href: `/collection?id=${collection.id}`,
    }}
    size="small"
    title={collection.name}
    titleAs="h3"
  />
);

const Home: NextPage = () => {
  const [albertApiKey] = useSessionStorage("albert-api-key", "");
  const router = useRouter();
  const { collections = [] } = useAlbertCollections(albertApiKey);

  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <div>
          <h1>albert-docs</h1>
          Intérroger rapidement des documents avec Albert
        </div>
      </div>
      <div className={fr.cx("fr-grid-row", "fr-mt-3w", "fr-grid-row--gutters")}>
        <InputAlbertToken />
        {albertApiKey && (
          <>
            <Card
              enlargeLink
              className={fr.cx("fr-col-4")}
              background
              desc={`Ajouter des fichiers et les intérroger`}
              linkProps={{
                href: `#not`,
                onClick: async () => {
                  const name = prompt("Nom de la collection à créer ?");
                  if (name) {
                    const collectionId = await createCollection({
                      name,
                      token: albertApiKey,
                    });
                    router.push(`/collection?id=${collectionId}`);
                  }
                },
              }}
              size="small"
              title={"Nouveau"}
              titleAs="h3"
            />
            {collections
              .filter((coll) => coll.type === "private")
              .map((coll) => (
                <CollectionCard collection={coll} key={coll.id} />
              ))}
          </>
        )}
      </div>
    </>
  );
};

export default Home;
