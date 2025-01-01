import { ReactNode, useEffect } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { NuqsAdapter } from "nuqs/adapters/next/pages";

import { createEmotionSsrAdvancedApproach } from "tss-react/next";
import { createNextDsfrIntegrationApi } from "@codegouvfr/react-dsfr/next-pagesdir";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { fr } from "@codegouvfr/react-dsfr";
import { Header } from "@codegouvfr/react-dsfr/Header";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks";
import { MuiDsfrThemeProvider } from "@codegouvfr/react-dsfr/mui";

import { init } from "@socialgouv/matomo-next";

import pkg from "../../package.json";

import "./styles.css";
import { useSessionStorage } from "usehooks-ts";
import Button from "@codegouvfr/react-dsfr/Button";

declare module "@codegouvfr/react-dsfr/next-pagesdir" {
  interface RegisterLink {
    Link: typeof Link;
  }
}

declare module "@codegouvfr/react-dsfr" {
  interface RegisterLink {
    Link: typeof Link;
  }
}

const { withDsfr, dsfrDocumentApi } = createNextDsfrIntegrationApi({
  defaultColorScheme: "system",
  Link,
  useLang: () => {
    const { locale = "fr" } = useRouter();
    return locale;
  },

  //doPersistDarkModePreferenceWithCookie: true,
  //Link,
  preloadFonts: [
    //"Marianne-Light",
    //"Marianne-Light_Italic",
    "Marianne-Regular",
    //"Marianne-Regular_Italic",
    "Marianne-Medium",
    //"Marianne-Medium_Italic",
    "Marianne-Bold",
    //"Marianne-Bold_Italic",
    //"Spectral-Regular",
    //"Spectral-ExtraBold"
  ],
});

export { dsfrDocumentApi };

const { withAppEmotionCache, augmentDocumentWithEmotionCache } =
  createEmotionSsrAdvancedApproach({
    key: "css",
  });

export { augmentDocumentWithEmotionCache };

const brandTop = (
  <>
    République
    <br />
    Française
  </>
);

const homeLinkPops = {
  href: "/",
  title:
    "Accueil - Nom de l’entité (ministère, secrétariat d'état, gouvernement)",
};

const bottomLinks = [
  {
    text: "Contribuer sur GitHub",
    linkProps: {
      href: `${process.env.NEXT_PUBLIC_APP_REPOSITORY_URL}${
        process.env.NEXT_PUBLIC_APP_VERSION
          ? `/releases/tag/v${process.env.NEXT_PUBLIC_APP_VERSION}`
          : process.env.NEXT_PUBLIC_APP_VERSION_COMMIT
          ? `/commit/${process.env.NEXT_PUBLIC_APP_VERSION}`
          : ""
      }`,
    },
  },
];

const Layout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [albertApiKey, setAlbertApiKey, deleteAlbertApiKey] = useSessionStorage(
    "albert-api-key",
    ""
  );

  const logout =
    (albertApiKey && (
      <Button
        onClick={(e) => {
          e.preventDefault();
          deleteAlbertApiKey();
        }}
        iconId="ri-login-box-line"
      >
        Se déconnecter
      </Button>
    )) ||
    null;
  const contentSecurityPolicy = process.env.CONTENT_SECURITY_POLICY;
  return (
    <MuiDsfrThemeProvider>
      <Head>
        <title>Albert-docs demo | beta.gouv.fr</title>
        {contentSecurityPolicy && (
          <meta
            httpEquiv="Content-Security-Policy"
            content={contentSecurityPolicy}
          ></meta>
        )}
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Albert docs demo" />
      </Head>
      <SkipLinks
        links={[
          {
            anchor: "#fr-header-main-navigation",
            label: "Menu",
          },
          {
            anchor: "#content",
            label: "Contenu",
          },
          {
            anchor: "#fr-footer",
            label: "Pied de page",
          },
        ]}
      />
      <Header
        brandTop={brandTop}
        serviceTitle="Albert-docs demo"
        serviceTagline="Interroger des documents avec l'IA Albert"
        homeLinkProps={homeLinkPops}
        navigation={[
          {
            text: "Accueil",
            linkProps: {
              href: "/",
            },
            isActive: router.asPath === "/",
          },
          {
            text: "A propos",
            linkProps: {
              href: "/a-propos",
            },
            isActive: router.asPath === "/a-propos",
          },
        ]}
        quickAccessItems={[logout, headerFooterDisplayItem]}
      />
      <div
        className={fr.cx("fr-container", "fr-container--fluid", "fr-p-5w")}
        id="content"
      >
        {children}
      </div>
      <Footer
        brandTop={brandTop}
        accessibility="non compliant"
        homeLinkProps={homeLinkPops}
        license={`Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce site sont proposés sous licence ${pkg.license}`}
        bottomItems={[...bottomLinks, headerFooterDisplayItem]}
      />
    </MuiDsfrThemeProvider>
  );
};

function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    init({
      url: process.env.NEXT_PUBLIC_MATOMO_URL ?? "",
      siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID ?? "",
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Layout>
        <NuqsAdapter>
          <Component {...pageProps} />
        </NuqsAdapter>
      </Layout>
    </div>
  );
}

export default withDsfr(withAppEmotionCache(App));
