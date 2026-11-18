import { useContext } from "react";
import { CartContext } from "../contexts/cartState";

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
