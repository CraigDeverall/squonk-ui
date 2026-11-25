import React from "react";
import { Pagination } from "./pagination";

/** Link-mode Pagination; getPageUrl must run in the browser, not the test runner. */
export function PaginationLinksHarness() {
  return <Pagination count={50} defaultPage={2} getPageUrl={(page) => `?page=${page}`} />;
}
