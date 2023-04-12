import { useRecoilState, useRecoilValue } from "recoil";
import Filters from "./filters";
import Listing from "./listing";
import { listingsAtom } from "@/state/listings";
import { artistDisplayStateSelector } from '@/state/display-state';
import styles from '@/styles/ArtistGroup.module.css';
import { MouseEvent } from "react";
import { useSearchState } from "@/state/use-search-state";

export default function ArtistGroup({artist}:{artist:string}) {

  const artistListings = useRecoilValue(listingsAtom);
  const {sellerSlug:seller} = useSearchState();
  const [artistDisplay, setArtistDisplay] = useRecoilState(artistDisplayStateSelector({seller, artist}));

  const onHeaderClick = (evt:MouseEvent<HTMLHeadingElement>) => {
    if(evt.currentTarget != evt.target ) return;
    setArtistDisplay({
      ...artistDisplay,
      open: !artistDisplay.open,
    })
  }

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