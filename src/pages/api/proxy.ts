import getRequest from "@/api/request";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=============================')
  console.log(req.query);
  const page = await getRequest(req.query.src);
  res.status(200).send(page);
  console.log('=============================')
}
