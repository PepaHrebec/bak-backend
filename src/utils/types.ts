import { Session } from "../auth/session";

export interface FilterOptions {
  syllables: boolean;
  borders: boolean;
  initialDash: boolean;
  trim: boolean;
}

export type HonoVariables = {
  session: Session | null;
};
