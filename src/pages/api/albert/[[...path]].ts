import { Readable } from "stream";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  message: string;
};

const ALBERT_API_KEY = process.env.ALBERT_API_KEY;
const API_URL = "https://albert.api.etalab.gouv.fr";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const data = {
    path: req.url,
    query: req.query,
    method: req.method,
    headers: req.headers,
    body: req.body,
  };
  // console.log(data);
  // console.log(
  //   `${API_URL}/${
  //     data.query.path &&
  //     Array.isArray(data.query.path) &&
  //     data.query.path.join("/")
  //   }`
  //);

  console.log("io");

  const fetchOptions = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${ALBERT_API_KEY}`,
    } as Record<string, string>,
    body: (req.method === "POST" && req.body) || undefined,
  };
  if (req.headers["content-type"]) {
    fetchOptions.headers["Content-Type"] = req.headers["content-type"];
  }
  const body =
    req.method === "GET"
      ? undefined
      : fetchOptions.headers["Content-Type"] === "application/json"
      ? JSON.stringify(req.body)
      : req.body;
  fetchOptions.body = body;
  // const formData = new FormData();
  // formData.append("file", req.bod, fileName);
  // formData.append("request", JSON.stringify({ collection: collectionId }));
  console.log("fetchOptions", fetchOptions);

  const albertApi = await fetch(
    `${API_URL}/${
      data.query.path &&
      Array.isArray(data.query.path) &&
      data.query.path.join("/")
    }`,
    fetchOptions
  );

  // const resBlob = await response.blob();
  // const resBufferArray = await resBlob.arrayBuffer();
  // const resBuffer = Buffer.from(resBufferArray);

  // const fileType = await fileTypeFromBuffer(resBuffer);
  // res.setHeader("Content-Type", fileType?.mime ?? "application/octet-stream");
  // res.setHeader("Content-Length", resBuffer.length);
  // res.write(resBuffer, "binary");
  // res.end();

  // omitting handler code for readability

  const reader = albertApi.body && albertApi.body.getReader();
  while (reader && true) {
    const result = await reader.read();
    if (result.done) {
      res.end();
      return;
    }
    res.write(result.value);
  }
  ///const readableStream = albertApi.body as unknown as NodeJS.ReadableStream;
  //readableStream.pipe(res);
  // const body = await albertApi.text();
  // console.log("body", body);
  // res
  //   .status(200)
  //   //.setHeader("content-type", albertApi.headers["content-type"])
  //   .send(body);

  // if (albertApi.body) {
  //   Readable.fromWeb(albertApi.body).pipe(res);
  // }

  //albertApi.body?.pipeTo(res);
  //res.status(200).pipe(albertApi);
  //.json(await albertApi.json());
  // .then((data) => {
  //   res.status(200).json({ message: "Hello from Next.js!", ...data });
  // });
}
//
