import Image from "next/image";
import Filters from "./filters";
import SearchForm from "./search-form";
import Sidebar from "./sidebar";
import ProgressOverlay from "./progress-overlay";
import Listing from "./listing";
import ArtistGroup from "./artist-group";
import search from "@/services/search";

export default function DiscogSearch() {

  const onSearch = (slug: string, noCache: boolean) => {
    console.log(slug, noCache);
    search(slug, noCache).then(results => {
      console.log(results);
    })
  }

  return <div style={{padding: 10}}>
    <SearchForm onSearch={onSearch} />
    <div id="container">
      <div id="results" style={{position: 'relative'}}>
        <h1>Results</h1>
        <h2>Prices originally in GBP</h2>
        <div>
          <div style={{position: 'sticky'}}>
            <Filters />
          </div>
          <ArtistGroup />
        </div>
      </div>
      <Sidebar />
      <ProgressOverlay />
    </div>
  </div>;
}