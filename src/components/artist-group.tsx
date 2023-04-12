import { useRecoilState, useRecoilValue } from "recoil";
import Filters from "./filters";
import Listing from "./listing";
import { artistDisplayStateSelector, listingsAtom } from "@/state/listings";
import styles from '@/styles/ArtistGroup.module.css';
import { MouseEvent, useState } from "react";
import { useSearchState } from "@/state/use-search-state";

// const conditionsMap:Record<string, ConditionFilterKeys> = {
//   'Mint (M)': 'mint',
//   'Near Mint (NM)': 'nearMint',
//   'Very Good Plus (VG+)': 'veryGoodPlus',
//   'Very Good (VG)': 'veryGood',
//   'Good Plus (G+)': 'goodPlus',
//   'Good (G)': 'good',
//   'Fair (F)': 'fair',
// }

export default function ArtistGroup({artist}:{artist:string}) {

  const artistListings = useRecoilValue(listingsAtom);
  const {sellerSlug:seller} = useSearchState();
  const [artistDisplay, setArtistDisplay] = useRecoilState(artistDisplayStateSelector({seller, artist}));

  // const [visibleListings, setVisibleListings] = useState(
  //   artistListings.artists[artist].map(x => true)
  // ) ;

  // const [filteredListings, setFilteredListings] = useState(artistListings.artists[artist]);

  // const conditions: ConditionFilterKeys[] = ['mint', 'nearMint', 'veryGoodPlus', 'veryGood', 'goodPlus', 'good', 'fair']
  // const onFilterChange = (filters: FiltersState) => {
  //   console.log(filters);
  //   const visibleConditions = conditions.filter(f => filters[f] === true);
  //   console.log(visibleConditions);
  //   const filtered = artistListings.artists[artist].map(l => {
  //     console.log(l.condition);
  //     if (visibleConditions.includes(conditionsMap[l.condition])) {
  //       return true;
  //     } else {
  //       return false;
  //     }
  //   })
  //   console.log( filtered)
  //   setVisibleListings(filtered);
  // }
//Vinylpusher941
  const onHeaderClick = (evt:MouseEvent<HTMLHeadingElement>) => {
    console.log(evt.currentTarget, evt.target);
    if(evt.currentTarget != evt.target ) return;
    console.log('headerclick');
    setArtistDisplay({
      ...artistDisplay,
      open: !artistDisplay.open,
    })
  }

  // return <section className={styles.artistListings}>
  return <section className={styles.artistListings + (artistDisplay.open ? '' : ' ' + styles.collapsed)}>
    <h2 className={styles.h2} onClick={onHeaderClick}>{artist}
      <span className="heading-controls">
        <Filters artist={artist} />
      </span>
    </h2>
    {/* <pre>atrist: {JSON.stringify(artistDisplay, null, 4)}</pre> */}
    <div className={styles.artistListings}>
      {artistListings.artists[artist].map((l, i) => {
        if (artistListings.artists[artist].findIndex(l2 => l2.id === l.id) === i) {
          return <Listing key={l.id} listing={l} artist={artist} />
        }
      })}
    </div>
  </section>

}