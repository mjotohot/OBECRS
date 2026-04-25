// src/pdfmake-shim.d.ts
declare module 'pdfmake/build/pdfmake' {
  interface TDocumentDefinitions {
    content: any
    styles?: any
    defaultStyle?: any
    pageSize?: string
    pageOrientation?: 'portrait' | 'landscape'
    pageMargins?: [number, number, number, number]
    [key: string]: any
  }

  interface TCreatedPdf {
    getBase64(callback: (data: string) => void): void
    getBuffer(callback: (buffer: Uint8Array) => void): void
    getBlob(callback: (blob: Blob) => void): void
    getDataUrl(callback: (url: string) => void): void
    download(defaultFileName?: string): void
    open(options?: any): void
    print(options?: any): void
  }

  interface PdfMakeStatic {
    vfs: Record<string, string>
    fonts: Record<string, any>
    createPdf(docDefinition: TDocumentDefinitions): TCreatedPdf
  }

  const pdfMake: PdfMakeStatic
  export = pdfMake
}

declare module 'pdfmake/build/vfs_fonts' {
  interface PdfFonts {
    pdfMake: {
      vfs: Record<string, string>
    }
  }
  const pdfFonts: PdfFonts
  export = pdfFonts
}

declare module 'html-to-pdfmake' {
  interface HtmlToPdfMakeOptions {
    window?: any
    tableAutoSize?: boolean
    defaultStyles?: any
  }

  function htmlToPdfMake(html: string, options?: HtmlToPdfMakeOptions): any
  export = htmlToPdfMake
}
