declare module 'pdf-parse' {
    interface PDFData {
        text: string
        numpages: number
        info: Record<string, unknown>  // 把 any 改成 unknown
        // 或者更精确：
        // info: {
        //   Title?: string
        //   Author?: string
        //   Subject?: string
        //   Keywords?: string
        //   Creator?: string
        //   Producer?: string
        //   CreationDate?: string
        //   ModDate?: string
        //   Tagged?: boolean
        //   Pages?: number
        // }
    }

    function pdfParse(dataBuffer: Buffer): Promise<PDFData>
    export default pdfParse
}