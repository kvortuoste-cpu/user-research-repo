"use client";

import { createContext, useContext, useState } from "react";

type NavContextType = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
};

const NavContext = createContext<NavContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <NavContext.Provider
      value={{
        isOpen,
        toggle: () => setIsOpen((o) => !o),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  return useContext(NavContext);
}
