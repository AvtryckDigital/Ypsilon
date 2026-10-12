/* eslint-disable */
import type { ReactNode } from "react";

declare global {
  interface PageProps<T = any> {
    params: Promise<any>;
    searchParams?: Promise<any>;
  }

  type LayoutProps<T = any> = {
    children: ReactNode;
    params?: Promise<any>;
  };

  interface RouteContext<T = any> {
    params: Promise<any>;
  }
}
