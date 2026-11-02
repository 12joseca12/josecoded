
import tresCat from './3cat.json';
import tresCatInfo from './3catinfo.json';
import josecoded from './josecoded.json';
import { projectSchema } from './schema.ts';

// The one list of project sheets. A sheet is added by dropping its JSON next to the others and importing it here
// (the Workers runtime has no filesystem); `content/projects/schema.test.ts` fails if a JSON file is not listed.
// Each sheet is validated at load time: an invalid one fails every import, not just one caller.
export const projects = [tresCat, tresCatInfo, josecoded].map((sheet) => projectSchema.parse(sheet));
