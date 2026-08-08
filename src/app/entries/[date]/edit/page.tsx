import { redirect } from "next/navigation";
import EditEntryPage from "@/features/entries/pages/EditEntryPage";
import { getEntryByDate } from "@/server/entries";

type Props = {
	params: Promise<{ date: string }>;
	searchParams: Promise<{ from?: string; mode?: string }>;
};

export default async function EditEntryRoute({ params, searchParams }: Props) {
	const [{ date }, query] = await Promise.all([params, searchParams]);

	if (query.mode !== "edit") {
		const entry = await getEntryByDate(date);
		if (entry) {
			redirect(`/entries/${date}${query.from === "list" ? "?from=list" : ""}`);
		}
	}

	return <EditEntryPage />;
}
