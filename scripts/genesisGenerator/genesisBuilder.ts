import { promises as fs } from "fs";
import * as path from "path";
import type { GenesisAlloc } from "."; // wherever you have your types


type JSONGenesis = any;

// type GenesisJson = {
//   config?: any;
//   alloc?: GenesisAlloc;
//   [k: string]: any;
// };

/**
 * Merge two allocs: everything in `additions` will be added/overwritten in `base`.
 * - balance / nonce / code / contractName are overwritten if provided
 * - storage is merged by key (new values overwrite existing ones)
 */
function mergeAlloc(allocBase: JSONGenesis = {}, allocAdditions: GenesisAlloc = {}): JSONGenesis {
  console.log("Merging alloc additions into base genesis alloc...");
  console.log(`  Base alloc entries: ${Object.keys(allocBase).length}`);
  console.log(`  Addition alloc entries: ${Object.keys(allocAdditions).length}`);

  // Merge existing entries

  for (const [addr, entry] of Object.entries(allocAdditions)) {
    if(allocBase[addr] === undefined) {
        allocBase[addr] = entry;
    }else {
        throw new Error(`Address ${addr} already exists in base genesis alloc.`);
    }
  }

  return allocBase;
}


/**
 * Reads a genesis template file, merges in the given slotStructure (alloc),
 * and writes the final genesis JSON to the specified outputFile.
 */
export async function buildGenesisWithAlloc(
  genesisTemplateFile: string,
  slotStructure: GenesisAlloc,
  outputFile: string
): Promise<void> {
  const raw = await fs.readFile(genesisTemplateFile, "utf8");
  if (!raw) {
    throw new Error(`Genesis template file is empty or not found: ${genesisTemplateFile}`);
  }
  const genesis: JSONGenesis = JSON.parse(raw);

  const mergedAlloc = mergeAlloc(genesis.genesis.alloc ?? {}, slotStructure);
  
  genesis.genesis.alloc = mergedAlloc;  

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(genesis, null, 2), "utf8");

  console.log(`✅ Genesis generated at: ${outputFile}`);
}