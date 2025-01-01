import React, {
  ReactChildren,
  ReactElement,
  ReactNode,
  useCallback,
  useState,
} from "react";

import { useDropzone } from "react-dropzone";
import { fr } from "@codegouvfr/react-dsfr";

export function DropZone({
  children,
  onDrop,
  canDrop = true,
}: {
  children: ReactNode;
  onDrop: (arg: File[]) => void;
  canDrop?: boolean;
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
    border:
      canDrop && isDragActive ? "2px dotted var(--grey-425-625) " : "none",
    backgroundColor:
      canDrop && isDragActive
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
