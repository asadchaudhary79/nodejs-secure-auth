import { serve } from "inngest/express";
import { inngest } from "../config/inngestConfig.js";
import * as functions from "./functions/index.js";

// Create array of all functions
const allFunctions = Object.values(functions);

// Create Inngest serve handler
export const inngestHandler = serve({
  client: inngest,
  functions: allFunctions,
});

export default inngestHandler;

