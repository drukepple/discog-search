import { SearchResults } from "@/pages/api/search";

export default function search(slug: string, noCache: boolean):Promise<SearchResults> {
  const params = new URLSearchParams();
  params.append('seller', slug);
  params.append('no_cache', noCache.toString());
  console.log(params.toString());
  return fetch('/api/search?' + params.toString())
    .then(r => r.json())
    .catch(e => console.error(e));
}