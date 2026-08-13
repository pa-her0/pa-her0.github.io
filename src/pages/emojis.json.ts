import type { APIRoute } from "astro"
import emojisConfig from "@/data/emojis.json"

export const prerender = true

export const GET: APIRoute = () =>
  new Response(JSON.stringify(emojisConfig), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
