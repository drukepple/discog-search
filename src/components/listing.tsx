import { MouseEventHandler } from "react";
import Image from "next/image";
import styles from '@/styles/Listing.module.css';
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { sidebarAtom } from "@/state/listings";
import { ListingDisplayStateSelector, artistDisplayStateSelector, displayStateAtom } from "@/state/display-state";
import { filterNameToKeyMap } from "./filters";
import { useSearchState } from "@/state/use-search-state";

type ListingProps = {
  listing: Listing,
  artist: string,
}
export default function Listing({listing, artist}:ListingProps) {

  const rel = listing.release;
  const prices:{price:string, shipping:string, total:string} = (listing as any).usdPrices
  const {sellerSlug:seller} = useSearchState();

  const [listingDisplayState, setListingDisplayState] = useRecoilState(ListingDisplayStateSelector({seller, id:listing.id}))
  const artistDisplayState = useRecoilValue(artistDisplayStateSelector({seller, artist}));
  const globalDisaplyState = useRecoilValue(displayStateAtom('GLOBAL'));

  const handleTitleClick = () => {
    setListingDisplayState({
      open: !listingDisplayState.open,
    });
  }

  const setSidebar = useSetRecoilState(sidebarAtom)
  const openInSidebar: MouseEventHandler<HTMLAnchorElement> = (e) => {
    console.log(e.metaKey, (e.target as HTMLAnchorElement).href, listing);
    if (!e.metaKey) {
      e.preventDefault();
      setSidebar({
        open: true,
        src: (e.target as HTMLAnchorElement).href
      })
    }
  }

  const getConditionFilterFromListing = () => {
    // console.group(`Conditions - ${listing.condition} ${artist}`);
    const conditionKey = filterNameToKeyMap[listing.condition];
    // console.log('conditionKey:', conditionKey);
    const artistFilter = artistDisplayState.filters[conditionKey];
    if (artistFilter === false) {
      // console.groupEnd();
      return false;
    }
    const globalFilter = globalDisaplyState.filters[conditionKey];
    if (globalFilter === false) {
      // console.groupEnd();
      return false;
    }
    // console.log('globalfilter must be true')
    // console.groupEnd();
    return true;
  }

  return <div className={styles.listing +
       (listingDisplayState.open ? '' : ' ' + styles.collapsed)
       + (getConditionFilterFromListing() ? '' : ' ' + styles.collapsed)
    }>
    <div className={styles.collapsable}>
      {/* <pre>{JSON.stringify(globalDisplayState.filters, null, 4)}</pre> */}
      {/* <pre>{JSON.stringify(rel, null, 4)}</pre> */}
      {/* <pre>{JSON.stringify(listing, null, 4)}</pre> */}
      <img className={styles.img} width="100" height="auto" src={rel.images[0]?.uri150} alt="" />
      {/* <Image alt="" width={100} height={100} src={rel.images[0].uri150} /> */}
    </div>
    <div className={styles.listingText}>
      <h3 className={styles.h3} onClick={handleTitleClick}>
        {rel.title} ({rel.year})&nbsp;
        <span className={styles.releaseDesc}>{rel.description}</span>
      </h3>
      {/*  <span className="reissue">RE</span>, RM</span> */}
      <div className={`${styles.listingDetails} ${styles.collapsable}`}>
        <p><span className={styles.mediaCondition}>{listing.condition}</span> / {listing.sleeve_condition}</p>
        <p>${prices.price} (+{prices.shipping}: ${prices.total})</p>
        <p>{listing.comments}</p>
        <p className={styles.links}>
          <a onClick={openInSidebar} href={listing.uri} target="_blank">{listing.uri}</a>
          &nbsp;|&nbsp;
            <a href={listing.release.resource_url} target="_blank">Release</a>
        </p>
      </div>
    </div>
  </div>

}