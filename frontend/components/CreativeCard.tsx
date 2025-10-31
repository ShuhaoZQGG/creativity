import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, DollarSign, Calendar, Download, Trash2, Copy } from 'lucide-react';

export interface Creative {
  id: string;
  textVariant: {
    headline: string;
    body: string;
    cta: string;
  };
  imageUrls: string[];
  videoUrls?: string[];
  score: {
    overall: number;
  };
  inputContext: {
    brand_name: string;
  };
  createdAt: string;
  ctr?: number | null;
  spend?: number | null;
}

interface CreativeCardProps {
  creative: Creative;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDownload?: (creative: Creative) => void;
}

export function CreativeCard({ creative, onDelete, onDuplicate, onDownload }: CreativeCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="group hover:shadow-lg transition-all border-2 hover:border-primary/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={creative.imageUrls[0]}
            alt={creative.textVariant.headline}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2">
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
              Score: {(creative.score.overall * 100).toFixed(0)}
            </div>
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {onDownload && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={() => onDownload(creative)}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
            {onDuplicate && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={() => onDuplicate(creative.id)}
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={() => onDelete(creative.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Brand */}
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {creative.inputContext.brand_name}
          </div>

          {/* Headline & Body */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg line-clamp-2 leading-tight">
              {creative.textVariant.headline}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {creative.textVariant.body}
            </p>
          </div>

          {/* CTA Button */}
          <Button variant="outline" className="w-full" size="sm">
            {creative.textVariant.cta}
          </Button>

          {/* Metrics */}
          <div className="flex items-center justify-between pt-3 border-t text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">{formatDate(creative.createdAt)}</span>
            </div>

            {(creative.ctr || creative.spend) && (
              <div className="flex items-center gap-3">
                {creative.ctr && (
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-green-500" />
                    <span className="text-xs font-medium">{(creative.ctr * 100).toFixed(2)}%</span>
                  </div>
                )}
                {creative.spend && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-orange-500" />
                    <span className="text-xs font-medium">${creative.spend.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
