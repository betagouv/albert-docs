import { useEffect, useState } from "react";
import type { AlbertCollection } from "albert-ts";
import { albertApi } from "albert-ts";

export const useAlbertCollections = (albertToken: string) => {
  const [collections, setCollections] = useState<AlbertCollection[]>([]);

  const reloadCollections = async () => {
    if (!albertToken) {
      return;
    }
    const collections = await albertApi({
      path: "/collections",
      method: "GET",
      token: albertToken,
    });
    setCollections(collections.data || []);
  };

  useEffect(() => {
    if (!collections.length) {
      reloadCollections();
    }
  }, [reloadCollections, albertToken]);

  return { collections, reloadCollections };
};
