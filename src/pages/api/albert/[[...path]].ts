import type { NextApiRequest, NextApiResponse } from "next";

import { ALBERT_API_KEY } from "../../../lib/albert";

const API_URL = "https://albert.api.etalab.gouv.fr"; // this is the real API endpoint

type ResponseData = {
  message: string;
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

// this proxies requests to albert API
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

  const albertApiResponse = await fetch(
    `${API_URL}/${
      data.query.path &&
      Array.isArray(data.query.path) &&
      data.query.path.join("/")
    }`,
    fetchOptions
  ).catch((e) => {
    console.log("e", e);
    res.status(500).write(e.message);
  });

  // allow streaming
  const reader =
    albertApiResponse &&
    albertApiResponse.body &&
    albertApiResponse.body.getReader();

  while (reader && true) {
    const result = await reader.read();
    if (result.done) {
      res.end();
      return;
    }
    res.write(result.value);
  }
}
