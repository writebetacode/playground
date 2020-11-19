import { createStoreon } from "storeon";
import { storeonDevtools } from "storeon/devtools";
import { board } from "./board";

export const store = createStoreon([
  board,
  process.env.NODE_ENV !== "production" && storeonDevtools,
]);
