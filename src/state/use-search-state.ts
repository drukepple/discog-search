import { useRouter } from "next/router";
import { useEffect, useState } from "react";


export const useSearchState = () => {
  const router = useRouter();
  const seller = router.query.seller as string ?? '';
  const [sellerSlug, setSellerSlug] = useState(seller);
  const [noCache, setNoCache] = useState(false);

  useEffect(() => {
    if (router.query.seller !== '') {
      setSellerSlug(router.query.seller as string);
    }
  }, [router.query.seller]);

  return {
    sellerSlug, setSellerSlug,
    noCache, setNoCache,
  };
};
