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

const Home: NextPage = () => {
  const onClick1 = () => {
    throw new Error("Hello, sentry");
  };

  return (
    <>
      <Head>
        <title>Albert docs | beta.gouv.fr</title>
      </Head>

      <div className={fr.cx("fr-grid-row", "fr-grid-row--center")}>
        <div className={fr.cx()}>
          <h1>albert-docs</h1>
          Intérroger rapidement des documents avec Albert
        </div>
      </div>
    </>
  );
};

export default Home;
