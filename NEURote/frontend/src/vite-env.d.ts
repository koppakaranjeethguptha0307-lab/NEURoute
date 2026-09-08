/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_TITLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Ambient JSX intrinsic elements support
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'react' {
  export type ReactNode = any;
  export type ReactElement = any;
  export type ElementType = any;
  export type FC<P = {}> = (props: P) => any;
  export interface FormEvent<T = any> {
    preventDefault: () => void;
    target: T;
  }
  export interface ChangeEvent<T = any> {
    target: T;
  }
  export interface MouseEvent<T = any> {
    preventDefault: () => void;
    stopPropagation: () => void;
    target: T;
  }
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useRef<T>(initialValue?: T): { current: T };
  export function useContext<T>(context: any): T;
  export function createContext<T>(defaultValue?: T): any;
  export const StrictMode: FC<{ children?: any }>;
  export default React;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-dom/client' {
  export function createRoot(container: any): {
    render: (element: any) => void;
  };
}

declare module 'react-router-dom' {
  export function useNavigate(): (to: any, options?: any) => void;
  export function useLocation(): { pathname: string; search: string; hash: string; state: any };
  export function useParams<T = any>(): T;
  export function createBrowserRouter(routes: any[], opts?: any): any;
  export const RouterProvider: React.FC<{ router: any }>;
  export const Outlet: React.FC<{ context?: any }>;
  export const Link: React.FC<any>;
  export const NavLink: React.FC<any>;
  export const Navigate: React.FC<{ to: string; replace?: boolean; state?: any }>;
}

// Shorthand ambient module declarations for packages
declare module 'lucide-react';
declare module 'clsx';
declare module 'tailwind-merge';
declare module 'leaflet';
declare module 'react-leaflet';
declare module 'recharts';
