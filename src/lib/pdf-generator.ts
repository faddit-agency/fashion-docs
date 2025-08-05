import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class PDFGenerator {
  /**
   * HTML 요소를 PDF로 변환하여 다운로드
   */
  static async generatePDFFromElement(
    element: HTMLElement,
    filename: string = 'document.pdf',
    options: {
      format?: 'a4' | 'a3' | 'letter' | 'legal';
      orientation?: 'portrait' | 'landscape';
      margin?: number;
      scale?: number;
    } = {}
  ): Promise<void> {
    try {
      const {
        format = 'a4',
        orientation = 'portrait',
        margin = 10,
        scale = 2
      } = options;

      // HTML을 캔버스로 변환
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      // 캔버스를 이미지로 변환
      const imgData = canvas.toDataURL('image/png');

      // PDF 생성
      const pdf = new jsPDF({
        format: format,
        orientation: orientation,
        unit: 'mm'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 이미지가 페이지보다 클 경우 여러 페이지로 나누기
      let heightLeft = imgHeight;
      let position = margin;

      // 첫 페이지
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - margin * 2);

      // 추가 페이지들
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);
      }

      // PDF 다운로드
      pdf.save(filename);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      throw new Error('PDF 생성에 실패했습니다.');
    }
  }

  /**
   * 텍스트 내용으로 PDF 생성
   */
  static generatePDFFromText(
    content: string,
    filename: string = 'document.pdf',
    options: {
      title?: string;
      format?: 'a4' | 'a3' | 'letter' | 'legal';
      orientation?: 'portrait' | 'landscape';
      fontSize?: number;
      lineHeight?: number;
    } = {}
  ): void {
    try {
      const {
        title = '문서',
        format = 'a4',
        orientation = 'portrait',
        fontSize = 12,
        lineHeight = 1.5
      } = options;

      const pdf = new jsPDF({
        format: format,
        orientation: orientation,
        unit: 'mm'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      const maxHeight = pageHeight - (margin * 2);

      // 제목 추가
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, margin + 10);

      // 내용 추가
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', 'normal');

      const lines = pdf.splitTextToSize(content, maxWidth);
      let yPosition = margin + 25;

      for (const line of lines) {
        if (yPosition > maxHeight) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += fontSize * lineHeight;
      }

      pdf.save(filename);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      throw new Error('PDF 생성에 실패했습니다.');
    }
  }


} 