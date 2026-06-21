import { CheckCircle2, ExternalLink } from "lucide-react";
import { praxisChain } from "@/lib/praxis-pool";
import { Button } from "@/components/ui/primitives/button";
import { DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/overlays/dialog";

interface MarketSuccessViewProps {
  txHash: `0x${string}` | undefined;
  onClose: () => void;
}

export function MarketSuccessView({ txHash, onClose }: MarketSuccessViewProps) {
  const truncatedTx = txHash ? `${txHash.slice(0, 6)}...${txHash.slice(-4)}` : null;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-foreground">Market Created</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-brand-green" />
        <div>
          <p className="text-lg font-semibold text-foreground">Market Created Successfully</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your prediction market has been deployed to the Praxis smart contract on{" "}
            {praxisChain.name}.
          </p>
        </div>
        {txHash && (
          <div className="flex flex-col gap-1 items-center">
            <p className="text-xs text-muted-foreground">Transaction Hash</p>
            <a
              href={`${praxisChain.blockExplorers.default.url}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-brand-blue underline underline-offset-2 hover:text-brand-blue/80"
            >
              {truncatedTx}
            </a>
            <a
              href={`${praxisChain.blockExplorers.default.url}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
            >
              <ExternalLink className="h-3 w-3" />
              View on {praxisChain.blockExplorers.default.name}
            </a>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button className="w-full" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
}
