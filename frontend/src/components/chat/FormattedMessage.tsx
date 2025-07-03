import React, { memo, useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface FormattedMessageProps {
  content: string;
}

// Tipos para melhor type safety
type TextSegment = {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'money' | 'percent' | 'rating' | 'math' | 'mathBlock';
  content: string;
  url?: string;
  key: string;
};

// Parser otimizado para markdown simples
class MarkdownParser {
  private static instance: MarkdownParser;
  private patterns: RegExp[];

  private constructor() {
    // Regex compiladas uma vez para melhor performance
    this.patterns = [
      /\\\[(.*?)\\\]/gs,          // Math block (LaTeX display)
      /\\\((.*?)\\\)/g,           // Math inline (LaTeX inline)
      /\$\$(.*?)\$\$/gs,          // Math block alternativo
      /\$([^$]+)\$/g,             // Math inline alternativo
      /\\frac\{([^}]+)\}\{([^}]+)\}/g, // Frações LaTeX diretas
      /\\text\{([^}]+)\}/g,       // Texto LaTeX direto
      /\[([^\]]+)\]\(([^)]+)\)/g, // Links
      /\*\*([^*]+)\*\*/g,         // Bold
      /\*([^*]+)\*/g,             // Italic
      /`([^`]+)`/g,               // Code
      /R\$\s*([\d.,]+)/g,         // Money
      /(\d+(?:,\d+)?%)/g,         // Percent
      /(\d+\/\d+)/g,              // Rating
      /(\d+\s+em\s+\d+)/g         // Rating text
    ];
  }

  static getInstance(): MarkdownParser {
    if (!MarkdownParser.instance) {
      MarkdownParser.instance = new MarkdownParser();
    }
    return MarkdownParser.instance;
  }

  parse(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    let remaining = text;
    let keyCounter = 0;

    while (remaining.length > 0) {
      let earliestMatch: RegExpMatchArray | null = null;
      let matchedPatternIndex = -1;

      // Encontra a primeira ocorrência de qualquer padrão
      this.patterns.forEach((pattern, index) => {
        pattern.lastIndex = 0; // Reset regex state
        const match = pattern.exec(remaining);
        if (match && (!earliestMatch || match.index! < earliestMatch.index!)) {
          earliestMatch = match;
          matchedPatternIndex = index;
        }
      });

      if (!earliestMatch) {
        // Nenhum padrão encontrado, adiciona o resto como texto
        if (remaining.trim()) {
          segments.push({
            type: 'text',
            content: remaining,
            key: `text-${keyCounter++}`
          });
        }
        break;
      }

      // Adiciona texto antes da correspondência
      if (earliestMatch.index! > 0) {
        const beforeText = remaining.substring(0, earliestMatch.index!);
        if (beforeText.trim()) {
          segments.push({
            type: 'text',
            content: beforeText,
            key: `text-${keyCounter++}`
          });
        }
      }

      // Adiciona o segmento correspondente
      const matchedSegment = this.createSegment(earliestMatch, matchedPatternIndex, keyCounter++);
      if (matchedSegment) {
        segments.push(matchedSegment);
      }

      // Remove a parte processada
      remaining = remaining.substring(earliestMatch.index! + earliestMatch[0].length);
    }

    return segments;
  }

  private createSegment(match: RegExpMatchArray, patternIndex: number, key: number): TextSegment | null {
    switch (patternIndex) {
      case 0: // Math block \[...\]
      case 2: // Math block $$...$$
        return {
          type: 'mathBlock',
          content: match[1],
          key: `mathBlock-${key}`
        };
      case 1: // Math inline \(...\)
      case 3: // Math inline $...$
        return {
          type: 'math',
          content: match[1],
          key: `math-${key}`
        };
      case 4: // Frações LaTeX diretas
        return {
          type: 'math',
          content: `\\frac{${match[1]}}{${match[2]}}`,
          key: `math-${key}`
        };
      case 5: // Texto LaTeX direto
        return {
          type: 'math',
          content: `\\text{${match[1]}}`,
          key: `math-${key}`
        };
      case 6: // Links
        return {
          type: 'link',
          content: match[1],
          url: match[2],
          key: `link-${key}`
        };
      case 7: // Bold
        return {
          type: 'bold',
          content: match[1],
          key: `bold-${key}`
        };
      case 8: // Italic
        return {
          type: 'italic',
          content: match[1],
          key: `italic-${key}`
        };
      case 9: // Code
        return {
          type: 'code',
          content: match[1],
          key: `code-${key}`
        };
      case 10: // Money
        return {
          type: 'money',
          content: `R$ ${match[1]}`,
          key: `money-${key}`
        };
      case 11: // Percent
      case 12: // Rating
      case 13: // Rating text
        return {
          type: patternIndex === 11 ? 'percent' : 'rating',
          content: match[1],
          key: `${patternIndex === 11 ? 'percent' : 'rating'}-${key}`
        };
      default:
        return null;
    }
  }
}

// Componente para renderizar matemática
const MathRenderer = memo(({ content, displayMode }: { content: string; displayMode: boolean }) => {
  const html = useMemo(() => {
    try {
      // Pré-processa o conteúdo para corrigir sintaxes comuns
      let processedContent = content
        .replace(/\\times/g, ' \\times ')
        .replace(/\\geq/g, ' \\geq ')
        .replace(/\\leq/g, ' \\leq ')
        .replace(/\\approx/g, ' \\approx ')
        .replace(/\{([^}]+)\}/g, '{$1}')
        .replace(/R\$/g, 'R\\$');
      
      return katex.renderToString(processedContent, {
        displayMode,
        throwOnError: false,
        errorColor: '#cc0000',
        strict: false,
        trust: true,
        macros: {
          "\\times": "\\times",
          "\\geq": "\\geq",
          "\\leq": "\\leq",
          "\\text": "\\text",
          "\\frac": "\\frac",
          "\\sqrt": "\\sqrt",
          "\\approx": "\\approx",
          "\\cdot": "\\cdot",
          "\\ge": "\\geq",
          "\\le": "\\leq"
        }
      });
    } catch (error) {
      console.error('KaTeX error:', error);
      return `<span style="color: #cc0000;">Erro ao renderizar fórmula: ${content}</span>`;
    }
  }, [content, displayMode]);

  return (
    <span
      className={displayMode ? "block my-4 overflow-x-auto text-center" : "inline-block mx-1"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

MathRenderer.displayName = 'MathRenderer';

// Componente para renderizar segmentos
const TextSegmentRenderer = memo(({ segment }: { segment: TextSegment }) => {
  switch (segment.type) {
    case 'math':
      return <MathRenderer content={segment.content} displayMode={false} />;
    
    case 'mathBlock':
      return <MathRenderer content={segment.content} displayMode={true} />;
    
    case 'link':
      return (
        <a
          href={segment.url}
          className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors duration-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          {segment.content}
        </a>
      );
    
    case 'bold':
      return (
        <strong className="font-semibold text-foreground">
          {segment.content}
        </strong>
      );
    
    case 'italic':
      return (
        <em className="italic text-muted-foreground">
          {segment.content}
        </em>
      );
    
    case 'code':
      return (
        <code className="bg-muted text-foreground px-2 py-1 rounded-md text-sm font-mono font-medium border">
          {segment.content}
        </code>
      );
    
    case 'money':
      return (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {segment.content}
        </span>
      );
    
    case 'percent':
      return (
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {segment.content}
        </span>
      );
    
    case 'rating':
      return (
        <span className="font-semibold text-orange-600 dark:text-orange-400">
          {segment.content}
        </span>
      );
    
    default:
      return <span>{segment.content}</span>;
  }
});

TextSegmentRenderer.displayName = 'TextSegmentRenderer';

// Componente para renderizar parágrafos
const ParagraphRenderer = memo(({ paragraph, index }: { paragraph: string; index: number }) => {
  const parser = MarkdownParser.getInstance();
  
  const content = useMemo(() => {
    const trimmed = paragraph.trim();
    
    // Ignora linhas que são apenas separadores
    if (/^-{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      return null;
    }
    
    // Detecta linhas que parecem ser fórmulas matemáticas puras
    if (/^[A-Za-z\s]*=\s*\\?frac|^[0-9,.\s]+\s*[+\-×]\s*[0-9,.\s]+|^[A-Za-z]\s*\\(leq|geq|times)/.test(trimmed)) {
      const mathContent = trimmed
        .replace(/\s*=\s*/g, ' = ')
        .replace(/\\geq/g, ' \\geq ')
        .replace(/\\leq/g, ' \\leq ')
        .replace(/\\times/g, ' \\times ')
        .replace(/\\approx/g, ' \\approx ');
      
      return (
        <div key={`math-line-${index}`} className="mb-4">
          <MathRenderer content={mathContent} displayMode={true} />
        </div>
      );
    }
    
    // Detecta tabelas simples com pipes |
    if (trimmed.includes(' | ') && trimmed.split('\n').every(line => line.includes('|'))) {
      const lines = trimmed.split('\n').filter(line => line.trim());
      const rows = lines.map(line => 
        line.split('|').map(cell => cell.trim()).filter(cell => cell)
      );
      
      const hasSeparator = rows.length > 1 && 
        rows[1].every(cell => /^-+$/.test(cell.replace(/:/g, '')));
      
      const headerRows = hasSeparator ? [rows[0]] : [];
      const bodyRows = hasSeparator ? rows.slice(2) : rows;
      
      return (
        <div key={`table-${index}`} className="mb-6 overflow-x-auto">
          <table className="min-w-full border-collapse">
            {headerRows.length > 0 && (
              <thead>
                <tr className="border-b border-border">
                  {headerRows[0].map((header, i) => (
                    <th key={i} className="px-4 py-2 text-left font-semibold text-sm bg-muted/30">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  {row.map((cell, cellIndex) => {
                    const cellSegments = parser.parse(cell);
                    return (
                      <td key={cellIndex} className="px-4 py-2 text-sm">
                        {cellSegments.map(segment => (
                          <TextSegmentRenderer key={segment.key} segment={segment} />
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // Headers
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+?)(?:\n(.*))?$/s);
    if (headerMatch) {
      const [, hashes, headerText, remainingContent] = headerMatch;
      const level = Math.min(hashes.length, 6) as 1 | 2 | 3 | 4 | 5 | 6;
      
      const headerClasses = {
        1: "text-2xl font-bold mb-4 mt-6 text-foreground border-b border-border pb-2",
        2: "text-xl font-bold mb-3 mt-5 text-foreground",
        3: "text-lg font-semibold mb-3 mt-4 text-foreground",
        4: "text-base font-semibold mb-2 mt-3 text-foreground",
        5: "text-sm font-semibold mb-2 mt-3 text-muted-foreground uppercase tracking-wider",
        6: "text-sm font-medium mb-2 mt-2 text-muted-foreground"
      };
      
      const HeaderTag = `h${level}` as keyof JSX.IntrinsicElements;
      const headerSegments = parser.parse(headerText);
      
      return (
        <div key={`header-${index}`}>
          <HeaderTag className={headerClasses[level]}>
            {headerSegments.map(segment => (
              <TextSegmentRenderer key={segment.key} segment={segment} />
            ))}
          </HeaderTag>
          {remainingContent && remainingContent.trim() && (
            <div className="mb-5">
              <span className="leading-relaxed block">
                {parser.parse(remainingContent.trim()).map(segment => (
                  <TextSegmentRenderer key={segment.key} segment={segment} />
                ))}
              </span>
            </div>
          )}
        </div>
      );
    }
    
    // Listas numeradas -> bullet points
    if (/^\d+\.\s/.test(trimmed)) {
      const lines = paragraph.split('\n');
      const listItems: string[] = [];
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        const match = trimmedLine.match(/^(\d+)\.\s(.+)/);
        if (match) {
          const [, , content] = match;
          listItems.push(content);
        } else if (listItems.length > 0 && trimmedLine) {
          listItems[listItems.length - 1] += ' ' + trimmedLine;
        }
      });
      
      if (listItems.length > 0) {
        return (
          <ul key={`list-${index}`} className="list-disc list-outside space-y-3 mb-6 pl-6 marker:text-primary">
            {listItems.map((item, itemIndex) => {
              const itemSegments = parser.parse(item.trim());
              return (
                <li key={`item-${index}-${itemIndex}`} className="leading-relaxed pl-2">
                  {itemSegments.map(segment => (
                    <TextSegmentRenderer key={segment.key} segment={segment} />
                  ))}
                </li>
              );
            })}
          </ul>
        );
      }
    }
    
    // Listas com bullet points
    if (/^[-*•]\s/.test(trimmed)) {
      const lines = paragraph.split('\n').filter(line => line.trim());
      const listItems: string[] = [];
      let currentItem = '';
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (/^[-*•]\s/.test(trimmedLine)) {
          if (currentItem) {
            listItems.push(currentItem);
          }
          currentItem = trimmedLine.replace(/^[-*•]\s*/, '');
        } else if (currentItem && trimmedLine) {
          currentItem += ' ' + trimmedLine;
        }
      });
      
      if (currentItem) {
        listItems.push(currentItem);
      }
      
      if (listItems.length > 0) {
        return (
          <ul key={`bullets-${index}`} className="list-disc list-outside space-y-3 mb-6 pl-6 marker:text-primary">
            {listItems.map((item, itemIndex) => {
              const itemSegments = parser.parse(item.trim());
              return (
                <li key={`bullet-${index}-${itemIndex}`} className="leading-relaxed pl-2">
                  {itemSegments.map(segment => (
                    <TextSegmentRenderer key={segment.key} segment={segment} />
                  ))}
                </li>
              );
            })}
          </ul>
        );
      }
    }
    
    // Seções com título em negrito
    if (/^\*\*[^*]+\*\*:/.test(trimmed)) {
      const segments = parser.parse(trimmed);
      return (
        <div key={`section-${index}`} className="mb-6">
          <h4 className="text-base font-semibold mb-3 text-foreground">
            {segments.map(segment => (
              <TextSegmentRenderer key={segment.key} segment={segment} />
            ))}
          </h4>
        </div>
      );
    }
    
    // Parágrafo normal - mas verifica se começa com " - " para indentar
    const segments = parser.parse(trimmed);
    
    // Se o parágrafo começa com " - ", renderiza como parágrafo indentado
    if (trimmed.startsWith('- ')) {
      const contentWithoutDash = trimmed.substring(2).trim();
      const contentSegments = parser.parse(contentWithoutDash);
      
      return (
        <div key={`indented-${index}`} className="mb-3 ml-8">
          <span className="leading-relaxed block">
            {contentSegments.map(segment => (
              <TextSegmentRenderer key={segment.key} segment={segment} />
            ))}
          </span>
        </div>
      );
    }
    
    return (
      <div key={`paragraph-${index}`} className="mb-5">
        <span className="leading-relaxed block">
          {segments.map(segment => (
            <TextSegmentRenderer key={segment.key} segment={segment} />
          ))}
        </span>
      </div>
    );
  }, [paragraph, parser, index]);

  return <React.Fragment key={`para-${index}`}>{content}</React.Fragment>;
});

ParagraphRenderer.displayName = 'ParagraphRenderer';

const FormattedMessage = memo(({ content }: FormattedMessageProps) => {
  // Remove referências de source e limpa o conteúdo
  const cleanContent = useMemo(() => {
    if (!content) return '';
    return content.replace(/【[^】]*】/g, '').trim();
  }, [content]);

  // Divide em parágrafos e processa
  const paragraphs = useMemo(() => {
    if (!cleanContent) return [];
    return cleanContent.split('\n\n')
      .filter(p => p.trim() && p.trim() !== '---')
      .map(p => p.trim());
  }, [cleanContent]);

  return (
    <div className="chat-message">
      <div className="text-foreground">
        {paragraphs.map((paragraph, index) => (
          <ParagraphRenderer key={`pg-${index}`} paragraph={paragraph} index={index} />
        ))}
      </div>
    </div>
  );
});

FormattedMessage.displayName = 'FormattedMessage';

export default FormattedMessage;