import { htmlCalendarFixturesBySourceId } from "../data/htmlCalendarFixtures";
import {
  localCalendarSources,
  type LocalCalendarEvent,
  type LocalCalendarSource
} from "../data/localCalendarFeeds";
import {
  createCalendarImportHealthSummary,
  type CalendarImportHealthSummary
} from "./calendarImportHealth";
import {
  importHtmlCalendarEvents,
  type HtmlCalendarImportResult
} from "./htmlCalendarImporter";

export type CalendarImportRun = {
  source: LocalCalendarSource;
  result: HtmlCalendarImportResult;
  health: CalendarImportHealthSummary;
};

export type CalendarImportPipelineOptions = {
  areaId?: string;
  importedAt?: string;
  sourceIds?: string[];
};

export function runConfiguredCalendarImports(
  options: CalendarImportPipelineOptions = {}
): CalendarImportRun[] {
  const importedAt = options.importedAt ?? new Date().toISOString();
  const sourceIds = options.sourceIds ? new Set(options.sourceIds) : undefined;

  return localCalendarSources
    .filter((source) => source.sourceKind === "html-calendar")
    .filter((source) => !options.areaId || source.areaId === options.areaId)
    .filter((source) => !sourceIds || sourceIds.has(source.id))
    .flatMap((source) => {
      const fixture = htmlCalendarFixturesBySourceId[source.id];

      if (!fixture || !source.parserProfile) {
        return [];
      }

      const result = importHtmlCalendarEvents(fixture, source, { importedAt });

      return [
        {
          source,
          result,
          health: createCalendarImportHealthSummary(source, result)
        }
      ];
    });
}

export function getImportedCalendarEvents(runs: CalendarImportRun[]): LocalCalendarEvent[] {
  return runs.flatMap((run) => run.result.events);
}
