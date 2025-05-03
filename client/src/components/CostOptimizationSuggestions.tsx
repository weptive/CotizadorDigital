import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Info, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  Target,
  TrendingDown
} from 'lucide-react';
import { OptimizationSuggestion } from '@/lib/costOptimizer';
import { formatearPrecioDOP } from '@/lib/utils';

interface CostOptimizationSuggestionsProps {
  suggestions: OptimizationSuggestion[];
  onItemClick?: (itemIds: string[]) => void;
}

export default function CostOptimizationSuggestions({ 
  suggestions,
  onItemClick
}: CostOptimizationSuggestionsProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Ordenar sugerencias por impacto (high, medium, low)
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });
  
  // Mostrar solo las 3 principales sugerencias a menos que showAll sea true
  const displayedSuggestions = showAll 
    ? sortedSuggestions 
    : sortedSuggestions.slice(0, Math.min(3, sortedSuggestions.length));
  
  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" /> 
              Sugerencias de optimización
            </CardTitle>
            <CardDescription>
              Recomendaciones para optimizar costos y mejorar la rentabilidad
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-normal bg-blue-50 text-blue-700 hover:bg-blue-50">
            {suggestions.length} sugerencia{suggestions.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Check className="h-12 w-12 text-green-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">¡Cotización optimizada!</h3>
            <p className="text-sm text-gray-500 max-w-md mt-1">
              No se encontraron oportunidades de optimización. Tu cotización parece estar bien balanceada.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedSuggestions.map((suggestion) => (
              <div 
                key={suggestion.id} 
                className="p-4 border rounded-lg flex gap-3"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {suggestion.type === 'warning' && (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                  {suggestion.type === 'error' && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  {suggestion.type === 'info' && (
                    <Info className="h-5 w-5 text-blue-500" />
                  )}
                  {suggestion.type === 'success' && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                    <div className="flex items-center gap-2">
                      {suggestion.impact === 'high' && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Impacto Alto
                        </Badge>
                      )}
                      {suggestion.impact === 'medium' && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Impacto Medio
                        </Badge>
                      )}
                      {suggestion.impact === 'low' && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Impacto Bajo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                  
                  {suggestion.potentialSavings !== undefined && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-green-700">
                      <TrendingDown className="h-4 w-4" />
                      <span>Ahorro potencial: {formatearPrecioDOP(suggestion.potentialSavings)}</span>
                    </div>
                  )}
                  
                  {suggestion.itemIds && suggestion.itemIds.length > 0 && onItemClick && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto text-blue-600 mt-2"
                      onClick={() => onItemClick(suggestion.itemIds!)}
                    >
                      <Target className="h-3.5 w-3.5 mr-1" />
                      Ver ítems relacionados
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {sortedSuggestions.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-gray-600"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Ver {sortedSuggestions.length - 3} sugerencia{sortedSuggestions.length - 3 !== 1 ? 's' : ''} más
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}