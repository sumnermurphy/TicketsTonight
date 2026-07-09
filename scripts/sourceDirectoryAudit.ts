import { areas } from "../src/data/catalog";
import {
  createLocalSourceDirectorySummary,
  getLocalSourceBuildStages,
  getRankedLocalSourceCandidates
} from "../src/services/localSourcePlanning";

const topCandidateCount = 6;

function main() {
  console.log("Local source directory audit");
  console.log("Purpose: rank repeatable local source candidates before building adapters.");
  console.log("");

  for (const area of areas) {
    const summary = createLocalSourceDirectorySummary(area.id);
    const rankedCandidates = getRankedLocalSourceCandidates(area.id);

    console.log(`${area.name}, ${area.region} local source directory`);
    console.log(
      `Candidates: ${summary.candidateCount}; ready: ${summary.readyCandidateCount}; partner/permission needed: ${summary.permissionRequiredCount}`
    );
    console.log(
      `Structured listings: ${summary.structuredCandidateCount}; ticket-link candidates: ${summary.ticketLinkCandidateCount}; missing categories: ${summary.missingCategoryCount}`
    );
    console.log(`Recommended next action: ${summary.recommendedNextAction}`);
    console.log("Top candidates:");

    for (const candidate of rankedCandidates.slice(0, topCandidateCount)) {
      console.log(
        `- ${candidate.label} [${candidate.status}/${candidate.intakeKind}/${candidate.termsPosture}]: score ${candidate.readinessScore}, categories ${candidate.matchingCategories.join(", ") || "none"}. ${candidate.nextStep}`
      );
    }

    console.log("Intake mix:");

    for (const intake of summary.intakeMix) {
      console.log(`- ${intake.intakeKind}: ${intake.count}`);
    }

    console.log("");
  }

  console.log("Repeatable source build stages:");

  for (const stage of getLocalSourceBuildStages()) {
    console.log(`- ${stage.id}: ${stage.label} (${stage.owner})`);
  }
}

main();
