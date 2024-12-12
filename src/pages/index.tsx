import * as React from "react";
import { NextPage } from "next";

import { fr } from "@codegouvfr/react-dsfr";
import Card from "@codegouvfr/react-dsfr/Card";

import { useAlbertCollections, createCollection } from "../lib/albert";
import { useRouter } from "next/router";

const Home: NextPage = () => {
  const router = useRouter();
  const { collections } = useAlbertCollections();

  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <div>
          <h1>albert-docs</h1>
          Intérroger rapidement des documents avec Albert
        </div>
      </div>
      <div className={fr.cx("fr-grid-row", "fr-mt-3w", "fr-grid-row--gutters")}>
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
                const collectionId = await createCollection({ name });
                router.push(`/collection/${collectionId}`);
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
            <Card
              enlargeLink
              key={coll.id}
              className={fr.cx("fr-col-4")}
              background
              desc={
                <>
                  {coll.documents
                    ? `${coll.documents} documents`
                    : "Aucun document"}
                  <span className={fr.cx("fr-hint-text")}>
                    {coll.description}
                  </span>
                </>
              }
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
