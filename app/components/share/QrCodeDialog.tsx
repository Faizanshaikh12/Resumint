import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Download, Copy, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/sonner";

export interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}

export function QrCodeDialog({ open, onOpenChange, url, title }: QrCodeDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    if (open && url) {
      setLoading(true);
      void QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      })
        .then((dataUrl) => {
          if (active) {
            setQrDataUrl(dataUrl);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (active) {
            console.error("Failed to generate QR code:", err);
            setLoading(false);
          }
        });
    }

    return () => {
      active = false;
    };
  }, [open, url]);

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "resume";
    link.download = `${sanitizedTitle}-qr.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success("QR Code downloaded as PNG");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm text-center">
        <DialogHeader>
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <QrCode className="h-5 w-5" />
          </div>
          <DialogTitle>Scan to View Resume</DialogTitle>
          <DialogDescription className="text-xs">
            Scan with any phone camera or tablet to open this public resume.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          <div className="rounded-xl border bg-white p-3 shadow-xs dark:bg-stone-100 flex items-center justify-center min-h-[220px] min-w-[220px]">
            {loading || !qrDataUrl ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-medium">Generating QR Code...</span>
              </div>
            ) : (
              <img
                src={qrDataUrl}
                alt={`QR code for ${title} linking to ${url}`}
                className="h-52 w-52 rounded"
                data-testid="qr-code-image"
              />
            )}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground break-all max-w-[260px]">
            {url}
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="w-full gap-1.5"
            data-testid="qr-copy-link-button"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleDownloadPng}
            disabled={!qrDataUrl || loading}
            className="w-full gap-1.5"
            data-testid="qr-download-png-button"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PNG</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
