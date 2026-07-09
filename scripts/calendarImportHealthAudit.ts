import { areas } from "../src/data/catalog";
import { runConfiguredCalendarImports } from "../src/services/calendarImportPipeline";

function main() {
  const importedAt = new Date().toISOString();
  const runs = runConfiguredCalendarImports({ importedAt });

  console.log("Calendar import health audit");

  for (const area of areas) {
    const areaRuns = runs.filter((run) => run.source.areaId === area.id);

    console.log(`${area.name}, ${area.region} calendar imports`);

    if (!areaRuns.length) {
      console.log("- no configured calendar fixture imports");
      console.log("");
      continue;
    }

    for (const run of areaRuns) {
      const issueCopy = run.health.issueCounts
        .map((issue) => `${issue.issue}:${issue.count}`)
        .join(", ") || "none";

      console.log(
        `- ${run.source.label}: ${run.health.importedEventCount}/${run.health.rawEventCount} imported, ${run.health.skippedEventCount} skipped, ${run.health.ticketLinkCount} links (${run.health.ticketLinkCoveragePercent}%), duplicate rate ${run.health.duplicateRatePercent}%, categories ${run.health.activeCategories.join(", ") || "none"}, issues ${issueCopy}`
      );
      console.log(`  Next: ${run.health.recommendedNextAction}`);
    }

    console.log("");
  }
}

main();
