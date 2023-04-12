import { MouseEventHandler } from "react";
import Image from "next/image";
import styles from '@/styles/Listing.module.css';
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { ListingDisplayStateSelector, artistDisplayStateSelector, displayStateAtom, sidebarAtom } from "@/state/listings";
import { filterNameToKeyMap } from "./filters";
import { MouseEvent } from "react";

type ListingProps = {
  listing: Listing,
  artist: string,
}
export default function Listing({listing, artist}:ListingProps) {

  const rel = listing.release;
  const prices:{price:string, shipping:string, total:string} = (listing as any).usdPrices

  const [listingDisplayState, setListingDisplayState] = useRecoilState(ListingDisplayStateSelector(listing.id))
  const artistDisplayState = useRecoilValue(artistDisplayStateSelector(artist));
  const globalDisaplyState = useRecoilValue(displayStateAtom);

  const handleTitleClick = () => {
    console.log('click')
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
    // console.log('  >>  ', listing.condition);
    const conditionKey = filterNameToKeyMap[listing.condition];
    // console.log(conditionKey, artistDisplayState.filters[conditionKey]);
    const artistFilter = artistDisplayState.filters[conditionKey];
    if (artistFilter === false) {
      return false;
    }
    const globalFilter = globalDisaplyState.filters[conditionKey];
    if (globalFilter === false) {
      return false;
    }
    return true;
  }

  return <div className={styles.listing +
       (listingDisplayState.open ? '' : ' ' + styles.collapsed)
       + (getConditionFilterFromListing() ? '' : ' ' + styles.collapsed)
    }>
    <div className={styles.collapsable}>
      {/* <pre>{JSON.stringify(visible, null, 4)}</pre> */}
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