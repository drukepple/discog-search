import Filters from "./filters";
import Listing from "./listing";

export default function ArtistGroup() {
  return <section className="artist-group">
    <h2>Queen
      <span className="heading-controls">
        <Filters />
      </span>
    </h2>
    <div className="artist-listings" data-visibility="true">
      <Listing />
      <Listing />
      <Listing />
      <Listing />
      <Listing />
      <Listing />
      <Listing />
      <Listing />
      <Listing />
      <Listing />
      <Listing />
      <Listing />
      <Listing />
    </div>
  </section>

}