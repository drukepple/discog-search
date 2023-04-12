import { useRouter } from "next/router";
import { FormEvent } from "react";
import { useSearchState } from "../state/use-search-state";

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
  const router = useRouter();
  const {sellerSlug, setSellerSlug, noCache, setNoCache} = useSearchState();

  const handleSubmit = (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push('/?seller=' + sellerSlug, undefined, {shallow: true});
  }

  return <form style={styles.form} onSubmit={handleSubmit}>
    <label>Enter the seller slug:
      <input id="socket-id" name="socket_id" type="hidden" />
      <input type="text" id="seller-slug-input" value={sellerSlug ?? ''} onChange={(e) => setSellerSlug(e.target.value)}  />
    </label>
    <label>
      <input type="checkbox" name="no_cache" checked={noCache} onChange={e => setNoCache(e.target.checked)} />
      No cache
    </label>
    <button type="submit">Search</button>
  </form>
}