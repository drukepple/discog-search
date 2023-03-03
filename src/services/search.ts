export default function search(slug: string, noCache: boolean) {
  return fetch('/api/hello').then(r => r.json()).catch(e => console.error(e));
}