import { validateFacests } from "../scripts/genesisGenerator";
import { task } from "hardhat/config";

task("facets:report", "Generates a report of facets in a diamond contract")
  .addParam("governancediamond", "The address of the governance diamond contract")
  .setAction(async (taskArgs, hre) => {
    const { governancediamond } = taskArgs;

    console.log(`Generating facets report for diamond at address: ${governancediamond}`);
    await validateFacests(hre,  governancediamond);

});