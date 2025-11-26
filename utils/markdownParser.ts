// utils/markdownParser.ts

/**
 * Converts markdown-like syntax to HTML
 * Supports:
 * - **bold text** -> <strong class="font-bold">bold text</strong>
 * - [link text](url) -> <a href="url" class="text-accent hover:underline">link text</a>
 * - # Heading -> <h1 class="text-3xl font-bold text-darkText dark:text-lightText mt-8 mb-4">Heading</h1>
 * - ## Heading -> <h2 class="text-2xl font-bold text-darkText dark:text-lightText mt-6 mb-3">Heading</h2>
 * - ### Heading -> <h3 class="text-xl font-bold text-darkText dark:text-lightText mt-4 mb-2">Heading</h3>
 * - - List item -> <li class="text-gray-500 dark:text-gray-400">List item</li>
 * - Paragraphs separated by empty lines
 * - Center alignment with ^^centered text^^
 */
export const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Convert line breaks to <br> tags temporarily
  html = html.replace(/\n/g, '<br>');
  
  // Convert paragraphs (double line breaks)
  html = html.replace(/<br><br>/g, '</p><p>');
  
  // Wrap content in paragraph tags if not already wrapped
  if (!html.startsWith('<p>')) {
    html = '<p>' + html;
  }
  if (!html.endsWith('</p>')) {
    html = html + '</p>';
  }
  
  // Convert center alignment ^^text^^
  html = html.replace(/\^\^(.*?)\^\^/g, '<div class="text-center">$1</div>');
  
  // Convert bold text (**text**) with enhanced boldness
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold">$1</strong>');
  
  // Convert links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent hover:underline font-medium">$1</a>');
  
  // Convert headings
  html = html.replace(/<br># (.*?)<br>/g, '</p><h1 class="text-3xl font-extrabold text-darkText dark:text-lightText mt-8 mb-4">$1</h1><p>');
  html = html.replace(/<br>## (.*?)<br>/g, '</p><h2 class="text-2xl font-extrabold text-darkText dark:text-lightText mt-6 mb-3">$1</h2><p>');
  html = html.replace(/<br>### (.*?)<br>/g, '</p><h3 class="text-xl font-extrabold text-darkText dark:text-lightText mt-4 mb-2">$1</h3><p>');
  
  // Convert list items with proper styling
  html = html.replace(/<br>- (.*?)<br>/g, '</p><ul class="list-disc list-inside text-gray-500 dark:text-gray-400 space-y-1 mb-4"><li class="text-gray-500 dark:text-gray-400">$1</li>');
  html = html.replace(/<br>- (.*?)$/g, '</p><ul class="list-disc list-inside text-gray-500 dark:text-gray-400 space-y-1 mb-4"><li class="text-gray-500 dark:text-gray-400">$1</li></ul><p>');
  
  // Handle multiple list items
  html = html.replace(/<\/li><br>- (.*?)<br>/g, '<li class="text-gray-500 dark:text-gray-400">$1</li>');
  html = html.replace(/<\/li><br>- (.*?)$/g, '<li class="text-gray-500 dark:text-gray-400">$1</li></ul><p>');
  
  // Clean up any remaining <br> tags at the beginning or end of paragraphs
  html = html.replace(/<p><br>/g, '<p>');
  html = html.replace(/<br><\/p>/g, '</p>');
  
  // Remove any standalone <br> tags that shouldn't be there
  html = html.replace(/<\/h1><br>/g, '</h1>');
  html = html.replace(/<\/h2><br>/g, '</h2>');
  html = html.replace(/<\/h3><br>/g, '</h3>');
  html = html.replace(/<\/ul><br>/g, '</ul>');
  
  return html;
};