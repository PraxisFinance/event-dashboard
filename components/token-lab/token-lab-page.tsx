"use client";

import { Header } from "@/components/layout/header";
import { FlaskConical } from "lucide-react";
import { MintCard } from "./mint-card";
import { ApyCard } from "./apy-card";

export function TokenLabPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-14">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <FlaskConical className="h-5 w-5 text-brand-green" />
            <div>
              <h1 className="text-base font-semibold">Token Lab</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Test-environment token manipulation — minting and APY
                configuration. Not for production use.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <MintCard />
            <ApyCard />
          </div>
        </div>
      </main>
    </div>
  );
}
