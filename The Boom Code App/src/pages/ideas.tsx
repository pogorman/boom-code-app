import { EntityListPage } from "@/components/entity-list-page";
import { IDEA_CONFIG } from "@/types/entities";

export default function IdeasPage() {
  return <EntityListPage config={IDEA_CONFIG} />;
}
