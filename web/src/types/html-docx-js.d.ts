declare module 'html-docx-js/dist/html-docx' {
    export function asBlob(htmlString: string, options?: any): Promise<Blob>;
}