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
  const albertJson = await fetch(
    `${API_URL}/${
      data.query.path &&
      Array.isArray(data.query.path) &&
      data.query.path.join("/")
    }`,
    {
      method: req.method,
      headers: {
        Authorization: `Bearer ${ALBERT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: (req.method === "POST" && JSON.stringify(req.body)) || undefined,
    }
  ).then((r) => {
    console.log(r);
    return r.json();
  });

  res.status(200).json(albertJson);
  // .then((data) => {
  //   res.status(200).json({ message: "Hello from Next.js!", ...data });
  // });
}
//
