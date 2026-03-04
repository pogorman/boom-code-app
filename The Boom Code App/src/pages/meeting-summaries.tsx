import { EntityListPage } from "@/components/entity-list-page";
import { MEETING_SUMMARY_CONFIG } from "@/types/entities";

export default function MeetingSummariesPage() {
  return <EntityListPage config={MEETING_SUMMARY_CONFIG} />;
}
