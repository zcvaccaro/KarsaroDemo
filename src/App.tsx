import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ShellLayout } from "./components/ShellLayout";
import { BookingFlowPage } from "./pages/BookingFlowPage";
import { CalendarPage } from "./pages/CalendarPage";
import { EmailPage } from "./pages/EmailPage";
import {
  FormCustomizerPage,
  FormsListPage,
  NewFormPage,
} from "./pages/FormsPage";
import { LocationsPage } from "./pages/LocationsPage";
import { OverviewPage } from "./pages/OverviewPage";
import {
  ClientProfilePage,
  ConfirmationEditorPage,
  EmployeeProfilePage,
  WaitlistDetailPage,
} from "./pages/ProfilePages";
import { ServicesPage } from "./pages/ServicesPage";
import { PublicBookOfferPage } from "./pages/PublicBookOfferPage";
import {
  BillingPage,
  BookNowPage,
  BusinessPage,
  ClientsPage,
  ConfirmationsPage,
  DrivePage,
  EmployeesPage,
  GooglePage,
  IncomePage,
  MetricsPage,
  SyncSetupPage,
  WaitlistPage,
} from "./pages/ShellPages";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/book/:slug" element={<PublicBookOfferPage />} />
        <Route element={<ShellLayout />}>
          <Route path="/dashboard" element={<OverviewPage />} />
          <Route path="/dashboard/calendar" element={<CalendarPage />} />
          <Route path="/dashboard/bookings/new" element={<BookNowPage />} />
          <Route path="/dashboard/waitlist" element={<WaitlistPage />} />
          <Route path="/dashboard/waitlist/:id" element={<WaitlistDetailPage />} />
          <Route path="/dashboard/clients" element={<ClientsPage />} />
          <Route
            path="/dashboard/clients/:clientId"
            element={<ClientProfilePage />}
          />
          <Route path="/dashboard/employees" element={<EmployeesPage />} />
          <Route
            path="/dashboard/employees/:id"
            element={<EmployeeProfilePage />}
          />
          <Route path="/dashboard/forms" element={<FormsListPage />} />
          <Route
            path="/dashboard/forms/confirmations"
            element={<ConfirmationsPage />}
          />
          <Route
            path="/dashboard/forms/confirmations/:formId"
            element={<ConfirmationEditorPage />}
          />
          <Route
            path="/dashboard/forms/new/:templateKey"
            element={<NewFormPage />}
          />
          <Route
            path="/dashboard/forms/:formId"
            element={<FormCustomizerPage />}
          />
          <Route
            path="/dashboard/settings/booking-flow"
            element={<BookingFlowPage />}
          />
          <Route path="/dashboard/settings" element={<BusinessPage />} />
          <Route path="/dashboard/services" element={<ServicesPage />} />
          <Route path="/dashboard/locations" element={<LocationsPage />} />
          <Route path="/dashboard/settings/email" element={<EmailPage />} />
          <Route path="/dashboard/settings/billing" element={<BillingPage />} />
          <Route path="/dashboard/insights/metrics" element={<MetricsPage />} />
          <Route path="/dashboard/insights/income" element={<IncomePage />} />
          <Route path="/dashboard/settings/sync" element={<SyncSetupPage />} />
          <Route path="/dashboard/settings/google" element={<GooglePage />} />
          <Route path="/dashboard/settings/drive" element={<DrivePage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
