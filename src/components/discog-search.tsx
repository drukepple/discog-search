import Image from "next/image";
import { useRouter } from "next/router";
import styles from '@/styles/DiscogSearch.module.css'
import Filters from "./filters";
import SearchForm from "./search-form";
import { useSearchState } from "../state/use-search-state";
import Sidebar from "./sidebar";
import ProgressOverlay from "./progress-overlay";
import ArtistGroup from "./artist-group";
import search from "@/services/search";
import { useRecoilState, useRecoilValue } from "recoil";
import { ArtistDisplayState, DisplayState, ListingDisplayState, displayStateAtom, listingsAtom, sidebarAtom } from "@/state/listings";
import { defaultFiltersDisplayState, defaultArtistDisplayState } from '@/state/listings';
import { useEffect } from "react";
import Head from "next/head";

const defaultListingState: ListingDisplayState = {
  open: true,
}

export default function DiscogSearch() {

  const [listings, setListings] = useRecoilState(listingsAtom);
  const sidebarState = useRecoilValue(sidebarAtom);
  const router = useRouter();
  const {sellerSlug} = useSearchState();
  const [displayState, setDisplayState] = useRecoilState(displayStateAtom(sellerSlug as string));

  useEffect(() => {
    const sellerSlug = router.query.seller as string;
    const noCache = router.query.noCache === 'true';
    if (sellerSlug) {
      search(sellerSlug, noCache).then(results => {
        setListings(results);
        let flatListings:Listing[] = [];
        // Create a new display state for this seller.
        // For each item, if it already exists in the atom (which is backed
        // by local storage), use that; if it's new, then use the default.
        const storedSellerDisplayState = displayState || {};
        const newSellerDisplayState: DisplayState = {
          artists: Object.keys(results.artists).reduce((acc:Record<string, ArtistDisplayState>, artist) => {
            acc[artist] = storedSellerDisplayState.artists?.[artist] || defaultArtistDisplayState;
            flatListings = flatListings.concat(results.artists[artist]);
            return acc;
          }, {}),
          listings: flatListings.reduce((acc:Record<string, ListingDisplayState>, listing) => {
            acc[listing.id] = defaultListingState;
            return acc;
          }, {}),
          filters: defaultFiltersDisplayState,
        }
        setDisplayState({
          ...displayState,
          [sellerSlug]: newSellerDisplayState,
        });
      })
    }
  }, [router.query]);

  return <div style={{padding: 10}} className={
      styles.main + (sidebarState.open ? ' ' + styles.sidebarOpen : '')
    }>
      <Head>
        <title>{sellerSlug && `${sellerSlug} | `}Discogs Search</title>
      </Head>
    <SearchForm />
    <div id="container">
      RoyalRecordsSeattle<br/>WEBUYRECORDSUSA<br/>{router.query.sellerSlug}<br/>{router.query.noCache}
      <div>Seller: {sellerSlug}</div>
      <div id="results" style={{position: 'relative'}}>
        <h1>Results</h1>
        <h2>Prices originally in GBP</h2>
        <div>
          <div style={{position: 'sticky'}}>
            <Filters />
          </div>
          {listings.listings.map(l => <ArtistGroup key={l.artist} artist={l.artist} />)}
        </div>
      </div>
      <Sidebar />
      <ProgressOverlay />
    </div>
  </div>;
}