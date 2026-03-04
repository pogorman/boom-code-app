import { EntityListPage } from "@/components/entity-list-page";
import { PROJECT_CONFIG } from "@/types/entities";

export default function ProjectsPage() {
  return <EntityListPage config={PROJECT_CONFIG} />;
}
