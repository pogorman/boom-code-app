import { EntityListPage } from "@/components/entity-list-page";
import { CONTACT_CONFIG } from "@/types/entities";

export default function ContactsPage() {
  return <EntityListPage config={CONTACT_CONFIG} />;
}
