import { FormEventHandler, useState } from "react";

const styles = {
  form: {
    display: 'flex',
    alignItems: 'center',
  }
}
type SearchFormProps = {
  onSearch: (slug: string, noCache: boolean) => void;
}
export default function SearchForm({onSearch}:SearchFormProps) {
  const [sellerSlug, setSellerSlug] = useState('');
  const [noCache, setNoCache] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    onSearch(sellerSlug, noCache)
  }

  return <form style={styles.form} onSubmit={handleSubmit}>
    <label>Enter the seller slug:
      <input id="socket-id" name="socket_id" type="hidden" />
    </label>
    <input type="text" id="seller-slug-input" value={sellerSlug} onChange={(e) => setSellerSlug(e.target.value)}  />
    <label>
      <input type="checkbox" name="no_cache" checked={noCache} onChange={e => setNoCache(e.target.checked)} />
      No cache
    </label>
    <button type="submit">Search</button>
  </form>
}