import { Session } from "../db/schema";

export interface FilterOptions {
  syllables: boolean;
  borders: boolean;
  initialDash: boolean;
  trim: boolean;
  oddG: boolean;
}

export type HonoVariables = {
  session: Session | null;
};
