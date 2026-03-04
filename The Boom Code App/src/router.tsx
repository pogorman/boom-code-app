import { createBrowserRouter } from "react-router-dom"
import Layout from "@/pages/_layout"
import HomePage from "@/pages/home"
import NotFoundPage from "@/pages/not-found"
import AccountsPage from "@/pages/accounts"
import ContactsPage from "@/pages/contacts"
import ActionItemsPage from "@/pages/action-items"
import HvasPage from "@/pages/hvas"
import IdeasPage from "@/pages/ideas"
import ImpactsPage from "@/pages/impacts"
import MeetingSummariesPage from "@/pages/meeting-summaries"
import ProjectsPage from "@/pages/projects"

// IMPORTANT: Do not remove or modify the code below!
// Normalize basename when hosted in Power Apps
const BASENAME = new URL(".", location.href).pathname
if (location.pathname.endsWith("/index.html")) {
  history.replaceState(null, "", BASENAME + location.search + location.hash);
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "accounts", element: <AccountsPage /> },
      { path: "contacts", element: <ContactsPage /> },
      { path: "action-items", element: <ActionItemsPage /> },
      { path: "hvas", element: <HvasPage /> },
      { path: "ideas", element: <IdeasPage /> },
      { path: "impacts", element: <ImpactsPage /> },
      { path: "meeting-summaries", element: <MeetingSummariesPage /> },
      { path: "projects", element: <ProjectsPage /> },
    ],
  },
], { 
  basename: BASENAME // IMPORTANT: Set basename for proper routing when hosted in Power Apps
})