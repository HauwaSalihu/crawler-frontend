import { Suspense } from "react";
import ResultsPageClient from "./ResultsPageClient";

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading results...</div>}>
      <ResultsPageClient />
    </Suspense>
  );
}