import { useMemo } from 'react';

interface SqlCodeBlockProps {
    code: string;
}

export function SqlCodeBlock({ code }: SqlCodeBlockProps) {
    const highlightedCode = useMemo(() => {
        if (!code) return '';

        // Simple mapping for colors based on the theme
        // We'll use classes that work well with the existing dark/light theme logic or direct styles if needed
        // But since it's a code block, let's use a nice slate/zinc background (dark) even in light mode for "premium" feel

        // 1. Basic SQL Formatting (Prettify)
        let formatted = code
            .replace(/\s+/g, ' ') // Collapse spaces
            .trim();

        const majorKeywords = [
            'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY',
            'HAVING', 'LIMIT', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
            'INNER JOIN', 'OUTER JOIN', 'UNION'
        ];

        majorKeywords.forEach(kw => {
            const regex = new RegExp(`\\s?\\b${kw}\\b`, 'gi');
            formatted = formatted.replace(regex, `\n${kw.toUpperCase()}`);
        });

        // Indent AND/OR in WHERE clauses for better readability
        formatted = formatted.replace(/\s?\b(AND|OR)\b/gi, '\n  $1');

        // Indent ON in JOINs
        formatted = formatted.replace(/\s?\bON\b/gi, '\n    ON');

        // Remove first newline if it exists
        formatted = formatted.trim();

        // 2. Syntax Highlighting
        // Escaping HTML characters
        let html = formatted
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Keywords (blue/purple)
        const keywords = [
            ...majorKeywords,
            'ON', 'IN', 'AND', 'OR', 'NOT', 'NULL', 'AS', 'DISTINCT',
            'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ALL'
        ];

        // Aggregate functions (gold/orange)
        const aggregates = ['SUM', 'COUNT', 'AVG', 'MIN', 'MAX', 'YEAR', 'MONTH', 'DAY', 'DATEADD', 'DATEDIFF'];

        // Variables (cyan/green)
        const variables = ['@Annee', '@Mois', '@Exercice', '@OrganizationId'];

        // Regex for keywords (case insensitive but we'll try to keep them as is)
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
            html = html.replace(regex, '<span class="text-sky-400 font-bold">$1</span>');
        });

        aggregates.forEach(agg => {
            const regex = new RegExp(`\\b(${agg})\\b`, 'gi');
            html = html.replace(regex, '<span class="text-amber-400">$1</span>');
        });

        variables.forEach(v => {
            const regex = new RegExp(`(${v})\\b`, 'g');
            html = html.replace(regex, '<span class="text-emerald-400 font-medium">$1</span>');
        });

        // Strings (orange)
        html = html.replace(/'(.*?)'/g, '<span class="text-orange-300">\'$1\'</span>');

        // Comments (gray)
        html = html.replace(/-- (.*)$/gm, '<span class="text-slate-500 italic">-- $1</span>');

        return html;
    }, [code]);

    return (
        <div className="relative rounded-xl bg-slate-950 p-6 shadow-2xl border border-slate-800 overflow-hidden group">
            <div className="absolute top-3 right-4 flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            </div>
            <pre
                className="font-mono text-sm leading-relaxed text-slate-300 overflow-x-auto selection:bg-sky-500/30"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
        </div>
    );
}
