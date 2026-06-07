import { EventDetailPage } from "@/components/events/event-detail-page";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <EventDetailPage params={params} />;
}
