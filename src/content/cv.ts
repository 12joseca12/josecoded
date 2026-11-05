import cvData from "../../content/cv.json";
import { type Cv, cvSchema } from "./schemas";

export const getCv = (): Cv => cvSchema.parse(cvData);
